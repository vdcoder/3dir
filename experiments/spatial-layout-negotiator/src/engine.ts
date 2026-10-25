// Runs the two passes over a hierarchy: measure bottom-up, then arrange
// top-down from the root's chosen offer.

import { DEFAULT_CONFIG, validateConfig } from './config.ts'
import type { Config } from './config.ts'
import { EPS, rect } from './geometry.ts'
import type { Rect } from './geometry.ts'
import type { Kind, LayoutNode } from './model.ts'
import { compactest } from './offers.ts'
import { InfeasibleError } from './protocol.ts'
import type { Ctx, Designer, Measured, Offer, Placed, Stats } from './protocol.ts'
import { bookshelf } from './designers/bookshelf.ts'
import { room } from './designers/room.ts'
import { building } from './designers/building.ts'
import { campus } from './designers/campus.ts'
import { areaDesigner } from './designers/area.ts'

const DESIGNERS: Record<Kind, Designer> = {
  shelf: bookshelf as Designer,
  room: room as Designer,
  building: building as Designer,
  campus: campus as Designer,
  area: areaDesigner as Designer,
}

export interface Options {
  cfg?: Partial<Config>
  /** Seed for the Area designer's randomized packing. */
  seed?: number
  /** Area packing attempts (overrides cfg.area.attempts). */
  attempts?: number
}

export function createContext(opts: Options = {}): Ctx {
  const base = DEFAULT_CONFIG
  const cfg: Config = { ...base, ...opts.cfg, area: { ...base.area, ...opts.cfg?.area, ...(opts.attempts ? { attempts: opts.attempts } : {}) } }
  validateConfig(cfg)
  const stats: Stats = { explored: 0, retained: 0, infeasible: 0, measured: 0, arranged: 0, byKind: {} }
  const ctx: Ctx = {
    cfg,
    seed: opts.seed ?? 1,
    phase: 'measure',
    ancestors: [],
    stats,
    explore(n = 1) {
      if (ctx.phase === 'arrange') throw new Error('A layout search was started during ARRANGE; growth must reuse the measured plan')
      stats.explored += n
    },
    measure: (node) => measureNode(node, ctx),
    arrange: (m, offer, env) => arrangeNode(m, offer, env, ctx),
  }
  return ctx
}

function measureNode(node: LayoutNode, ctx: Ctx): Measured {
  if (ctx.phase !== 'measure') throw new Error('MEASURE called during ARRANGE')
  const d = DESIGNERS[node.kind]
  ctx.ancestors.push(node)
  const kids = d.children(node, ctx).map((c) => measureNode(c, ctx))
  ctx.ancestors.pop()
  const explored0 = ctx.stats.explored
  const t0 = performance.now()
  const offers = d.measure(node, kids, ctx)
  const k = (ctx.stats.byKind[node.kind] ??= { ms: 0, explored: 0, retained: 0, containers: 0 })
  k.ms += performance.now() - t0
  k.explored += ctx.stats.explored - explored0
  k.retained += offers.length
  k.containers++
  if (!offers.length) throw new InfeasibleError(node.path, `no feasible ${node.kind} arrangement`)
  ctx.stats.measured++
  ctx.stats.retained += offers.length
  return { node, offers, children: kids }
}

function arrangeNode(m: Measured, offer: Offer, env: Rect, ctx: Ctx): Placed {
  if (!m.offers.includes(offer)) throw new Error(`${m.node.path}: offer "${offer.key}" was not one of its measured offers`)
  if (env.w < offer.w - EPS || env.d < offer.d - EPS) {
    throw new InfeasibleError(m.node.path, `allocated ${env.w.toFixed(2)} × ${env.d.toFixed(2)} m is smaller than the selected minimum ${offer.w.toFixed(2)} × ${offer.d.toFixed(2)} m`)
  }
  ctx.stats.arranged++
  return DESIGNERS[m.node.kind].arrange(m, offer, env, ctx)
}

export interface Result { ctx: Ctx; measured: Measured; offer: Offer; placed: Placed; timings: { measureMs: number; arrangeMs: number } }

/** Measures `root` and arranges it into an envelope `scale` times the chosen offer's minimum. */
export function layout(root: LayoutNode, opts: Options & { pick?: (offers: Offer[]) => Offer; scale?: { x: number; y: number }; size?: { w: number; d: number } } = {}): Result {
  const ctx = createContext(opts)
  const t0 = performance.now()
  const measured = measureNode(root, ctx)
  const t1 = performance.now()
  const offer = (opts.pick ?? compactest)(measured.offers)
  const placed = arrangeAt(measured, offer, ctx, opts.size ?? { w: offer.w * (opts.scale?.x ?? 1), d: offer.d * (opts.scale?.y ?? 1) })
  const t2 = performance.now()
  return { ctx, measured, offer, placed, timings: { measureMs: t1 - t0, arrangeMs: t2 - t1 } }
}

/** Pass 2 only: grow an already-measured hierarchy into an envelope (at the origin). */
export function arrangeAt(measured: Measured, offer: Offer, ctx: Ctx, size: { w: number; d: number }): Placed {
  ctx.phase = 'arrange'
  try {
    return arrangeNode(measured, offer, rect(0, 0, size.w, size.d), ctx)
  } finally {
    ctx.phase = 'measure'
  }
}

export { InfeasibleError }
