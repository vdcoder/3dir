import { useLayoutEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

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
  onPick?: (index: number, e: ThreeEvent<PointerEvent | MouseEvent>, kind: 'click' | 'double' | 'over' | 'out') => void
  meshRef?: React.MutableRefObject<THREE.InstancedMesh | null>
}

const unitBox = new THREE.BoxGeometry(1, 1, 1)

/** Many boxes in one draw call, with optional per-box colors and picking. */
export function Boxes({ boxes, color = '#ffffff', roughness = 0.85, metalness = 0, castShadow = true, receiveShadow = true, geometry = unitBox, onPick, meshRef }: Props) {
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

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: perInstanceColor ? '#ffffff' : color, roughness, metalness }),
    [color, roughness, metalness, perInstanceColor],
  )

  if (boxes.length === 0) return null
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, boxes.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onClick={onPick ? (e) => { if (e.instanceId !== undefined) { e.stopPropagation(); onPick(e.instanceId, e, 'click') } } : undefined}
      onDoubleClick={onPick ? (e) => { if (e.instanceId !== undefined) { e.stopPropagation(); onPick(e.instanceId, e, 'double') } } : undefined}
      onPointerMove={onPick ? (e) => { if (e.instanceId !== undefined) { e.stopPropagation(); onPick(e.instanceId, e, 'over') } } : undefined}
      onPointerOut={onPick ? (e) => { if (e.instanceId !== undefined) onPick(e.instanceId, e, 'out') } : undefined}
    />
  )
}
