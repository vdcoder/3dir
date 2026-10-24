// Deterministic spatial layout: canonical filesystem -> world entities.
//
// Grammar (sizes computed bottom-up so nothing overlaps and positions are stable):
//   land > district > building > room > fixture (shelf/table/wall) > item
//   a fixture's subfolders become labelled compartments; anything deeper
//   becomes a closed archive box on the shelf.
// Districts are placed by the curated plan (plan.ts); promoted folders appear
// as top-level districts/buildings while keeping their real paths.

import type { FsIndex } from '../model/fs'
import type { FileKind, FileNode, FsNode, NodeId } from '../model/types'
import { DISTRICTS, IMPORTANCE, type DistrictPlan, type ThemeId } from './plan'

export type Vec3 = [number, number, number]
export interface AABB { min: Vec3; max: Vec3 }
export interface Rect { x: number; z: number; w: number; d: number }

export type ItemForm = 'spine' | 'box' | 'frame' | 'paper'
export type FixtureType = 'shelf' | 'table' | 'wall'

export interface ItemEntity {
  nodeId: NodeId
  form: ItemForm
  kind: FileKind | 'folder'
  /** Center of the item. */
  pos: Vec3
  size: Vec3
  fixtureId: NodeId
}

export interface FixtureEntity {
  nodeId: NodeId
  type: FixtureType
  theme: ThemeId
  /** Center of the base (y = floor). Fixtures face +Z. */
  pos: Vec3
  size: Vec3
  levels: number
  bays: number
}

export interface CompartmentEntity {
  nodeId: NodeId
  fixtureId: NodeId
  bounds: AABB
}

export interface RoomEntity {
  nodeId: NodeId
  /** True for a building's own loose files (its "front desk"), not a subfolder. */
  lobby: boolean
  rect: Rect
  theme: ThemeId
  buildingId: NodeId
}

export interface BuildingEntity {
  nodeId: NodeId
  rect: Rect
  theme: ThemeId
  wallHeight: number
  /** Shown higher in the map than its real depth. */
  promoted: boolean
  districtKey: string
}

export interface WallEntity {
  /** Center of the wall footprint at floor level. */
  pos: Vec3
  size: Vec3
  /** Outward normal on the ground plane, used for camera-facing cutaways. */
  normal: [number, number]
  exterior: boolean
  buildingId: NodeId
  theme: ThemeId
}

export interface DistrictEntity {
  key: string
  title: string
  theme: ThemeId
  rect: Rect
  /** Folders this district shows (its real locations). */
  nodeIds: NodeId[]
  /** Paved plaza inside a courtyard district. */
  plaza?: Rect
  /** Where walkways arrive (front-center edge). */
  gate: [number, number]
}

/** A promoted folder's real home points to where it is shown. */
export interface PortalEntity {
  nodeId: NodeId
  /** Signpost location, outside the real parent's building. */
  pos: Vec3
  /** The district gate the walkway leads to. */
  to: [number, number]
  fromBuildingId: NodeId
}

export interface Walkway { points: [number, number][]; width: number; kind: 'avenue' | 'portal' }

export interface Anchor {
  nodeId: NodeId
  bounds: AABB
  /** The nearest node that is drawn in the world (itself when visible). */
  shownAs: NodeId
  level: 'land' | 'district' | 'building' | 'room' | 'fixture' | 'compartment' | 'item' | 'box' | 'portal'
}

export interface WorldLayout {
  land: Rect
  districts: DistrictEntity[]
  buildings: BuildingEntity[]
  rooms: RoomEntity[]
  walls: WallEntity[]
  fixtures: FixtureEntity[]
  compartments: CompartmentEntity[]
  items: ItemEntity[]
  portals: PortalEntity[]
  walkways: Walkway[]
  anchors: Map<NodeId, Anchor>
  importance: Map<NodeId, number>
}

// ---------- Dimensions (world units ≈ metres in the miniature) ----------

const SHELF = { levelH: 0.5, base: 0.12, depth: 0.45, bayW: 1.0, side: 0.04, maxLevels: 4 }
const TABLE = { h: 0.76, cell: [0.3, 0.38] as const, pad: 0.18, maxCols: 6 }
const WALL_PANEL = { frame: [0.5, 0.38] as const, gap: 0.12, h: 2.4, maxRows: 3 }
const ROOM = { aisle: 1.15, margin: 0.55, wall: 0.18, partitionH: 1.05, min: 3.6, maxInnerW: 13 }
const BUILDING = { wall: 0.25, maxW: 34 }
const STREET = 3.2
const LOOSE_TABLE_MAX = 12

const WALL_HEIGHT: Record<ThemeId, number> = { business: 2.9, studio: 2.6, gallery: 3.0, home: 2.4, system: 2.2 }

// ---------- Helpers ----------

const box = (min: Vec3, max: Vec3): AABB => ({ min, max })
const rectBox = (r: Rect, y0: number, y1: number): AABB => box([r.x, y0, r.z], [r.x + r.w, y1, r.z + r.d])

function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return h >>> 0
}
const rand = (key: string) => (hash(key) % 10_000) / 10_000

function spineSize(f: FileNode): Vec3 {
  const r = rand(f.id)
  const thick = 0.04 + Math.min(0.05, Math.log10(Math.max(f.sizeBytes, 1000)) * 0.006) + r * 0.012
  const tall: Partial<Record<FileKind, number>> = { spreadsheet: 0.4, pdf: 0.36, document: 0.38, presentation: 0.34, text: 0.28, code: 0.3, design: 0.4, archive: 0.3, image: 0.32 }
  return [thick, (tall[f.kind] ?? 0.3) - r * 0.04, 0.32]
}
const BOX_SIZE: Vec3 = [0.3, 0.27, 0.36]

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
    if (inner.length === 0) slots.push({ nodeId: sub.id, kind: 'folder', form: 'box', size: [0.2, 0.18, 0.3], compartment: sub.id })
  }
  return slots
}

interface BuiltFixture { fixture: FixtureEntity; items: ItemEntity[]; compartments: CompartmentEntity[] }

/** Builds a shelf at the local origin (base center at 0,0,0, facing +Z), growing bays until everything fits. */
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
    }
    x += l + s.size[0] + gap
    prev = s.compartment
  }
  const compartments = [...comp].map(([id, bounds]) => ({ nodeId: id, fixtureId: nodeId, bounds }))
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
    return { nodeId: f.id, kind: f.kind, form: 'paper' as ItemForm, pos, size: [0.22, h, 0.29] as Vec3, fixtureId: nodeId }
  })
  return { fixture, items, compartments: [] }
}

/** Gallery display wall: files hang as frames. Subfolders become boxes on a ledge. */
function buildWall(fs: FsIndex, nodeId: NodeId, theme: ThemeId, withSubfolders = true): BuiltFixture {
  const kids = fs.children(nodeId)
  const files = kids.filter((k): k is FileNode => k.type === 'file')
  const subs = withSubfolders ? kids.filter((k) => k.type === 'folder') : []
  const n = Math.max(1, files.length)
  const rows = Math.min(WALL_PANEL.maxRows, Math.max(1, Math.round(Math.sqrt(n / 2))))
  const cols = Math.ceil(n / rows)
  const [fw, fh] = WALL_PANEL.frame
  const W = Math.max(1.6, cols * (fw + WALL_PANEL.gap) + 0.3, subs.length * 0.36 + 0.4)
  const H = WALL_PANEL.h
  const D = 0.16
  const fixture: FixtureEntity = { nodeId, type: 'wall', theme, pos: [0, 0, 0], size: [W, H, D], levels: rows, bays: cols }
  const top = 0.75 + rows * (fh + WALL_PANEL.gap)
  const items: ItemEntity[] = files.map((f, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const pos: Vec3 = [-W / 2 + 0.15 + WALL_PANEL.gap / 2 + (c + 0.5) * (fw + WALL_PANEL.gap) - WALL_PANEL.gap / 2, Math.min(H - 0.2, top) - (r + 0.5) * (fh + WALL_PANEL.gap), D / 2 + 0.02]
    return { nodeId: f.id, kind: f.kind, form: 'frame' as ItemForm, pos, size: [fw, fh, 0.035] as Vec3, fixtureId: nodeId }
  })
  subs.forEach((s, i) => {
    items.push({ nodeId: s.id, kind: 'folder', form: 'box', pos: [-W / 2 + 0.3 + i * 0.36, 0.14, D / 2 + 0.2], size: [0.28, 0.24, 0.3], fixtureId: nodeId })
  })
  return { fixture, items, compartments: [] }
}

const itemBox = (p: Vec3, s: Vec3): AABB => box([p[0] - s[0] / 2, p[1] - s[1] / 2, p[2] - s[2] / 2], [p[0] + s[0] / 2, p[1] + s[1] / 2, p[2] + s[2] / 2])
const union = (a: AABB, b: AABB): AABB => box(
  [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1]), Math.min(a.min[2], b.min[2])],
  [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1]), Math.max(a.max[2], b.max[2])],
)

function translateFixture(b: BuiltFixture, dx: number, dz: number): BuiltFixture {
  const t = (p: Vec3): Vec3 => [p[0] + dx, p[1], p[2] + dz]
  const tb = (a: AABB): AABB => box(t(a.min), t(a.max))
  return {
    fixture: { ...b.fixture, pos: t(b.fixture.pos) },
    items: b.items.map((i) => ({ ...i, pos: t(i.pos) })),
    compartments: b.compartments.map((c) => ({ ...c, bounds: tb(c.bounds) })),
  }
}

// ---------- Rooms ----------

interface BuiltRoom { room: Omit<RoomEntity, 'rect' | 'buildingId'>; w: number; d: number; contents: BuiltFixture[] }

/** A room for folder F: one fixture per subfolder in rows facing +Z, plus a table for loose files. */
function buildRoom(fs: FsIndex, folderId: NodeId, theme: ThemeId, lobby: boolean, skip: Set<NodeId>): BuiltRoom {
  const kids = fs.children(folderId).filter((k) => !skip.has(k.id))
  const files = kids.filter((k): k is FileNode => k.type === 'file')
  const subs = lobby ? [] : kids.filter((k) => k.type === 'folder')
  const fixtures: BuiltFixture[] = []
  const make = (id: NodeId) => (theme === 'gallery' ? buildWall(fs, id, theme) : buildShelf(id, fixtureSlots(fs, id), theme))
  for (const s of subs) fixtures.push(make(s.id))

  let table: BuiltFixture | undefined
  if (files.length > 0) {
    if (theme === 'gallery') {
      fixtures.unshift(buildWall(fs, folderId, theme, false))
    } else if (files.length <= LOOSE_TABLE_MAX) {
      table = buildTable(folderId, files, theme)
    } else {
      // Many loose files: a shelf for the room's own folder.
      const slots = files.map((f) => ({ nodeId: f.id, kind: f.kind, form: 'spine' as ItemForm, size: spineSize(f) }))
      fixtures.unshift(buildShelf(folderId, slots, theme))
    }
  }

  // Arrange fixtures in rows facing +Z (towards the default camera).
  const widths = fixtures.map((f) => f.fixture.size[0])
  const maxW = Math.max(0, ...widths, table?.fixture.size[0] ?? 0)
  const totalArea = widths.reduce((a, w) => a + (w + 0.5) * (SHELF.depth + ROOM.aisle), 0)
  const innerW = Math.min(Math.max(maxW, ROOM.min - 2 * ROOM.margin, Math.sqrt(totalArea) * 1.25), Math.max(ROOM.maxInnerW, maxW))
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
  const w = Math.max(ROOM.min, innerW + 2 * ROOM.margin)
  const d = Math.max(ROOM.min, z + ROOM.margin)
  // Center contents if the room was stretched to the minimum size.
  const dx = (w - (innerW + 2 * ROOM.margin)) / 2
  const contents = dx > 0 ? placed.map((p) => translateFixture(p, dx, 0)) : placed
  return { room: { nodeId: folderId, lobby, theme }, w, d, contents }
}

// ---------- Buildings ----------

interface BuiltBuilding { building: Omit<BuildingEntity, 'rect' | 'districtKey'>; w: number; d: number; rooms: { room: BuiltRoom; rect: Rect }[] }

function buildBuilding(fs: FsIndex, folderId: NodeId, theme: ThemeId, promoted: boolean, skip: Set<NodeId>, importance: (id: NodeId) => number): BuiltBuilding {
  const kids = fs.children(folderId).filter((k) => !skip.has(k.id))
  const subs = kids.filter((k) => k.type === 'folder')
  const hasLoose = kids.some((k) => k.type === 'file')
  const built: BuiltRoom[] = []
  // Most important rooms first; ties keep Explorer order.
  const ordered = [...subs].sort((a, b) => importance(b.id) - importance(a.id))
  for (const s of ordered) built.push(buildRoom(fs, s.id, theme, false, skip))
  if (hasLoose || built.length === 0) built.push(buildRoom(fs, folderId, theme, true, skip))

  const area = built.reduce((a, r) => a + r.w * r.d, 0)
  const maxRoomW = Math.max(...built.map((r) => r.w))
  const targetW = Math.min(BUILDING.maxW, Math.max(maxRoomW, Math.sqrt(area) * 1.2))
  // Shelf-pack rooms into rows; stretch rooms to fill row width and depth.
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
      // Center the room's contents inside its stretched rect.
      const shifted = { ...room, contents: room.contents.map((c) => translateFixture(c, extra / 2, (depth - room.d) / 2)) }
      rooms.push({ room: shifted, rect: { x, z, w, d: depth } })
      x += w
    }
    z += depth
  }
  return {
    building: { nodeId: folderId, theme, wallHeight: WALL_HEIGHT[theme], promoted },
    w: W + 2 * BUILDING.wall,
    d: z + BUILDING.wall,
    rooms,
  }
}

// ---------- Districts ----------

interface PlacedBuilding { b: BuiltBuilding; x: number; z: number }
interface BuiltDistrict { plan: DistrictPlan; nodeIds: NodeId[]; w: number; d: number; buildings: PlacedBuilding[]; plaza?: Rect; kiosk?: BuiltFixture }

function rowsArrangement(blds: BuiltBuilding[]): { w: number; d: number; placed: PlacedBuilding[] } {
  const area = blds.reduce((a, b) => a + (b.w + STREET) * (b.d + STREET), 0)
  const targetW = Math.max(...blds.map((b) => b.w), Math.sqrt(area) * 1.3)
  const placed: PlacedBuilding[] = []
  let x = 0
  let z = 0
  let rowD = 0
  let maxW = 0
  for (const b of blds) {
    if (x > 0 && x + b.w > targetW) { z += rowD + STREET; x = 0; rowD = 0 }
    placed.push({ b, x, z })
    x += b.w + STREET
    rowD = Math.max(rowD, b.d)
    maxW = Math.max(maxW, x - STREET)
  }
  return { w: maxW, d: z + rowD, placed }
}

function courtyardArrangement(blds: BuiltBuilding[], sideOf: (b: BuiltBuilding) => 'north' | 'south' | 'west' | 'east') {
  const side = { north: [] as BuiltBuilding[], south: [] as BuiltBuilding[], west: [] as BuiltBuilding[], east: [] as BuiltBuilding[] }
  for (const b of blds) side[sideOf(b)].push(b)
  const rowW = (r: BuiltBuilding[]) => r.reduce((a, b) => a + b.w, 0) + STREET * Math.max(0, r.length - 1)
  const rowD = (r: BuiltBuilding[]) => Math.max(0, ...r.map((b) => b.d))
  const colW = (c: BuiltBuilding[]) => Math.max(0, ...c.map((b) => b.w))
  const colD = (c: BuiltBuilding[]) => c.reduce((a, b) => a + b.d, 0) + STREET * Math.max(0, c.length - 1)
  const plazaMin = { w: 16, d: 13 }
  const midD = Math.max(plazaMin.d, colD(side.west), colD(side.east))
  const midW = colW(side.west) + colW(side.east) + plazaMin.w + 2 * STREET
  const W = Math.max(rowW(side.north), rowW(side.south), midW)
  const nD = rowD(side.north)
  const sD = rowD(side.south)
  const D = nD + (nD ? STREET : 0) + midD + (sD ? STREET : 0) + sD
  const placed: PlacedBuilding[] = []
  const placeRow = (r: BuiltBuilding[], z: number, alignBottom: number | null) => {
    let x = (W - rowW(r)) / 2
    for (const b of r) {
      placed.push({ b, x, z: alignBottom === null ? z : z + alignBottom - b.d })
      x += b.w + STREET
    }
  }
  placeRow(side.north, 0, nD)
  const midZ = nD + (nD ? STREET : 0)
  const placeCol = (c: BuiltBuilding[], x0: (b: BuiltBuilding) => number) => {
    let z = midZ + (midD - colD(c)) / 2
    for (const b of c) { placed.push({ b, x: x0(b), z }); z += b.d + STREET }
  }
  placeCol(side.west, () => 0)
  placeCol(side.east, (b) => W - b.w)
  // South buildings flank a central entrance gap.
  const southZ = midZ + midD + (sD ? STREET : 0)
  const half = Math.ceil(side.south.length / 2)
  const left = side.south.slice(0, half)
  const right = side.south.slice(half)
  let x = 0
  for (const b of left) { placed.push({ b, x, z: southZ }); x += b.w + STREET }
  x = W
  for (const b of right.reverse()) { x -= b.w; placed.push({ b, x, z: southZ }); x -= STREET }
  const westW = colW(side.west)
  const eastW = colW(side.east)
  const plaza: Rect = { x: westW + STREET, z: midZ, w: W - westW - eastW - 2 * STREET, d: midD }
  return { w: W, d: D, placed, plaza }
}

// ---------- Main ----------

export function computeLayout(fs: FsIndex): WorldLayout {
  const root = fs.roots()[0]
  const pathToId = (p: string) => fs.resolve(p)?.id

  // Importance: curated values, else simple rules.
  const curated = new Map<NodeId, number>()
  for (const [p, v] of Object.entries(IMPORTANCE)) { const id = pathToId(p); if (id) curated.set(id, v) }
  const importanceCache = new Map<NodeId, number>()
  const importance = (id: NodeId): number => {
    const c = importanceCache.get(id)
    if (c !== undefined) return c
    let v = curated.get(id)
    if (v === undefined) {
      const n = fs.get(id)
      const parent = n?.parentId ? importance(n.parentId) : 0.5
      v = n?.type === 'file' ? Math.min(1, parent * 0.8 + (n.modified >= '2026-09-01' ? 0.15 : 0)) : parent * 0.85
    }
    importanceCache.set(id, v)
    return v
  }

  // Promoted folders = everything a district shows directly (except top-level folders).
  const districtFolders = DISTRICTS.map((d) => ({ plan: d, ids: d.paths.map(pathToId).filter((x): x is NodeId => !!x) }))
  const promoted = new Set<NodeId>()
  for (const d of districtFolders) for (const id of d.ids) if (fs.ancestry(id).length > 2) promoted.add(id)

  // Build districts bottom-up.
  const built: BuiltDistrict[] = []
  for (const { plan, ids } of districtFolders) {
    if (ids.length === 0) continue
    const buildingFolders: NodeId[] = []
    let kioskFiles: FileNode[] = []
    for (const id of ids) {
      if (plan.expand) {
        const kids = fs.children(id).filter((k) => !promoted.has(k.id))
        buildingFolders.push(...kids.filter((k) => k.type === 'folder').map((k) => k.id))
        kioskFiles = kioskFiles.concat(kids.filter((k): k is FileNode => k.type === 'file'))
      } else buildingFolders.push(id)
    }
    const blds = buildingFolders.map((id) => buildBuilding(fs, id, plan.theme, promoted.has(id) || (plan.expand ?? false) && fs.ancestry(id).length > 3, promoted, importance))
    let w: number, d: number, placed: PlacedBuilding[], plaza: Rect | undefined
    if (plan.arrangement === 'courtyard') {
      const r = courtyardArrangement(blds, (b) => plan.sides?.[fs.get(b.building.nodeId)!.name] ?? 'south')
      ;({ w, d, placed, plaza } = r)
    } else {
      ;({ w, d, placed } = rowsArrangement(blds))
    }
    let kiosk: BuiltFixture | undefined
    if (kioskFiles.length && plan.expand) {
      kiosk = buildTable(ids[0], kioskFiles.slice(0, 24), plan.theme)
    }
    built.push({ plan, nodeIds: ids, w, d, buildings: placed, plaza, kiosk })
  }

  // Land: 3 columns x 2 rows of districts with avenues between.
  const AVENUE = 9
  const MARGIN = 10
  const colW = [0, 1, 2].map((c) => Math.max(0, ...built.filter((b) => b.plan.slot.col === c).map((b) => b.w)))
  const rowD = [0, 1].map((r) => Math.max(0, ...built.filter((b) => b.plan.slot.row === r).map((b) => b.d)))
  const totalW = colW.reduce((a, b) => a + b, 0) + AVENUE * 2
  const totalD = rowD[0] + rowD[1] + AVENUE
  const x0 = -totalW / 2
  const z0 = -totalD / 2
  const colX = [x0, x0 + colW[0] + AVENUE, x0 + colW[0] + colW[1] + 2 * AVENUE]
  // Row 1 is the back (smaller z), row 0 the front.
  const rowZ = [z0 + rowD[1] + AVENUE, z0]

  const layout: WorldLayout = {
    land: { x: x0 - MARGIN, z: z0 - MARGIN, w: totalW + 2 * MARGIN, d: totalD + 2 * MARGIN },
    districts: [], buildings: [], rooms: [], walls: [], fixtures: [], compartments: [], items: [], portals: [], walkways: [],
    anchors: new Map(), importance: new Map(),
  }
  const anchor = (nodeId: NodeId, bounds: AABB, level: Anchor['level'], shownAs = nodeId) => {
    if (!layout.anchors.has(nodeId)) layout.anchors.set(nodeId, { nodeId, bounds, shownAs, level })
  }

  for (const bd of built) {
    const { col, row } = bd.plan.slot
    // Front row aligns to the boulevard (its back edge); back row aligns to its front edge.
    const dx = colX[col] + (colW[col] - bd.w) / 2
    const dz = row === 0 ? rowZ[0] : rowZ[1] + rowD[1] - bd.d
    const rect: Rect = { x: dx, z: dz, w: bd.w, d: bd.d }
    const district: DistrictEntity = {
      key: bd.plan.key, title: bd.plan.title, theme: bd.plan.theme, rect, nodeIds: bd.nodeIds,
      plaza: bd.plaza ? { ...bd.plaza, x: bd.plaza.x + dx, z: bd.plaza.z + dz } : undefined,
      gate: row === 0 ? [dx + bd.w / 2, dz] : [dx + bd.w / 2, dz + bd.d],
    }
    layout.districts.push(district)
    if (bd.plan.expand) for (const id of bd.nodeIds) anchor(id, rectBox(rect, 0, 3), 'district')

    if (bd.kiosk) {
      const p = district.plaza ?? rect
      const k = translateFixture(bd.kiosk, p.x + p.w / 2, p.z + p.d - bd.kiosk.fixture.size[2] / 2 - 1.5)
      addFixture(layout, k, anchor)
    }

    for (const pb of bd.buildings) {
      const b = pb.b
      const bx = dx + pb.x
      const bz = dz + pb.z
      const brect: Rect = { x: bx, z: bz, w: b.w, d: b.d }
      layout.buildings.push({ ...b.building, rect: brect, districtKey: bd.plan.key })
      anchor(b.building.nodeId, rectBox(brect, 0, b.building.wallHeight), 'building')
      addExteriorWalls(layout, b.building.nodeId, brect, b.building.wallHeight, b.building.theme)
      for (const { room, rect: rr } of b.rooms) {
        const rrect: Rect = { x: bx + rr.x, z: bz + rr.z, w: rr.w, d: rr.d }
        layout.rooms.push({ ...room.room, rect: rrect, buildingId: b.building.nodeId })
        if (!room.room.lobby) anchor(room.room.nodeId, rectBox(rrect, 0, 2.2), 'room')
        addPartitions(layout, b.building.nodeId, brect, rrect, b.building.theme)
        for (const f of room.contents) addFixture(layout, translateFixture(f, rrect.x, rrect.z), anchor)
      }
    }
  }

  // Portals: promoted folders get a signpost outside their real parent's building.
  for (const id of promoted) {
    const parentId = fs.get(id)?.parentId
    const parentBuilding = layout.buildings.find((b) => b.nodeId === parentId)
    const target = layout.districts.find((d) => d.nodeIds.includes(id))
    if (!parentBuilding || !target) continue
    const siblings = [...promoted].filter((p) => fs.get(p)?.parentId === parentId).sort()
    const i = siblings.indexOf(id)
    const r = parentBuilding.rect
    const pos: Vec3 = [r.x + r.w / 2 + (i - (siblings.length - 1) / 2) * 1.6, 0, r.z + r.d + 1.4]
    layout.portals.push({ nodeId: id, pos, to: target.gate, fromBuildingId: parentBuilding.nodeId })
    layout.walkways.push({ kind: 'portal', width: 1.2, points: [[pos[0], pos[2]], [pos[0], pos[2] + 2], [target.gate[0], pos[2] + 2], [target.gate[0], target.gate[1]]] })
  }

  // Avenues: the boulevard between rows and the streets between columns.
  const bz = rowZ[0] - AVENUE / 2
  layout.walkways.push({ kind: 'avenue', width: AVENUE * 0.62, points: [[x0 - MARGIN * 0.6, bz], [x0 + totalW + MARGIN * 0.6, bz]] })
  for (const c of [1, 2]) {
    const ax = colX[c] - AVENUE / 2
    layout.walkways.push({ kind: 'avenue', width: AVENUE * 0.45, points: [[ax, z0 - MARGIN * 0.6], [ax, z0 + totalD + MARGIN * 0.6]] })
  }

  // Anchors for everything else: inherit from the nearest anchored ancestor.
  anchor(root.id, rectBox(layout.land, 0, 4), 'land')
  for (const n of allNodes(fs, root.id)) {
    if (layout.anchors.has(n.id)) continue
    const chain = fs.ancestry(n.id)
    for (let i = chain.length - 2; i >= 0; i--) {
      const a = layout.anchors.get(chain[i].id)
      if (a) { layout.anchors.set(n.id, { nodeId: n.id, bounds: a.bounds, shownAs: a.shownAs, level: a.level }); break }
    }
  }
  // Promoted folders without their own district anchor point at their district.
  for (const n of allNodes(fs, root.id)) layout.importance.set(n.id, importance(n.id))
  return layout
}

function* allNodes(fs: FsIndex, id: NodeId): Generator<FsNode> {
  const n = fs.get(id)
  if (!n) return
  yield n
  for (const c of fs.children(id)) yield* allNodes(fs, c.id)
}

function addFixture(layout: WorldLayout, f: BuiltFixture, anchor: (id: NodeId, b: AABB, level: Anchor['level'], shownAs?: NodeId) => void) {
  layout.fixtures.push(f.fixture)
  const p = f.fixture.pos
  const s = f.fixture.size
  anchor(f.fixture.nodeId, box([p[0] - s[0] / 2, 0, p[2] - s[2] / 2], [p[0] + s[0] / 2, s[1], p[2] + s[2] / 2]), 'fixture')
  for (const c of f.compartments) {
    layout.compartments.push(c)
    anchor(c.nodeId, c.bounds, 'compartment')
  }
  for (const it of f.items) {
    layout.items.push(it)
    anchor(it.nodeId, itemBox(it.pos, it.size), it.form === 'box' ? 'box' : 'item')
  }
}

function addExteriorWalls(layout: WorldLayout, buildingId: NodeId, r: Rect, h: number, theme: ThemeId) {
  const t = BUILDING.wall
  const door = Math.min(2.4, r.w * 0.3)
  const seg = (r.w - door) / 2
  const push = (pos: Vec3, size: Vec3, normal: [number, number]) => layout.walls.push({ pos, size, normal, exterior: true, buildingId, theme })
  push([r.x + r.w / 2, 0, r.z + t / 2], [r.w, h, t], [0, -1]) // north
  push([r.x + t / 2, 0, r.z + r.d / 2], [t, h, r.d - 2 * t], [-1, 0]) // west
  push([r.x + r.w - t / 2, 0, r.z + r.d / 2], [t, h, r.d - 2 * t], [1, 0]) // east
  // South wall with a central entrance.
  push([r.x + seg / 2, 0, r.z + r.d - t / 2], [seg, h, t], [0, 1])
  push([r.x + r.w - seg / 2, 0, r.z + r.d - t / 2], [seg, h, t], [0, 1])
}

/** Low interior walls on a room's south and east edges (unless on the exterior), each with a doorway. */
function addPartitions(layout: WorldLayout, buildingId: NodeId, b: Rect, r: Rect, theme: ThemeId) {
  const t = ROOM.wall
  const h = ROOM.partitionH
  const eps = 0.3
  const door = 1.3
  const push = (pos: Vec3, size: Vec3, normal: [number, number]) => layout.walls.push({ pos, size, normal, exterior: false, buildingId, theme })
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
