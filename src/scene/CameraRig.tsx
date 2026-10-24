import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import CameraControlsImpl from 'camera-controls'
import * as THREE from 'three'
import type { AABB } from '../mapping/layout'
import { useStore } from '../state/store'
import { anchorOf, layout } from './worldData'

const DEFAULT_AZIMUTH = 0.42 // radians from +Z (camera looks from the south, slightly east)
const OVERVIEW_POLAR = 0.86
const CLOSE_POLAR = 0.82

/** Frames a box from the current azimuth, at a comfortable elevated angle. */
function frame(controls: CameraControlsImpl, camera: THREE.PerspectiveCamera, b: AABB, polar: number, smooth: boolean, azimuth?: number) {
  const cx = (b.min[0] + b.max[0]) / 2
  const cy = (b.min[1] + b.max[1]) / 2
  const cz = (b.min[2] + b.max[2]) / 2
  const sx = b.max[0] - b.min[0]
  const sy = b.max[1] - b.min[1]
  const sz = b.max[2] - b.min[2]
  const radius = Math.max(0.6, 0.5 * Math.hypot(sx, sy * 0.6, sz))
  const vfov = THREE.MathUtils.degToRad(camera.fov)
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect)
  const dist = (radius / Math.sin(Math.min(vfov, hfov) / 2)) * 0.92
  const theta = azimuth ?? controls.azimuthAngle
  const target = new THREE.Vector3(cx, Math.min(cy, 1.2), cz)
  const pos = new THREE.Vector3().setFromSphericalCoords(dist, polar, theta).add(target)
  void controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, smooth)
}

export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const frameNonce = useStore((s) => s.world.frameNonce)
  const frameId = useStore((s) => s.world.frameId)
  const first = useRef(true)

  // Initial overview.
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const l = layout.land
    frame(c, camera, { min: [l.x + 6, 0, l.z + 6], max: [l.x + l.w - 6, 4, l.z + l.d - 6] }, OVERVIEW_POLAR, false, DEFAULT_AZIMUTH)
  }, [camera])

  // Explicit framing requests (entering folders, Show in World, search).
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const c = ref.current
    const a = anchorOf(frameId)
    if (!c || !a) return
    if (a.level === 'land') {
      const l = layout.land
      frame(c, camera, { min: [l.x + 6, 0, l.z + 6], max: [l.x + l.w - 6, 4, l.z + l.d - 6] }, OVERVIEW_POLAR, true)
      return
    }
    // Small things (single files, boxes) are framed with some context around them.
    const b = a.bounds
    const minSize = a.level === 'item' || a.level === 'box' ? 2.2 : a.level === 'compartment' ? 2.6 : 0
    const grown: AABB = minSize
      ? {
          min: [Math.min(b.min[0], (b.min[0] + b.max[0]) / 2 - minSize / 2), b.min[1], Math.min(b.min[2], (b.min[2] + b.max[2]) / 2 - minSize / 2)],
          max: [Math.max(b.max[0], (b.min[0] + b.max[0]) / 2 + minSize / 2), b.max[1], Math.max(b.max[2], (b.min[2] + b.max[2]) / 2 + minSize / 2)],
        }
      : b
    frame(c, camera, grown, a.level === 'district' ? OVERVIEW_POLAR - 0.04 : CLOSE_POLAR, true)
  }, [frameNonce, frameId, camera])

  const l = layout.land
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1.5}
      maxDistance={Math.max(l.w, l.d) * 2.2}
      minPolarAngle={0.25}
      maxPolarAngle={1.22}
      smoothTime={0.45}
      draggingSmoothTime={0.08}
      dollyToCursor
      mouseButtons={{ left: CameraControlsImpl.ACTION.SCREEN_PAN, middle: CameraControlsImpl.ACTION.DOLLY, right: CameraControlsImpl.ACTION.ROTATE, wheel: CameraControlsImpl.ACTION.DOLLY }}
      touches={{ one: CameraControlsImpl.ACTION.TOUCH_SCREEN_PAN, two: CameraControlsImpl.ACTION.TOUCH_DOLLY_ROTATE, three: CameraControlsImpl.ACTION.TOUCH_ROTATE }}
    />
  )
}
