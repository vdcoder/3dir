import { describe, expect, it } from 'vitest'
import type { Blueprint } from '../src/designers/area.ts'
import type { AreaNode, BuildingNode } from '../src/model.ts'
import { rng } from '../src/rng.ts'
import { demoHierarchy, room } from '../src/synth.ts'
import { nodes } from '../src/validate.ts'
import { at, measureOnly, SIZES, valid } from './helpers.ts'

const building = (parent: string, name: string, rooms: number, seed: number): BuildingNode => ({
  kind: 'building', name, path: `${parent}\\${name}`, files: [],
  rooms: Array.from({ length: rooms }, (_, i) => room(`${parent}\\${name}`, `Room ${i + 1}`, Array.from({ length: 1 + (i % 2) }, (_, s) => `S${s}`), 2, rng(seed + i))),
})

const area = (name = 'District', n = 6): AreaNode => ({
  kind: 'area', name, path: `C:\\${name}`, children: Array.from({ length: n }, (_, i) => building(`C:\\${name}`, `B${i + 1}`, 1 + (i % 4), i)),
})

describe('Designer E — Area', () => {
  it('is deterministic for a seed, and different seeds explore different packings', () => {
    const a = measureOnly(area(), { seed: 3 }).m.offers
    const b = measureOnly(area(), { seed: 3 }).m.offers
    const c = measureOnly(area(), { seed: 4 }).m.offers
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c))
  })

  it('runs exactly the configured number of attempts (10, 100, 1000)', () => {
    const kids = area().children.reduce((s, c) => s + measureOnly(c).ctx.stats.explored, 0)
    for (const attempts of [10, 100, 1000]) {
      const { ctx } = measureOnly(area(), { attempts })
      // Everything explored beyond the children's own small families is the area's attempts.
      expect(ctx.stats.explored - kids).toBe(attempts)
    }
  })

  it('places children without rotation, at the size of the offer it chose', () => {
    const { ctx, m } = measureOnly(area())
    for (const o of m.offers) {
      const p = at(ctx, m, o)
      const bp = o.plan as Blueprint
      for (const pl of bp.placements) {
        const kid = p.children[pl.child]
        expect(kid.rect.w).toBeCloseTo(pl.w, 9)
        expect(kid.rect.d).toBeCloseTo(pl.d, 9)
        expect(m.children[pl.child].offers.find((x) => x.key === pl.key)!.w).toBeCloseTo(pl.w, 9)
      }
    }
  })

  it('grows a saved blueprint without searching again, keeping order and clearances', () => {
    const { ctx, m } = measureOnly(area())
    const o = m.offers[0]
    const explored = ctx.stats.explored
    const order = (p: ReturnType<typeof at>, axis: 'x' | 'y') => p.children.map((k, i) => ({ i, v: k.rect[axis] })).sort((a, b) => a.v - b.v || a.i - b.i).map((x) => x.i).join(',')
    const base = at(ctx, m, o)
    for (const [sx, sy] of SIZES) {
      const p = at(ctx, m, o, sx, sy)
      valid(p)
      expect(order(p, 'x')).toBe(order(base, 'x'))
      expect(order(p, 'y')).toBe(order(base, 'y'))
      // Every child grows by the same factor on each axis (80% of the surplus, in proportion to size).
      const fx = p.children.map((k) => k.rect.w / k.min.w)
      const fy = p.children.map((k) => k.rect.d / k.min.d)
      expect(Math.max(...fx) - Math.min(...fx)).toBeLessThan(1e-9)
      expect(Math.max(...fy) - Math.min(...fy)).toBeLessThan(1e-9)
      expect(p.ledger.x.absorbed).toBeCloseTo(0.2 * p.ledger.x.surplus, 9)
    }
    expect(ctx.stats.explored).toBe(explored)
  })

  it('negotiates eight children with ten candidate offers each', () => {
    const big = (i: number): BuildingNode => building('C:\\Ten', `Ten${i}`, 10, 100 + i)
    const node: AreaNode = { kind: 'area', name: 'Ten', path: 'C:\\Ten', children: Array.from({ length: 8 }, (_, i) => big(i)) }
    const t0 = performance.now()
    const { ctx, m } = measureOnly(node, { cfg: { maxOffers: 10, keepDominated: true }, attempts: 100 })
    const ms = performance.now() - t0
    expect(m.children.every((k) => k.offers.length === 10)).toBe(true)
    // Different attempts really use different child offers.
    const used = new Set(m.offers.flatMap((o) => (o.plan as Blueprint).placements.map((p) => `${p.child}:${p.key}`)))
    expect(used.size).toBeGreaterThan(8)
    for (const o of m.offers) for (const [sx, sy] of [[1, 1], [2, 1.5]] as const) valid(at(ctx, m, o, sx, sy))
    expect(ms).toBeLessThan(5000)
  })

  it('keeps narrow, square and wide blueprints when they exist', () => {
    const { m } = measureOnly(area('Spread', 8), { attempts: 200 })
    const aspects = m.offers.map((o) => o.w / o.d)
    expect(m.offers.length).toBeGreaterThanOrEqual(3)
    expect(Math.max(...aspects) / Math.min(...aspects)).toBeGreaterThan(1.3)
  })

  it('lays out deeply nested areas with real canonical containment and one separator family per level', () => {
    // Five nested areas, each holding the next plus a building.
    let inner: AreaNode = area('L4', 2)
    for (let l = 3; l >= 0; l--) {
      const path = `C:\\L${l}`
      const rebase = (n: AreaNode, p: string): AreaNode => ({ ...n, path: p, children: n.children.map((c) => (c.kind === 'area' ? rebase(c, `${p}\\${c.name}`) : { ...c, path: `${p}\\${c.name}`, rooms: (c as BuildingNode).rooms.map((r) => ({ ...r, path: `${p}\\${c.name}\\${r.name}`, shelves: r.shelves.map((s) => ({ ...s, path: `${p}\\${c.name}\\${r.name}\\${s.name}` })) })) } as BuildingNode)) })
      inner = rebase({ kind: 'area', name: `L${l}`, path, children: [inner, building(path, `Own${l}`, 2, l)] }, path)
    }
    const { ctx, m } = measureOnly(inner)
    const p = at(ctx, m, m.offers[0], 1.4, 1.2)
    valid(p) // includes canonical containment of every node
    const areas = [...nodes(p)].filter((n) => n.kind === 'area')
    expect(areas).toHaveLength(5)
    const fam = areas.map((a) => `${a.meta!.level}:${a.meta!.family}`)
    expect(fam).toEqual(['0:highway', '1:street', '2:path', '3:hedge', '4:hedge'])
  })

  it('handles empty, single-child and mixed small/large children', () => {
    const empty: AreaNode = { kind: 'area', name: 'E', path: 'C:\\E', children: [] }
    const single = area('One', 1)
    const mixed: AreaNode = { kind: 'area', name: 'Mixed', path: 'C:\\Mixed', children: [building('C:\\Mixed', 'Huge', 24, 1), building('C:\\Mixed', 'Tiny', 1, 2), building('C:\\Mixed', 'Small', 2, 3)] }
    for (const n of [empty, single, mixed]) {
      const { ctx, m } = measureOnly(n)
      for (const [sx, sy] of SIZES) valid(at(ctx, m, m.offers[0], sx, sy))
    }
  })

  it('favours the most important child near the front', () => {
    const h = demoHierarchy()
    const { m } = measureOnly(h)
    const bp = m.offers[0].plan as Blueprint
    const docs = bp.placements.find((p) => m.children[p.child].node.name === 'Documents')!
    expect(docs.y + docs.d / 2).toBeGreaterThan(bp.d / 2)
  })
})
