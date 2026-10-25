// Independent checks of an α.v3 layout: everything the α.v2 validator checks
// (geometry, containment, canonical ancestry, overlap, accounting, fixed-size
// objects, clearances, row alignment, ledgers), plus the α.v3 invariants:
//
//  1 area exact sizing          6 room maximum width        11 segment continuity
//  2 campus exact footprints    7 per-row shelf uniformity  12 logical identity
//  3 campus centering + walks   9 shortest-first allocation 13 file-table completeness
//  4 building row alignment    10 segment size              14 fallback offer kept
//  5 room growth accounted                                  15 no collisions (furniture, door, walkway)
//
// (8, independent rows, is a freedom rather than a rule; 16, no search during
// arrangement, is enforced by the engine and checked in the tests.)

import { DEFAULT_CONFIG, maxShelfSegment, maxTableWidth } from '../config.ts'
import type { Config } from '../config.ts'
import { area, bottom, contains, overlaps, right } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import { within } from '../model.ts'
import type { Placed, Region } from '../protocol.ts'
import { nodes, validate } from '../validate.ts'
import type { Violation } from '../validate.ts'
import { rowWidth } from './allocate.ts'
import type { RoomRowMeta } from './room.ts'
import type { SegmentMeta } from './bookshelf.ts'

const near = (a: number, b: number, scale = 1) => Math.abs(a - b) <= 1e-6 * Math.max(1, scale)
const sameSize = (r: Rect, s: { w: number; d: number }) => near(r.w, s.w, s.w) && near(r.d, s.d, s.d)

export function validateV3(root: Placed, cfg: Config = DEFAULT_CONFIG): Violation[] {
  const out = validate(root, 0)
  const fail = (n: Placed, check: string, detail: string) => out.push({ path: n.path, name: n.name, check, detail })
  const bandWidths = (n: Placed, role: Region['role'], size: number, label: string) => {
    for (const g of n.regions.filter((x) => x.role === role)) {
      const t = g.axis === 'x' ? g.rect.w : g.rect.d
      if (!near(t, size, size)) fail(n, 'fixed-separator', `${label} ${g.label} is ${t.toFixed(3)} m, designed ${size} m`)
    }
  }

  for (const n of nodes(root)) {
    // Containers above rooms (and shelves) have no surplus: they sit at exactly their measured size.
    if (n.kind === 'area' || n.kind === 'campus' || n.kind === 'building') {
      if (!sameSize(n.rect, n.min)) fail(n, 'exact-size', `${n.kind} is ${n.rect.w.toFixed(3)} × ${n.rect.d.toFixed(3)}, measured ${n.min.w.toFixed(3)} × ${n.min.d.toFixed(3)}`)
    }
    if (n.kind === 'area') {
      // 1. Every child of an area receives exactly its selected offer's dimensions.
      for (const k of n.children) if (!sameSize(k.rect, k.min)) fail(n, 'area-exact', `${k.name} placed at ${k.rect.w.toFixed(3)} × ${k.rect.d.toFixed(3)}, offer ${k.min.w.toFixed(3)} × ${k.min.d.toFixed(3)}`)
    }
    if (n.kind === 'campus') checkCampus(n, cfg, fail, bandWidths)
    if (n.kind === 'building') checkBuilding(n, cfg, fail, bandWidths)
    if (n.kind === 'room' && n.meta?.v3) checkRoom(n, cfg, fail)
    if (n.kind === 'shelf' && n.meta?.v3) {
      if (!near(n.rect.d, cfg.shelf.depth)) fail(n, 'shelf-fixed', `shelf depth ${n.rect.d}`)
      for (const b of n.children) if (!near(b.rect.w, b.objects[0].rect.w)) fail(n, 'shelf-fixed', `${b.name} slot ${b.rect.w} ≠ book ${b.objects[0].rect.w}`)
      // 10. No physical shelf (segment or ordinary) is longer than MAX_SHELF_SEGMENT_LENGTH.
      if (n.rect.w > maxShelfSegment(cfg) + 1e-6) fail(n, 'segment-size', `${n.rect.w.toFixed(3)} m > MAX_SHELF_SEGMENT_LENGTH ${maxShelfSegment(cfg)} m`)
    }
  }
  return out
}

type Fail = (n: Placed, check: string, detail: string) => void
type Bands = (n: Placed, role: Region['role'], size: number, label: string) => void

function checkCampus(n: Placed, cfg: Config, fail: Fail, bands: Bands) {
  const cells = n.meta?.cells as Rect[] | undefined
  const walks = n.meta?.walks as (Rect | null)[] | undefined
  if (!cells || !walks) { fail(n, 'campus-centering', 'no cell data'); return }
  bands(n, 'path', cfg.campus.path, 'path')
  bands(n, 'street', cfg.campus.street, 'street')
  bands(n, 'courtyard', cfg.campus.courtyard, 'courtyard')
  n.children.forEach((b, i) => {
    // 2. Buildings keep their selected offer's footprint, even in deeper or wider cells.
    if (!sameSize(b.rect, b.min)) fail(n, 'campus-exact', `${b.name} resized to ${b.rect.w.toFixed(3)} × ${b.rect.d.toFixed(3)}`)
    // 3. ... centered in their cell, with an entrance walk from the door to the band in front of the row.
    const c = cells[i]
    if (!contains(c, b.rect)) fail(n, 'campus-centering', `${b.name} outside its cell`)
    if (!near(b.rect.x + b.rect.w / 2, c.x + c.w / 2, c.w) || !near(b.rect.y + b.rect.d / 2, c.y + c.d / 2, c.d)) fail(n, 'campus-centering', `${b.name} is not centered in its cell`)
    const gap = bottom(c) - bottom(b.rect)
    const w = walks[i]
    if (gap > 1e-6) {
      const door = b.objects.find((o) => o.kind === 'door')
      if (!w || !near(w.y, bottom(b.rect)) || !near(bottom(w), bottom(c)) || (door && (door.rect.x < w.x - 1e-6 || right(door.rect) > right(w) + 1e-6))) fail(n, 'campus-entrance', `${b.name}: no entrance walk from its door to the front of its cell`)
      else if (!n.regions.some((g) => g.role === 'walk' && near(g.rect.x, w.x) && near(g.rect.y, w.y))) fail(n, 'campus-entrance', `${b.name}: entrance walk is not a campus region`)
    }
    const front = n.regions.find((g) => (g.role === 'street' || g.role === 'courtyard' || g.role === 'plaza') && near(g.rect.y, bottom(c)) && g.rect.x <= c.x + 1e-6 && right(g.rect) >= right(c) - 1e-6)
    if (!front) fail(n, 'campus-entrance', `${b.name}: the front of its cell does not reach a street, courtyard or plaza`)
  })
}

function checkBuilding(n: Placed, cfg: Config, fail: Fail, bands: Bands) {
  const depths = n.meta?.rowDepths as number[] | undefined
  bands(n, 'corridor', cfg.building.corridor, 'corridor')
  for (const g of n.regions.filter((x) => x.role === 'wall' && x.label === 'partition')) if (!near(g.rect.w, cfg.building.roomWall)) fail(n, 'fixed-separator', `partition ${g.rect.w}`)
  // 4. Rooms in a row share the row's common depth (top alignment is checked by the base validator).
  ;(n.rules.rowGroups ?? []).forEach((group, r) => {
    for (const i of group) {
      const k = n.children[i]
      if (depths && !near(k.rect.d, depths[r], depths[r])) fail(n, 'row-depth', `${k.name} is ${k.rect.d.toFixed(3)} m deep, row ${r} is ${depths[r].toFixed(3)} m`)
      if (k.rect.d < k.min.d - 1e-6 || k.rect.w < k.min.w - 1e-6) fail(n, 'row-depth', `${k.name} smaller than its offer`)
    }
  })
}

function checkRoom(n: Placed, cfg: Config, fail: Fail) {
  const m = n.meta!
  const rows = m.rows as RoomRowMeta[]
  const sd = cfg.shelf.depth
  const maxW = cfg.v3.maxRoomWidth
  const segMax = maxShelfSegment(cfg)
  // 6. Bounded width.
  if (n.rect.w > maxW + 1e-6) fail(n, 'room-width', `${n.rect.w.toFixed(3)} m > MAX_ROOM_WIDTH ${maxW} m`)
  // 5. All extra width and depth stays in the room (base validator: regions + children tile the room).
  for (const a of ['x', 'y'] as const) if (!near(n.ledger[a].absorbed, n.ledger[a].surplus, n.rect.w + n.rect.d)) fail(n, 'room-growth', `${a}: passed ${n.ledger[a].passed} m to its contents`)

  const shelves = n.children.filter((k) => k.kind === 'shelf')
  const required = (k: Placed) => k.meta!.required as number
  // 7. Ordinary shelves in one row share one physical length: the longest required length in the row.
  //    Shelves and the table keep their measured geometry when the room grows.
  for (const r of rows) {
    const ks = r.children.map((i) => n.children[i])
    if (r.kind === 'table') { const t = ks[0]; if (!sameSize(t.rect, t.min)) fail(n, 'room-growth', 'the file table was resized'); continue }
    for (const k of ks) {
      if (!near(k.rect.w, r.length, r.length) || !near(k.rect.d, sd)) fail(n, 'row-uniform', `${k.name} is ${k.rect.w.toFixed(3)} m in a ${r.length.toFixed(3)} m row`)
    }
    if (r.kind === 'shelves' && !near(r.length, Math.max(...ks.map(required)), r.length)) fail(n, 'row-uniform', `row length ${r.length} is not its longest shelf's ${Math.max(...ks.map(required))}`)
  }

  // 9. Shortest-first allocation, from the shelves' own required lengths.
  const ord = rows.filter((r) => r.kind === 'shelves')
  const C = m.C as number
  const hasStacks = rows.some((r) => r.kind === 'stack')
  const lens = ord.map((r) => r.children.map((i) => required(n.children[i])))
  const flat = lens.flat()
  for (let i = 1; i < flat.length; i++) if (flat[i] < flat[i - 1] - 1e-9) fail(n, 'shortest-first', `shelf lengths are not allocated in ascending order (${flat[i - 1].toFixed(3)} before ${flat[i].toFixed(3)})`)
  if (ord.length) {
    if (lens[0].length !== Math.min(C, flat.length)) fail(n, 'shortest-first', `first row holds ${lens[0].length} shelves, C = ${C}`)
    let W = Math.max(hasStacks ? rowWidth(cfg, 1, segMax) : 0, rowWidth(cfg, lens[0].length, lens[0][lens[0].length - 1]))
    if (W > maxW + 1e-6) fail(n, 'shortest-first', 'first row wider than MAX_ROOM_WIDTH')
    lens.forEach((row, r) => {
      if (row.length > C) fail(n, 'shortest-first', `row ${r} holds ${row.length} > C = ${C}`)
      if (r > 0) W = Math.max(W, rowWidth(cfg, 1, row[0]))
      if (rowWidth(cfg, row.length, row[row.length - 1]) > W + 1e-6) fail(n, 'shortest-first', `row ${r} is wider than the established room width`)
      const next = lens[r + 1]
      if (r > 0 && next && row.length < C && rowWidth(cfg, row.length + 1, next[0]) <= W + 1e-6) fail(n, 'shortest-first', `row ${r} closed although the next shelf fit`)
    })
  }

  // 10–12. Segments: bounded length, a consecutive dedicated-row stack, one canonical identity, complete contents.
  const groups = new Map<string, { row: number; k: Placed; s: SegmentMeta }[]>()
  rows.forEach((r, ri) => {
    if (r.kind !== 'stack') return
    if (r.children.length !== 1) fail(n, 'segment-continuity', `stack row ${ri} is shared by ${r.children.length} shelves`)
    for (const i of r.children) {
      const k = n.children[i]
      const s = k.meta?.segment as SegmentMeta | undefined
      if (!s) { fail(n, 'segment-continuity', `${k.name} in a stack row is not a segment`); continue }
      groups.set(s.groupId, [...(groups.get(s.groupId) ?? []), { row: ri, k, s }])
    }
  })
  for (const k of shelves) if (k.meta?.segment && !rows.some((r) => r.kind === 'stack' && r.children.some((i) => n.children[i] === k))) fail(n, 'segment-continuity', `${k.name} is not in a stack row`)
  for (const [gid, segs] of groups) {
    const s0 = segs[0].s
    segs.forEach((g, i) => {
      if (g.s.index !== i || g.s.count !== segs.length) fail(n, 'segment-continuity', `${gid}: segment ${g.s.index + 1}/${g.s.count} found at position ${i + 1} of ${segs.length}`)
      if (i && g.row !== segs[i - 1].row + 1) fail(n, 'segment-continuity', `${gid}: segments are not in consecutive rows`)
      if (i && !near(g.k.rect.x, segs[0].k.rect.x)) fail(n, 'segment-continuity', `${gid}: segments do not form one stack`)
      if (!near(g.k.rect.w, segMax, segMax)) fail(n, 'segment-size', `${g.k.name} is ${g.k.rect.w} m, not one full ${segMax} m fixture`)
      if (g.k.path !== s0.folder || g.s.groupId !== gid || g.s.folder !== s0.folder) fail(n, 'segment-identity', `${g.k.name} does not resolve to ${s0.folder}`)
      if (g.s.first !== (i ? segs[i - 1].s.last : 0)) fail(n, 'segment-identity', `${gid}: contents are not contiguous at segment ${i + 1}`)
      if (g.k.children.length !== g.s.last - g.s.first) fail(n, 'segment-identity', `${g.k.name}: ${g.k.children.length} books placed, ${g.s.last - g.s.first} allocated`)
    })
    if (segs[segs.length - 1].s.last !== s0.totalBooks) fail(n, 'segment-identity', `${gid}: ${segs[segs.length - 1].s.last} of ${s0.totalBooks} books placed`)
    const names = segs.flatMap((g) => g.k.children.map((b) => b.path))
    if (new Set(names).size !== names.length) fail(n, 'segment-identity', `${gid}: a book appears twice`)
    if (names.some((p) => !within(p, s0.folder))) fail(n, 'segment-identity', `${gid}: a book outside its folder`)
    // Identity markings: a rail on each side spanning the stack, and a connector to each end of every segment.
    const top = segs[0].k.rect.y, end = bottom(segs[segs.length - 1].k.rect)
    const rails = n.objects.filter((o) => o.kind === 'rail' && near(o.rect.y, top) && near(bottom(o.rect), end))
    const conns = n.objects.filter((o) => o.kind === 'connector' && o.rect.y >= top - 1e-6 && bottom(o.rect) <= end + 1e-6)
    if (rails.length !== 2 || conns.length !== 2 * segs.length) fail(n, 'segment-markings', `${gid}: ${rails.length} rails and ${conns.length} connectors for ${segs.length} segments`)
  }

  // 13. Every loose file exactly once, on the one primary table, within the width limit.
  const files = m.files as string[]
  const tables = n.children.filter((k) => k.kind === 'table')
  if (files.length && tables.length !== 1) fail(n, 'file-table', `${tables.length} tables for ${files.length} files`)
  if (tables.length) {
    const on = tables[0].objects.filter((o) => o.kind === 'file').map((o) => o.label)
    const want = [...files].sort(), got = [...on].sort()
    if (want.length !== got.length || want.some((f, i) => f !== got[i])) fail(n, 'file-table', `table holds ${got.length} files, folder has ${want.length}`)
    const top = tables[0].objects.find((o) => o.kind === 'table')!
    if (top.rect.w > maxTableWidth(cfg) + 1e-6) fail(n, 'file-table', `table ${top.rect.w} m wider than allowed ${maxTableWidth(cfg)} m`)
  }
  // 14. The constructive fallback (one shelf per row) is always among the room's offers.
  if (!(m.offerKeys as string[]).some((k) => k.startsWith('C=1'))) fail(n, 'fallback', 'no C = 1 offer was kept')

  // 15. Furniture stands only in feature zones, never on shelves, the table, aisles, clearances or the door.
  const feat = n.regions.filter((g) => g.role === 'feature')
  for (const o of n.objects.filter((x) => x.layer === 0)) {
    if (!feat.some((g) => contains(g.rect, o.rect))) fail(n, 'collision', `${o.kind} outside every feature zone`)
    for (const k of n.children) if (overlaps(o.rect, k.rect)) fail(n, 'collision', `${o.kind} overlaps ${k.name}`)
  }
  const door = n.objects.find((o) => o.kind === 'door')
  if (!door || !n.regions.some((g) => g.role === 'entrance' && contains(g.rect, door.rect))) fail(n, 'collision', 'door is not in a free entrance clearance')
  const zones = m.zones as { front: number }
  if (zones.front > 1e-6 && !n.regions.some((g) => g.role === 'walkway' && door && g.rect.x <= door.rect.x + 1e-6 && right(g.rect) >= right(door.rect) - 1e-6)) fail(n, 'collision', 'front zone without a walkway in line with the door')
  if (feat.reduce((s, g) => s + area(g.rect), 0) > area(n.rect) + 1e-6) fail(n, 'room-growth', 'feature zones exceed the room')
}

/** Shares the base validator's node walk for callers that only need α.v3 rooms. */
export const roomsOf = (p: Placed) => [...nodes(p)].filter((n) => n.kind === 'room')
