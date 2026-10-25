import { describe, expect, it } from 'vitest'
import { arrangeAt, createContext, layout } from '../src/engine.ts'
import { rect } from '../src/geometry.ts'
import { InfeasibleError } from '../src/protocol.ts'
import type { Placed } from '../src/protocol.ts'
import { demoHierarchy, syntheticHierarchy } from '../src/synth.ts'
import { nodes, validate } from '../src/validate.ts'
import { SIZES, valid } from './helpers.ts'

describe('Two-pass protocol', () => {
  it('produces identical results for identical inputs and seeds', () => {
    const a = layout(demoHierarchy(), { seed: 9, scale: { x: 1.7, y: 1.3 } })
    const b = layout(demoHierarchy(), { seed: 9, scale: { x: 1.7, y: 1.3 } })
    expect(JSON.stringify(a.placed)).toBe(JSON.stringify(b.placed))
    // Everything but wall-clock timings is identical.
    const noTime = (x: typeof a.ctx.stats) => JSON.stringify(x, (k, v) => (k === 'ms' ? undefined : v))
    expect(noTime(a.ctx.stats)).toBe(noTime(b.ctx.stats))
  })

  it('never searches while arranging, and is valid at many allocation sizes', () => {
    const ctx = createContext({ seed: 2 })
    const m = ctx.measure(demoHierarchy())
    const explored = ctx.stats.explored
    for (const o of m.offers) for (const [sx, sy] of SIZES) valid(arrangeAt(m, o, ctx, { w: o.w * sx, d: o.d * sy }))
    expect(ctx.stats.explored).toBe(explored)
    // A designer that tried to search during ARRANGE would be stopped.
    ctx.phase = 'arrange'
    expect(() => ctx.explore()).toThrow(/during ARRANGE/)
    expect(() => ctx.measure(demoHierarchy())).toThrow(/MEASURE called during ARRANGE/)
  })

  it('refuses an allocation smaller than the selected minimum', () => {
    const ctx = createContext()
    const m = ctx.measure(demoHierarchy())
    const o = m.offers[0]
    expect(() => arrangeAt(m, o, ctx, { w: o.w - 0.01, d: o.d })).toThrow(InfeasibleError)
    expect(() => arrangeAt(m, o, ctx, { w: o.w, d: o.d * 0.99 })).toThrow(/smaller than the selected minimum/)
  })

  it('rejects impossible configuration values', () => {
    expect(() => createContext({ cfg: { absorb: -0.1 } })).toThrow(/Invalid configuration/)
    expect(() => createContext({ cfg: { absorb: 1.5 } })).toThrow(/absorb/)
  })

  it('distributes a very large surplus across all five levels, 20% kept at each', () => {
    const r = layout(demoHierarchy(), { scale: { x: 10, y: 8 } })
    valid(r.placed)
    const kinds = new Set<string>()
    for (const n of nodes(r.placed)) {
      if (n.kind === 'book' || n.kind === 'table') continue
      for (const l of [n.ledger.x, n.ledger.y]) if (l.surplus > 1e-6) {
        kinds.add(n.kind)
        expect(l.absorbed).toBeGreaterThanOrEqual(0.2 * l.surplus - 1e-6)
        expect(l.absorbed + l.passed).toBeCloseTo(l.surplus, 6)
      }
    }
    expect([...kinds].sort()).toEqual(['area', 'building', 'campus', 'room', 'shelf'])
  })

  it('handles significant extra width only, extra depth only, and unequal expansion', () => {
    for (const scale of [{ x: 3, y: 1 }, { x: 1, y: 3 }, { x: 1.2, y: 5 }]) valid(layout(demoHierarchy(), { scale }).placed)
  })

  it('works for synthetic hierarchies of 10, 100 and 1000 containers', () => {
    for (const n of [10, 100, 1000]) {
      const { root } = syntheticHierarchy(n, 1)
      valid(layout(root, { scale: { x: 1.3, y: 1.2 } }).placed)
    }
  })

  it('respects a different growth constant (absorb = 0.5)', () => {
    const r = layout(demoHierarchy(), { cfg: { absorb: 0.5 }, scale: { x: 2, y: 2 } })
    valid(r.placed, 0.5)
    expect(r.placed.ledger.x.absorbed).toBeCloseTo(0.5 * r.placed.ledger.x.surplus, 6)
  })
})

describe('The validator catches broken layouts', () => {
  const fresh = () => layout(demoHierarchy(), { scale: { x: 1.3, y: 1.2 } }).placed
  const first = (p: Placed, kind: string) => [...nodes(p)].find((n) => n.kind === kind)!
  /** A building with at least one row of two or more rooms. */
  const rowBuilding = (p: Placed) => [...nodes(p)].find((n) => n.kind === 'building' && n.rules.rowGroups!.some((g) => g.length > 1))!
  const checks = (p: Placed) => new Set(validate(p, 0.2).map((v) => v.check))

  it('overlapping siblings', () => {
    const p = fresh()
    const b = rowBuilding(p)
    b.children[1].rect = { ...b.children[0].rect }
    expect(checks(p)).toContain('overlap')
  })
  it('an allocation below the minimum', () => {
    const p = fresh()
    const r = first(p, 'room')
    r.rect = { ...r.rect, w: r.min.w - 0.5 }
    expect(checks(p)).toContain('min-size')
  })
  it('space that is not accounted for', () => {
    const p = fresh()
    first(p, 'campus').regions.pop()
    expect(checks(p)).toContain('accounting')
  })
  it('a broken row alignment', () => {
    const p = fresh()
    const b = rowBuilding(p)
    const g = b.rules.rowGroups!.find((x) => x.length > 1)!
    b.children[g[1]].rect = { ...b.children[g[1]].rect, y: b.children[g[1]].rect.y + 0.1 }
    expect(checks(p)).toContain('row-alignment')
  })
  it('a resized book', () => {
    const p = fresh()
    const book = first(p, 'book')
    book.objects[0].rect = { ...book.objects[0].rect, w: book.objects[0].rect.w * 1.5 }
    expect(checks(p)).toContain('fixed-size')
  })
  it('a child outside its parent and a non-canonical path', () => {
    const p = fresh()
    const c = first(p, 'campus')
    c.rect = rect(p.rect.x + p.rect.w + 5, c.rect.y, c.rect.w, c.rect.d)
    c.path = 'C:\\Elsewhere'
    const found = checks(p)
    expect(found).toContain('containment')
    expect(found).toContain('canonical')
  })
  it('a violated clearance and a dishonest ledger', () => {
    const p = fresh()
    const r = first(p, 'room')
    r.ledger.x = { ...r.ledger.x, absorbed: 0, passed: r.ledger.x.surplus }
    const a = p
    a.rules.minSep = 1e6
    const found = checks(p)
    expect(found).toContain('ledger')
    expect(found).toContain('clearance')
  })
})
