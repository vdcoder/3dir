// Designer E — Area (geographic absorber). The only designer that searches at
// random, and only while measuring: each seeded attempt orders the children,
// picks one offer per child, and places them first-fit on an X/Y marking grid
// with a separator of width P around every child (the paths between them),
// enlarging the container when a child does not fit. The best distinct
// attempts are saved as blueprints. Growth reuses a blueprint: it stretches
// the area's x and y axes monotonically, so order, adjacency and clearances
// are kept; 20% of each axis' surplus widens the area's own boundary and
// separators, 80% widens the children (each in proportion to its size).

import { EPS, freeRects, rect, right, bottom } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import type { AreaNode, LayoutNode } from '../model.ts'
import { ledger, offerByKey } from '../protocol.ts'
import type { AxisLedger, Ctx, Designer, Measured, Obj, Offer, Placed, Region } from '../protocol.ts'
import { hash, rng, shuffle } from '../rng.ts'

export interface Placement { child: number; key: string; x: number; y: number; w: number; d: number }

export interface Blueprint {
  attempt: number
  seed: number
  /** Nesting level among areas (0 = outermost). */
  level: number
  order: number[]
  /** Separator family between siblings at this level. */
  family: string
  P: number
  /** Boundary band widths: sides and rear, and the front band (sign + entrance). */
  B: number
  front: number
  w: number
  d: number
  placements: Placement[]
  fill: number
}

/** An X/Y marking grid on the coordinates where something starts or ends. */
class MarkGrid {
  xs: number[] = [0]
  ys: number[] = [0]
  cells: boolean[][] = [[false]]
  rects: Rect[] = []
  W: number
  D: number
  constructor(W: number, D: number) { this.W = W; this.D = D; this.rebuild() }
  rebuild() {
    this.xs = [...new Set([0, this.W, ...this.rects.flatMap((r) => [r.x, right(r)])])].sort((a, b) => a - b)
    this.ys = [...new Set([0, this.D, ...this.rects.flatMap((r) => [r.y, bottom(r)])])].sort((a, b) => a - b)
    this.cells = this.ys.slice(0, -1).map((y0, j) => this.xs.slice(0, -1).map((x0, i) => {
      const cx = (x0 + this.xs[i + 1]) / 2
      const cy = (y0 + this.ys[j + 1]) / 2
      return this.rects.some((r) => cx > r.x && cx < right(r) && cy > r.y && cy < bottom(r))
    }))
  }
  mark(r: Rect) { this.rects.push(r); this.rebuild() }
  resize(W: number, D: number) { this.W = W; this.D = D; this.rebuild() }
  /** Scan row by row (north to south, west to east) for the first free spot on the grid. */
  firstFit(w: number, d: number): { x: number; y: number } | null {
    for (let j = 0; j < this.ys.length; j++) {
      const y = this.ys[j]
      if (y + d > this.D + EPS) break
      for (let i = 0; i < this.xs.length; i++) {
        const x = this.xs[i]
        if (x + w > this.W + EPS) break
        if (this.freeFrom(i, j, x + w, y + d)) return { x, y }
      }
    }
    return null
  }
  /** Are all cells from grid line (i, j) up to (x1, y1) unmarked? */
  freeFrom(i0: number, j0: number, x1: number, y1: number): boolean {
    for (let j = j0; j + 1 < this.ys.length && this.ys[j] < y1 - EPS; j++) {
      for (let i = i0; i + 1 < this.xs.length && this.xs[i] < x1 - EPS; i++) if (this.cells[j][i]) return false
    }
    return true
  }
}

export const familyOf = (ctx: Ctx, level: number) => {
  const s = ctx.cfg.area.separators
  return s[Math.min(level, s.length - 1)]
}

/** How many areas enclose the one being measured (siblings share a level, hence a separator family). */
const levelOf = (ctx: Ctx) => ctx.ancestors.filter((a) => a.kind === 'area').length

const importanceOf = (n: LayoutNode) => ('importance' in n ? n.importance ?? 0 : 0)

function attempt(node: AreaNode, kids: Measured[], ctx: Ctx, a: number, level: number): Blueprint {
  const c = ctx.cfg.area
  const fam = familyOf(ctx, level)
  const P = fam.width
  const seed = hash(`${ctx.seed}|${node.path}|${a}`)
  const r = rng(seed)
  const idx = kids.map((_, i) => i)
  // Attempt 0 is the "sensible" one: most important first, then largest, each child's most compact offer.
  const order = a === 0
    ? [...idx].sort((i, j) => importanceOf(kids[j].node) - importanceOf(kids[i].node) || minArea(kids[j].offers) - minArea(kids[i].offers) || i - j)
    : shuffle(idx, r)
  const pick = kids.map((k) => (a === 0 ? smallest(k.offers) : k.offers[Math.floor(r() * k.offers.length)]))
  const aspect = a === 0 ? 1.2 : Math.exp((r() - 0.5) * 1.2)
  const inflated = pick.map((o) => ({ w: o.w + P, d: o.d + P }))
  const total = inflated.reduce((s, o) => s + o.w * o.d, 0)
  let W = Math.max(Math.sqrt(total * aspect), ...inflated.map((o) => o.w), 0)
  let D = Math.max(total / Math.max(W, EPS), ...inflated.map((o) => o.d), 0)
  const grid = new MarkGrid(W, D)
  const placements: Placement[] = []
  for (const i of order) {
    const s = inflated[i]
    let spot = grid.firstFit(s.w, s.d)
    while (!spot) {
      // Enlarge the containing rectangle toward the balanced proportion.
      const wider = { W: W + s.w, D: Math.max(D, s.d) }
      const deeper = { W: Math.max(W, s.w), D: D + s.d }
      const off = (x: { W: number; D: number }) => Math.abs(Math.log(x.W / x.D / aspect))
      const next = off(wider) < off(deeper) - EPS || (Math.abs(off(wider) - off(deeper)) <= EPS && wider.W * wider.D <= deeper.W * deeper.D) ? wider : deeper
      W = next.W; D = next.D
      grid.resize(W, D)
      spot = grid.firstFit(s.w, s.d)
    }
    grid.mark(rect(spot.x, spot.y, s.w, s.d))
    placements.push({ child: i, key: pick[i].key, x: spot.x, y: spot.y, w: pick[i].w, d: pick[i].d })
  }
  // Shrink to what is used; then frame it with the boundary band and the front (sign + entrance) band.
  const usedW = Math.max(0, ...grid.rects.map(right))
  const usedD = Math.max(0, ...grid.rects.map(bottom))
  const B = c.boundary
  const front = c.signBand
  // The front band must hold the sign beside the gate.
  const minW = 2 * (B + c.sign.w + 1) + 6
  const w = Math.max(minW, 2 * B + usedW)
  const d = Math.max(B + front + 2, B + usedD + front)
  const fill = pick.reduce((s, o) => s + o.w * o.d, 0) / (w * d)
  return {
    attempt: a, seed, level, order, family: fam.name, P, B, front, w, d, fill,
    // Child rectangles in area coordinates: inside the boundary, half a separator in from their cell.
    placements: placements.map((p) => ({ ...p, x: B + p.x + P / 2, y: B + p.y + P / 2 })),
  }
}

const minArea = (offers: Offer[]) => Math.min(...offers.map((o) => o.w * o.d))
const smallest = (offers: Offer[]) => offers.reduce((m, o) => (o.w * o.d < m.w * m.d ? o : m))

function score(bp: Blueprint, kids: Measured[]): number {
  let s = bp.fill - 0.15 * Math.abs(Math.log(bp.w / bp.d / 1.2))
  // Prominence: the most important child is favoured near the front and the middle.
  const lead = kids.map((k, i) => ({ i, imp: importanceOf(k.node) })).filter((x) => x.imp > 0).sort((a, b) => b.imp - a.imp)[0]
  if (lead) {
    const p = bp.placements.find((x) => x.child === lead.i)!
    s += 0.12 * ((p.y + p.d / 2) / bp.d) + 0.06 * (1 - Math.abs((p.x + p.w / 2) / bp.w - 0.5) * 2)
  }
  return s
}

const signature = (bp: Blueprint) => `${bp.w.toFixed(1)}x${bp.d.toFixed(1)}|` + [...bp.placements].sort((a, b) => a.child - b.child).map((p) => `${p.child}:${p.key}@${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(';')

/** Children never overlap and keep the separator between them and to the boundary. */
function valid(bp: Blueprint): boolean {
  const rs = bp.placements.map((p) => rect(p.x, p.y, p.w, p.d))
  for (let i = 0; i < rs.length; i++) {
    const a = rs[i]
    if (a.x < bp.B + bp.P / 2 - EPS || a.y < bp.B + bp.P / 2 - EPS || right(a) > bp.w - bp.B - bp.P / 2 + EPS || bottom(a) > bp.d - bp.front - bp.P / 2 + EPS) return false
    for (let j = i + 1; j < rs.length; j++) {
      const b = rs[j]
      const dx = Math.max(b.x - right(a), a.x - right(b))
      const dy = Math.max(b.y - bottom(a), a.y - bottom(b))
      if (Math.max(dx, dy) < bp.P - EPS) return false
    }
  }
  return true
}

export const areaDesigner: Designer<AreaNode> = {
  children: (node) => node.children,

  measure(node, kids, ctx) {
    const c = ctx.cfg.area
    const level = node.level ?? levelOf(ctx)
    const n = Math.max(1, kids.length === 0 ? 1 : c.attempts)
    const found = new Map<string, { bp: Blueprint; score: number }>()
    for (let a = 0; a < n; a++) {
      ctx.explore()
      const bp = attempt(node, kids, ctx, a, level)
      if (!valid(bp)) { ctx.stats.infeasible++; continue }
      const sig = signature(bp)
      if (!found.has(sig)) found.set(sig, { bp, score: score(bp, kids) })
    }
    // Keep the best few distinct blueprints, making sure narrow, square and wide ones all survive.
    const ranked = [...found.values()].sort((x, y) => y.score - x.score || x.bp.attempt - y.bp.attempt)
    const keep: typeof ranked = []
    const bucket = (bp: Blueprint) => (bp.w / bp.d < 0.85 ? 'narrow' : bp.w / bp.d > 1.4 ? 'wide' : 'square')
    for (const b of ['square', 'narrow', 'wide']) { const best = ranked.find((x) => bucket(x.bp) === b); if (best) keep.push(best) }
    for (const x of ranked) { if (keep.length >= c.keep) break; if (!keep.includes(x)) keep.push(x) }
    keep.sort((x, y) => y.score - x.score)
    return keep.map(({ bp, score: s }) => ({ key: `blueprint#${bp.attempt}`, w: bp.w, d: bp.d, plan: bp, quality: { score: s, fill: bp.fill, aspect: bp.w / bp.d, attempt: bp.attempt } }))
  },

  arrange(m: Measured<AreaNode>, offer, env, ctx): Placed {
    const bp = offer.plan as Blueprint
    const absorb = ctx.cfg.absorb
    const fx = axisMap(0, bp.w, bp.placements.map((p) => [p.x, p.x + p.w]), env.w - bp.w, absorb)
    const fy = axisMap(0, bp.d, bp.placements.map((p) => [p.y, p.y + p.d]), env.d - bp.d, absorb)
    const X = (v: number) => env.x + fx.map(v)
    const Y = (v: number) => env.y + fy.map(v)
    const children: Placed[] = []
    const envs: Rect[] = []
    for (const p of [...bp.placements].sort((a, b) => a.child - b.child)) {
      const e = rect(X(p.x), Y(p.y), X(p.x + p.w) - X(p.x), Y(p.y + p.d) - Y(p.y))
      const kid = m.children[p.child]
      envs.push(e)
      children.push(ctx.arrange(kid, offerByKey(kid, p.key), e))
    }
    // Own space: the boundary ring, the front band, and the separators between children.
    const inner = rect(X(bp.B), Y(bp.B), X(bp.w - bp.B) - X(bp.B), Y(bp.d - bp.front) - Y(bp.B))
    const regions: Region[] = []
    const band = (r: Rect, role: Region['role'], label: string, axis: 'x' | 'y') => { if (r.w > EPS && r.d > EPS) regions.push({ rect: r, role, label, axis }) }
    band(rect(env.x, env.y, env.w, inner.y - env.y), 'boundary', 'boundary', 'y')
    band(rect(env.x, bottom(inner), env.w, env.y + env.d - bottom(inner)), 'entrance', 'sign & entrance band', 'y')
    band(rect(env.x, inner.y, inner.x - env.x, inner.d), 'boundary', 'boundary', 'x')
    band(rect(right(inner), inner.y, env.x + env.w - right(inner), inner.d), 'boundary', 'boundary', 'x')
    for (const r of freeRects(inner, envs)) regions.push({ rect: r, role: 'separator', label: bp.family, family: bp.family })
    const c = ctx.cfg.area
    const fb = bottom(inner)
    const fd = env.y + env.d - fb
    const gate = Math.min(6, env.w / 3)
    const objects: Obj[] = [
      { rect: rect(env.x + env.w / 2 - gate / 2, env.y + env.d - 0.4, gate, 0.4), kind: 'gate', label: 'entrance', layer: 0 },
      { rect: rect(inner.x, fb + (fd - c.sign.d) / 2, c.sign.w, c.sign.d), kind: 'sign', label: m.node.name, layer: 0, fixed: { ...c.sign } },
    ]
    return {
      kind: 'area', name: m.node.name, path: m.node.path, rect: { ...env }, offerKey: offer.key, min: { w: offer.w, d: offer.d },
      ledger: { x: fx.ledger, y: fy.ledger },
      regions, objects, children,
      rules: { minSep: bp.P, pad: { l: bp.B + bp.P / 2, r: bp.B + bp.P / 2, t: bp.B + bp.P / 2, b: bp.front + bp.P / 2 } },
      meta: { family: bp.family, P: bp.P, attempt: bp.attempt, seed: bp.seed, order: bp.order, level: bp.level },
    }
  },
}

/**
 * A monotone stretch of one axis. Stretches of the axis covered by some child
 * share `1 - absorb` of the surplus (each child grows in proportion to its
 * size); the uncovered stretches (boundary bands, separators) share `absorb`.
 * Because nothing shrinks and order is kept, overlaps and clearances can only
 * stay as they were or improve.
 */
export function axisMap(lo: number, hi: number, spans: [number, number][], surplus: number, absorb: number): { map: (v: number) => number; ledger: AxisLedger } {
  const cuts = [...new Set([lo, hi, ...spans.flat()])].sort((a, b) => a - b)
  const pieces = cuts.slice(0, -1).map((a, i) => {
    const b = cuts[i + 1]
    const mid = (a + b) / 2
    return { a, b, covered: spans.some(([s, e]) => s <= mid && e >= mid) }
  }).filter((p) => p.b - p.a > EPS)
  const covered = pieces.filter((p) => p.covered).reduce((s, p) => s + (p.b - p.a), 0)
  const open = pieces.filter((p) => !p.covered).reduce((s, p) => s + (p.b - p.a), 0)
  const own = covered <= EPS ? surplus : open <= EPS ? 0 : absorb * surplus
  const pass = surplus - own
  const out = pieces.map((p) => ({ ...p, grow: ((p.b - p.a) / (p.covered ? covered : open)) * (p.covered ? pass : own) }))
  const map = (v: number) => {
    let shift = 0
    for (const p of out) {
      if (v >= p.b - EPS) { shift += p.grow; continue }
      if (v > p.a) shift += p.grow * ((v - p.a) / (p.b - p.a))
      break
    }
    return v + shift
  }
  return { map, ledger: ledger(hi - lo, hi - lo + surplus, own) }
}
