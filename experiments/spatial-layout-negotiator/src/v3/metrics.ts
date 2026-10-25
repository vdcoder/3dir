// Geometry and quality metrics that apply to α.v2 and α.v3 layouts alike.
//
// Unused floor (rooms, buildings, campuses): floor that is neither a child, nor
// furniture, nor a feature zone, nor the designed minimum of a band of the
// container's own space. A band (aisle, clearance, wall, corridor, street,
// path, courtyard, plaza, boundary, entrance) counts as used up to its designed
// minimum thickness; anything thicker is unused. Open floor with no purpose
// (α.v3 row ends, open circulation, lobbies, campus grounds) is unused; α.v2
// table envelopes larger than the table's minimum count their extra too. Area
// packing gaps are reported separately: both versions pack areas the same way.

import type { Config } from '../config.ts'
import { DEFAULT_CONFIG } from '../config.ts'
import type { Placed, Region } from '../protocol.ts'
import { nodes } from '../validate.ts'

const area = (r: { w: number; d: number }) => r.w * r.d

/** Designed minimum thickness of a band of own space, or null when the region is fully unused / fully used. */
function bandMin(cfg: Config, kind: string, g: Region): number | 'unused' | 'used' {
  const r = g.role
  if (r === 'feature' || r === 'walkway' || r === 'walk' || r === 'structure' || r === 'breathing' || r === 'display') return 'used'
  if (r === 'open' || r === 'circulation' || r === 'ground' || r === 'lobby') return 'unused'
  if (kind === 'room') {
    if (r === 'wall') return g.axis === 'x' ? cfg.room.wall : cfg.room.rear
    if (r === 'entrance') return cfg.room.entrance
    if (r === 'aisle') return cfg.room.aisle
    if (r === 'spacing') return cfg.room.shelfGap
  }
  if (kind === 'building') {
    if (r === 'wall') return g.axis === 'y' ? cfg.building.rear : g.label === 'partition' ? cfg.building.roomWall : cfg.building.wall
    if (r === 'corridor') return cfg.building.corridor
    if (r === 'entrance') return cfg.building.entrance
  }
  if (kind === 'campus') {
    if (r === 'boundary') return cfg.campus.boundary
    if (r === 'path') return cfg.campus.path
    if (r === 'street') return cfg.campus.street
    if (r === 'courtyard') return cfg.campus.courtyard
    if (r === 'plaza') return cfg.campus.entrance
  }
  return 'used'
}

function unusedOf(cfg: Config, n: Placed): number {
  let u = 0
  for (const g of n.regions) {
    const m = bandMin(cfg, n.kind, g)
    if (m === 'used') continue
    if (m === 'unused') { u += area(g.rect); continue }
    const thick = g.axis === 'x' ? g.rect.w : g.rect.d
    const len = g.axis === 'x' ? g.rect.d : g.rect.w
    u += Math.max(0, thick - m) * len
  }
  return u
}

/** Physical furniture footprint in a room: shelf fixtures, the table, desks and feature furniture. */
function furnitureOf(room: Placed): number {
  let s = 0
  for (const c of room.children) {
    if (c.kind === 'shelf') { const b = (c.meta?.body as { w: number; d: number }) ?? c.rect; s += area(b) }
    else for (const o of c.objects) if (o.layer === 0) s += area(o.rect)
  }
  for (const o of room.objects) if (o.layer === 0) s += area(o.rect)
  return s
}

export interface LayoutMetrics {
  rootW: number; rootD: number; rootArea: number
  containers: Record<string, number>
  rooms: number
  /** Room proportions: mean |ln(w/d)|, share beyond 3 : 1, worst ratio. */
  roomImbalance: number; roomBeyond3: number; roomWorst: number
  roomMaxW: number; roomMaxD: number; roomsOverMax: number; meanRoomArea: number
  /** Room floor as a share of the root. */
  roomsShare: number
  /** Physical furniture / room floor. */
  furnitureDensity: number
  /** Unused floor (see the file comment), by level, in m², and in total as a share of the root. */
  unused: { room: number; building: number; campus: number; total: number; share: number; perRoom: number; roomShare: number }
  /** Own space of areas (boundaries, sign bands, separators and packing gaps) as a share of the root. */
  areaOwnShare: number
  /** Book widths / shelf fixture length, over all shelves. */
  shelfFill: number
  /** Per shelf row: (fixtures + gaps between them) / the room's width inside its side clearances; mean over rows. */
  rowOccupancy: number
  segments: number; stacks: number; shelves: number
  features: number; featureTypes: Record<string, number>; featureFloor: number
  /** Rooms larger than their selected offer, and the floor they gained. */
  grownRooms: number; roomGrowth: number
}

export function layoutMetrics(p: Placed, cfg: Config = DEFAULT_CONFIG): LayoutMetrics {
  const containers: Record<string, number> = {}
  const logs: number[] = []
  let rooms = 0, roomArea = 0, furn = 0, maxW = 0, maxD = 0, over = 0, books = 0, shelfLen = 0, segments = 0, shelves = 0
  const stacks = new Set<string>()
  const unused = { room: 0, building: 0, campus: 0 }
  let areaOwn = 0, features = 0, featureFloor = 0, grown = 0, growth = 0
  const featureTypes: Record<string, number> = {}
  const occ: number[] = []
  for (const n of nodes(p)) {
    if (n.kind === 'book') continue
    containers[n.kind] = (containers[n.kind] ?? 0) + 1
    if (n.kind === 'area') areaOwn += area(n.rect) - n.children.reduce((s, c) => s + area(c.rect), 0)
    if (n.kind === 'campus' || n.kind === 'building') unused[n.kind] += unusedOf(cfg, n)
    if (n.kind === 'table') unused.room += Math.max(0, area(n.rect) - area(n.min))
    if (n.kind === 'shelf') {
      shelves++
      shelfLen += n.rect.w
      for (const b of n.children) books += b.objects[0].rect.w
      const s = n.meta?.segment as { groupId: string } | undefined
      if (s) { segments++; stacks.add(s.groupId) }
    }
    if (n.kind !== 'room') continue
    rooms++
    const a = area(n.rect)
    roomArea += a
    furn += furnitureOf(n)
    unused.room += unusedOf(cfg, n)
    logs.push(Math.abs(Math.log(n.rect.w / n.rect.d)))
    maxW = Math.max(maxW, n.rect.w)
    maxD = Math.max(maxD, n.rect.d)
    if (n.rect.w > cfg.v3.maxRoomWidth + 1e-6) over++
    if (a > area(n.min) + 1e-6) { grown++; growth += a - area(n.min) }
    for (const g of n.regions) if (g.role === 'feature') { features++; featureFloor += area(g.rect); featureTypes[g.feature ?? g.label] = (featureTypes[g.feature ?? g.label] ?? 0) + 1 }
    // Row occupancy: group shelves by their top edge.
    const inner = n.rect.w - 2 * cfg.room.wall
    const byRow = new Map<string, Placed[]>()
    for (const c of n.children) if (c.kind === 'shelf') { const k = c.rect.y.toFixed(4); byRow.set(k, [...(byRow.get(k) ?? []), c]) }
    for (const row of byRow.values()) {
      const used = row.reduce((s, c) => s + c.rect.w, 0) + (row.length - 1) * cfg.room.shelfGap
      occ.push(Math.min(1, used / inner))
    }
  }
  const total = unused.room + unused.building + unused.campus
  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
  return {
    rootW: p.rect.w, rootD: p.rect.d, rootArea: area(p.rect), containers, rooms,
    roomImbalance: mean(logs), roomBeyond3: logs.length ? logs.filter((x) => x > Math.log(3)).length / logs.length : 0, roomWorst: Math.exp(Math.max(0, ...logs)),
    roomMaxW: maxW, roomMaxD: maxD, roomsOverMax: over, meanRoomArea: rooms ? roomArea / rooms : 0,
    roomsShare: roomArea / area(p.rect), furnitureDensity: roomArea ? furn / roomArea : 0,
    unused: { ...unused, total, share: total / area(p.rect), perRoom: rooms ? unused.room / rooms : 0, roomShare: roomArea ? unused.room / roomArea : 0 },
    areaOwnShare: areaOwn / area(p.rect),
    shelfFill: shelfLen ? books / shelfLen : 0, rowOccupancy: mean(occ),
    segments, stacks: stacks.size, shelves, features, featureTypes, featureFloor, grownRooms: grown, roomGrowth: growth,
  }
}
