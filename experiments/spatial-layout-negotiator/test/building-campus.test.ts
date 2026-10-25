import { describe, expect, it } from 'vitest'
import type { RowContainerPlan } from '../src/designers/rowContainer.ts'
import type { BuildingNode, CampusNode } from '../src/model.ts'
import { rng } from '../src/rng.ts'
import { room } from '../src/synth.ts'
import { at, byKey, measureOnly, SIZES, valid } from './helpers.ts'

const path = 'C:\\A\\Clients'

/** Three rooms whose measured offers need clearly different minimum depths. */
function threeRooms(): BuildingNode {
  const r = rng(31)
  return {
    kind: 'building', name: 'Clients', path, files: [],
    rooms: [room(path, 'Front desk', [], 3, r), room(path, 'Archive', ['2022', '2023', '2024', '2025'], 2, r, [10, 24]), room(path, 'Records', ['Agreements', 'Orders'], 26, r)],
  }
}

describe('Designer C — Building', () => {
  it('ACCEPTANCE: three rooms with different minimum depths share one depth, without re-measuring', () => {
    const { ctx, m } = measureOnly(threeRooms())
    const smallest = m.children.map((k) => Math.min(...k.offers.map((o) => o.d)))
    expect(new Set(smallest.map((d) => d.toFixed(3))).size).toBe(3)
    const o = byKey(m, 'rooms/row=3')
    const explored = ctx.stats.explored
    for (const [sx, sy] of SIZES) {
      const p = at(ctx, m, o, sx, sy)
      valid(p)
      const rooms = p.children
      expect(rooms).toHaveLength(3)
      expect(new Set(rooms.map((x) => x.rect.y.toFixed(9))).size).toBe(1)
      expect(new Set(rooms.map((x) => x.rect.d.toFixed(9))).size).toBe(1)
      rooms.forEach((x, i) => {
        expect(x.rect.d).toBeGreaterThanOrEqual(x.min.d - 1e-9)
        expect(m.children[i].offers.map((q) => q.key)).toContain(x.offerKey)
      })
    }
    // Growing never searched again.
    expect(ctx.stats.explored).toBe(explored)
  })

  it('measures one, two, three … rooms per row, without duplicates', () => {
    const { m } = measureOnly(threeRooms())
    expect(m.offers.map((o) => (o.plan as RowContainerPlan).perRow).sort()).toEqual([1, 2, 3])
    expect(new Set(m.offers.map((o) => `${o.w.toFixed(4)}x${o.d.toFixed(4)}`)).size).toBe(m.offers.length)
  })

  it('puts the building\'s own loose files in a files room in the first row', () => {
    const b = { ...threeRooms(), files: ['a.pdf', 'b.xlsx', 'c.docx'] }
    const { ctx, m } = measureOnly(b)
    for (const o of m.offers) {
      const p = at(ctx, m, o, 1.3, 1.2)
      valid(p)
      const first = p.children[0]
      expect(first.synthetic).toBe(true)
      expect(first.path).toBe(b.path)
      expect(p.rules.rowGroups![0]).toContain(0)
    }
  })

  it('keeps 20% of each surplus for walls and corridors and passes 80% to the rooms', () => {
    const { ctx, m } = measureOnly(threeRooms())
    const o = byKey(m, 'rooms/row=3')
    const a = at(ctx, m, o)
    const b = at(ctx, m, o, 1.5, 1.4)
    const sumW = (p: typeof a) => p.children.reduce((s, x) => s + x.rect.w, 0)
    expect(sumW(b) - sumW(a)).toBeCloseTo(0.8 * (b.rect.w - a.rect.w), 9)
    expect(b.children[0].rect.d - a.children[0].rect.d).toBeCloseTo(0.8 * (b.rect.d - a.rect.d), 9)
  })

  it('handles empty, single-room and many identical rooms', () => {
    const empty: BuildingNode = { kind: 'building', name: 'Empty', path, rooms: [], files: [] }
    const single: BuildingNode = { kind: 'building', name: 'One', path, rooms: [room(path, 'Only', ['x'], 2, rng(1))], files: [] }
    const many: BuildingNode = { kind: 'building', name: 'Many', path, files: [], rooms: Array.from({ length: 20 }, (_, i) => room(path, `R${i}`, ['a', 'b'], 4, rng(9))) }
    for (const b of [empty, single, many]) {
      const { ctx, m } = measureOnly(b)
      expect(m.offers.length).toBeGreaterThan(0)
      expect(m.offers.length).toBeLessThanOrEqual(ctx.cfg.maxOffers)
      for (const o of m.offers) for (const [sx, sy] of SIZES) valid(at(ctx, m, o, sx, sy))
    }
  })
})

describe('Designer D — Campus', () => {
  const r = rng(77)
  const bld = (name: string, rooms: number): BuildingNode => ({ kind: 'building', name, path: `C:\\Camp\\${name}`, files: [], rooms: Array.from({ length: rooms }, (_, i) => room(`C:\\Camp\\${name}`, `Room ${i}`, Array.from({ length: (i % 3) + 1 }, (_, s) => `S${s}`), i % 4, r)) })
  const camp: CampusNode = { kind: 'campus', name: 'Camp', path: 'C:\\Camp', files: ['overview.pdf'], buildings: [bld('A', 2), bld('B', 6), bld('C', 3), bld('D', 1), bld('E', 4)] }

  it('aligns buildings in each east–west row and keeps paths, streets and boundary', () => {
    const { ctx, m } = measureOnly(camp)
    for (const o of m.offers) for (const [sx, sy] of SIZES) {
      const p = at(ctx, m, o, sx, sy)
      valid(p)
      for (const g of p.rules.rowGroups!) expect(new Set(g.map((i) => `${p.children[i].rect.y.toFixed(9)}/${p.children[i].rect.d.toFixed(9)}`)).size).toBe(1)
    }
  })

  it('offers several proportions, puts the file building first, and includes the courtyard in the minimum', () => {
    const { ctx, m } = measureOnly(camp)
    const aspects = m.offers.map((o) => o.w / o.d)
    expect(m.offers.length).toBeGreaterThanOrEqual(3)
    expect(Math.max(...aspects) / Math.min(...aspects)).toBeGreaterThan(4)
    for (const o of m.offers) {
      const p = at(ctx, m, o)
      expect(p.children[0].synthetic).toBe(true)
      const rows = (o.plan as RowContainerPlan).rowCount
      const yard = p.regions.find((x) => x.role === 'courtyard')
      if (rows >= 2) expect(yard!.rect.d).toBeGreaterThanOrEqual(ctx.cfg.campus.courtyard - 1e-9)
      else expect(yard).toBeUndefined()
    }
  })

  it('grows recursively: the campus keeps 20%, buildings and rooms keep theirs', () => {
    const { ctx, m } = measureOnly(camp)
    const p = at(ctx, m, m.offers[0], 3, 2)
    valid(p)
    for (const n of [p, ...p.children, ...p.children.flatMap((b) => b.children)]) {
      if (n.ledger.x.surplus > 1e-6) expect(n.ledger.x.absorbed / n.ledger.x.surplus).toBeGreaterThanOrEqual(0.2 - 1e-9)
    }
  })

  it('handles an empty campus', () => {
    const { ctx, m } = measureOnly({ kind: 'campus', name: 'E', path: 'C:\\E', files: [], buildings: [] })
    valid(at(ctx, m, m.offers[0], 2, 2))
  })
})
