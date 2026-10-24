import { createContext, useContext, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { WorldLayout } from '../mapping/types'
import type { NodeId } from '../model/types'
import { fs, useStore } from '../state/store'
import { pinsFor } from './Pins'
import { center, isWithin, useLayout } from './worldData'

type Level = 'region' | 'area' | 'pin' | 'building' | 'room' | 'fixture' | 'compartment'

interface Candidate {
  key: string
  nodeId: NodeId
  level: Level
  text: string
  sub?: string
  /** Extra style (campus areas stand out). */
  variant?: string
  pos: THREE.Vector3
  /** World-space size used to decide when it is big enough on screen to label. */
  extent: number
  priority: number
}

// Minimum on-screen size (px) before a label of this level appears at rest.
const MIN_PX: Record<Level, number> = { region: 40, area: 30, pin: 0, building: 55, room: 85, fixture: 70, compartment: 60 }
const BASE_PRIORITY: Record<Level, number> = { pin: 130, area: 110, region: 100, building: 55, room: 35, fixture: 25, compartment: 15 }
// With Alt held (reveal mode), everything interactive is named down to this size.
const REVEAL_PX = 14

const chainText = (id: NodeId, from = 1) => fs.ancestry(id).slice(from, -1).map((n) => n.name).join(' › ')

function buildCandidates(layout: WorldLayout): Candidate[] {
  const out: Candidate[] = []
  const imp = (id: NodeId) => layout.importance.get(id) ?? 0.5
  const regionIds = new Set(layout.regions.map((r) => r.nodeId))
  for (const r of layout.regions) {
    out.push({
      key: 'g:' + r.nodeId, nodeId: r.nodeId, level: 'region', text: fs.get(r.nodeId)!.name, variant: r.metaphor,
      // Front-left corner: nested regions form a readable staircase of names.
      pos: new THREE.Vector3(r.rect.x + 1.4, 0.5, r.rect.z + r.rect.d - 0.5), extent: Math.max(r.rect.w, r.rect.d) * (r.depth <= 1 ? 1.6 : 1),
      priority: BASE_PRIORITY.region - r.depth * 4,
    })
  }
  for (const a of layout.areas) {
    if (regionIds.has(a.nodeId)) continue // a residual area is named by its region
    if (layout.context.kind === 'main' && a.nodeId === layout.context.rootId) continue // the land itself is the drive
    const promoted = a.prominence === 'campus' || a.prominence === 'major'
    out.push({
      key: 'a:' + a.nodeId, nodeId: a.nodeId, level: 'area', text: (a.prominence === 'campus' ? '★ ' : '') + fs.get(a.nodeId)!.name,
      sub: promoted || layout.context.kind === 'box' ? chainText(a.nodeId) : undefined,
      variant: a.prominence,
      pos: new THREE.Vector3(a.rect.x + a.rect.w / 2, 0.5, a.rect.z + a.rect.d + 0.6), extent: Math.max(a.rect.w, a.rect.d) * (a.prominence === 'campus' ? 3 : 1.4),
      priority: BASE_PRIORITY.area + imp(a.nodeId) * 20,
    })
  }
  const named = new Set([...regionIds, ...layout.areas.map((a) => a.nodeId)])
  for (const b of layout.buildings) {
    if (named.has(b.nodeId)) continue
    out.push({
      key: 'b:' + b.nodeId, nodeId: b.nodeId, level: 'building', text: fs.get(b.nodeId)!.name,
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
  const roomIds = new Set(layout.rooms.map((r) => r.nodeId))
  for (const f of layout.fixtures) {
    if (roomIds.has(f.nodeId)) continue
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
  for (const p of pinsFor(layout)) {
    out.push({
      key: 'pin:' + p.nodeId, nodeId: p.nodeId, level: 'pin', text: '★ ' + p.title, sub: fs.ancestry(p.nodeId).map((n) => n.name).slice(-3, -1).join(' › '),
      pos: new THREE.Vector3(p.x, p.top + 0.15, p.z), extent: 10, priority: BASE_PRIORITY.pin,
    })
  }
  return out
}

interface Placed { x: number; y: number; w: number; h: number }
const overlaps = (a: Placed, b: Placed) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/** Per-world label state shared by the DOM layer and the in-canvas updater. */
export interface LabelBus {
  layout: WorldLayout
  candidates: Candidate[]
  refs: Map<string, HTMLDivElement>
  sizes: Map<string, [number, number]>
  itemTag: HTMLDivElement | null
  offscreen: HTMLButtonElement | null
  itemById: Map<NodeId, WorldLayout['items'][number]>
}

export function makeLabelBus(layout: WorldLayout): LabelBus {
  return { layout, candidates: buildCandidates(layout), refs: new Map(), sizes: new Map(), itemTag: null, offscreen: null, itemById: new Map(layout.items.map((i) => [i.nodeId, i])) }
}

export const LabelBusContext = createContext<LabelBus | null>(null)

/** DOM layer with every label, rendered over the canvas (outside the 3D tree). */
export function LabelLayer({ bus }: { bus: LabelBus }) {
  return (
    <div className="labels">
      {bus.candidates.map((c) => (
        <div
          key={c.key}
          ref={(el) => { if (el) bus.refs.set(c.key, el); else bus.refs.delete(c.key) }}
          className={`wl wl-${c.level}${c.variant ? ` wl-${c.level}-${c.variant}` : ''}`}
          style={{ display: 'none' }}
          data-node={c.nodeId}
          onClick={(e) => {
            e.stopPropagation()
            // A pin is a destination: one click goes there.
            if (c.level === 'pin') useStore.getState().worldEnter(c.nodeId)
            else useStore.getState().worldSelect(c.nodeId)
          }}
          title={c.level === 'pin' ? `Go to ${fs.path(c.nodeId)}` : `${fs.path(c.nodeId)}\nDouble-click to go inside`}
          onDoubleClick={(e) => { e.stopPropagation(); if (fs.get(c.nodeId)?.type === 'folder') useStore.getState().worldEnter(c.nodeId) }}
          onPointerEnter={() => useStore.getState().setHover(c.nodeId)}
          onPointerLeave={() => useStore.getState().hoverId === c.nodeId && useStore.getState().setHover(null)}
        >
          <span className="t">{c.text}</span>
          {c.sub && <span className="s">{c.sub}</span>}
        </div>
      ))}
      <div ref={(el) => { bus.itemTag = el }} className="wl wl-item" style={{ display: 'none' }} />
      <button
        ref={(el) => { bus.offscreen = el }}
        className="offscreen"
        style={{ display: 'none' }}
        title="The selection is not in view. Click to show it."
        onClick={() => { const id = useStore.getState().world.selectedId; if (id) useStore.getState().showInWorld(id) }}
      >
        <span className="arrow">➜</span><span className="name" />
      </button>
    </div>
  )
}

/** Inside the canvas: projects label anchors each frame, hides small or colliding labels. */
export function LabelUpdater() {
  const bus = useContext(LabelBusContext)!
  const layout = useLayout()
  const v = useMemo(() => new THREE.Vector3(), [])
  const ancestors = useMemo(() => new Map(bus.candidates.map((c) => [c.key, new Set(fs.ancestry(c.nodeId).map((n) => n.id))])), [bus])
  // Draw a frame when selection/hover/location/reveal change so labels and indicators update.
  const invalidate = useThree((s) => s.invalidate)
  const sel = useStore((s) => s.world.selectedId)
  const hov = useStore((s) => s.hoverId)
  const loc = useStore((s) => s.world.location)
  const rev = useStore((s) => s.revealMode)
  useEffect(() => { invalidate() }, [sel, hov, loc, rev, invalidate])
  // Text widths change once the web font arrives: measure again.
  useEffect(() => { void document.fonts.ready.then(() => { bus.sizes.clear(); invalidate() }) }, [bus, invalidate])

  useFrame(({ camera, size }) => {
    const { world, hoverId, revealMode } = useStore.getState()
    const here = world.location
    const selectedId = world.selectedId
    const cam = camera as THREE.PerspectiveCamera
    const focal = size.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2))
    const placed: Placed[] = []
    const visible: { c: Candidate; x: number; y: number; score: number }[] = []
    for (const c of bus.candidates) {
      const el = bus.refs.get(c.key)
      if (!el) continue
      v.copy(c.pos).project(cam)
      const dist = cam.position.distanceTo(c.pos)
      const px = (c.extent / dist) * focal
      const inHere = ancestors.get(c.key)!.has(here)
      const special = c.nodeId === selectedId || c.nodeId === hoverId
      const imp = layout.importance.get(c.nodeId) ?? 0.5
      let threshold = MIN_PX[c.level] * (imp >= 0.9 ? 0.45 : imp >= 0.8 ? 0.7 : 1)
      if (inHere) threshold *= 0.6
      if (revealMode) threshold = Math.min(threshold, REVEAL_PX)
      const onScreen = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05
      if (!onScreen || (!special && px < threshold)) { el.style.display = 'none'; continue }
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      visible.push({ c, x, y, score: c.priority + (special ? 1000 : 0) + (inHere ? 20 : 0) })
    }
    visible.sort((a, b) => b.score - a.score)
    for (const { c, x: ax, y, score } of visible) {
      const el = bus.refs.get(c.key)!
      el.style.display = 'block'
      let wh = bus.sizes.get(c.key)
      // Measure once it has real size (a label measured while hidden reads 0x0 and would never collide).
      if (!wh || !wh[0]) { wh = [el.offsetWidth, el.offsetHeight]; if (wh[0]) bus.sizes.set(c.key, wh) }
      const [w, h] = wh
      // Region names start just right of their corner; others center on their anchor.
      const x = c.level === 'region' ? ax + w / 2 + 10 : ax
      // Important labels may shift a little to dodge others before giving up: [dx, lift].
      const tries: [number, number][] = c.level === 'region' || c.level === 'area'
        ? [[0, 0], [0, -h - 6], [0, h * 0.6], [0, h + 8], [0, -2 * h - 12]]
        : c.level === 'pin'
          ? [[0, 0], [w * 0.55, 0], [-w * 0.55, 0], [0, h * 0.6], [w * 0.55, h * 0.6], [-w * 0.55, h * 0.6], [w * 0.55, -h * 0.8], [-w * 0.55, -h * 0.8], [0, h + 8]]
          : [[0, 0]]
      let lift = NaN
      let shift = 0
      for (const [dx, t] of tries) {
        const r = { x: x + dx - w / 2 - 3, y: y - t - h - 3, w: w + 6, h: h + 6 }
        if (score >= 1000 || revealMode || !placed.some((p) => overlaps(p, r))) { placed.push(r); lift = t; shift = dx; break }
      }
      if (Number.isNaN(lift)) { el.style.display = 'none'; continue }
      el.style.transform = `translate(${Math.round(x + shift - w / 2)}px, ${Math.round(y - h - lift)}px)`
      el.style.setProperty('--lift', `${shift ? 0 : Math.max(0, Math.round(lift))}px`)
      el.classList.toggle('selected', c.nodeId === selectedId)
      el.classList.toggle('hovered', c.nodeId === hoverId)
      el.classList.toggle('revealed', revealMode)
    }
    updateOffscreen(bus, cam, size, selectedId, v)
    updateItemTag(bus, cam, size, selectedId, hoverId, v)
  })
  return null
}

/** Name tag over the hovered or selected file, or over the closed box something selected is in. */
function updateItemTag(bus: LabelBus, cam: THREE.Camera, size: { width: number; height: number }, selectedId: NodeId | null, hoverId: NodeId | null, v: THREE.Vector3) {
  const tag = bus.itemTag
  if (!tag) return
  const { layout, itemById } = bus
  const itemId = [hoverId, selectedId].find((id) => id && (itemById.has(id) || (layout.anchors.get(id)?.shownAs !== id && itemById.has(layout.anchors.get(id)?.shownAs ?? ''))))
  const shownAs = itemId ? layout.anchors.get(itemId)?.shownAs : undefined
  const item = itemId ? itemById.get(itemId) ?? (shownAs ? itemById.get(shownAs) : undefined) : undefined
  if (!item || !itemId) { tag.style.display = 'none'; return }
  v.set(item.pos[0], item.pos[1] + item.size[1] / 2 + 0.05, item.pos[2]).project(cam)
  if (v.z > 1) { tag.style.display = 'none'; return }
  tag.style.display = 'block'
  const n = fs.get(item.nodeId)!
  const action = n.type === 'folder' ? 'Double-click to open the box' : 'Double-click to open'
  tag.innerHTML = ''
  const t = document.createElement('span')
  t.className = 't'
  t.textContent = item.nodeId === itemId ? n.name : `${fs.get(itemId)!.name} — inside the “${n.name}” box`
  const s = document.createElement('span')
  s.className = 's'
  s.textContent = action
  tag.append(t, s)
  tag.classList.toggle('selected', itemId === selectedId)
  const x = (v.x * 0.5 + 0.5) * size.width
  const y = (-v.y * 0.5 + 0.5) * size.height
  tag.style.transform = `translate(${Math.round(x - tag.offsetWidth / 2)}px, ${Math.round(y - tag.offsetHeight - 6)}px)`
}

/** Edge-of-view pointer to a selection the camera can't see (never moves the camera by itself). */
function updateOffscreen(bus: LabelBus, cam: THREE.PerspectiveCamera, size: { width: number; height: number }, selectedId: NodeId | null, v: THREE.Vector3) {
  const el = bus.offscreen
  if (!el) return
  if (!selectedId) { el.style.display = 'none'; return }
  const { layout } = bus
  const a = layout.anchors.get(selectedId)
  const name = el.querySelector('.name') as HTMLSpanElement
  const arrow = el.querySelector('.arrow') as HTMLSpanElement
  if (!a) {
    // The selection lives in another world (inside a box, or outside this box).
    el.style.display = 'flex'
    const text = `${fs.get(selectedId)!.name} — elsewhere`
    if (name.textContent !== text) name.textContent = text
    arrow.style.transform = isWithin(selectedId, layout.context.rootId) ? 'rotate(90deg)' : 'rotate(-90deg)'
    el.style.transform = `translate(${Math.round(size.width / 2 - el.offsetWidth / 2)}px, ${Math.round(size.height - el.offsetHeight - 14)}px)`
    return
  }
  if (a.level === 'land') { el.style.display = 'none'; return }
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
  const text = fs.get(selectedId)!.name
  if (name.textContent !== text) name.textContent = text
  const w = el.offsetWidth
  const h = el.offsetHeight
  const x = THREE.MathUtils.clamp((dx * 0.5 + 0.5) * size.width - w / 2, 12, size.width - w - 12)
  const y = THREE.MathUtils.clamp((-dy * 0.5 + 0.5) * size.height - h / 2, 56, size.height - h - 12)
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
  arrow.style.transform = `rotate(${Math.atan2(-dy, dx)}rad)`
}
