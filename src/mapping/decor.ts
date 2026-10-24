// Deterministic placement of decorative props around and inside the layout.
// Decor never represents files; it gives districts identity and the map a
// sense of place. Every prop is placed only where it collides with nothing.

import type { NodeId } from '../model/types'
import type { Rect, Vec3, WorldLayout } from './layout'
import { footprint, type PropId } from './props'

export interface Decor {
  prop: PropId
  pos: Vec3
  rotY: number
  /** The place this prop belongs to (clicking it selects that place). */
  placeId?: NodeId
}

interface Box2 { x0: number; z0: number; x1: number; z1: number }

const fromRect = (r: Rect, pad = 0): Box2 => ({ x0: r.x - pad, z0: r.z - pad, x1: r.x + r.w + pad, z1: r.z + r.d + pad })
const hits = (a: Box2, b: Box2) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1
const inside = (a: Box2, outer: Box2) => a.x0 >= outer.x0 && a.x1 <= outer.x1 && a.z0 >= outer.z0 && a.z1 <= outer.z1

function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return h >>> 0
}
const rand = (s: string) => (hash(s) % 10_000) / 10_000

/** Footprint box of a prop at (x, z), rotated by a multiple of 90° (others use the larger side). */
function propBox(id: PropId, x: number, z: number, rotY: number, pad: number): Box2 {
  const [w, d] = footprint(id)
  const q = Math.round(rotY / (Math.PI / 2))
  const exact = Math.abs(rotY - q * (Math.PI / 2)) < 1e-6
  const [hw, hd] = exact ? (q % 2 === 0 ? [w / 2, d / 2] : [d / 2, w / 2]) : [Math.max(w, d) / 2, Math.max(w, d) / 2]
  return { x0: x - hw - pad, z0: z - hd - pad, x1: x + hw + pad, z1: z + hd + pad }
}

class Planner {
  decor: Decor[] = []
  constructor(public obstacles: Box2[]) {}

  free(b: Box2, within?: Box2): boolean {
    if (within && !inside(b, within)) return false
    return !this.obstacles.some((o) => hits(o, b))
  }

  place(prop: PropId, x: number, z: number, rotY = 0, opts: { pad?: number; within?: Box2; placeId?: NodeId; force?: boolean } = {}): boolean {
    const box = propBox(prop, x, z, rotY, opts.pad ?? 0.15)
    if (!opts.force && !this.free(box, opts.within)) return false
    this.decor.push({ prop, pos: [x, 0, z], rotY, placeId: opts.placeId })
    this.obstacles.push(propBox(prop, x, z, rotY, 0.05))
    return true
  }

  /** Best free spot in a region by a preference score (higher is better). */
  spot(prop: PropId, region: Box2, rotY: number, score: (x: number, z: number) => number, step = 0.4, pad = 0.15): [number, number] | null {
    let best: [number, number] | null = null
    let bestScore = -Infinity
    for (let x = region.x0; x <= region.x1; x += step) {
      for (let z = region.z0; z <= region.z1; z += step) {
        if (!this.free(propBox(prop, x, z, rotY, pad), region)) continue
        const s = score(x, z)
        if (s > bestScore) { bestScore = s; best = [x, z] }
      }
    }
    return best
  }
}

const facing = (fromX: number, fromZ: number, toX: number, toZ: number) => Math.atan2(toX - fromX, toZ - fromZ)

export function planDecor(layout: WorldLayout, nameOf: (id: NodeId) => string): Decor[] {
  const obstacles: Box2[] = [
    ...layout.buildings.map((b) => fromRect(b.rect, 0.3)),
    ...layout.portals.map((p) => ({ x0: p.pos[0] - 0.6, z0: p.pos[2] - 0.4, x1: p.pos[0] + 0.6, z1: p.pos[2] + 0.4 })),
    ...layout.fixtures.map((f) => ({ x0: f.pos[0] - f.size[0] / 2 - 0.2, z0: f.pos[2] - f.size[2] / 2 - 0.2, x1: f.pos[0] + f.size[0] / 2 + 0.2, z1: f.pos[2] + f.size[2] / 2 + 0.6 })),
  ]
  const walkBoxes: Box2[] = []
  for (const w of layout.walkways) {
    for (let i = 0; i < w.points.length - 1; i++) {
      const [ax, az] = w.points[i]
      const [bx, bz] = w.points[i + 1]
      const h = w.width / 2 + 0.6
      walkBoxes.push({ x0: Math.min(ax, bx) - h, z0: Math.min(az, bz) - h, x1: Math.max(ax, bx) + h, z1: Math.max(az, bz) + h })
    }
  }
  const outdoor = new Planner([...obstacles, ...walkBoxes])

  // ---------- Business plaza: fountain, benches, trees, lamps, clock tower ----------
  for (const d of layout.districts) {
    if (!d.plaza) continue
    const p = d.plaza
    const cx = p.x + p.w / 2
    const cz = p.z + p.d / 2
    const placeId = d.nodeIds[0]
    outdoor.place('fountain', cx, cz, 0, { placeId, force: true })
    const r = footprint('fountain')[0] / 2 + 1.7
    for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
      outdoor.place('bench', cx + dx, cz + dz, facing(cx + dx, cz + dz, cx, cz), { placeId, pad: 0.05 })
    }
    const inset = 1.9
    for (const [x, z] of [[p.x + inset, p.z + inset], [p.x + p.w - inset, p.z + inset], [p.x + inset, p.z + p.d - inset], [p.x + p.w - inset, p.z + p.d - inset]]) {
      outdoor.place('tree-round', x, z, rand(`${x},${z}`) * 6.28, { placeId, pad: 0 })
    }
    for (const [x, z] of [[cx, p.z + 0.7], [cx, p.z + p.d - 0.7], [p.x + 0.7, cz], [p.x + p.w - 0.7, cz]]) {
      outdoor.place('lamp-post', x, z, 0, { placeId, pad: 0 })
    }
    for (const sx of [-1, 1]) outdoor.place('planter', cx + sx * (p.w / 2 - 4.2), p.z + p.d - 0.9, 0, { placeId, pad: 0.05 })
    // Landmark clock tower: in the plaza's free corner area nearest the entrance, else anywhere in the district.
    const district = fromRect(d.rect, 1.5)
    const spot = outdoor.spot('clock-tower', district, 0, (x, z) => -Math.abs(x - (p.x + 2.5)) - Math.abs(z - (p.z + p.d - 2.5)), 0.5, 0.3)
    if (spot) outdoor.place('clock-tower', spot[0], spot[1], 0, { placeId, pad: 0.3 })
  }

  // ---------- Building-specific outdoor props ----------
  for (const b of layout.buildings) {
    const name = nameOf(b.nodeId)
    const front = (x: number, z: number) => -Math.hypot(x - (b.rect.x + b.rect.w * 0.78), z - (b.rect.z + b.rect.d + 1.6))
    if (b.theme === 'business') {
      // Planters flank the lettered sign at each business entrance.
      const sx = b.rect.x + b.rect.w / 2
      const sz = b.rect.z + b.rect.d + 0.95
      for (const dx of [-2.6, 2.6]) outdoor.place('planter', sx + dx, sz, 0, { placeId: b.nodeId, pad: 0.05 })
    }
    if (b.theme === 'home') {
      // A mailbox by every front door.
      const s = outdoor.spot('mailbox', fromRect(b.rect, 4), 0, front, 0.3, 0.1)
      if (s) outdoor.place('mailbox', s[0], s[1], 0, { placeId: b.nodeId, pad: 0.1 })
    }
    if (b.theme === 'gallery') {
      const region = fromRect(b.rect, 8)
      const s = outdoor.spot('sculpture-rings', region, 0, (x, z) => -Math.hypot(x - (b.rect.x - 2.6), z - (b.rect.z + b.rect.d * 0.6)), 0.4, 0.4)
      if (s) outdoor.place('sculpture-rings', s[0], s[1], 0.5, { placeId: b.nodeId, pad: 0.4 })
      for (const dx of [-2.2, 2.2]) {
        const bx = b.rect.x + b.rect.w / 2 + dx
        outdoor.place('bench', bx, b.rect.z + b.rect.d + 2.6, Math.PI, { placeId: b.nodeId, pad: 0.1 })
      }
    }
    if (b.theme === 'business' && name === 'Operations') {
      const region = fromRect(b.rect, 7)
      const s = outdoor.spot('van', region, 0, (x, z) => -Math.hypot(x - (b.rect.x + b.rect.w / 2), z - (b.rect.z + b.rect.d + 2.2)), 0.5, 0.2)
      if (s) outdoor.place('van', s[0], s[1], 0, { placeId: b.nodeId, pad: 0.2 })
      const f = outdoor.spot('forklift', region, Math.PI / 2, (x, z) => -Math.hypot(x - (b.rect.x + b.rect.w + 2), z - (b.rect.z + b.rect.d / 2)), 0.5, 0.2)
      if (f) outdoor.place('forklift', f[0], f[1], Math.PI / 2, { placeId: b.nodeId, pad: 0.2 })
    }
  }

  // ---------- Interiors ----------
  // Indoors, building outlines aren't obstacles; fixtures and doorways are.
  const indoor = new Planner(layout.fixtures.map((f) => ({ x0: f.pos[0] - f.size[0] / 2 - 0.15, z0: f.pos[2] - f.size[2] / 2 - 0.15, x1: f.pos[0] + f.size[0] / 2 + 0.15, z1: f.pos[2] + f.size[2] / 2 + 0.55 })))
  for (const r of layout.rooms) {
    // Doorways (south and east, centered) stay clear.
    indoor.obstacles.push({ x0: r.rect.x + r.rect.w / 2 - 0.9, z0: r.rect.z + r.rect.d - 1.2, x1: r.rect.x + r.rect.w / 2 + 0.9, z1: r.rect.z + r.rect.d + 0.2 })
    indoor.obstacles.push({ x0: r.rect.x + r.rect.w - 1.2, z0: r.rect.z + r.rect.d / 2 - 0.9, x1: r.rect.x + r.rect.w + 0.2, z1: r.rect.z + r.rect.d / 2 + 0.9 })
  }
  const buildingName = new Map(layout.buildings.map((b) => [b.nodeId, nameOf(b.nodeId)]))
  const roomsByBuilding = new Map<NodeId, typeof layout.rooms>()
  for (const r of layout.rooms) roomsByBuilding.set(r.buildingId, [...(roomsByBuilding.get(r.buildingId) ?? []), r])

  for (const [bid, rooms] of roomsByBuilding) {
    const bname = buildingName.get(bid)
    const theme = rooms[0].theme
    const biggest = [...rooms].sort((a, b) => b.rect.w * b.rect.d - a.rect.w * a.rect.d)[0]
    if (theme === 'business' && bname === 'Board') {
      const room = rooms.find((r) => nameOf(r.nodeId) === '2026 Meetings') ?? biggest
      const inner = fromRect(room.rect, -0.45)
      const s = indoor.spot('table-boardroom', inner, 0, (x, z) => z - Math.abs(x - (inner.x0 + inner.x1) / 2), 0.25)
      if (s) indoor.place('table-boardroom', s[0], s[1], 0, { placeId: room.nodeId })
    }
    if (theme === 'business' && bname === 'Contracts') {
      for (const r of rooms) {
        const inner = fromRect(r.rect, -0.4)
        const s = indoor.spot('vault', inner, 0, (x, z) => -z * 3 - Math.abs(x - (inner.x0 + inner.x1) / 2), 0.3)
        if (s) { indoor.place('vault', s[0], s[1], 0, { placeId: r.nodeId }); break }
      }
    }
    rooms.forEach((r, ri) => {
      const inner = fromRect(r.rect, -0.4)
      const cx = (inner.x0 + inner.x1) / 2
      if (theme === 'studio' && !r.lobby) {
        const prop: PropId = ri % 2 === 0 ? 'workbench' : 'drafting-table'
        const s = indoor.spot(prop, inner, 0, (x, z) => z - Math.abs(x - (inner.x0 + 1.5)) * 0.4, 0.25)
        if (s) indoor.place(prop, s[0], s[1], 0, { placeId: r.nodeId })
      }
      if (theme === 'system' && !r.lobby) {
        const s = indoor.spot('server-cabinet', inner, 0, (x, z) => -z - Math.abs(x - inner.x1) * 0.2, 0.3)
        if (s) indoor.place('server-cabinet', s[0], s[1], 0, { placeId: r.nodeId })
      }
      if (theme === 'business' && (bname === 'Strategy' || bname === 'Board')) {
        const s = indoor.spot('easel-board', inner, 0, (x, z) => -z - Math.abs(x - inner.x1) * 0.3, 0.3)
        if (s) indoor.place('easel-board', s[0], s[1], 0, { placeId: r.nodeId })
      }
      const meeting = bname === 'Board' && nameOf(r.nodeId) === '2026 Meetings'
      if (theme === 'business' && !r.lobby && !meeting) {
        const s = indoor.spot('desk-office', inner, 0, (x, z) => z - Math.abs(x - (inner.x0 + 1.4)) * 0.5, 0.25)
        if (s) indoor.place('desk-office', s[0], s[1], 0, { placeId: r.nodeId })
      }
      if (theme === 'gallery' && r.rect.w * r.rect.d > 20) {
        const s = indoor.spot('bench', inner, 0, (x, z) => -Math.hypot(x - cx, z - (inner.z0 + inner.z1) / 2), 0.3)
        if (s) indoor.place('bench', s[0], s[1], 0, { placeId: r.nodeId })
      }
      if (theme !== 'system') {
        // A plant in the emptiest corner, preferring the back corners.
        const s = indoor.spot('plant-pot', inner, 0, (x, z) => Math.max(Math.abs(x - cx), 0) - z * 0.2 + (rand(r.nodeId) > 0.5 ? x : -x) * 0.05, 0.3, 0.05)
        if (s) indoor.place('plant-pot', s[0], s[1], rand(r.nodeId + 'p') * 6.28, { placeId: r.nodeId, pad: 0.05 })
      }
    })
  }

  // ---------- Streets: cypress rows and lamps along avenues ----------
  const land = fromRect(layout.land, -2.5)
  const pads = layout.districts.map((d) => fromRect(d.rect, 2.6))
  const streets = new Planner([...obstacles, ...pads])
  for (const w of layout.walkways.filter((x) => x.kind === 'avenue')) {
    const [[ax, az], [bx, bz]] = w.points
    const horizontal = Math.abs(bx - ax) > Math.abs(bz - az)
    const len = horizontal ? Math.abs(bx - ax) : Math.abs(bz - az)
    const off = w.width / 2 + 1.3
    for (let t = 4, i = 0; t < len - 4; t += 6.5, i++) {
      for (const side of [-1, 1]) {
        const x = horizontal ? Math.min(ax, bx) + t : ax + side * off
        const z = horizontal ? az + side * off : Math.min(az, bz) + t
        const prop: PropId = i % 3 === 1 ? 'lamp-post' : 'tree-cypress'
        streets.place(prop, x, z, 0, { within: land, pad: 0.4 })
      }
    }
  }

  // ---------- Parkland: scattered trees on open grass ----------
  const park = new Planner([...streets.obstacles, ...walkBoxes, ...outdoor.obstacles])
  for (let x = land.x0 + 3; x < land.x1 - 3; x += 8.5) {
    for (let z = land.z0 + 3; z < land.z1 - 3; z += 8.5) {
      const key = `${Math.round(x)}:${Math.round(z)}`
      const jx = x + (rand(key) - 0.5) * 5
      const jz = z + (rand(key + 'z') - 0.5) * 5
      const prop: PropId = rand(key + 'k') < 0.28 ? 'tree-cypress' : 'tree-round'
      park.place(prop, jx, jz, rand(key + 'r') * 6.28, { within: land, pad: 0.8 })
    }
  }

  return [...outdoor.decor, ...indoor.decor, ...streets.decor, ...park.decor]
}
