import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { planDecor, type Decor } from '../mapping/decor'
import { footprint, PROPS, type PropId } from '../mapping/props'
import { fs, useStore } from '../state/store'
import { assetUrl } from '../assetUrl'
import type { AABB, WorldLayout } from '../mapping/types'
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
      {parts.map((p, i) => <PartInstances key={i} id={id} part={p} items={items} />)}
    </>
  )
}

/** What the camera is looking at: the framed thing or the current place (nothing on the open map). */
function targetOf(layout: WorldLayout): AABB | null {
  const { frameId, location } = useStore.getState().world
  const a = (frameId ? layout.anchors.get(frameId) : undefined) ?? layout.anchors.get(location)
  if (!a || a.level === 'land' || a.level === 'region') return null
  return (layout.anchors.get(a.shownAs) ?? a).bounds
}

const boxCorners = (b: AABB): [number, number, number][] =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i & 1 ? b.max[0] : b.min[0], i & 2 ? b.max[1] : b.min[1], i & 4 ? b.max[2] : b.min[2]])

interface ScreenRect { x0: number; y0: number; x1: number; y1: number }
const sv = new THREE.Vector3()
/** Screen-space bounds (normalized device coords, clamped to the view) of points in front of the camera. */
function screenRect(camera: THREE.Camera, pts: [number, number, number][]): ScreenRect | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of pts) {
    sv.set(p[0], p[1], p[2]).project(camera)
    if (sv.z > 1) continue
    x0 = Math.min(x0, sv.x); x1 = Math.max(x1, sv.x); y0 = Math.min(y0, sv.y); y1 = Math.max(y1, sv.y)
  }
  x0 = Math.max(x0, -1); y0 = Math.max(y0, -1); x1 = Math.min(x1, 1); y1 = Math.min(y1, 1)
  return x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : null
}
/** Share of `a` that covers `b`. */
const overlap = (a: ScreenRect, b: ScreenRect) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  return w > 0 && h > 0 ? (w * h) / ((b.x1 - b.x0) * (b.y1 - b.y0)) : 0
}

/** Tall props that may stand between the camera and what it looks at (heights in world units). */
const OCCLUDER_HEIGHT: Partial<Record<PropId, number>> = { 'tree-round': 5.6, 'tree-cypress': 6.4, 'clock-tower': 13, 'lamp-post': 3.4, 'sculpture-rings': 3.4 }
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)

function PartInstances({ id, part, items }: { id: PropId; part: { geometry: THREE.BufferGeometry; material: THREE.Material; local: THREE.Matrix4 }; items: Decor[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const matrices = useMemo(() => {
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    return items.map((d) => {
      q.setFromAxisAngle(up, d.rotY)
      return new THREE.Matrix4().compose(new THREE.Vector3(...d.pos), q, new THREE.Vector3(1, 1, 1)).multiply(part.local)
    })
  }, [items, part])
  const hidden = useRef<boolean[]>([])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    hidden.current = matrices.map(() => false)
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    refreshShadows()
  }, [matrices])

  // Tall props close to the camera, in the middle of the view and nearer than
  // what it looks at, step aside (they would hide the place you came to see).
  const height = OCCLUDER_HEIGHT[id]
  const v = useMemo(() => new THREE.Vector3(), [])
  const layout = useLayout()
  const radius = Math.max(...footprint(id)) / 2
  useFrame(({ camera, size }) => {
    const mesh = ref.current
    if (!mesh || !height) return
    const target = targetOf(layout)
    const focal = size.height / (2 * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov ?? 30) / 2))
    const goal = target ? screenRect(camera, boxCorners(target)) : null
    const goalDist = target ? camera.position.distanceTo(v.set((target.min[0] + target.max[0]) / 2, (target.min[1] + target.max[1]) / 2, (target.min[2] + target.max[2]) / 2)) : Infinity
    let changed = false
    items.forEach((d, i) => {
      const dist = camera.position.distanceTo(v.set(d.pos[0], height * 0.6, d.pos[2]))
      let hide = false
      if (dist < goalDist) {
        const r = radius
        const rect = screenRect(camera, [[d.pos[0] - r, 0, d.pos[2]], [d.pos[0] + r, 0, d.pos[2]], [d.pos[0], height, d.pos[2]], [d.pos[0] - r, height * 0.6, d.pos[2]], [d.pos[0] + r, height * 0.6, d.pos[2]], [d.pos[0], height * 0.6, d.pos[2] - r], [d.pos[0], height * 0.6, d.pos[2] + r]])
        const outside = !target || d.pos[0] < target.min[0] - 0.5 || d.pos[0] > target.max[0] + 0.5 || d.pos[2] < target.min[2] - 0.5 || d.pos[2] > target.max[2] + 0.5
        // In front of the place you came to see, covering part of it...
        const covers = !!goal && !!rect && outside && overlap(rect, goal) > 0.02
        // ...or so close it fills a third of the screen.
        const big = !!rect && (height / dist) * focal > size.height * 0.3
        hide = covers || big
      }
      if (hide !== hidden.current[i]) {
        hidden.current[i] = hide
        mesh.setMatrixAt(i, hide ? ZERO : matrices[i])
        changed = true
      }
    })
    if (changed) { mesh.instanceMatrix.needsUpdate = true; refreshShadows() }
  })
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
