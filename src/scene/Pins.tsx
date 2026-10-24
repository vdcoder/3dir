import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import type * as THREE from 'three'
import { PINS } from '../mapping/plan'
import type { WorldLayout } from '../mapping/types'
import { fs } from '../state/store'
import { useLayout } from './worldData'

export interface Pin { nodeId: string; title: string; x: number; z: number; base: number; top: number }

const noRaycast = () => {}

/** Pins in a world: those whose folder is drawn there, rising from where it physically is. */
export function pinsFor(layout: WorldLayout): Pin[] {
  return PINS.flatMap((p) => {
    const n = fs.resolve(p.path)
    const a = n ? layout.anchors.get(n.id) : undefined
    if (!n || !a || layout.context.kind !== 'main') return []
    const b = layout.anchors.get(a.shownAs)?.bounds ?? a.bounds
    return [{ nodeId: n.id, title: p.title, x: (b.min[0] + b.max[0]) / 2, z: (b.min[2] + b.max[2]) / 2, base: b.max[1], top: b.max[1] + 3.2 }]
  })
}

export function Pins() {
  const layout = useLayout()
  const pins = useMemo(() => pinsFor(layout), [layout])
  const refs = useRef<(THREE.Group | null)[]>([])
  // Pins are for orientation at a distance; up close they'd only get in the way.
  useFrame(({ camera }) => {
    pins.forEach((p, i) => {
      const g = refs.current[i]
      if (g) g.visible = Math.hypot(camera.position.x - p.x, camera.position.y - p.base, camera.position.z - p.z) > 16
    })
  })
  return (
    <group>
      {pins.map((p, i) => (
        <group key={p.nodeId} ref={(g) => { refs.current[i] = g }}>
          <Line points={[[p.x, p.base + 0.05, p.z], [p.x, p.top, p.z]]} color="#b8892f" lineWidth={2.2} transparent opacity={0.9} raycast={noRaycast} />
          <mesh position={[p.x, p.top, p.z]} raycast={noRaycast}>
            <sphereGeometry args={[0.16, 16, 12]} />
            <meshStandardMaterial color="#d9a53a" emissive="#b8892f" emissiveIntensity={0.4} roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[p.x, p.base + 0.03, p.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
            <ringGeometry args={[0.35, 0.5, 32]} />
            <meshBasicMaterial color="#d9a53a" transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
