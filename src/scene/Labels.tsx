import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { NodeId } from '../model/types'
import { fs, useStore } from '../state/store'
import { center, layout } from './worldData'
import { pins } from './Pins'

type Level = 'district' | 'pin' | 'building' | 'room' | 'fixture' | 'compartment' | 'portal' | 'item'

interface Candidate {
  key: string
  nodeId: NodeId | null
  level: Level
  text: string
  sub?: string
  pos: THREE.Vector3
  /** World-space size used to decide when it is big enough on screen to label. */
  extent: number
  priority: number
  /** Ids of this node and its ancestors, for fast "is it inside the focus?" checks. */
  ancestors?: Set<NodeId>
}

// Minimum on-screen size (px) before a label of this level appears.
const MIN_PX: Record<Level, number> = { district: 0, pin: 0, building: 55, room: 85, fixture: 70, compartment: 60, portal: 40, item: 45 }
const BASE_PRIORITY: Record<Level, number> = { district: 100, pin: 130, portal: 60, building: 55, room: 35, fixture: 25, compartment: 15, item: 5 }

function buildCandidates(): Candidate[] {
  const out: Candidate[] = []
  const imp = (id: NodeId) => layout.importance.get(id) ?? 0.5
  for (const d of layout.districts) {
    const real = d.nodeIds.length === 1 ? fs.path(d.nodeIds[0]) : undefined
    out.push({
      key: 'd:' + d.key, nodeId: d.nodeIds.length === 1 ? d.nodeIds[0] : null, level: 'district', text: d.title,
      sub: real && real.split('\\').length > 2 ? real : undefined,
      pos: new THREE.Vector3(d.rect.x + d.rect.w / 2, 0.3, d.rect.z + d.rect.d + 1.6), extent: Math.max(d.rect.w, d.rect.d), priority: BASE_PRIORITY.district,
    })
  }
  for (const b of layout.buildings) {
    const n = fs.get(b.nodeId)!
    out.push({
      key: 'b:' + b.nodeId, nodeId: b.nodeId, level: 'building', text: n.name,
      pos: new THREE.Vector3(b.rect.x + b.rect.w / 2, b.wallHeight + 0.6, b.rect.z + 0.6), extent: Math.max(b.rect.w, b.rect.d),
      priority: BASE_PRIORITY.building + imp(b.nodeId) * 30,
    })
  }
  for (const r of layout.rooms) {
    if (r.lobby) continue
    out.push({
      key: 'r:' + r.nodeId, nodeId: r.nodeId, level: 'room', text: fs.get(r.nodeId)!.name,
      pos: new THREE.Vector3(r.rect.x + r.rect.w / 2, 0.4, r.rect.z + r.rect.d - 0.5), extent: Math.max(r.rect.w, r.rect.d),
      priority: BASE_PRIORITY.room + imp(r.nodeId) * 25,
    })
  }
  for (const f of layout.fixtures) {
    if (layout.rooms.some((r) => r.nodeId === f.nodeId)) continue
    out.push({
      key: 'f:' + f.nodeId, nodeId: f.nodeId, level: 'fixture', text: fs.get(f.nodeId)!.name,
      pos: new THREE.Vector3(f.pos[0], f.size[1] + 0.25, f.pos[2]), extent: f.size[0],
      priority: BASE_PRIORITY.fixture + imp(f.nodeId) * 25,
    })
  }
  for (const c of layout.compartments) {
    const [x, , z] = center(c.bounds)
    out.push({
      key: 'c:' + c.nodeId, nodeId: c.nodeId, level: 'compartment', text: fs.get(c.nodeId)!.name,
      pos: new THREE.Vector3(x, c.bounds.max[1] + 0.06, z + 0.25), extent: c.bounds.max[0] - c.bounds.min[0] + 0.3,
      priority: BASE_PRIORITY.compartment + imp(c.nodeId) * 25,
    })
  }
  for (const p of layout.portals) {
    out.push({
      key: 'p:' + p.nodeId, nodeId: p.nodeId, level: 'portal', text: '→ ' + fs.get(p.nodeId)!.name,
      pos: new THREE.Vector3(p.pos[0], 2.2, p.pos[2]), extent: 2.5, priority: BASE_PRIORITY.portal,
    })
  }
  for (const p of pins) {
    const chain = fs.ancestry(p.nodeId).map((n) => n.name)
    out.push({
      key: 'pin:' + p.nodeId, nodeId: p.nodeId, level: 'pin', text: '★ ' + p.title,
      sub: chain.slice(-3, -1).join(' › '),
      pos: new THREE.Vector3(p.x, p.top + 0.15, p.z), extent: 10, priority: BASE_PRIORITY.pin,
    })
  }
  for (const c of out) if (c.nodeId) c.ancestors = new Set(fs.ancestry(c.nodeId).map((n) => n.id))
  return out
}

interface Placed { x: number; y: number; w: number; h: number }
const overlaps = (a: Placed, b: Placed) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const candidates = buildCandidates()
const rootId = fs.roots()[0].id
// Label elements live in the DOM layer; the in-canvas updater positions them.
const refs = new Map<string, HTMLDivElement>()
const sizes = new Map<string, [number, number]>()
let itemTag: HTMLDivElement | null = null
let offscreen: HTMLButtonElement | null = null

/** DOM layer with every label, rendered over the canvas (outside the 3D tree). */
export function LabelLayer() {
  return (
    <div className="labels">
      {candidates.map((c) => (
        <div
          key={c.key}
          ref={(el) => { if (el) refs.set(c.key, el); else refs.delete(c.key) }}
          className={`wl wl-${c.level}`}
          style={{ display: 'none' }}
          onClick={(e) => { e.stopPropagation(); if (c.nodeId) useStore.getState().worldSelect(c.nodeId) }}
          onDoubleClick={(e) => { e.stopPropagation(); if (c.nodeId && fs.get(c.nodeId)?.type === 'folder') useStore.getState().worldEnter(c.nodeId) }}
          onPointerEnter={() => c.nodeId && useStore.getState().setHover(c.nodeId)}
          onPointerLeave={() => c.nodeId && useStore.getState().hoverId === c.nodeId && useStore.getState().setHover(null)}
        >
          <span className="t">{c.text}</span>
          {c.sub && <span className="s">{c.sub}</span>}
        </div>
      ))}
      <div ref={(el) => { itemTag = el }} className="wl wl-item" style={{ display: 'none' }} />
      <button
        ref={(el) => { offscreen = el }}
        className="offscreen"
        style={{ display: 'none' }}
        title="The selection is outside the current view. Click to show it."
        onClick={() => { const id = useStore.getState().world.selectedId; if (id) useStore.getState().showInWorld(id) }}
      >
        <span className="arrow">➜</span><span className="name" />
      </button>
    </div>
  )
}

/** Inside the canvas: projects label anchors each frame, hides small or colliding labels. */
export function LabelUpdater() {
  const v = useMemo(() => new THREE.Vector3(), [])
  const selectedRef = useRef<NodeId | null>(null)
  // Draw a frame when selection/hover/focus change so labels and indicators update.
  const invalidate = useThree((s) => s.invalidate)
  const sel = useStore((s) => s.world.selectedId)
  const hov = useStore((s) => s.hoverId)
  const foc = useStore((s) => s.world.focusId)
  useEffect(() => { invalidate() }, [sel, hov, foc, invalidate])

  useFrame(({ camera, size }) => {
    const { world, hoverId } = useStore.getState()
    const focusId = world.focusId
    const selectedId = world.selectedId
    selectedRef.current = selectedId
    const cam = camera as THREE.PerspectiveCamera
    const focal = size.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2))
    const placed: Placed[] = []
    const visible: { c: Candidate; x: number; y: number; score: number }[] = []
    for (const c of candidates) {
      const el = refs.get(c.key)
      if (!el) continue
      v.copy(c.pos).project(cam)
      const dist = cam.position.distanceTo(c.pos)
      const px = (c.extent / dist) * focal
      const inFocus = c.ancestors ? c.ancestors.has(focusId) : focusId === rootId
      const special = c.nodeId !== null && (c.nodeId === selectedId || c.nodeId === hoverId)
      const imp = c.nodeId ? layout.importance.get(c.nodeId) ?? 0.5 : 1
      let threshold = MIN_PX[c.level] * (imp >= 0.9 ? 0.45 : imp >= 0.8 ? 0.7 : 1)
      if (inFocus) threshold *= 0.6
      const onScreen = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05
      if (!onScreen || (!special && px < threshold)) { el.style.display = 'none'; continue }
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      visible.push({ c, x, y, score: c.priority + (special ? 1000 : 0) + (inFocus ? 20 : 0) })
    }
    visible.sort((a, b) => b.score - a.score)
    for (const { c, x, y, score } of visible) {
      const el = refs.get(c.key)!
      el.style.display = 'block'
      let wh = sizes.get(c.key)
      if (!wh) { wh = [el.offsetWidth, el.offsetHeight]; sizes.set(c.key, wh) }
      const [w, h] = wh
      // Important labels may move up a little to dodge others before giving up.
      const tries = c.level === 'district' ? [0, -h - 6, h * 0.6, h + 8, -2 * h - 12] : c.level === 'pin' ? [0, h * 0.6, h + 8, 2 * h + 16] : [0]
      let lift = NaN
      for (const t of tries) {
        const r = { x: x - w / 2 - 3, y: y - t - h - 3, w: w + 6, h: h + 6 }
        if (score >= 1000 || !placed.some((p) => overlaps(p, r))) { placed.push(r); lift = t; break }
      }
      if (Number.isNaN(lift)) { el.style.display = 'none'; continue }
      el.style.transform = `translate(${Math.round(x - w / 2)}px, ${Math.round(y - h - lift)}px)`
      el.style.setProperty('--lift', `${Math.max(0, Math.round(lift))}px`)
      el.classList.toggle('selected', c.nodeId !== null && c.nodeId === selectedId)
      el.classList.toggle('hovered', c.nodeId !== null && c.nodeId === hoverId)
    }
    updateOffscreen(cam, size, selectedId, v)
    // Item tag: the hovered or selected file, or the closed box a selection is inside.
    const tag = itemTag
    if (!tag) return
    const itemId = [hoverId, selectedId].find((id) => id && (fs.get(id)?.type === 'file' || layout.anchors.get(id)?.shownAs !== id))
    const shownAs = itemId ? layout.anchors.get(itemId)?.shownAs : undefined
    const item = itemId ? itemById.get(itemId) ?? (shownAs ? itemById.get(shownAs) : undefined) : undefined
    if (!item || !itemId) { tag.style.display = 'none'; return }
    v.set(item.pos[0], item.pos[1] + item.size[1] / 2 + 0.05, item.pos[2]).project(cam)
    if (v.z > 1) { tag.style.display = 'none'; return }
    tag.style.display = 'block'
    tag.textContent = item.nodeId === itemId ? fs.get(itemId)!.name : `${fs.get(itemId)!.name} — inside the “${fs.get(item.nodeId)!.name}” box`
    tag.classList.toggle('selected', itemId === selectedId)
    const x = (v.x * 0.5 + 0.5) * size.width
    const y = (-v.y * 0.5 + 0.5) * size.height
    tag.style.transform = `translate(${Math.round(x - tag.offsetWidth / 2)}px, ${Math.round(y - tag.offsetHeight - 6)}px)`
  })
  return null
}

const itemById = new Map(layout.items.map((i) => [i.nodeId, i]))

/** Edge-of-view pointer to a selection the camera can't see (no automatic camera move). */
function updateOffscreen(cam: THREE.PerspectiveCamera, size: { width: number; height: number }, selectedId: NodeId | null, v: THREE.Vector3) {
  const el = offscreen
  if (!el) return
  const a = selectedId ? layout.anchors.get(selectedId) : undefined
  if (!a || a.level === 'land') { el.style.display = 'none'; return }
  const b = (layout.anchors.get(a.shownAs) ?? a).bounds
  v.set((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2).project(cam)
  const behind = v.z > 1
  if (!behind && Math.abs(v.x) < 0.97 && Math.abs(v.y) < 0.97) { el.style.display = 'none'; return }
  let dx = behind ? -v.x : v.x
  let dy = behind ? -v.y : v.y
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) dy = -1
  const k = 1 / Math.max(Math.abs(dx), Math.abs(dy))
  dx *= k
  dy *= k
  el.style.display = 'flex'
  const name = el.querySelector('.name') as HTMLSpanElement
  const text = fs.get(selectedId!)!.name
  if (name.textContent !== text) name.textContent = text
  const w = el.offsetWidth
  const h = el.offsetHeight
  const x = THREE.MathUtils.clamp((dx * 0.5 + 0.5) * size.width - w / 2, 12, size.width - w - 12)
  const y = THREE.MathUtils.clamp((-dy * 0.5 + 0.5) * size.height - h / 2, 56, size.height - h - 12)
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
  const arrow = el.querySelector('.arrow') as HTMLSpanElement
  arrow.style.transform = `rotate(${Math.atan2(-dy, dx)}rad)`
}
