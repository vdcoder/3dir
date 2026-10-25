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
import { bookshelfV3 } from './v3/bookshelf.ts'
import { roomV3 } from './v3/room.ts'
import { buildingV3, campusV3 } from './v3/rowsV3.ts'
import { areaV3 } from './v3/area.ts'

const DESIGNERS: Record<'v2' | 'v3', Record<Kind, Designer>> = {
  // α.v2: every container keeps a share of its surplus and passes the rest down.
  v2: {
    shelf: bookshelf as Designer,
    room: room as Designer,
    building: building as Designer,
    campus: campus as Designer,
    area: areaDesigner as Designer,
  },
  // α.v3: areas, campuses, buildings and shelves keep their measured geometry; only rooms grow.
  v3: {
    shelf: bookshelfV3 as Designer,
    room: roomV3 as Designer,
    building: buildingV3 as Designer,
    campus: campusV3 as Designer,
    area: areaV3 as Designer,
  },
}

export interface Options {
  cfg?: Partial<Config>
  /** Seed for the Area designer's randomized packing. */
  seed?: number
  /** Area packing attempts (overrides cfg.area.attempts). */
  attempts?: number
  /** Designer set (default α.v2, so earlier results reproduce). */
  version?: 'v2' | 'v3'
}

/** α.v3 defaults: balanced child-offer sampling (the sensitivity study's recommendation). */
const V3_AREA: Partial<Config['area']> = { sampling: 'balanced', balance: 1 }

export function createContext(opts: Options = {}): Ctx {
  const base = DEFAULT_CONFIG
  const version = opts.version ?? 'v2'
  const cfg: Config = {
    ...base, ...opts.cfg,
    area: { ...base.area, ...(version === 'v3' ? V3_AREA : {}), ...opts.cfg?.area, ...(opts.attempts ? { attempts: opts.attempts } : {}) },
    v3: { ...base.v3, ...opts.cfg?.v3 },
  }
  validateConfig(cfg)
  const stats: Stats = { explored: 0, retained: 0, infeasible: 0, measured: 0, arranged: 0, byKind: {} }
  const ctx: Ctx = {
    cfg,
    version,
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
  const d = DESIGNERS[ctx.version][node.kind]
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
  return DESIGNERS[ctx.version][m.node.kind].arrange(m, offer, env, ctx)
}

export interface Result { ctx: Ctx; measured: Measured; offer: Offer; placed: Placed; timings: { measureMs: number; arrangeMs: number } }

/**
 * Measures `root` and arranges it into an envelope `scale` times the chosen offer's minimum.
 * α.v3: the root is placed at exactly its chosen offer's size (no scale, no viewport).
 */
export function layout(root: LayoutNode, opts: Options & { pick?: (offers: Offer[]) => Offer; scale?: { x: number; y: number }; size?: { w: number; d: number } } = {}): Result {
  if (opts.version === 'v3' && (opts.scale || opts.size)) throw new Error('α.v3 world geometry comes from measurement; it takes no scale or size')
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
