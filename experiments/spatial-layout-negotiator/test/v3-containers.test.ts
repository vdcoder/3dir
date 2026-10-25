import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, MAX_ROOM_WIDTH } from '../src/config.ts'
import { arrangeAt, createContext, layout } from '../src/engine.ts'
import { bottom } from '../src/geometry.ts'
import type { Rect } from '../src/geometry.ts'
import { join } from '../src/model.ts'
import type { AreaNode, BuildingNode, CampusNode } from '../src/model.ts'
import { InfeasibleError, offerByKey } from '../src/protocol.ts'
import type { Placed } from '../src/protocol.ts'
import { rng } from '../src/rng.ts'
import { demoHierarchy, mixedRoom, room, syntheticHierarchy, withLongShelves } from '../src/synth.ts'
import { nodes } from '../src/validate.ts'
import { exact, measureV3, validV3 } from './helpers.ts'

const cfg = DEFAULT_CONFIG
const sizeOf = (p: Placed) => p.children.map((k) => `${k.name}:${k.rect.w.toFixed(9)}x${k.rect.d.toFixed(9)}`)

describe('α.v3 Designer C — Building', () => {
  const path = 'C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Clients'
  const r = rng(31)
  const b: BuildingNode = {
    kind: 'building', name: 'Clients', path, files: [],
    rooms: [room(path, 'Front desk', [], 3, r), room(path, 'Archive', ['2022', '2023', '2024', '2025'], 2, r, [10, 24]), room(path, 'Records', ['Agreements', 'Orders'], 26, r)],
  }

  it('aligns a row of rooms at one depth; the rooms absorb the difference and keep their shelves and table', () => {
    const { ctx, m } = measureV3(b)
    const o = m.offers.find((x) => x.key === 'rooms/row=3')!
    const p = exact(ctx, m, o)
    validV3(p)
    const depth = (p.meta!.rowDepths as number[])[0]
    const own = p.children.map((k) => k.min.d)
    expect(new Set(own.map((d) => d.toFixed(3))).size).toBe(3) // three different minimum depths…
    for (const k of p.children) expect(k.rect.d).toBeCloseTo(depth, 9) // …one shared depth
    p.children.forEach((k, i) => {
      // The same room at its own minimum has exactly the same shelves and table.
      const alone = exact(ctx, m.children[i], offerByKey(m.children[i], k.offerKey))
      expect(sizeOf(k)).toEqual(sizeOf(alone))
      expect(k.ledger.y.absorbed).toBeCloseTo(depth - k.min.d, 9)
    })
  })

  it('keeps its measured footprint, walls, partitions and corridors; narrower rows widen their rooms up to MAX_ROOM_WIDTH', () => {
    const { ctx, m } = measureV3(b)
    for (const o of m.offers) {
      const p = exact(ctx, m, o)
      validV3(p) // exact size, fixed corridors and partitions, row depth
      const lobbies = p.meta!.lobbies as number[]
      ;(p.rules.rowGroups ?? []).forEach((g, r) => {
        const widened = g.map((i) => p.children[i].rect.w - p.children[i].min.w)
        // A lobby appears only when every room in the row has reached MAX_ROOM_WIDTH.
        if (lobbies[r] > 1e-9) for (const i of g) expect(p.children[i].rect.w).toBeCloseTo(MAX_ROOM_WIDTH, 9)
        for (const w of widened) expect(w).toBeGreaterThanOrEqual(-1e-9)
      })
    }
    expect(() => arrangeAt(m, m.offers[0], ctx, { w: m.offers[0].w + 1, d: m.offers[0].d })).toThrow(InfeasibleError)
  })

  it('puts width no room can take into a lobby (rooms at MAX_ROOM_WIDTH)', () => {
    const p2 = 'C:\\Users\\Amanda\\Library'
    // Rows of three 3.6 m rooms (11.3 m with partitions) and of one 2.4 m room: the single room can
    // only widen to 10 m, so the remaining 1.28 m is a lobby.
    const bb: BuildingNode = { kind: 'building', name: 'Library', path: p2, files: [], rooms: [...['A', 'B', 'C'].map((n, i) => mixedRoom(p2, n, [2.2, 2.3], 0, i + 1)), mixedRoom(p2, 'D', [0.7], 0, 9)] }
    const { ctx, m } = measureV3(bb)
    const p = exact(ctx, m, m.offers.find((x) => x.key === 'rooms/row=3')!)
    validV3(p)
    const [, second] = p.rules.rowGroups!
    expect(p.children[second[0]].rect.w).toBeCloseTo(MAX_ROOM_WIDTH, 9)
    expect((p.meta!.lobbies as number[])[1]).toBeCloseTo(1.28, 1)
    expect(p.regions.filter((g) => g.role === 'lobby')).toHaveLength(1)
  })
})

describe('α.v3 Designer D — Campus', () => {
  const cPath = 'C:\\Users\\Amanda\\OneDrive - Alder & Finch'
  // Buildings of clearly different depths: a deep archive (one shelf per row), a small board room, contracts in between.
  const bld = (name: string, rooms: [string, number[], number][]): BuildingNode => {
    const p = join(cPath, name)
    return { kind: 'building', name, path: p, files: [], rooms: rooms.map(([n, ls, f], i) => mixedRoom(p, n, ls, f, i + 1)) }
  }
  const c: CampusNode = {
    kind: 'campus', name: 'OneDrive - Alder & Finch', path: cPath, files: [],
    buildings: [bld('Archive', [['Boxes', Array(12).fill(4.0), 0]]), bld('Board', [['Meetings', [1.2], 6]]), bld('Contracts', [['Clients', Array(6).fill(4.0), 0], ['Vendors', [1.5, 2.0], 4]])],
  }

  it('centers natural-sized buildings in their row cells, never resizing them, with an entrance walk to the plaza', () => {
    const { ctx, m } = measureV3(c)
    const o = m.offers.find((x) => x.key === 'buildings/row=3')!
    const p = exact(ctx, m, o)
    validV3(p)
    const cells = p.meta!.cells as Rect[]
    const depth = (p.meta!.rowDepths as number[])[0]
    expect(Math.max(...p.children.map((k) => k.rect.d))).toBeCloseTo(depth, 9) // the row is as deep as its deepest building
    p.children.forEach((k, i) => {
      expect(k.rect.w).toBeCloseTo(k.min.w, 9)
      expect(k.rect.d).toBeCloseTo(k.min.d, 9)
      expect(k.rect.x + k.rect.w / 2).toBeCloseTo(cells[i].x + cells[i].w / 2, 9)
      expect(k.rect.y + k.rect.d / 2).toBeCloseTo(cells[i].y + cells[i].d / 2, 9)
    })
    const shorter = p.children.filter((k) => k.rect.d < depth - 1e-6)
    expect(shorter.length).toBeGreaterThan(0)
    expect(p.regions.filter((g) => g.role === 'walk')).toHaveLength(shorter.length)
    for (const g of p.regions.filter((x) => x.role === 'path')) expect(g.rect.w).toBeCloseTo(cfg.campus.path, 9)
  })

  it('is valid for every offer, and is placed only at its measured size', () => {
    const { ctx, m } = measureV3(c)
    for (const o of m.offers) validV3(exact(ctx, m, o))
    expect(() => arrangeAt(m, m.offers[0], ctx, { w: m.offers[0].w, d: m.offers[0].d + 2 })).toThrow(/exactly its measured size/)
  })
})

describe('α.v3 Designer E — Area and the whole protocol', () => {
  it('places every child of every area at exactly its selected offer; the root uses its offer directly', () => {
    const res = layout(demoHierarchy(), { version: 'v3', seed: 3 })
    validV3(res.placed)
    expect(res.placed.rect.w).toBe(res.offer.w)
    expect(res.placed.rect.d).toBe(res.offer.d)
    let areas = 0
    for (const n of nodes(res.placed)) if (n.kind === 'area') {
      areas++
      expect(n.ledger.x.surplus).toBeCloseTo(0, 9)
      for (const k of n.children) { expect(k.rect.w).toBeCloseTo(k.min.w, 9); expect(k.rect.d).toBeCloseTo(k.min.d, 9) }
    }
    expect(areas).toBe(3)
    // Only rooms (and, by row normalization, shelves) are ever larger than their own offer.
    const grown = new Set<string>()
    for (const n of nodes(res.placed)) if (n.rect.w > n.min.w + 1e-9 || n.rect.d > n.min.d + 1e-9) grown.add(n.kind)
    expect([...grown].every((k) => k === 'room' || k === 'shelf')).toBe(true)
  })

  it('does not let a viewport or scale change world geometry', () => {
    expect(() => layout(demoHierarchy(), { version: 'v3', scale: { x: 2, y: 2 } })).toThrow(/no scale or size/)
    const ctx = createContext({ version: 'v3' })
    const m = ctx.measure(demoHierarchy())
    expect(() => arrangeAt(m, m.offers[0], ctx, { w: m.offers[0].w * 1.5, d: m.offers[0].d })).toThrow(InfeasibleError)
  })

  it('is deterministic and never searches while arranging', () => {
    const a = layout(demoHierarchy(), { version: 'v3', seed: 9 })
    const b = layout(demoHierarchy(), { version: 'v3', seed: 9 })
    expect(JSON.stringify(a.placed)).toBe(JSON.stringify(b.placed))
    const ctx = createContext({ version: 'v3', seed: 2 })
    const m = ctx.measure(demoHierarchy())
    const explored = ctx.stats.explored
    for (const o of m.offers) validV3(arrangeAt(m, o, ctx, { w: o.w, d: o.d }))
    expect(ctx.stats.explored).toBe(explored)
    ctx.phase = 'arrange'
    expect(() => ctx.explore()).toThrow(/during ARRANGE/)
  })

  it('uses balanced child-offer sampling by default, and keeps α.v2 as the engine default', () => {
    expect(createContext({ version: 'v3' }).cfg.area.sampling).toBe('balanced')
    expect(createContext().version).toBe('v2')
    expect(createContext().cfg.area.sampling).toBe('uniform')
  })

  it('is valid on synthetic hierarchies of several sizes and seeds, with and without very long folders', () => {
    for (const [n, seeds] of [[100, [1, 2, 3]], [1000, [1]]] as const) for (const seed of seeds) {
      const { root } = syntheticHierarchy(n, seed)
      validV3(layout(root, { version: 'v3', seed }).placed)
      const long = withLongShelves(root, 0.05, [12, 150], seed)
      const p = layout(long, { version: 'v3', seed }).placed
      validV3(p)
      let segs = 0
      for (const x of nodes(p)) if (x.kind === 'shelf' && x.meta?.segment) segs++
      expect(segs).toBeGreaterThan(0)
    }
  })

  it('keeps canonical ancestry: segments and books stay under their folder; nested areas under theirs', () => {
    const long = withLongShelves(demoHierarchy() as AreaNode, 0.1, [15, 40], 4)
    const p = layout(long, { version: 'v3', seed: 4 }).placed
    validV3(p) // the base validator's canonical-containment check runs on every node
    for (const n of nodes(p)) if (n.kind === 'shelf' && n.meta?.segment) for (const b of n.children) expect(b.path.startsWith(n.path + '\\')).toBe(true)
  })

  it('places rooms side by side only within one building row: entrance walks reach the street or plaza', () => {
    const p = layout(demoHierarchy(), { version: 'v3', seed: 1 }).placed
    for (const n of nodes(p)) if (n.kind === 'campus') for (const w of (n.meta!.walks as (Rect | null)[])) if (w) expect(n.regions.some((g) => ['street', 'courtyard', 'plaza'].includes(g.role) && Math.abs(g.rect.y - bottom(w)) < 1e-6)).toBe(true)
  })
})
