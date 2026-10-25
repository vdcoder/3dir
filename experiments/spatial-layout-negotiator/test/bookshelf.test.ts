import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { InfeasibleError } from '../src/protocol.ts'
import { shelfFromAverage } from '../src/model.ts'
import type { ShelfNode } from '../src/model.ts'
import { at, measureOnly, SIZES, valid } from './helpers.ts'

const c = DEFAULT_CONFIG.shelf
const shelf = (widths: number[]): ShelfNode => ({ kind: 'shelf', name: 'S', path: 'C:\\A\\S', books: widths.map((w, i) => ({ name: `b${i}`, w })) })

describe('Designer A — Bookshelf', () => {
  it('minimum length = books + shelf body + minimum spacing + minimum breathing room', () => {
    const widths = [0.05, 0.08, 0.04, 0.06, 0.07, 0.05, 0.09, 0.03, 0.06, 0.05]
    const { m } = measureOnly(shelf(widths))
    const packed = m.offers.find((o) => o.key === 'packed')!
    const expected = widths.reduce((s, w) => s + w, 0) + 2 * c.side + c.spacing * (widths.length - 1) + c.breathing
    expect(packed.w).toBeCloseTo(Math.max(expected, c.minLength), 9)
    expect(packed.d).toBe(c.depth)
  })

  it('uses N × average width when only an average is known', () => {
    const { m } = measureOnly(shelfFromAverage('Avg', 'C:\\A\\Avg', 30, 0.05))
    const packed = m.offers.find((o) => o.key === 'packed')!
    expect(packed.w).toBeCloseTo(30 * 0.05 + 2 * c.side + c.spacing * 29 + c.breathing, 9)
  })

  it('offers real alternative arrangements, not one arrangement stretched', () => {
    const { ctx, m } = measureOnly(shelf([0.05, 0.06, 0.07, 0.05, 0.06, 0.04]))
    expect(m.offers.map((o) => o.key).sort()).toEqual(['display', 'packed', 'roomy'])
    const display = at(ctx, m, m.offers.find((o) => o.key === 'display')!)
    expect(display.regions.some((r) => r.role === 'display')).toBe(true)
    const roomy = at(ctx, m, m.offers.find((o) => o.key === 'roomy')!)
    const packed = at(ctx, m, m.offers.find((o) => o.key === 'packed')!)
    const gaps = (p: typeof roomy) => p.regions.filter((r) => r.role === 'spacing').map((r) => r.rect.w)
    expect(Math.min(...gaps(roomy))).toBeGreaterThan(Math.max(...gaps(packed)))
  })

  it('grows in length only; books keep their size; extra depth is front clearance', () => {
    const widths = [0.05, 0.08, 0.04, 0.06]
    const { ctx, m } = measureOnly(shelf(widths))
    for (const o of m.offers) for (const [sx, sy] of SIZES) {
      const p = at(ctx, m, o, sx, sy)
      valid(p)
      expect((p.meta!.body as { d: number }).d).toBe(c.depth)
      p.children.forEach((b, i) => expect(b.objects[0].rect.w).toBe(widths[i]))
      if (sy > 1) expect(p.regions.find((r) => r.role === 'clearance')!.rect.d).toBeCloseTo(o.d * sy - c.depth, 9)
    }
  })

  it('keeps 20% of the extra length as breathing room and gives 80% to the book slots', () => {
    const widths = [0.05, 0.08, 0.04, 0.06, 0.05]
    const { ctx, m } = measureOnly(shelf(widths))
    const o = m.offers.find((x) => x.key === 'packed')!
    const p = at(ctx, m, o, 2)
    const S = o.w
    const slotGrowth = p.children.reduce((s, b) => s + b.rect.w, 0) - widths.reduce((s, w) => s + w, 0)
    expect(slotGrowth).toBeCloseTo(0.8 * S, 9)
    expect(p.ledger.x.absorbed).toBeCloseTo(0.2 * S, 9)
  })

  it('handles an empty shelf', () => {
    const { ctx, m } = measureOnly(shelf([]))
    expect(m.offers.map((o) => o.key)).toEqual(['packed'])
    expect(m.offers[0].w).toBe(c.minLength)
    valid(at(ctx, m, m.offers[0], 3, 2))
  })

  it('rejects impossible books (zero or negative width)', () => {
    expect(() => measureOnly(shelf([0.05, 0, 0.04]))).toThrow(InfeasibleError)
    expect(() => measureOnly(shelf([0.05, -1]))).toThrow(/no feasible shelf arrangement/)
  })
})
