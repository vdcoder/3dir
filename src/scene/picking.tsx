import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { NodeId } from '../model/types'
import { fs, useStore } from '../state/store'
import { resolvePick, type PickHit } from './pickPolicy'
import { isWithin, useLayout } from './worldData'

/**
 * Marks a mesh as pickable: `resolve` maps a ray hit (instance id, face...) to
 * the canonical node it represents. Unmarked meshes (props, highlights,
 * decoration) are never picked.
 */
export const pickable = (resolve: (hit: THREE.Intersection) => NodeId | null) => ({ pick: resolve })

const CLICK_SLOP = 5 // px of movement before a press counts as a drag

/** One controller for every click, double-click and hover in the world. */
export function PickController() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  const layout = useLayout()

  useEffect(() => {
    const el = gl.domElement
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()

    const pickAt = (clientX: number, clientY: number): PickHit | null => {
      const r = el.getBoundingClientRect()
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      const hits: PickHit[] = []
      for (const h of raycaster.intersectObject(scene, true)) {
        const resolve = h.object.userData.pick as ((hit: THREE.Intersection) => NodeId | null) | undefined
        if (!resolve) continue
        const id = resolve(h)
        if (!id) continue
        hits.push({ nodeId: id, level: layout.anchors.get(id)?.level ?? 'land', distance: h.distance })
      }
      const best = resolvePick(hits, isWithin)
      // The bare land is "nothing in particular".
      return best && best.level !== 'land' ? best : null
    }

    let down: { x: number; y: number } | null = null
    let hoverFrame = 0
    let lastMove: PointerEvent | null = null

    const onDown = (e: PointerEvent) => { if (e.button === 0) down = { x: e.clientX, y: e.clientY } }
    const onUp = (e: PointerEvent) => {
      if (e.button !== 0 || !down) return
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      down = null
      if (moved > CLICK_SLOP) return
      useStore.getState().worldSelect(pickAt(e.clientX, e.clientY)?.nodeId ?? null)
    }
    const onDouble = (e: MouseEvent) => {
      const hit = pickAt(e.clientX, e.clientY)
      if (!hit) return
      activate(hit.nodeId)
    }
    const onMove = (e: PointerEvent) => {
      lastMove = e
      if (hoverFrame) return
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0
        if (!lastMove || (lastMove.buttons & 1)) return
        const id = pickAt(lastMove.clientX, lastMove.clientY)?.nodeId ?? null
        const s = useStore.getState()
        if (s.hoverId !== id) s.setHover(id)
        el.style.cursor = id ? 'pointer' : ''
      })
    }
    const onLeave = () => {
      useStore.getState().setHover(null)
      el.style.cursor = ''
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('dblclick', onDouble)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)

    // Test hooks: what is under a screen point, and where a node is on screen.
    const hooks = (window as unknown as { __3dir: Record<string, unknown> }).__3dir
    if (hooks) {
      hooks.pickAt = (x: number, y: number) => pickAt(x, y)
      hooks.screenOf = (id: NodeId) => {
        const a = layout.anchors.get(id)
        if (!a) return null
        const shown = layout.anchors.get(a.shownAs) ?? a
        const b = shown.bounds
        // Aim where a person would click: the visible front face of small things.
        const small = shown.level === 'item' || shown.level === 'box'
        const v = new THREE.Vector3((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, small ? b.max[2] - 0.005 : (b.min[2] + b.max[2]) / 2).project(camera)
        const r = el.getBoundingClientRect()
        return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height, onScreen: v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1 }
      }
    }
    invalidate()
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('dblclick', onDouble)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (hoverFrame) cancelAnimationFrame(hoverFrame)
    }
  }, [gl, camera, scene, layout, invalidate])
  return null
}

/** Double-click: go into folders (closed boxes open as box-worlds), open files. */
export function activate(id: NodeId) {
  const s = useStore.getState()
  const n = fs.get(id)
  if (!n) return
  if (n.type === 'folder') s.worldEnter(id)
  else { s.worldSelect(id); s.openPreview(id) }
}
