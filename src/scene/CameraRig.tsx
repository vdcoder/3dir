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

/**
 * Frames a box from the given (or current) azimuth at a comfortable elevated
 * angle: the closest distance at which all 8 corners fit inside the view.
 */
function frame(controls: CameraControlsImpl, camera: THREE.PerspectiveCamera, b: AABB, polar: number, smooth: boolean, azimuth?: number, margin = 0.86) {
  const target = new THREE.Vector3((b.min[0] + b.max[0]) / 2, Math.min((b.min[1] + b.max[1]) / 2, 1.2), (b.min[2] + b.max[2]) / 2)
  const theta = azimuth ?? controls.azimuthAngle
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(i & 1 ? b.max[0] : b.min[0], i & 2 ? b.max[1] : b.min[1], i & 4 ? b.max[2] : b.min[2]))
  const probe = camera.clone()
  const fits = (dist: number) => {
    probe.position.setFromSphericalCoords(dist, polar, theta).add(target)
    probe.lookAt(target)
    probe.updateMatrixWorld()
    const v = new THREE.Vector3()
    return corners.every((c) => {
      v.copy(c).project(probe)
      return v.z < 1 && Math.abs(v.x) <= margin && Math.abs(v.y) <= margin
    })
  }
  let lo = 0.5
  let hi = 2000
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) hi = mid
    else lo = mid
  }
  const pos = new THREE.Vector3().setFromSphericalCoords(hi, polar, theta).add(target)
  void controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, smooth)
}

export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const frameNonce = useStore((s) => s.world.frameNonce)
  const frameId = useStore((s) => s.world.frameId)
  const first = useRef(true)
  const size = useThree((s) => s.size)
  const touched = useRef(false)

  // Initial overview (re-fit when the canvas size settles, until the user moves the camera).
  useEffect(() => {
    const c = ref.current
    if (!c || touched.current || size.width === 0) return
    const l = layout.land
    frame(c, camera, { min: [l.x + 4, 0, l.z + 4], max: [l.x + l.w - 4, 3, l.z + l.d - 4] }, OVERVIEW_POLAR, false, DEFAULT_AZIMUTH, 0.94)
  }, [camera, size.width, size.height])
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const onStart = () => { touched.current = true }
    c.addEventListener('controlstart', onStart)
    return () => c.removeEventListener('controlstart', onStart)
  }, [])

  // Explicit framing requests (entering folders, Show in World, search).
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const c = ref.current
    const a = anchorOf(frameId)
    if (!c || !a) return
    touched.current = true
    if (a.level === 'land') {
      const l = layout.land
      frame(c, camera, { min: [l.x + 4, 0, l.z + 4], max: [l.x + l.w - 4, 3, l.z + l.d - 4] }, OVERVIEW_POLAR, true, undefined, 0.94)
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
