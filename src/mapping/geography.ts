// Stage 1b — geography. Turns the area plan into nested rectangles: the land,
// absorber regions inside it, and areas inside those. Sizes are bottom-up
// (areas are measured by the Stage 2 renderer), so nothing overlaps and the
// layout is stable for a given drive and configuration.
//
// Inside every region the most important child takes the front row, nearest
// the default camera, with the most important item centered; streets,
// highways or paths fill the gaps depending on the region's metaphor.

import type { NodeId } from '../model/types'
import type { PlanArea, PlanNode, PlanRegion } from './areaPlanner'
import type { AbsorberMetaphor, Rect, RoadEntity } from './types'

export interface RegionStyle {
  /** Gap between children (street, path...). */
  gutter: number
  /** Ring around the children (curb, sidewalk, fence line). */
  pad: number
  /** Extra space at the front edge for the region's sign. */
  front: number
  road?: RoadEntity['kind']
}

export const REGION_STYLE: Record<AbsorberMetaphor | 'land', RegionStyle> = {
  land: { gutter: 7, pad: 9, front: 0, road: 'highway' },
  district: { gutter: 3.6, pad: 2.4, front: 1.2, road: 'street' },
  block: { gutter: 2.2, pad: 1.8, front: 1.2, road: 'path' },
  yard: { gutter: 1.8, pad: 1.4, front: 1.4 },
  square: { gutter: 1.6, pad: 1.2, front: 1.4 },
  garden: { gutter: 1.4, pad: 1.0, front: 1.2 },
  court: { gutter: 1.4, pad: 1.0, front: 1.2 },
}

/** Plate heights: each nesting level sits a little above its parent (all below room floors). */
export const PLATE_STEP = 0.018

export interface PlacedRegion { node: PlanRegion; rect: Rect; y: number; gate: [number, number] }
export interface PlacedArea { node: PlanArea; rect: Rect; y: number }

export interface Geography {
  land: Rect
  regions: PlacedRegion[]
  areas: PlacedArea[]
  roads: RoadEntity[]
}

interface Item { key: string; w: number; d: number; importance: number; name: string }
interface Placement { key: string; x: number; z: number }

/**
 * Packs items into rows: most important row in front (largest z), the most
 * important item of each row centered. Returns size, placements and the gaps
 * between them (as road rectangles, in local coordinates).
 */
export function packRows(items: Item[], gutter: number, aspect = 1.5) {
  const sorted = [...items].sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name))
  const area = sorted.reduce((s, it) => s + (it.w + gutter) * (it.d + gutter), 0)
  const targetW = Math.max(...sorted.map((it) => it.w), Math.sqrt(area * aspect))
  const rows: Item[][] = []
  let row: Item[] = []
  let rowW = 0
  for (const it of sorted) {
    if (row.length && rowW + gutter + it.w > targetW + 1e-6) { rows.push(row); row = []; rowW = 0 }
    rowW += (row.length ? gutter : 0) + it.w
    row.push(it)
  }
  if (row.length) rows.push(row)
  // Center the most important item of each row: alternate right / left.
  const centered = rows.map((r) => r.reduce<Item[]>((acc, it, i) => (i % 2 === 0 ? [...acc, it] : [it, ...acc]), []))
  const widthOf = (r: Item[]) => r.reduce((s, it) => s + it.w, 0) + gutter * (r.length - 1)
  const W = Math.max(...centered.map(widthOf))
  const placements: Placement[] = []
  const roads: Rect[] = []
  // Rows from the back (z = 0) to the front; rows[0] (most important) is last.
  let z = 0
  const ordered = [...centered].reverse()
  ordered.forEach((r, ri) => {
    const rowD = Math.max(...r.map((it) => it.d))
    let x = (W - widthOf(r)) / 2
    const lead = Math.max(...r.map((it) => it.importance))
    r.forEach((it, i) => {
      // Important things line up along the front of the row; quiet ones recede to the back.
      const recede = it.importance < lead * 0.5
      placements.push({ key: it.key, x, z: recede ? z : z + rowD - it.d })
      if (i < r.length - 1) roads.push({ x: x + it.w, z, w: gutter, d: rowD })
      x += it.w + gutter
    })
    if (ri < ordered.length - 1) roads.push({ x: 0, z: z + rowD, w: W, d: gutter })
    z += rowD + (ri < ordered.length - 1 ? gutter : 0)
  })
  return { w: W, d: z, placements, roads }
}

/**
 * Lays out the plan. `measure` gives each area's footprint from the Stage 2
 * renderer (keyed by plan node so residual areas are distinct from regions).
 */
export function layoutGeography(plan: PlanRegion, measure: (a: PlanArea) => { w: number; d: number }): Geography {
  const key = (n: PlanNode) => `${n.kind}:${n.nodeId}`
  const sizes = new Map<string, { w: number; d: number }>()
  const packs = new Map<string, ReturnType<typeof packRows>>()

  const size = (n: PlanNode): { w: number; d: number } => {
    const k = key(n)
    const hit = sizes.get(k)
    if (hit) return hit
    let s: { w: number; d: number }
    if (n.kind === 'area') s = measure(n)
    else {
      const st = REGION_STYLE[n.metaphor]
      const items = n.children.map((c) => ({ key: key(c), ...size(c), importance: c.importance, name: c.nodeId }))
      // The land stacks quiet things behind the important ones; inside regions rows stay wide.
      const p = packRows(items, st.gutter, n.kind === 'land' ? 0.5 : 1.45)
      packs.set(k, p)
      s = { w: p.w + 2 * st.pad, d: p.d + 2 * st.pad + st.front }
    }
    sizes.set(k, s)
    return s
  }

  const geo: Geography = { land: { x: 0, z: 0, w: 0, d: 0 }, regions: [], areas: [], roads: [] }
  const place = (n: PlanNode, x: number, z: number, y: number) => {
    const s = size(n)
    const rect: Rect = { x, z, w: s.w, d: s.d }
    if (n.kind === 'area') { geo.areas.push({ node: n, rect, y }); return }
    const st = REGION_STYLE[n.metaphor]
    if (n.kind === 'land') geo.land = rect
    else geo.regions.push({ node: n, rect, y, gate: [x + s.w / 2, z + s.d] })
    const p = packs.get(key(n))!
    const byKey = new Map(n.children.map((c) => [key(c), c]))
    const ox = x + st.pad
    const oz = z + st.pad
    if (st.road) for (const r of p.roads) geo.roads.push({ rect: { ...r, x: r.x + ox, z: r.z + oz }, kind: st.road, y: y + PLATE_STEP * 0.5 })
    for (const pl of p.placements) place(byKey.get(pl.key)!, ox + pl.x, oz + pl.z, y + PLATE_STEP)
  }
  const s = size(plan)
  place(plan, -s.w / 2, -s.d / 2, 0)
  return geo
}

export const regionOf = (geo: Geography, id: NodeId) => geo.regions.find((r) => r.node.nodeId === id)
