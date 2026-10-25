import { describe, expect, it } from 'vitest'
import type { RoomPlan } from '../src/designers/room.ts'
import { rng } from '../src/rng.ts'
import { room } from '../src/synth.ts'
import { at, measureOnly, SIZES, valid } from './helpers.ts'

const r = () => rng(5)

describe('Designer B — Room', () => {
  const node = room('C:\\A', 'Budgets', ['2025', '2026', '2027', 'Old'], 14, r(), [3, 20])

  it('measures a family from one shelf per row up to all shelves in one row', () => {
    const { m } = measureOnly(node)
    const perRow = m.offers.map((o) => (o.plan as RoomPlan).perRow)
    expect(perRow).toContain(1)
    expect(perRow).toContain(4)
    expect(new Set(perRow).size).toBeGreaterThanOrEqual(3)
    // Real alternatives: proportions differ from narrow to wide.
    const aspects = m.offers.map((o) => o.w / o.d)
    expect(Math.max(...aspects) / Math.min(...aspects)).toBeGreaterThan(3)
  })

  it('gives every shelf in the room identical dimensions, at every size', () => {
    const { ctx, m } = measureOnly(node)
    for (const o of m.offers) for (const [sx, sy] of SIZES) {
      const p = at(ctx, m, o, sx, sy)
      valid(p) // includes the uniform-shelf, row-alignment, clearance and accounting checks
      const shelves = p.children.filter((k) => k.kind === 'shelf')
      expect(new Set(shelves.map((s) => s.rect.w.toFixed(9))).size).toBe(1)
      const widest = Math.max(...m.children.map((k) => k.offers.find((x) => x.key === 'packed')!.w))
      expect(shelves[0].rect.w).toBeGreaterThanOrEqual(widest - 1e-9)
    }
  })

  it('keeps the shelf rows and their grouping when it grows', () => {
    const { ctx, m } = measureOnly(node)
    const o = m.offers.find((x) => (x.plan as RoomPlan).perRow === 2)!
    const rowsAt = (sx: number, sy: number) => {
      const p = at(ctx, m, o, sx, sy)
      const ys = [...new Set(p.children.filter((k) => k.kind === 'shelf').map((k) => k.rect.y.toFixed(6)))]
      return { rows: ys.length, order: p.children.map((k) => k.name).join('|') }
    }
    expect(rowsAt(3, 2.5)).toEqual(rowsAt(1, 1))
  })

  it('puts every loose file on the table, and adds desks only when there is room', () => {
    const { ctx, m } = measureOnly(node)
    const o = m.offers[0]
    const small = at(ctx, m, o)
    const table = small.children.find((k) => k.kind === 'table')!
    expect(table.objects.filter((x) => x.kind === 'file')).toHaveLength(14)
    expect(table.objects.some((x) => x.kind === 'desk')).toBe(false)
    const big = at(ctx, m, o, 3, 1.5)
    expect(big.children.find((k) => k.kind === 'table')!.objects.filter((x) => x.kind === 'desk')).toHaveLength(2)
  })

  it('offers a near-square file table when there are no shelves', () => {
    const { ctx, m } = measureOnly(room('C:\\A', 'Scans', [], 20, r()))
    const sq = m.offers.find((o) => o.key.includes('square'))!
    const t = (sq.plan as RoomPlan).table!
    expect(t.cols * t.rows).toBeGreaterThanOrEqual(20)
    expect(Math.abs(t.cols - t.rows)).toBeLessThanOrEqual(1)
    expect(t.cols).toBe(Math.ceil(Math.sqrt(20)))
    valid(at(ctx, m, sq, 1.5, 1.5))
  })

  it('also offers a square table with very few shelves and many files', () => {
    const { m } = measureOnly(room('C:\\A', 'Recipes', ['Family'], 30, r()))
    expect(m.offers.some((o) => o.key.includes('square'))).toBe(true)
  })

  it('handles an empty room and a single-shelf room', () => {
    for (const n of [room('C:\\A', 'Empty', [], 0, r()), room('C:\\A', 'One', ['Only'], 0, r())]) {
      const { ctx, m } = measureOnly(n)
      expect(m.offers.length).toBeGreaterThan(0)
      for (const [sx, sy] of SIZES) valid(at(ctx, m, m.offers[0], sx, sy))
    }
  })

  it('keeps the entrance clearance free and the door in the front wall', () => {
    const { ctx, m } = measureOnly(node)
    const p = at(ctx, m, m.offers[0], 1.4, 1.4)
    const band = p.regions.find((x) => x.role === 'entrance')!
    expect(band.rect.d).toBeGreaterThanOrEqual(1.2 - 1e-9)
    const door = p.objects.find((x) => x.kind === 'door')!
    expect(door.rect.y + door.rect.d).toBeCloseTo(p.rect.y + p.rect.d, 9)
  })
})
