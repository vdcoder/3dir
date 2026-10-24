import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { AABB } from '../mapping/types'
import type { NodeId } from '../model/types'
import { useStore } from '../state/store'
import { useLayout } from './worldData'

const noRaycast = () => {}

function edges(b: AABB, pad: number): [number, number, number][] {
  const [x0, y0, z0] = [b.min[0] - pad, Math.max(0.02, b.min[1] - pad), b.min[2] - pad]
  const [x1, y1, z1] = [b.max[0] + pad, b.max[1] + pad, b.max[2] + pad]
  const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] as [number, number, number][]
  const seg = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
  return seg.flatMap(([a, b2]) => [c[a], c[b2]])
}

/** Outline of the thing that represents `id` in this world (itself, or the closed box it's in). Never pickable. */
function Outline({ id, color, width, beacon }: { id: NodeId; color: string; width: number; beacon?: boolean }) {
  const layout = useLayout()
  const a = layout.anchors.get(id)
  const shown = a ? layout.anchors.get(a.shownAs) ?? a : undefined
  const pts = useMemo(() => (shown ? edges(shown.bounds, shown.level === 'item' || shown.level === 'box' ? 0.015 : 0.06) : []), [shown])
  const beaconRef = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    if (!beaconRef.current || !shown) return
    const b2 = shown.bounds
    const d = Math.hypot(camera.position.x - (b2.min[0] + b2.max[0]) / 2, camera.position.y - b2.max[1], camera.position.z - (b2.min[2] + b2.max[2]) / 2)
    beaconRef.current.visible = d > 14
  })
  if (!shown || shown.level === 'land') return null
  const b = shown.bounds
  const top = b.max[1]
  const cx = (b.min[0] + b.max[0]) / 2
  const cz = (b.min[2] + b.max[2]) / 2
  const size = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2])
  return (
    <group>
      <Line points={pts} segments color={color} lineWidth={width} depthTest={false} renderOrder={10} transparent opacity={0.95} raycast={noRaycast} />
      {beacon && size < 4 && (
        <group ref={beaconRef}>
          <Line points={[[cx, top + 0.05, cz], [cx, top + 2.4, cz]]} color={color} lineWidth={2} depthTest={false} renderOrder={10} transparent opacity={0.8} raycast={noRaycast} />
          <mesh position={[cx, top + 2.45, cz]} renderOrder={11} raycast={noRaycast}>
            <sphereGeometry args={[0.12, 16, 12]} />
            <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.95} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/** Outlines the selection (blue, with a beacon for small things) and the hovered thing (amber). */
export function Highlight() {
  const selectedId = useStore((s) => s.world.selectedId)
  const hoverId = useStore((s) => s.hoverId)
  return (
    <group>
      {hoverId && hoverId !== selectedId && <Outline id={hoverId} color="#f0b429" width={2} />}
      {selectedId && <Outline id={selectedId} color="#2f6fdb" width={3} beacon />}
    </group>
  )
}
