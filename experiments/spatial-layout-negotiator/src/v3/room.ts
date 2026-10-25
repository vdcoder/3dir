// Designer B (α.v3) — Room: the only designer that grows.
//
// Measure: for each target C (shelves per row) the shortest-first allocation
// (allocate.ts) gives shelf rows normalized to their own longest shelf;
// segmented folders take dedicated consecutive rows at the rear; one file
// table in front holds every loose file, as wide as the shelves allow or about
// square, never wider than MAX_ROOM_WIDTH allows (it grows in depth instead).
// The C = 1 offer is always kept: it exists for any valid input.
//
// Arrange: the shelf rows, stacks and table keep their measured geometry. Extra
// width becomes a furnished side zone (or, if small, wider side clearances);
// extra depth becomes a front zone with a walkway to the door, plus a middle
// zone between the shelves and the table when there is a lot of it (or, if
// small, a deeper entrance clearance). Features come from a fixed library.

import { maxShelfSegment, maxTableWidth } from '../config.ts'
import type { Config } from '../config.ts'
import { EPS, rect, right, bottom } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import type { RoomNode } from '../model.ts'
import { boundOffers } from '../offers.ts'
import { InfeasibleError, ledger } from '../protocol.ts'
import type { Designer, Measured, Obj, Offer, Placed, Region } from '../protocol.ts'
import { tableEnvelope, tableSpec } from '../designers/room.ts'
import type { TableSpec } from '../designers/room.ts'
import { allocateShelves } from './allocate.ts'
import type { ShelfIn, ShelfRowPlan, StackIn } from './allocate.ts'
import { bookshelfV3 } from './bookshelf.ts'
import type { ShelfPlanV3 } from './bookshelf.ts'
import { furnishZone } from './features.ts'
import type { FeatureId, PlacedFeature } from './features.ts'

export interface RoomPlanV3 {
  C: number
  /** Room width the shelves need (side clearances included); 0 without shelves. */
  shelvesW: number
  rows: ShelfRowPlan[]
  table: TableSpec | null
  /** Minimum size of this offer, and its depth before the room's minimum depth applies. */
  w: number
  d: number
  natural: number
}

/** Narrowest half of a front zone worth keeping on both sides of a centered walkway (a waiting area's minimum width). */
const FRONT_HALF_MIN = 2.45

export interface RoomRowMeta { kind: 'stack' | 'shelves' | 'table'; children: number[]; length: number; segment?: number }

const colsFor = (cfg: Config, tableW: number) => {
  const f = cfg.room.file
  return Math.floor((tableW - 2 * cfg.room.tableMargin + f.gap) / (f.w + f.gap) + EPS)
}

/** Table layouts: as wide as the shelves allow, about square, and for rooms of loose files only, wide and long; all within MAX_ROOM_WIDTH. */
export function tableVariantsV3(cfg: Config, files: number, contentW: number, hasShelves: boolean): TableSpec[] {
  const maxCols = Math.max(1, colsFor(cfg, maxTableWidth(cfg)))
  const out: TableSpec[] = []
  if (contentW > 0) {
    const cols = colsFor(cfg, contentW - 2 * cfg.room.tableSide)
    if (cols >= 1) out.push(tableSpec(cfg, files, Math.min(cols, maxCols), 'fit'))
  }
  out.push(tableSpec(cfg, files, Math.min(Math.ceil(Math.sqrt(files)), maxCols), 'square'))
  if (!hasShelves) {
    out.push(tableSpec(cfg, files, Math.min(Math.ceil(Math.sqrt(2 * files)), maxCols), 'wide'))
    out.push(tableSpec(cfg, files, Math.min(Math.ceil(Math.sqrt(files / 2)), maxCols), 'long'))
  }
  const seen = new Set<number>()
  return out.filter((t) => (seen.has(t.cols) ? false : (seen.add(t.cols), true)))
}

export function roomSize(cfg: Config, rows: ShelfRowPlan[], shelvesW: number, table: TableSpec | null) {
  const c = cfg.room
  const R = rows.length
  const aisles = Math.max(0, R - 1) + (table && R ? 1 : 0)
  const env = table ? tableEnvelope(cfg, table) : null
  const natural = c.rear + R * cfg.shelf.depth + aisles * c.aisle + (env ? env.d : 0) + c.entrance
  return { w: Math.max(c.minW, shelvesW, env ? 2 * c.wall + env.w : 0), d: Math.max(c.minD, natural), natural }
}

/** Splits a room's measured shelf children into ordinary shelves and segmented stacks. */
export function shelfInputs(kids: Measured[]): { shelves: ShelfIn[]; stacks: StackIn[] } {
  const shelves: ShelfIn[] = []
  const stacks: StackIn[] = []
  kids.forEach((k, i) => {
    const o = k.offers[0]
    const p = o.plan as ShelfPlanV3
    if (p.segmented) stacks.push({ child: i, segments: p.segments.length })
    else shelves.push({ child: i, length: o.w })
  })
  return { shelves, stacks }
}

export const roomV3: Designer<RoomNode> = {
  children: (node) => node.shelves,

  measure(node, kids, ctx) {
    const cfg = ctx.cfg
    const { shelves, stacks } = shelfInputs(kids)
    const N = node.files.length
    const offers: Offer[] = []
    for (let C = 1; C <= Math.max(1, shelves.length); C++) {
      ctx.explore()
      const alloc = allocateShelves(cfg, shelves, stacks, C)
      // A wider first row only gets wider with C: stop at the first rejection.
      if (!alloc) { ctx.stats.infeasible++; break }
      const contentW = alloc.width > 0 ? alloc.width - 2 * cfg.room.wall : 0
      const tables = N ? tableVariantsV3(cfg, N, contentW, shelves.length + stacks.length > 0) : [null]
      tables.forEach((table, i) => {
        if (i) ctx.explore()
        const s = roomSize(cfg, alloc.rows, alloc.width, table)
        if (s.w > cfg.v3.maxRoomWidth + EPS) { ctx.stats.infeasible++; return }
        const plan: RoomPlanV3 = { C, shelvesW: alloc.width, rows: alloc.rows, table, ...s }
        const aspect = s.w / s.d
        offers.push({
          key: `C=${C}` + (table ? ` table=${table.variant}` : ''), w: s.w, d: s.d, plan,
          quality: { score: -Math.abs(Math.log(aspect / 1.3)), aspect, rows: alloc.rows.length, C },
        })
      })
    }
    let kept = boundOffers(offers, cfg.maxOffers, cfg.keepDominated)
    // Guaranteed fallback: keep the most compact C = 1 offer (one shelf per row) whatever the bounding did.
    if (!kept.some((o) => (o.plan as RoomPlanV3).C === 1)) {
      const c1 = offers.filter((o) => (o.plan as RoomPlanV3).C === 1).sort((a, b) => a.w * a.d - b.w * b.d)[0]
      if (c1) kept = [...kept.slice(0, Math.max(0, cfg.maxOffers - 1)), c1].sort((a, b) => a.w / a.d - b.w / b.d || a.key.localeCompare(b.key))
    }
    return kept
  },

  arrange(m: Measured<RoomNode>, offer, env, ctx): Placed {
    const cfg = ctx.cfg
    const c = cfg.room
    const v = cfg.v3
    const sd = cfg.shelf.depth
    const p = offer.plan as RoomPlanV3
    if (env.w > v.maxRoomWidth + EPS) throw new InfeasibleError(m.node.path, `a room cannot be wider than MAX_ROOM_WIDTH = ${v.maxRoomWidth} m (asked for ${env.w.toFixed(2)} m)`)
    const X = env.x, Y = env.y
    const dW = env.w - p.w
    const dD = env.d - p.d
    const regions: Region[] = []
    const objects: Obj[] = []
    const features: PlacedFeature[] = []
    const used = new Set<FeatureId>()
    const semantics = `${m.node.name} ${m.node.path}`
    const add = (r: Rect, role: Region['role'], label: string, axis?: 'x' | 'y') => { if (r.w > EPS && r.d > EPS) regions.push({ rect: r, role, label, ...(axis ? { axis } : {}) }) }
    const furnish = (zone: Rect, kind: 'front' | 'middle' | 'side', axis: 'x' | 'y') => {
      if (zone.w <= EPS || zone.d <= EPS) return
      const f = furnishZone(zone, kind, axis, semantics, used, v.featureMargin)
      regions.push(...f.regions)
      objects.push(...f.objects)
      features.push(...f.features)
    }

    // ---------- Where the extra space goes ----------
    const sideZone = dW >= v.sideZoneMin - EPS
    const cl = c.wall + (sideZone ? 0 : dW / 2)
    const cr = c.wall + (sideZone ? 0 : dW / 2)
    const Wc = p.w - 2 * c.wall
    const Ws = sideZone ? dW : 0
    const hasRows = p.rows.length > 0
    let mid = 0, front = 0, entranceExtra = p.d - p.natural
    if (dD >= v.zoneMin - EPS) {
      if (hasRows && p.table && dD >= v.middleZoneMin - EPS) { mid = Math.round(dD * 0.4 * 100) / 100; front = dD - mid } else front = dD
    } else entranceExtra += dD
    // With no table, the last shelf row needs its aisle before a front zone.
    const frontAisle = front > 0 && hasRows && !p.table ? Math.min(c.aisle, front) : 0

    // ---------- Frame: rear wall, side clearances, entrance ----------
    const entranceH = c.entrance + entranceExtra
    const yIn0 = Y + c.rear
    const yIn1 = Y + env.d - entranceH
    add(rect(X, Y, env.w, c.rear), 'wall', 'rear wall', 'y')
    add(rect(X, yIn0, cl, yIn1 - yIn0), 'wall', 'side clearance', 'x')
    add(rect(X + env.w - cr, yIn0, cr, yIn1 - yIn0), 'wall', 'side clearance', 'x')
    add(rect(X, yIn1, env.w, entranceH), 'entrance', 'entrance clearance', 'y')

    // ---------- Shelf rows (stacks at the rear), aisles, middle zone, table ----------
    const xc = X + cl
    let y = yIn0
    const children: Placed[] = []
    const rowsMeta: RoomRowMeta[] = []
    const stackEnvs = new Map<number, Rect[]>()
    const rowEnvs: { row: ShelfRowPlan; envs: Rect[] }[] = []
    p.rows.forEach((row, r) => {
      const k = row.members.length
      const total = k * row.length + (k - 1) * c.shelfGap
      const off = (Wc - total) / 2
      add(rect(xc, y, off, sd), 'open', 'row end', 'x')
      add(rect(xc + off + total, y, Wc - off - total, sd), 'open', 'row end', 'x')
      let x = xc + off
      const envs: Rect[] = []
      row.members.forEach((_, j) => {
        envs.push(rect(x, y, row.length, sd))
        x += row.length
        if (j < k - 1) { add(rect(x, y, c.shelfGap, sd), 'spacing', 'shelf gap', 'x'); x += c.shelfGap }
      })
      rowEnvs.push({ row, envs })
      if (row.kind === 'stack') { const list = stackEnvs.get(row.members[0]) ?? []; list.push(envs[0]); stackEnvs.set(row.members[0], list) }
      y += sd
      if (r < p.rows.length - 1 || p.table) { add(rect(xc, y, Wc, c.aisle), 'aisle', 'aisle', 'y'); y += c.aisle }
    })
    // Children in row order; a stack's segments are placed together (they are consecutive rows).
    for (const { row, envs } of rowEnvs) {
      if (row.kind === 'stack') {
        if (row.segment !== 0) continue
        const kid = m.children[row.members[0]] as Measured<RoomNode['shelves'][number]>
        const segs = bookshelfV3.arrangeStack(kid, kid.offers[0], stackEnvs.get(row.members[0])!, ctx)
        segs.forEach((s, i) => { rowsMeta.push({ kind: 'stack', children: [children.length], length: row.length, segment: i }); children.push(s) })
      } else {
        const idx: number[] = []
        row.members.forEach((child, j) => { idx.push(children.length); children.push(ctx.arrange(m.children[child], m.children[child].offers[0], envs[j])) })
        rowsMeta.push({ kind: 'shelves', children: idx, length: row.length })
      }
    }
    if (mid > 0) { furnish(rect(xc, y, Wc, mid), 'middle', 'x'); y += mid }
    if (p.table) {
      const te = tableEnvelope(cfg, p.table)
      const off = (Wc - te.w) / 2
      add(rect(xc, y, off, te.d), 'open', 'row end', 'x')
      add(rect(xc + off + te.w, y, Wc - off - te.w, te.d), 'open', 'row end', 'x')
      rowsMeta.push({ kind: 'table', children: [children.length], length: te.w })
      children.push(arrangeTableV3(cfg, m.node, p.table, rect(xc + off, y, te.w, te.d)))
      y += te.d
    }
    // Side zone beside the shelves, middle zone and table.
    if (Ws > EPS && y - yIn0 > EPS) furnish(rect(xc + Wc, yIn0, Ws, y - yIn0), 'side', 'y')

    // ---------- Front zone, with a walkway from the door ----------
    if (frontAisle > 0) { add(rect(xc, y, Wc + Ws, frontAisle), 'aisle', 'aisle', 'y'); y += frontAisle }
    const fz = yIn1 - y
    // The door is centered, unless a centered walkway would leave both halves of the front zone
    // too narrow for a feature; then door and walkway move to the west side.
    let doorX = X + env.w / 2
    if (fz > EPS) {
      const centered = (Wc + Ws - v.walkway) / 2 >= FRONT_HALF_MIN
      // A side walkway runs along the side clearance, so aisle width suffices there (0.9 + 0.5 m clear).
      const walk = Math.min(centered ? v.walkway : c.aisle, Wc + Ws)
      const wx = centered ? Math.min(Math.max(X + env.w / 2 - walk / 2, xc), xc + Wc + Ws - walk) : xc
      doorX = wx + walk / 2
      furnish(rect(xc, y, wx - xc, fz), 'front', 'x')
      add(rect(wx, y, walk, fz), 'walkway', 'walkway', 'x')
      furnish(rect(wx + walk, y, xc + Wc + Ws - wx - walk, fz), 'front', 'x')
    }

    // ---------- Door and the identity markings of segmented folders ----------
    objects.push({ rect: rect(doorX - c.door / 2, Y + env.d - 0.12, c.door, 0.12), kind: 'door', label: 'door', layer: 2 })
    objects.push(...stackMarkings(cfg, children))

    const rowGroups = rowsMeta.map((r) => r.children)
    return {
      kind: 'room', name: m.node.name, path: m.node.path, synthetic: m.node.synthetic, rect: { ...env }, offerKey: offer.key, min: { w: offer.w, d: offer.d },
      // The room absorbs all of its extra width and depth itself; it passes nothing to shelves or the table.
      ledger: { x: ledger(p.w, env.w, dW), y: ledger(p.d, env.d, dD) },
      regions, objects, children,
      rules: { gapX: c.shelfGap, gapY: c.aisle, pad: { l: c.wall, r: c.wall, t: c.rear, b: c.entrance }, rowGroups },
      meta: {
        v3: true, C: p.C, shelvesW: p.shelvesW, rows: rowsMeta, table: p.table, files: m.node.files,
        offerKeys: m.offers.map((o) => o.key), maxRoomWidth: v.maxRoomWidth,
        zones: { side: Ws, middle: mid, front: Math.max(0, fz) }, features,
        // Each shelf child's own required length (before row normalization), by child index.
        shelfRequired: children.map((k) => (k.kind === 'shelf' ? (k.meta!.required as number) : null)),
      },
    }
  },
}

/** Dashed floor rails on both sides of each segment stack, a connector to every segment, and one label. */
export function stackMarkings(cfg: Config, children: Placed[]): Obj[] {
  const out: Obj[] = []
  const t = 0.06
  const groups = new Map<string, Placed[]>()
  for (const k of children) {
    const s = k.meta?.segment as { groupId: string } | undefined
    if (s) groups.set(s.groupId, [...(groups.get(s.groupId) ?? []), k])
  }
  for (const segs of groups.values()) {
    const first = segs[0], last = segs[segs.length - 1]
    const y0 = first.rect.y, y1 = bottom(last.rect)
    const xw = first.rect.x - cfg.room.wall / 2
    const xe = right(first.rect) + cfg.room.wall / 2
    const name = (first.meta!.segment as { folder: string }).folder.split('\\').pop()!
    out.push({ rect: rect(xw - t / 2, y0, t, y1 - y0), kind: 'rail', label: name, layer: 3 })
    out.push({ rect: rect(xe - t / 2, y0, t, y1 - y0), kind: 'rail', label: name, layer: 3 })
    for (const s of segs) {
      const yc = s.rect.y + s.rect.d / 2 - t / 2
      out.push({ rect: rect(xw + t / 2, yc, s.rect.x - xw - t / 2, t), kind: 'connector', layer: 4 })
      out.push({ rect: rect(right(s.rect), yc, xe - t / 2 - right(s.rect), t), kind: 'connector', layer: 4 })
    }
    out.push({ rect: rect(first.rect.x, y0, maxShelfSegment(cfg), first.rect.d), kind: 'marking-label', label: `${name} · ${segs.length} segments`, layer: 5 })
  }
  return out
}

/** The file table at its exact envelope: table, side clearance and chair zone; files in a grid. */
function arrangeTableV3(cfg: Config, node: RoomNode, t: TableSpec, env: Rect): Placed {
  const c = cfg.room
  const tx = env.x + c.tableSide
  const objects: Obj[] = [{ rect: rect(tx, env.y, t.w, t.d), kind: 'table', label: `table · ${node.files.length} files`, layer: 0, fixed: { w: t.w, d: t.d } }]
  node.files.forEach((name, i) => {
    const col = i % t.cols
    const row = Math.floor(i / t.cols)
    objects.push({ rect: rect(tx + c.tableMargin + col * (c.file.w + c.file.gap), env.y + c.tableMargin + row * (c.file.d + c.file.gap), c.file.w, c.file.d), kind: 'file', label: name, layer: 1, fixed: { w: c.file.w, d: c.file.d } })
  })
  const min = tableEnvelope(cfg, t)
  return {
    kind: 'table', name: `${node.name} · ${node.files.length} loose files`, path: node.path, synthetic: true, rect: { ...env }, offerKey: t.variant, min: { ...min },
    ledger: { x: ledger(min.w, env.w, env.w - min.w), y: ledger(min.d, env.d, env.d - min.d) },
    regions: [], children: [], objects, rules: {},
    meta: { cols: t.cols, rows: t.rows, variant: t.variant },
  }
}
