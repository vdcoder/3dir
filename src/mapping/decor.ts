// Deterministic placement of decorative props around and inside a world.
// Decor never represents files and is never pickable; it gives places
// identity and the map a sense of place. Every prop is placed only where it
// collides with nothing (buildings, shelves, doorways, roads, other props).

import type { NodeId } from '../model/types'
import type { ThemeId } from './plan'
import { footprint, type PropId } from './props'
import type { Rect, Vec3, WorldLayout } from './types'

export interface Decor {
  prop: PropId
  pos: Vec3
  rotY: number
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

  place(prop: PropId, x: number, z: number, rotY = 0, opts: { pad?: number; within?: Box2; force?: boolean } = {}): boolean {
    const box = propBox(prop, x, z, rotY, opts.pad ?? 0.15)
    if (!opts.force && !this.free(box, opts.within)) return false
    this.decor.push({ prop, pos: [x, 0, z], rotY })
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
const OFFICE: ThemeId[] = ['business', 'medical']

export function planDecor(layout: WorldLayout, nameOf: (id: NodeId) => string): Decor[] {
  const fixtureBox = (f: WorldLayout['fixtures'][number], front = 0.6): Box2 => ({ x0: f.pos[0] - f.size[0] / 2 - 0.2, z0: f.pos[2] - f.size[2] / 2 - 0.2, x1: f.pos[0] + f.size[0] / 2 + 0.2, z1: f.pos[2] + f.size[2] / 2 + front })
  const buildingBoxes = layout.buildings.map((b) => fromRect(b.rect, 0.3))
  const roadBoxes = layout.roads.map((r) => fromRect(r.rect, 0.2))
  // Signs stand at region gates and area fronts; keep them clear.
  const signBoxes: Box2[] = [
    ...layout.regions.map((r) => ({ x0: r.gate[0] - 2.4, z0: r.gate[1] - 1.6, x1: r.gate[0] + 2.4, z1: r.gate[1] + 0.2 })),
    ...layout.buildings.map((b) => ({ x0: b.rect.x + b.rect.w / 2 - 2, z0: b.rect.z + b.rect.d, x1: b.rect.x + b.rect.w / 2 + 2, z1: b.rect.z + b.rect.d + 1.6 })),
  ]
  const outdoor = new Planner([...buildingBoxes, ...roadBoxes, ...signBoxes])
  const main = layout.context.kind === 'main'

  // ---------- Campus plazas: fountain, benches, trees, lamps; the heart gets a clock tower ----------
  for (const a of layout.areas) {
    if (!a.plaza) continue
    const p = a.plaza
    const cx = p.x + p.w / 2
    const cz = p.z + p.d / 2
    outdoor.place('fountain', cx, cz, 0, { force: true })
    // The heart of the computer gets a clock tower: a landmark you can find from anywhere.
    if ((layout.importance.get(a.nodeId) ?? 0) >= 0.99) {
      const s = outdoor.spot('clock-tower', fromRect(p, -0.4), 0, (x, z) => -Math.abs(x - (p.x + 2.2)) - Math.abs(z - (p.z + 2.2)), 0.4, 0.2)
      if (s) outdoor.place('clock-tower', s[0], s[1], 0, { pad: 0.2 })
    }
    const r = footprint('fountain')[0] / 2 + 1.7
    for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) outdoor.place('bench', cx + dx, cz + dz, facing(cx + dx, cz + dz, cx, cz), { pad: 0.05 })
    const inset = 1.9
    for (const [x, z] of [[p.x + inset, p.z + inset], [p.x + p.w - inset, p.z + inset], [p.x + inset, p.z + p.d - inset], [p.x + p.w - inset, p.z + p.d - inset]]) {
      outdoor.place('tree-round', x, z, rand(`${x},${z}`) * 6.28, { pad: 0 })
    }
    for (const [x, z] of [[cx, p.z + 0.7], [p.x + 0.7, cz], [p.x + p.w - 0.7, cz]]) outdoor.place('lamp-post', x, z, 0, { pad: 0 })
  }

  // ---------- Building fronts ----------
  for (const b of layout.buildings) {
    const name = nameOf(b.nodeId)
    const sx = b.rect.x + b.rect.w / 2
    const sz = b.rect.z + b.rect.d + 0.95
    if (OFFICE.includes(b.theme) && main) for (const dx of [-3.4, 3.4]) outdoor.place('planter', sx + dx, sz, 0, { pad: 0.05 })
    if (b.theme === 'home' && main) {
      const s = outdoor.spot('mailbox', fromRect(b.rect, 4), 0, (x, z) => -Math.hypot(x - (b.rect.x + b.rect.w * 0.8), z - (b.rect.z + b.rect.d + 1.4)), 0.3, 0.1)
      if (s) outdoor.place('mailbox', s[0], s[1], 0, { pad: 0.1 })
    }
    if (b.theme === 'gallery' && b.main && main) {
      const s = outdoor.spot('sculpture-rings', fromRect(b.rect, 7), 0, (x, z) => -Math.hypot(x - (b.rect.x - 2.4), z - (b.rect.z + b.rect.d * 0.6)), 0.4, 0.4)
      if (s) outdoor.place('sculpture-rings', s[0], s[1], 0.5, { pad: 0.4 })
    }
    if (b.theme === 'business' && name === 'Operations' && main) {
      const region = fromRect(b.rect, 7)
      const v = outdoor.spot('van', region, 0, (x, z) => -Math.hypot(x - sx, z - (b.rect.z + b.rect.d + 2.4)), 0.5, 0.2)
      if (v) outdoor.place('van', v[0], v[1], 0, { pad: 0.2 })
      const f = outdoor.spot('forklift', region, Math.PI / 2, (x, z) => -Math.hypot(x - (b.rect.x + b.rect.w + 2), z - (b.rect.z + b.rect.d / 2)), 0.5, 0.2)
      if (f) outdoor.place('forklift', f[0], f[1], Math.PI / 2, { pad: 0.2 })
    }
    if (b.theme === 'medical' && name === 'Operations' && main) {
      const v = outdoor.spot('van', fromRect(b.rect, 7), 0, (x, z) => -Math.hypot(x - sx, z - (b.rect.z - 2.4)), 0.5, 0.2)
      if (v) outdoor.place('van', v[0], v[1], 0, { pad: 0.2 })
    }
  }

  // ---------- Interiors ----------
  const indoor = new Planner(layout.fixtures.map((f) => fixtureBox(f, 0.55)))
  for (const r of layout.rooms) {
    indoor.obstacles.push({ x0: r.rect.x + r.rect.w / 2 - 0.7, z0: r.rect.z + r.rect.d - 0.9, x1: r.rect.x + r.rect.w / 2 + 0.7, z1: r.rect.z + r.rect.d + 0.2 })
    indoor.obstacles.push({ x0: r.rect.x + r.rect.w - 1.2, z0: r.rect.z + r.rect.d / 2 - 0.9, x1: r.rect.x + r.rect.w + 0.2, z1: r.rect.z + r.rect.d / 2 + 0.9 })
  }
  const roomsByBuilding = new Map<NodeId, typeof layout.rooms>()
  for (const r of layout.rooms) roomsByBuilding.set(r.buildingId, [...(roomsByBuilding.get(r.buildingId) ?? []), r])
  for (const [bid, rooms] of roomsByBuilding) {
    const bname = nameOf(bid)
    const theme = rooms[0].theme
    const biggest = [...rooms].sort((a, b) => b.rect.w * b.rect.d - a.rect.w * a.rect.d)[0]
    if (theme === 'business' && bname === 'Board') {
      const room = rooms.find((r) => nameOf(r.nodeId) === '2026 Meetings') ?? biggest
      const inner = fromRect(room.rect, -0.45)
      const s = indoor.spot('table-boardroom', inner, 0, (x, z) => z - Math.abs(x - (inner.x0 + inner.x1) / 2), 0.25)
      if (s) indoor.place('table-boardroom', s[0], s[1], 0)
    }
    if ((theme === 'business' && bname === 'Contracts') || (theme === 'medical' && bname === 'Legal')) {
      for (const r of rooms) {
        const inner = fromRect(r.rect, -0.4)
        const s = indoor.spot('vault', inner, 0, (x, z) => -z * 3 - Math.abs(x - (inner.x0 + inner.x1) / 2), 0.3)
        if (s) { indoor.place('vault', s[0], s[1], 0); break }
      }
    }
    rooms.forEach((r, ri) => {
      const inner = fromRect(r.rect, -0.4)
      const cx = (inner.x0 + inner.x1) / 2
      if (main && OFFICE.includes(theme) && (bname === 'Strategy' || bname === 'Board')) {
        const s = indoor.spot('easel-board', inner, 0, (x, z) => -z - Math.abs(x - inner.x1) * 0.3, 0.3)
        if (s) indoor.place('easel-board', s[0], s[1], 0)
      }
      const meeting = bname === 'Board' && nameOf(r.nodeId) === '2026 Meetings'
      if (main && OFFICE.includes(theme) && !r.lobby && !meeting) {
        const s = indoor.spot('desk-office', inner, 0, (x, z) => z - Math.abs(x - (inner.x0 + 1.4)) * 0.5, 0.25)
        if (s) indoor.place('desk-office', s[0], s[1], 0)
      }
      if (main && theme === 'studio' && !r.lobby) {
        // A workbench, or a drafting table where a workbench doesn't fit; alternate between rooms.
        const order: PropId[] = (ri + (rand(r.nodeId) > 0.5 ? 1 : 0)) % 2 === 0 ? ['workbench', 'drafting-table'] : ['drafting-table', 'workbench']
        for (const prop of order) {
          const s = indoor.spot(prop, inner, 0, (x, z) => z - Math.abs(x - (inner.x0 + 1.5)) * 0.4, 0.25)
          if (s) { indoor.place(prop, s[0], s[1], 0); break }
        }
      }
      if (main && theme === 'system' && !r.lobby) {
        const s = indoor.spot('server-cabinet', inner, 0, (x, z) => -z - Math.abs(x - inner.x1) * 0.2, 0.3)
        if (s) indoor.place('server-cabinet', s[0], s[1], 0)
      }
      if (theme === 'gallery' && r.rect.w * r.rect.d > 20) {
        const s = indoor.spot('bench', inner, 0, (x, z) => -Math.hypot(x - cx, z - (inner.z0 + inner.z1) / 2), 0.3)
        if (s) indoor.place('bench', s[0], s[1], 0)
      }
      if (theme !== 'system') {
        const s = indoor.spot('plant-pot', inner, 0, (x, z) => Math.abs(x - cx) - z * 0.2 + (rand(r.nodeId) > 0.5 ? x : -x) * 0.05, 0.3, 0.05)
        if (s) indoor.place('plant-pot', s[0], s[1], rand(r.nodeId + 'p') * 6.28, { pad: 0.05 })
      }
    })
  }
  if (!main) return [...outdoor.decor, ...indoor.decor]

  // ---------- Streets: tree rows and lamps along highways and streets ----------
  const areaBoxes = layout.areas.map((a) => fromRect(a.rect, 0.4))
  const streets = new Planner([...outdoor.obstacles, ...areaBoxes, ...signBoxes])
  for (const road of layout.roads.filter((r) => r.kind !== 'path')) {
    const r = road.rect
    const horizontal = r.w >= r.d
    const len = horizontal ? r.w : r.d
    const step = road.kind === 'highway' ? 6.5 : 7.5
    for (let t = 3, i = 0; t < len - 3; t += step, i++) {
      const prop: PropId = road.kind === 'highway' ? (i % 3 === 1 ? 'lamp-post' : 'tree-cypress') : (i % 2 ? 'lamp-post' : 'tree-round')
      // Trees stand on the verge just inside the road edges.
      for (const side of [0, 1]) {
        const x = horizontal ? r.x + t : (side ? r.x + r.w - 0.6 : r.x + 0.6)
        const z = horizontal ? (side ? r.z + r.d - 0.6 : r.z + 0.6) : r.z + t
        streets.place(prop, x, z, 0, { pad: 0.05, within: fromRect(r) })
      }
    }
  }

  // ---------- Parkland: scattered trees on open grass ----------
  const land = fromRect(layout.ground, -2.5)
  const park = new Planner([...streets.obstacles, ...layout.regions.map((r) => fromRect(r.rect, 1)), ...areaBoxes, ...roadBoxes])
  for (let x = land.x0 + 3; x < land.x1 - 3; x += 8.5) {
    for (let z = land.z0 + 3; z < land.z1 - 3; z += 8.5) {
      const key = `${Math.round(x)}:${Math.round(z)}`
      const jx = x + (rand(key) - 0.5) * 5
      const jz = z + (rand(key + 'z') - 0.5) * 5
      const prop: PropId = rand(key + 'k') < 0.28 ? 'tree-cypress' : 'tree-round'
      park.place(prop, jx, jz, rand(key + 'r') * 6.28, { within: land, pad: 0.8 })
    }
  }

  // ---------- Grounds: trees on the open lawn left inside districts and blocks ----------
  const grounds = new Planner([...streets.obstacles, ...roadBoxes])
  for (const r of layout.regions) {
    if (r.metaphor !== 'district' && r.metaphor !== 'block') continue
    const inner = fromRect(r.rect, -1.6)
    const own = fromRect(r.rect)
    // Nested regions are someone else's ground.
    const nested = layout.regions.filter((q) => q !== r && inside(fromRect(q.rect), own)).map((q) => fromRect(q.rect, 1.2))
    for (let x = inner.x0 + 2; x < inner.x1 - 2; x += 7) {
      for (let z = inner.z0 + 2; z < inner.z1 - 2; z += 7) {
        const key = `g${Math.round(x)}:${Math.round(z)}`
        const jx = x + (rand(key) - 0.5) * 3.5
        const jz = z + (rand(key + 'z') - 0.5) * 3.5
        const prop: PropId = rand(key + 'k') < 0.2 ? 'tree-cypress' : 'tree-round'
        if (nested.some((b) => hits(b, propBox(prop, jx, jz, 0, 0.8)))) continue
        grounds.place(prop, jx, jz, rand(key + 'r') * 6.28, { within: inner, pad: 0.8 })
      }
    }
  }

  return [...outdoor.decor, ...indoor.decor, ...streets.decor, ...park.decor, ...grounds.decor]
}
