import { useCallback, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import CameraControlsImpl from 'camera-controls'
import * as THREE from 'three'
import type { AABB } from '../mapping/types'
import { useStore } from '../state/store'
import { useLayout } from './worldData'

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
  const layout = useLayout()
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const frameNonce = useStore((s) => s.world.frameNonce)
  const mounted = useRef(false)
  const touched = useRef(false)

  const target = useCallback((smooth: boolean) => {
    const c = ref.current
    if (!c) return
    const { frameId, location } = useStore.getState().world
    const a = layout.anchors.get(frameId) ?? layout.anchors.get(location)
    const g = layout.ground
    if (!a || a.level === 'land') {
      frame(c, camera, { min: [g.x + 4, 0, g.z + 4], max: [g.x + g.w - 4, 3, g.z + g.d - 4] }, OVERVIEW_POLAR, smooth, smooth ? undefined : DEFAULT_AZIMUTH, 0.94)
      return
    }
    // Small things (single files, boxes) are framed with some context around them.
    const b = (layout.anchors.get(a.shownAs) ?? a).bounds
    const minSize = a.level === 'item' || a.level === 'box' ? 3.6 : a.level === 'compartment' ? 3.4 : 0
    const grown: AABB = minSize
      ? {
          min: [Math.min(b.min[0], (b.min[0] + b.max[0]) / 2 - minSize / 2), b.min[1], Math.min(b.min[2], (b.min[2] + b.max[2]) / 2 - minSize / 2)],
          max: [Math.max(b.max[0], (b.min[0] + b.max[0]) / 2 + minSize / 2), b.max[1], Math.max(b.max[2], (b.min[2] + b.max[2]) / 2 + minSize / 2)],
        }
      : { min: [...b.min], max: [...b.max] }
    const wide = a.level === 'region' || a.level === 'area'
    // An area is framed by its buildings (with a little ground), not its whole pad.
    const own = a.level === 'area' ? layout.buildings.filter((x) => x.areaId === a.nodeId) : []
    if (own.length) {
      const m = 1.6
      grown.min[0] = Math.max(grown.min[0], Math.min(...own.map((x) => x.rect.x)) - m)
      grown.min[2] = Math.max(grown.min[2], Math.min(...own.map((x) => x.rect.z)) - m)
      grown.max[0] = Math.min(grown.max[0], Math.max(...own.map((x) => x.rect.x + x.rect.w)) + m)
      grown.max[2] = Math.min(grown.max[2], Math.max(...own.map((x) => x.rect.z + x.rect.d)) + m)
    }
    frame(c, camera, grown, wide ? OVERVIEW_POLAR - 0.04 : a.level === 'item' || a.level === 'box' ? 0.72 : CLOSE_POLAR, smooth, smooth ? undefined : DEFAULT_AZIMUTH)
  }, [layout, camera])

  // Entering a world (first load, opening or leaving a box): cut straight to the target.
  useEffect(() => {
    if (size.width === 0) return
    if (mounted.current && touched.current) return
    target(false)
  }, [target, size.width, size.height])
  useEffect(() => { mounted.current = true }, [])

  // Moves within a world (navigation, Show in World, search): glide.
  const lastNonce = useRef(frameNonce)
  useEffect(() => {
    if (frameNonce === lastNonce.current) return
    lastNonce.current = frameNonce
    touched.current = true
    target(true)
  }, [frameNonce, target])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const onStart = () => { touched.current = true }
    c.addEventListener('controlstart', onStart)
    return () => c.removeEventListener('controlstart', onStart)
  }, [])

  const g = layout.ground
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1.5}
      maxDistance={Math.max(g.w, g.d) * 2.2}
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
