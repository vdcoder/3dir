import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { planDecor, type Decor } from '../mapping/decor'
import { PROPS, type PropId } from '../mapping/props'
import { fs } from '../state/store'
import { assetUrl } from '../assetUrl'
import type { WorldLayout } from '../mapping/types'
import { useLayout } from './worldData'
import { refreshShadows } from './shadows'

const decorCache = new WeakMap<WorldLayout, Decor[]>()
/** Decor for a world, planned once per world. */
export function decorFor(layout: WorldLayout): Decor[] {
  let d = decorCache.get(layout)
  if (!d) {
    d = planDecor(layout, (id) => fs.get(id)?.name ?? '')
    decorCache.set(layout, d)
  }
  return d
}

const noRaycast = () => null

/** All placements of one prop, drawn as one instanced mesh per model part. */
function PropInstances({ id, items }: { id: PropId; items: Decor[] }) {
  const { scene } = useGLTF(assetUrl(`assets/${id}.glb`))
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(scene)
    const out: { geometry: THREE.BufferGeometry; material: THREE.Material; local: THREE.Matrix4 }[] = []
    // Normalize: center on X/Z, base on the ground, then scale to real size.
    const s = PROPS[id].scale
    const center = box.getCenter(new THREE.Vector3())
    const norm = new THREE.Matrix4().makeScale(s, s, s).multiply(new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z))
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const material = (m.material as THREE.MeshStandardMaterial).clone()
      material.roughness = Math.max(material.roughness ?? 1, 0.72)
      material.metalness = Math.min(material.metalness ?? 0, 0.2)
      out.push({ geometry: m.geometry, material, local: norm.clone().multiply(m.matrixWorld) })
    })
    return out
  }, [scene, id])

  return (
    <>
      {parts.map((p, i) => <PartInstances key={i} part={p} items={items} />)}
    </>
  )
}

function PartInstances({ part, items }: { part: { geometry: THREE.BufferGeometry; material: THREE.Material; local: THREE.Matrix4 }; items: Decor[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    items.forEach((d, i) => {
      q.setFromAxisAngle(up, d.rotY)
      m.compose(new THREE.Vector3(...d.pos), q, new THREE.Vector3(1, 1, 1)).multiply(part.local)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    refreshShadows()
  }, [items, part])
  return <instancedMesh ref={ref} args={[part.geometry, part.material, items.length]} castShadow receiveShadow raycast={noRaycast} />
}

export function Props() {
  const layout = useLayout()
  const groups = useMemo(() => {
    const m = new Map<PropId, Decor[]>()
    for (const d of decorFor(layout)) m.set(d.prop, [...(m.get(d.prop) ?? []), d])
    return [...m]
  }, [layout])
  return (
    <>
      {groups.map(([id, items]) => (
        <Suspense key={id} fallback={null}>
          <PropInstances id={id} items={items} />
        </Suspense>
      ))}
    </>
  )
}
