import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import type * as THREE from 'three'
import type { WorldLayout } from '../mapping/types'
import { useLayout } from './worldData'

export interface Pin { nodeId: string; title: string; x: number; z: number; base: number; top: number }

const noRaycast = () => {}

/** Pins in a world, from its planned landmarks (they rise from where the folder physically is). */
export function pinsFor(layout: WorldLayout): Pin[] {
  return layout.landmarks.filter((l) => l.kind === 'pin').map((l) => ({ nodeId: l.nodeId, title: l.title, x: l.pos[0], z: l.pos[2], base: l.pos[1], top: l.top }))
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
