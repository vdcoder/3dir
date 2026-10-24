// Stage 2 — the area renderer. Renders one folder (an "area root") with the
// conventional level-by-level vocabulary, sizes computed bottom-up:
//   area → buildings → rooms → shelves / tables / photo walls → files,
//   a shelf's subfolders become labelled compartments, anything deeper a
//   closed archive box (which opens as a box-world of its own).
// The same renderer draws areas on the main map and inside box-worlds; it
// never promotes anything (that is Stage 1's job).

import type { FsIndex } from '../model/fs'
import type { FileKind, FileNode, FsNode, NodeId } from '../model/types'
import type { ImportanceFn } from './importance'
import { ROOM_RESERVE, type ThemeId } from './plan'
import type { AABB, Anchor, AnchorLevel, BuildingEntity, CompartmentEntity, FixtureEntity, ItemEntity, ItemForm, Prominence, Rect, RoomEntity, Vec3, WorldLayout } from './types'

// ---------- Dimensions ----------

const SHELF = { levelH: 0.64, base: 0.14, depth: 0.56, bayW: 1.3, side: 0.05, maxLevels: 4 }
const TABLE = { h: 0.8, cell: [0.38, 0.48] as const, pad: 0.2, maxCols: 6 }
const WALL_PANEL = { frame: [1.0, 0.75] as const, gap: 0.22, h: 2.5, maxRows: 2 }
const ROOM = { aisle: 1.15, margin: 0.55, wall: 0.18, partitionH: 1.05, min: 3.6, maxInnerW: 13 }
const BUILDING = { wall: 0.25, maxW: 34 }
const LOOSE_TABLE_MAX = 12
/** Gap between buildings inside an area. */
export const AREA_STREET: Record<Prominence, number> = { campus: 3.2, major: 2.8, minor: 2.2, box: 2.6 }
/** Margin between an area's buildings and its edge. */
export const AREA_PAD: Record<Prominence, number> = { campus: 2.4, major: 1.8, minor: 1.2, box: 3 }

export const WALL_HEIGHT: Record<ThemeId, number> = { business: 2.9, medical: 2.8, studio: 2.6, gallery: 3.0, home: 2.4, system: 2.2 }

// ---------- Helpers ----------

export const box = (min: Vec3, max: Vec3): AABB => ({ min, max })
export const rectBox = (r: Rect, y0: number, y1: number): AABB => box([r.x, y0, r.z], [r.x + r.w, y1, r.z + r.d])
export const itemBox = (p: Vec3, s: Vec3): AABB => box([p[0] - s[0] / 2, p[1] - s[1] / 2, p[2] - s[2] / 2], [p[0] + s[0] / 2, p[1] + s[1] / 2, p[2] + s[2] / 2])
const union = (a: AABB, b: AABB): AABB => box(
  [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1]), Math.min(a.min[2], b.min[2])],
  [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1]), Math.max(a.max[2], b.max[2])],
)

function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return h >>> 0
}
const rand = (key: string) => (hash(key) % 10_000) / 10_000

function spineSize(f: FileNode): Vec3 {
  const r = rand(f.id)
  const thick = 0.052 + Math.min(0.065, Math.log10(Math.max(f.sizeBytes, 1000)) * 0.0078) + r * 0.016
  const tall: Partial<Record<FileKind, number>> = { spreadsheet: 0.52, pdf: 0.47, document: 0.5, presentation: 0.44, text: 0.37, code: 0.4, design: 0.52, archive: 0.4, image: 0.42 }
  return [thick, (tall[f.kind] ?? 0.4) - r * 0.05, 0.42]
}
const BOX_SIZE: Vec3 = [0.39, 0.35, 0.46]

// ---------- Fixtures ----------

interface Slot { nodeId: NodeId; kind: FileKind | 'folder'; form: ItemForm; size: Vec3; compartment?: NodeId }

/** What sits in a fixture for folder F: its files, then each subfolder as a compartment. */
function fixtureSlots(fs: FsIndex, folderId: NodeId): Slot[] {
  const slots: Slot[] = []
  const pushFile = (n: FsNode, compartment?: NodeId) => {
    if (n.type === 'file') slots.push({ nodeId: n.id, kind: n.kind, form: 'spine', size: spineSize(n), compartment })
  }
  const kids = fs.children(folderId)
  for (const n of kids) pushFile(n)
  for (const sub of kids.filter((k) => k.type === 'folder')) {
    const inner = fs.children(sub.id)
    for (const n of inner) pushFile(n, sub.id)
    for (const deep of inner.filter((k) => k.type === 'folder')) {
      slots.push({ nodeId: deep.id, kind: 'folder', form: 'box', size: BOX_SIZE, compartment: sub.id })
    }
    if (inner.length === 0) slots.push({ nodeId: sub.id, kind: 'folder', form: 'box', size: [0.26, 0.24, 0.4], compartment: sub.id })
  }
  return slots
}

export interface BuiltFixture { fixture: FixtureEntity; items: ItemEntity[]; compartments: CompartmentEntity[] }

/** A shelf at the local origin (base center at 0,0,0, facing +Z), growing bays until everything fits. */
function buildShelf(nodeId: NodeId, slots: Slot[], theme: ThemeId): BuiltFixture {
  const gap = 0.008
  const divider = 0.09
  let run = 0
  for (const s of slots) run += s.size[0] + gap + divider * 0.3
  const levels = Math.max(2, Math.min(SHELF.maxLevels, Math.ceil(run / SHELF.bayW)))
  for (let bays = Math.max(1, Math.ceil(run / (levels * SHELF.bayW))); ; bays++) {
    const r = fillShelf(nodeId, slots, theme, levels, bays, gap, divider)
    if (r) return r
  }
}

function fillShelf(nodeId: NodeId, slots: Slot[], theme: ThemeId, levels: number, bays: number, gap: number, divider: number): BuiltFixture | null {
  const innerW = bays * SHELF.bayW + (bays - 1) * SHELF.side
  const W = innerW + 2 * SHELF.side
  const H = SHELF.base + levels * SHELF.levelH
  const fixture: FixtureEntity = { nodeId, type: 'shelf', theme, pos: [0, 0, 0], size: [W, H, SHELF.depth], levels, bays }
  const items: ItemEntity[] = []
  const comp = new Map<NodeId, AABB>()
  const segs = new Map<string, AABB>()
  const left = -innerW / 2
  // Fill each level left to right, top level first (reading order).
  let level = 0
  let x = left
  let prev: NodeId | undefined
  for (const s of slots) {
    const lead = s.compartment !== prev && x > left ? divider : 0
    if (x + lead + s.size[0] > left + innerW) {
      level++
      x = left
      if (level >= levels) return null
    }
    const l = s.compartment !== prev && x > left ? divider : 0
    const y0 = SHELF.base + (levels - 1 - level) * SHELF.levelH
    const pos: Vec3 = [x + l + s.size[0] / 2, y0 + s.size[1] / 2, -SHELF.depth / 2 + 0.04 + s.size[2] / 2]
    items.push({ nodeId: s.nodeId, kind: s.kind, form: s.form, pos, size: s.size, fixtureId: nodeId })
    if (s.compartment) {
      const b = itemBox(pos, s.size)
      const c = comp.get(s.compartment)
      comp.set(s.compartment, c ? union(c, b) : b)
      const key = `${s.compartment}\u0000${level}`
      const sg = segs.get(key)
      segs.set(key, sg ? union(sg, b) : b)
    }
    x += l + s.size[0] + gap
    prev = s.compartment
  }
  const compartments = [...comp].map(([id, bounds]) => ({
    nodeId: id, fixtureId: nodeId, bounds,
    segments: [...segs].filter(([k]) => k.startsWith(id + '\u0000')).map(([, b]) => b),
  }))
  return { fixture, items, compartments }
}

function buildTable(nodeId: NodeId, files: FileNode[], theme: ThemeId): BuiltFixture {
  const cols = Math.min(TABLE.maxCols, Math.max(2, Math.ceil(Math.sqrt(files.length * 1.6))))
  const rows = Math.max(1, Math.ceil(files.length / cols))
  const W = cols * TABLE.cell[0] + TABLE.pad * 2
  const D = rows * TABLE.cell[1] + TABLE.pad * 2
  const fixture: FixtureEntity = { nodeId, type: 'table', theme, pos: [0, 0, 0], size: [W, TABLE.h, D], levels: 1, bays: 1 }
  const items = files.map((f, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const h = 0.015 + rand(f.id) * 0.03
    const pos: Vec3 = [-W / 2 + TABLE.pad + (c + 0.5) * TABLE.cell[0], TABLE.h + h / 2, -D / 2 + TABLE.pad + (r + 0.5) * TABLE.cell[1]]
    return { nodeId: f.id, kind: f.kind, form: 'paper' as ItemForm, pos, size: [0.29, h, 0.38] as Vec3, fixtureId: nodeId }
  })
  return { fixture, items, compartments: [] }
}

/** Gallery display wall: files hang as frames; subfolders become boxes on the floor in front. */
function buildWall(fs: FsIndex, nodeId: NodeId, theme: ThemeId, withSubfolders = true): BuiltFixture {
  const kids = fs.children(nodeId)
  const files = kids.filter((k): k is FileNode => k.type === 'file')
  const subs = withSubfolders ? kids.filter((k) => k.type === 'folder') : []
  const n = Math.max(1, files.length)
  const rows = Math.min(WALL_PANEL.maxRows, Math.max(1, Math.round(Math.sqrt(n / 2))))
  const cols = Math.ceil(n / rows)
  const [fw, fh] = WALL_PANEL.frame
  const W = Math.max(2.2, cols * (fw + WALL_PANEL.gap) + 0.3, subs.length * 0.5 + 0.4)
  const H = WALL_PANEL.h
  const D = 0.16
  const fixture: FixtureEntity = { nodeId, type: 'wall', theme, pos: [0, 0, 0], size: [W, H, D], levels: rows, bays: cols }
  const top = 0.85 + rows * (fh + WALL_PANEL.gap)
  const items: ItemEntity[] = files.map((f, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const pos: Vec3 = [-W / 2 + 0.15 + WALL_PANEL.gap / 2 + (c + 0.5) * (fw + WALL_PANEL.gap) - WALL_PANEL.gap / 2, Math.min(H - 0.2, top) - (r + 0.5) * (fh + WALL_PANEL.gap), D / 2 + 0.02]
    return { nodeId: f.id, kind: f.kind, form: 'frame' as ItemForm, pos, size: [fw, fh, 0.035] as Vec3, fixtureId: nodeId }
  })
  subs.forEach((s, i) => {
    items.push({ nodeId: s.id, kind: 'folder', form: 'box', pos: [-W / 2 + 0.35 + i * 0.5, 0.2, D / 2 + 0.3], size: BOX_SIZE, fixtureId: nodeId })
  })
  return { fixture, items, compartments: [] }
}

function translateFixture(b: BuiltFixture, dx: number, dz: number): BuiltFixture {
  const t = (p: Vec3): Vec3 => [p[0] + dx, p[1], p[2] + dz]
  return {
    fixture: { ...b.fixture, pos: t(b.fixture.pos) },
    items: b.items.map((i) => ({ ...i, pos: t(i.pos) })),
    compartments: b.compartments.map((c) => ({ ...c, bounds: box(t(c.bounds.min), t(c.bounds.max)), segments: c.segments.map((g) => box(t(g.min), t(g.max))) })),
  }
}

// ---------- Rooms ----------

interface BuiltRoom { room: Omit<RoomEntity, 'rect' | 'buildingId'>; w: number; d: number; contents: BuiltFixture[] }

/** A room for folder F: one fixture per subfolder in rows facing +Z, plus a table for loose files. */
function buildRoom(fs: FsIndex, folderId: NodeId, theme: ThemeId, lobby: boolean, skip: ReadonlySet<NodeId>): BuiltRoom {
  const reserve = lobby ? undefined : ROOM_RESERVE[fs.path(folderId)] ?? ROOM_RESERVE[`*:${theme}`]
  const kids = fs.children(folderId).filter((k) => !skip.has(k.id))
  const files = kids.filter((k): k is FileNode => k.type === 'file')
  const subs = lobby ? [] : kids.filter((k) => k.type === 'folder')
  const fixtures: BuiltFixture[] = []
  const make = (id: NodeId) => (theme === 'gallery' ? buildWall(fs, id, theme) : buildShelf(id, fixtureSlots(fs, id), theme))
  for (const s of subs) fixtures.push(make(s.id))

  let table: BuiltFixture | undefined
  if (files.length > 0) {
    if (theme === 'gallery') fixtures.unshift(buildWall(fs, folderId, theme, false))
    else if (files.length <= LOOSE_TABLE_MAX) table = buildTable(folderId, files, theme)
    else fixtures.unshift(buildShelf(folderId, files.map((f) => ({ nodeId: f.id, kind: f.kind, form: 'spine' as ItemForm, size: spineSize(f) })), theme))
  }

  const widths = fixtures.map((f) => f.fixture.size[0])
  const maxW = Math.max(0, ...widths, table?.fixture.size[0] ?? 0)
  const totalArea = widths.reduce((a, w) => a + (w + 0.5) * (SHELF.depth + ROOM.aisle), 0)
  const innerW = Math.min(Math.max(maxW, reserve?.[0] ?? 0, ROOM.min - 2 * ROOM.margin, Math.sqrt(totalArea) * 1.25), Math.max(ROOM.maxInnerW, maxW, reserve?.[0] ?? 0))
  const rows: BuiltFixture[][] = []
  let row: BuiltFixture[] = []
  let rowW = 0
  for (const f of fixtures) {
    const w = f.fixture.size[0]
    if (row.length && rowW + 0.5 + w > innerW) { rows.push(row); row = []; rowW = 0 }
    rowW += (row.length ? 0.5 : 0) + w
    row.push(f)
  }
  if (row.length) rows.push(row)

  const placed: BuiltFixture[] = []
  let z = ROOM.margin
  for (const r of rows) {
    const depth = Math.max(...r.map((f) => f.fixture.size[2]))
    const w = r.reduce((a, f) => a + f.fixture.size[0], 0) + 0.5 * (r.length - 1)
    let x = ROOM.margin + (innerW - w) / 2
    for (const f of r) {
      placed.push(translateFixture(f, x + f.fixture.size[0] / 2, z + depth / 2))
      x += f.fixture.size[0] + 0.5
    }
    z += depth + ROOM.aisle
  }
  if (table) {
    const td = table.fixture.size[2]
    placed.push(translateFixture(table, ROOM.margin + innerW / 2, z + td / 2))
    z += td + 0.6
  } else if (rows.length) {
    z += -ROOM.aisle + 0.9
  }
  if (reserve) z += reserve[1]
  const w = Math.max(ROOM.min, innerW + 2 * ROOM.margin)
  const d = Math.max(ROOM.min, z + ROOM.margin)
  const dx = (w - (innerW + 2 * ROOM.margin)) / 2
  const contents = dx > 0 ? placed.map((p) => translateFixture(p, dx, 0)) : placed
  return { room: { nodeId: folderId, lobby, theme }, w, d, contents }
}

// ---------- Buildings ----------

interface BuiltBuilding { nodeId: NodeId; theme: ThemeId; main: boolean; w: number; d: number; rooms: { room: BuiltRoom; rect: Rect }[] }

/** A building for folder F: its subfolders become rooms; its own files a lobby. */
function buildBuilding(fs: FsIndex, folderId: NodeId, theme: ThemeId, skip: ReadonlySet<NodeId>, importance: ImportanceFn, main: boolean): BuiltBuilding {
  const kids = fs.children(folderId).filter((k) => !skip.has(k.id))
  const subs = kids.filter((k) => k.type === 'folder')
  const hasLoose = kids.some((k) => k.type === 'file')
  const built: BuiltRoom[] = []
  const ordered = [...subs].sort((a, b) => importance(b.id) - importance(a.id))
  for (const s of ordered) built.push(buildRoom(fs, s.id, theme, false, skip))
  if (hasLoose || built.length === 0) built.push(buildRoom(fs, folderId, theme, true, skip))

  const area = built.reduce((a, r) => a + r.w * r.d, 0)
  const maxRoomW = Math.max(...built.map((r) => r.w))
  const targetW = Math.min(BUILDING.maxW, Math.max(maxRoomW, Math.sqrt(area) * 1.2))
  const rows: BuiltRoom[][] = []
  let row: BuiltRoom[] = []
  let rowW = 0
  for (const r of built) {
    if (row.length && rowW + r.w > targetW + 0.01) { rows.push(row); row = []; rowW = 0 }
    row.push(r)
    rowW += r.w
  }
  if (row.length) rows.push(row)
  const W = Math.max(...rows.map((r) => r.reduce((a, x) => a + x.w, 0)))

  const rooms: { room: BuiltRoom; rect: Rect }[] = []
  let z = BUILDING.wall
  for (const r of rows) {
    const depth = Math.max(...r.map((x) => x.d))
    const natural = r.reduce((a, x) => a + x.w, 0)
    const extra = (W - natural) / r.length
    let x = BUILDING.wall
    for (const room of r) {
      const w = room.w + extra
      const shifted = { ...room, contents: room.contents.map((c) => translateFixture(c, extra / 2, (depth - room.d) / 2)) }
      rooms.push({ room: shifted, rect: { x, z, w, d: depth } })
      x += w
    }
    z += depth
  }
  return { nodeId: folderId, theme, main, w: W + 2 * BUILDING.wall, d: z + BUILDING.wall, rooms }
}

// ---------- Areas ----------

interface PlacedBuilding { b: BuiltBuilding; x: number; z: number }

export interface BuiltArea {
  nodeId: NodeId
  theme: ThemeId
  prominence: Prominence
  /** Footprint including the area's own margin. */
  w: number
  d: number
  buildings: PlacedBuilding[]
  plaza?: Rect
}

function rowsArrangement(blds: BuiltBuilding[], street: number) {
  const area = blds.reduce((a, b) => a + (b.w + street) * (b.d + street), 0)
  const targetW = Math.max(...blds.map((b) => b.w), Math.sqrt(area) * 1.3)
  const placed: PlacedBuilding[] = []
  let x = 0
  let z = 0
  let rowD = 0
  let maxW = 0
  for (const b of blds) {
    if (x > 0 && x + b.w > targetW) { z += rowD + street; x = 0; rowD = 0 }
    placed.push({ b, x, z })
    x += b.w + street
    rowD = Math.max(rowD, b.d)
    maxW = Math.max(maxW, x - street)
  }
  return { w: maxW, d: z + rowD, placed }
}

type Side = 'north' | 'south' | 'west' | 'east'
const SIDE_ORDER: Side[] = ['north', 'west', 'east', 'south', 'south', 'north', 'west', 'east']

function courtyardArrangement(blds: BuiltBuilding[], street: number) {
  const side: Record<Side, BuiltBuilding[]> = { north: [], south: [], west: [], east: [] }
  // The area's own building greets visitors at the entrance (south).
  const others = blds.filter((b) => !b.main)
  const main = blds.find((b) => b.main)
  others.forEach((b, i) => side[SIDE_ORDER[i % SIDE_ORDER.length]].push(b))
  if (main) side.south.push(main)
  const rowW = (r: BuiltBuilding[]) => r.reduce((a, b) => a + b.w, 0) + street * Math.max(0, r.length - 1)
  const rowD = (r: BuiltBuilding[]) => Math.max(0, ...r.map((b) => b.d))
  const colW = (c: BuiltBuilding[]) => Math.max(0, ...c.map((b) => b.w))
  const colD = (c: BuiltBuilding[]) => c.reduce((a, b) => a + b.d, 0) + street * Math.max(0, c.length - 1)
  const plazaMin = { w: 15, d: 12 }
  const midD = Math.max(plazaMin.d, colD(side.west), colD(side.east))
  const midW = colW(side.west) + colW(side.east) + plazaMin.w + 2 * street
  const W = Math.max(rowW(side.north), rowW(side.south) + plazaMin.w * 0.35, midW)
  const nD = rowD(side.north)
  const sD = rowD(side.south)
  const D = nD + (nD ? street : 0) + midD + (sD ? street : 0) + sD
  const placed: PlacedBuilding[] = []
  let x = (W - rowW(side.north)) / 2
  for (const b of side.north) { placed.push({ b, x, z: nD - b.d }); x += b.w + street }
  const midZ = nD + (nD ? street : 0)
  const placeCol = (c: BuiltBuilding[], x0: (b: BuiltBuilding) => number) => {
    let z = midZ + (midD - colD(c)) / 2
    for (const b of c) { placed.push({ b, x: x0(b), z }); z += b.d + street }
  }
  placeCol(side.west, () => 0)
  placeCol(side.east, (b) => W - b.w)
  // South buildings flank a central entrance gap.
  const southZ = midZ + midD + (sD ? street : 0)
  const half = Math.ceil(side.south.length / 2)
  x = 0
  for (const b of side.south.slice(0, half)) { placed.push({ b, x, z: southZ }); x += b.w + street }
  x = W
  for (const b of side.south.slice(half).reverse()) { x -= b.w; placed.push({ b, x, z: southZ }); x -= street }
  const westW = colW(side.west)
  const eastW = colW(side.east)
  const plaza: Rect = { x: westW + street, z: midZ, w: W - westW - eastW - 2 * street, d: midD }
  return { w: W, d: D, placed, plaza }
}

/**
 * Renders folder `rootId` as an area. Subfolders that have subfolders of their
 * own become buildings; the root's leaf subfolders and files share a main
 * building. With no deep subfolders the whole area is a single building.
 */
export function buildArea(fs: FsIndex, rootId: NodeId, themeOf: (id: NodeId) => ThemeId, prominence: Prominence, importance: ImportanceFn, skip: ReadonlySet<NodeId> = new Set()): BuiltArea {
  const theme = themeOf(rootId)
  const kids = fs.children(rootId).filter((k) => !skip.has(k.id))
  const deep = kids.filter((k) => k.type === 'folder' && fs.children(k.id).some((c) => c.type === 'folder'))
  const deepSet = new Set(deep.map((d) => d.id))
  const ordered = [...deep].sort((a, b) => importance(b.id) - importance(a.id))
  const blds: BuiltBuilding[] = ordered.map((d) => buildBuilding(fs, d.id, themeOf(d.id), skip, importance, false))
  const restSkip = new Set([...skip, ...deepSet])
  const hasRest = kids.some((k) => !deepSet.has(k.id)) || blds.length === 0
  if (hasRest) blds.unshift(buildBuilding(fs, rootId, theme, restSkip, importance, true))

  const street = AREA_STREET[prominence]
  const pad = AREA_PAD[prominence]
  const arranged = prominence === 'campus' && blds.length >= 3 ? courtyardArrangement(blds, street) : { ...rowsArrangement(blds, street), plaza: undefined as Rect | undefined }
  const shift = (r: Rect): Rect => ({ ...r, x: r.x + pad, z: r.z + pad })
  return {
    nodeId: rootId, theme, prominence,
    w: arranged.w + 2 * pad,
    d: arranged.d + 2 * pad,
    buildings: arranged.placed.map((p) => ({ ...p, x: p.x + pad, z: p.z + pad })),
    plaza: arranged.plaza ? shift(arranged.plaza) : undefined,
  }
}

// ---------- Emission into a world layout ----------

export type AnchorFn = (id: NodeId, b: AABB, level: AnchorLevel, shownAs?: NodeId) => void

/** Adds an area built at the origin to `out`, offset to (dx, dz). */
export function emitArea(out: WorldLayout, a: BuiltArea, dx: number, dz: number, y: number, anchor: AnchorFn) {
  const rect: Rect = { x: dx, z: dz, w: a.w, d: a.d }
  out.areas.push({ nodeId: a.nodeId, rect, theme: a.theme, prominence: a.prominence, plaza: a.plaza ? { ...a.plaza, x: a.plaza.x + dx, z: a.plaza.z + dz } : undefined, y })
  anchor(a.nodeId, rectBox(rect, 0, 3), 'area')
  for (const pb of a.buildings) {
    const b = pb.b
    const brect: Rect = { x: dx + pb.x, z: dz + pb.z, w: b.w, d: b.d }
    const be: BuildingEntity = { nodeId: b.nodeId, rect: brect, theme: b.theme, wallHeight: WALL_HEIGHT[b.theme], areaId: a.nodeId, main: b.main }
    out.buildings.push(be)
    anchor(b.nodeId, rectBox(brect, 0, be.wallHeight), 'building')
    addExteriorWalls(out, b.nodeId, brect, be.wallHeight, b.theme)
    for (const { room, rect: rr } of b.rooms) {
      const rrect: Rect = { x: brect.x + rr.x, z: brect.z + rr.z, w: rr.w, d: rr.d }
      out.rooms.push({ ...room.room, rect: rrect, buildingId: b.nodeId })
      if (!room.room.lobby) anchor(room.room.nodeId, rectBox(rrect, 0, 2.2), 'room')
      addPartitions(out, b.nodeId, brect, rrect, b.theme)
      for (const f of room.contents) addFixture(out, translateFixture(f, rrect.x, rrect.z), anchor)
    }
  }
}

function addFixture(out: WorldLayout, f: BuiltFixture, anchor: AnchorFn) {
  out.fixtures.push(f.fixture)
  const p = f.fixture.pos
  const s = f.fixture.size
  anchor(f.fixture.nodeId, box([p[0] - s[0] / 2, 0, p[2] - s[2] / 2], [p[0] + s[0] / 2, s[1], p[2] + s[2] / 2]), 'fixture')
  for (const c of f.compartments) {
    out.compartments.push(c)
    anchor(c.nodeId, c.bounds, 'compartment')
  }
  for (const it of f.items) {
    out.items.push(it)
    anchor(it.nodeId, itemBox(it.pos, it.size), it.form === 'box' ? 'box' : 'item')
  }
}

function addExteriorWalls(out: WorldLayout, buildingId: NodeId, r: Rect, h: number, theme: ThemeId) {
  const t = BUILDING.wall
  const door = Math.min(2.4, r.w * 0.3)
  const seg = (r.w - door) / 2
  const push = (pos: Vec3, size: Vec3, normal: [number, number]) => out.walls.push({ pos, size, normal, exterior: true, buildingId, theme })
  push([r.x + r.w / 2, 0, r.z + t / 2], [r.w, h, t], [0, -1])
  push([r.x + t / 2, 0, r.z + r.d / 2], [t, h, r.d - 2 * t], [-1, 0])
  push([r.x + r.w - t / 2, 0, r.z + r.d / 2], [t, h, r.d - 2 * t], [1, 0])
  push([r.x + seg / 2, 0, r.z + r.d - t / 2], [seg, h, t], [0, 1])
  push([r.x + r.w - seg / 2, 0, r.z + r.d - t / 2], [seg, h, t], [0, 1])
}

/** Low interior walls on a room's south and east edges (unless on the exterior), each with a doorway. */
function addPartitions(out: WorldLayout, buildingId: NodeId, b: Rect, r: Rect, theme: ThemeId) {
  const t = ROOM.wall
  const h = ROOM.partitionH
  const eps = 0.3
  const door = 1.3
  const push = (pos: Vec3, size: Vec3, normal: [number, number]) => out.walls.push({ pos, size, normal, exterior: false, buildingId, theme })
  if (r.z + r.d < b.z + b.d - eps) {
    const seg = (r.w - door) / 2
    if (seg > 0.2) {
      push([r.x + seg / 2, 0, r.z + r.d], [seg, h, t], [0, 1])
      push([r.x + r.w - seg / 2, 0, r.z + r.d], [seg, h, t], [0, 1])
    }
  }
  if (r.x + r.w < b.x + b.w - eps) {
    const seg = (r.d - door) / 2
    if (seg > 0.2) {
      push([r.x + r.w, 0, r.z + seg / 2], [t, h, seg], [1, 0])
      push([r.x + r.w, 0, r.z + r.d - seg / 2], [t, h, seg], [1, 0])
    }
  }
}

/** An empty world layout for a context (Stage 1 or a box-world fills it). */
export function emptyLayout(context: WorldLayout['context']): WorldLayout {
  return {
    context, ground: { x: 0, z: 0, w: 0, d: 0 },
    regions: [], roads: [], areas: [], buildings: [], rooms: [], walls: [], fixtures: [], compartments: [], items: [],
    anchors: new Map<NodeId, Anchor>(), importance: new Map(),
  }
}
