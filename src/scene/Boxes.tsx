import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { NodeId } from '../model/types'

export interface BoxSpec {
  /** Center. */
  pos: [number, number, number]
  size: [number, number, number]
  color?: string
}

interface Props {
  boxes: BoxSpec[]
  color?: string
  roughness?: number
  metalness?: number
  castShadow?: boolean
  receiveShadow?: boolean
  geometry?: THREE.BufferGeometry
  material?: THREE.Material
  /** Makes the boxes pickable: instance index -> canonical node. */
  pick?: (index: number) => NodeId | null
  /** Draw nothing but still answer picks (invisible pick volumes). */
  hidden?: boolean
  meshRef?: React.MutableRefObject<THREE.InstancedMesh | null>
}

const unitBox = new THREE.BoxGeometry(1, 1, 1)
const noRaycast = () => {}

/** Many boxes in one draw call, with optional per-box colors and picking. */
export function Boxes({ boxes, color = '#ffffff', roughness = 0.85, metalness = 0, castShadow = true, receiveShadow = true, geometry = unitBox, material, pick, hidden = false, meshRef }: Props) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const perInstanceColor = boxes.some((b) => b.color)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    if (meshRef) meshRef.current = mesh
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    boxes.forEach((b, i) => {
      m.makeScale(b.size[0], b.size[1], b.size[2])
      m.setPosition(b.pos[0], b.pos[1], b.pos[2])
      mesh.setMatrixAt(i, m)
      if (perInstanceColor) mesh.setColorAt(i, c.set(b.color ?? color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
    mesh.computeBoundingBox()
  }, [boxes, color, perInstanceColor, meshRef])

  const mat = useMemo(() => {
    if (material) return material
    const m = new THREE.MeshStandardMaterial({ color: perInstanceColor ? '#ffffff' : color, roughness, metalness })
    if (hidden) m.visible = false
    return m
  }, [material, color, roughness, metalness, perInstanceColor, hidden])

  const userData = useMemo(() => (pick ? { pick: (h: THREE.Intersection) => (h.instanceId === undefined ? null : pick(h.instanceId)) } : {}), [pick])

  if (boxes.length === 0) return null
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, mat, boxes.length]}
      castShadow={castShadow && !hidden}
      receiveShadow={receiveShadow && !hidden}
      userData={userData}
      {...(pick ? {} : { raycast: noRaycast })}
    />
  )
}
