import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import type * as THREE from 'three'
import { PINS } from '../mapping/plan'
import { fs } from '../state/store'
import { anchorOf } from './worldData'

/** Pinned destinations: a brass pole rising from where the folder physically is. */
export const pins = PINS.flatMap((p) => {
  const n = fs.resolve(p.path)
  const a = n ? anchorOf(n.id) : undefined
  if (!n || !a) return []
  const b = anchorOf(a.shownAs)?.bounds ?? a.bounds
  const x = (b.min[0] + b.max[0]) / 2
  const z = (b.min[2] + b.max[2]) / 2
  return [{ nodeId: n.id, title: p.title, x, z, base: b.max[1], top: b.max[1] + 3.2 }]
})

export function Pins() {
  const refs = useRef<(THREE.Group | null)[]>([])
  // Pins are for orientation at a distance; up close they'd only get in the way.
  useFrame(({ camera }) => {
    pins.forEach((p, i) => {
      const g = refs.current[i]
      if (g) g.visible = camera.position.distanceTo({ x: p.x, y: p.base, z: p.z } as THREE.Vector3) > 16
    })
  })
  return (
    <group>
      {pins.map((p, i) => (
        <group key={p.nodeId} ref={(g) => { refs.current[i] = g }}>
          <Line points={[[p.x, p.base + 0.05, p.z], [p.x, p.top, p.z]]} color="#b8892f" lineWidth={2.2} transparent opacity={0.9} />
          <mesh position={[p.x, p.top, p.z]}>
            <sphereGeometry args={[0.16, 16, 12]} />
            <meshStandardMaterial color="#d9a53a" emissive="#b8892f" emissiveIntensity={0.4} roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[p.x, p.base + 0.03, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.35, 0.5, 32]} />
            <meshBasicMaterial color="#d9a53a" transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
