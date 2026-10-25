// Quality and utilization metrics for comparing layouts of the same hierarchy.

import type { Placed } from './protocol.ts'
import { nodes } from './validate.ts'

const area = (p: Placed) => p.rect.w * p.rect.d
const LEVELS = ['area', 'campus', 'building', 'room', 'shelf'] as const
export type Level = (typeof LEVELS)[number]

/** Physical furniture in a room: shelf bodies, tables and desks (not files on tables). */
function furniture(room: Placed): number {
  let s = 0
  for (const c of room.children) {
    if (c.kind === 'shelf') { const b = c.meta!.body as { w: number; d: number }; s += b.w * b.d }
    else for (const o of c.objects) if (o.layer === 0) s += o.rect.w * o.rect.d
  }
  return s
}

/** Each level's own space (everything inside it that is not a child or, for leaves, a fixed object). */
function ownSpace(p: Placed): Record<Level, number> {
  const out: Record<Level, number> = { area: 0, campus: 0, building: 0, room: 0, shelf: 0 }
  for (const n of nodes(p)) {
    const kids = n.children.reduce((s, c) => s + area(c), 0)
    if (n.kind === 'book') out.shelf += area(n) - n.objects.reduce((s, o) => s + o.rect.w * o.rect.d, 0)
    else if (n.kind === 'table') out.room += area(n) - n.objects.filter((o) => o.layer === 0).reduce((s, o) => s + o.rect.w * o.rect.d, 0)
    else out[n.kind as Level] += area(n) - kids
  }
  return out
}

export interface Snapshot {
  rootW: number
  rootD: number
  rootArea: number
  /** Share of the root's area that is room floor. */
  roomsShare: number
  /** Children's share of each level's area (summed over containers of that kind). */
  childShare: Record<Exclude<Level, 'shelf'>, number>
  /** Physical furniture / room floor. */
  furnitureDensity: number
  /** Total book width / total shelf length. */
  shelfFill: number
  own: Record<Level, number>
  /** Geometric-mean area factor vs. minimum, per level (shelves: length factor). */
  growth: Record<Level, number>
  /** Proportions of the children placed by areas: mean |ln(w/d)| and share beyond 2.5 : 1. */
  areaChildImbalance: number
  areaChildExtreme: number
  /** Proportions of every building: mean |ln(w/d)| and share beyond 3 : 1. */
  buildingImbalance: number
  buildingExtreme: number
}

export function snapshot(p: Placed): Snapshot {
  const sum: Record<string, { total: number; kids: number }> = {}
  const logs: Record<Level, number[]> = { area: [], campus: [], building: [], room: [], shelf: [] }
  let rooms = 0, furn = 0, books = 0, shelfLen = 0
  const areaKids: number[] = []
  const buildings: number[] = []
  for (const n of nodes(p)) {
    if (!(LEVELS as readonly string[]).includes(n.kind)) continue
    const k = n.kind as Level
    const s = (sum[k] ??= { total: 0, kids: 0 })
    s.total += area(n)
    s.kids += n.children.reduce((t, c) => t + area(c), 0)
    logs[k].push(k === 'shelf' ? Math.log(n.rect.w / n.min.w) : Math.log(area(n) / (n.min.w * n.min.d)))
    if (k === 'room') { rooms += area(n); furn += furniture(n) }
    if (k === 'shelf') { shelfLen += n.rect.w; for (const b of n.children) books += b.objects[0].rect.w }
    if (k === 'area') for (const c of n.children) areaKids.push(Math.abs(Math.log(c.rect.w / c.rect.d)))
    if (k === 'building') buildings.push(Math.abs(Math.log(n.rect.w / n.rect.d)))
  }
  const share = (k: string) => (sum[k] ? sum[k].kids / sum[k].total : 0)
  const gmean = (xs: number[]) => (xs.length ? Math.exp(xs.reduce((s, x) => s + x, 0) / xs.length) : 1)
  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)
  return {
    rootW: p.rect.w, rootD: p.rect.d, rootArea: area(p),
    roomsShare: rooms / area(p),
    childShare: { area: share('area'), campus: share('campus'), building: share('building'), room: share('room') },
    furnitureDensity: rooms ? furn / rooms : 0,
    shelfFill: shelfLen ? books / shelfLen : 0,
    own: ownSpace(p),
    growth: Object.fromEntries(LEVELS.map((k) => [k, gmean(logs[k])])) as Record<Level, number>,
    areaChildImbalance: mean(areaKids),
    areaChildExtreme: areaKids.length ? areaKids.filter((x) => x > Math.log(2.5)).length / areaKids.length : 0,
    buildingImbalance: mean(buildings),
    buildingExtreme: buildings.length ? buildings.filter((x) => x > Math.log(3)).length / buildings.length : 0,
  }
}

/** Where the extra floor area of a grown layout went: each level's own space, as a share of the root's growth. */
export function newAreaShares(min: Snapshot, grown: Snapshot): Record<Level, number> {
  const extra = grown.rootArea - min.rootArea
  return Object.fromEntries(LEVELS.map((k) => [k, extra > 0 ? (grown.own[k] - min.own[k]) / extra : 0])) as Record<Level, number>
}

/**
 * Composition drift: how far the balance between containers and the space around them moved
 * from the minimum design, for levels whose children are containers (areas, campuses,
 * buildings): mean absolute change of the children's share, in percentage points.
 * (Rooms are left out: their "children" are furniture plus clearance; furniture density says more.)
 */
export function lookDrift(min: Snapshot, grown: Snapshot): number {
  const ks = ['area', 'campus', 'building'] as const
  return ks.reduce((s, k) => s + Math.abs(grown.childShare[k] - min.childShare[k]), 0) / ks.length * 100
}
