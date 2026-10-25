// Designer A (α.v3) — Bookshelf. Fixed physical geometry.
//
// Measure: the shelf's length is the books' widths + the structure (two side
// panels) + the minimum spacing between neighbouring books + the minimum
// breathing room (at least cfg.shelf.minLength). A folder that needs more than
// MAX_SHELF_SEGMENT_LENGTH is split into consecutive full-length segments, in
// book order, never splitting a book; the last segment's spare length is a
// display bay. Segments keep the folder's canonical path and one group id.
//
// Arrange: books sit at their own widths, packed from the west panel. The Room
// may give an ordinary shelf its row's common length (the extra becomes display
// space); segments are always exactly MAX_SHELF_SEGMENT_LENGTH. Nothing else
// changes a shelf: depth is fixed and there is no growth.

import { maxShelfSegment, segmentCapacity } from '../config.ts'
import type { Config } from '../config.ts'
import { EPS, rect } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import { join } from '../model.ts'
import type { ShelfNode } from '../model.ts'
import { InfeasibleError, ledger } from '../protocol.ts'
import type { Ctx, Designer, Measured, Offer, Placed, Region } from '../protocol.ts'

export interface Segment {
  index: number
  /** Books [first, last) of the folder, in order. */
  first: number
  last: number
  /** Fixture length (outer, panels included). */
  length: number
  /** Panels + books + spacing + minimum breathing. */
  used: number
}

export interface ShelfPlanV3 {
  /** The folder's physical requirement as one shelf: panels + books + spacing + breathing (≥ minLength). */
  required: number
  segmented: boolean
  segments: Segment[]
  /** Shared by every segment of one logical shelf. */
  groupId: string
}

export interface SegmentMeta { index: number; count: number; first: number; last: number; totalBooks: number; groupId: string; folder: string }

export const requiredLength = (cfg: Config, widths: number[]) =>
  Math.max(cfg.shelf.minLength, 2 * cfg.shelf.side + widths.reduce((s, w) => s + w, 0) + cfg.shelf.spacing * Math.max(0, widths.length - 1) + cfg.shelf.breathing)

/** Greedy, order-preserving split into fixtures of at most MAX_SHELF_SEGMENT_LENGTH. */
export function splitSegments(cfg: Config, widths: number[]): Segment[] {
  const c = cfg.shelf
  const max = maxShelfSegment(cfg)
  const out: Segment[] = []
  let first = 0
  while (first < widths.length) {
    let used = 2 * c.side + c.breathing + widths[first]
    let last = first + 1
    while (last < widths.length && used + c.spacing + widths[last] <= max + EPS) { used += c.spacing + widths[last]; last++ }
    out.push({ index: out.length, first, last, length: max, used })
    first = last
  }
  return out
}

export const bookshelfV3: Designer<ShelfNode> & {
  arrangeStack(m: Measured<ShelfNode>, offer: Offer, envs: Rect[], ctx: Ctx): Placed[]
} = {
  children: () => [],

  measure(node, _kids, ctx) {
    const cfg = ctx.cfg
    const widths = node.books.map((b) => b.w)
    ctx.explore()
    // Genuinely infeasible inputs: a book of no width, or wider than a whole segment can hold.
    if (widths.some((w) => !(Number.isFinite(w) && w > 0)) || widths.some((w) => w > segmentCapacity(cfg) + EPS)) { ctx.stats.infeasible++; return [] }
    const required = requiredLength(cfg, widths)
    const groupId = `shelf:${node.path}`
    if (required <= maxShelfSegment(cfg) + EPS) {
      const plan: ShelfPlanV3 = { required, segmented: false, groupId, segments: [{ index: 0, first: 0, last: widths.length, length: required, used: required }] }
      return [{ key: 'fixed', w: required, d: cfg.shelf.depth, plan, quality: { score: 0, segments: 1, books: widths.length } }]
    }
    const segments = splitSegments(cfg, widths)
    const plan: ShelfPlanV3 = { required, segmented: true, groupId, segments }
    // One offer: the size of one segment row; the room stacks `segments.length` of them.
    return [{ key: `segments=${segments.length}`, w: maxShelfSegment(cfg), d: cfg.shelf.depth, plan, quality: { score: 0, segments: segments.length, books: widths.length } }]
  },

  /** An ordinary (unsegmented) shelf, at its own length or its row's common length. */
  arrange(m, offer, env, ctx) {
    const p = offer.plan as ShelfPlanV3
    if (p.segmented) throw new Error(`${m.node.path}: a segmented shelf is placed by its room (arrangeStack)`)
    if (Math.abs(env.d - ctx.cfg.shelf.depth) > EPS) throw new InfeasibleError(m.node.path, `a shelf is ${ctx.cfg.shelf.depth} m deep, not ${env.d} m`)
    return placeSegment(m.node, p, p.segments[0], env, offer, ctx.cfg)
  },

  /** All segments of a split folder, one envelope (one row) each, rear to front. */
  arrangeStack(m, offer, envs, ctx) {
    const p = offer.plan as ShelfPlanV3
    if (!p.segmented || envs.length !== p.segments.length) throw new Error(`${m.node.path}: expected ${p.segments.length} segment envelopes, got ${envs.length}`)
    if (!m.offers.includes(offer)) throw new Error(`${m.node.path}: offer "${offer.key}" was not one of its measured offers`)
    return p.segments.map((s, i) => {
      const e = envs[i]
      if (Math.abs(e.w - s.length) > EPS || Math.abs(e.d - ctx.cfg.shelf.depth) > EPS) throw new InfeasibleError(m.node.path, `segment ${i + 1} must be ${s.length} × ${ctx.cfg.shelf.depth} m`)
      ctx.stats.arranged++
      return placeSegment(m.node, p, s, e, offer, ctx.cfg)
    })
  },
}

function placeSegment(node: ShelfNode, p: ShelfPlanV3, s: Segment, env: Rect, offer: Offer, cfg: Config): Placed {
  const c = cfg.shelf
  if (env.w < s.length - EPS) throw new InfeasibleError(node.path, `shelf length ${env.w} < required ${s.length}`)
  const books = node.books.slice(s.first, s.last)
  const count = p.segments.length
  const last = s.index === count - 1
  const regions: Region[] = []
  const kids: Placed[] = []
  const strip = (x: number, w: number, role: Region['role'], label: string) => {
    if (w > EPS) regions.push({ rect: rect(x, env.y, w, c.depth), role, label, axis: 'x' })
  }
  let x = env.x
  strip(x, c.side, 'structure', 'side panel')
  x += c.side
  books.forEach((b, i) => {
    const book = rect(x, env.y + (c.depth - c.bookDepth) / 2, b.w, c.bookDepth)
    kids.push({
      kind: 'book', name: b.name, path: join(node.path, b.name), rect: rect(x, env.y, b.w, c.depth), offerKey: 'book', min: { w: b.w, d: c.depth },
      ledger: { x: ledger(b.w, b.w, 0), y: ledger(c.depth, c.depth, 0) }, regions: [], children: [], rules: {},
      objects: [{ rect: book, kind: 'book', label: b.name, layer: 0, fixed: { w: b.w, d: c.bookDepth } }],
    })
    x += b.w
    if (i < books.length - 1) { strip(x, c.spacing, 'spacing', 'spacing'); x += c.spacing }
  })
  // Spare length: breathing room (at least the minimum), and a display bay on the last segment of a
  // split folder, or display space where the room lengthened the shelf to its row's common length.
  const spare = env.x + env.w - c.side - x
  const display = p.segmented ? (last ? spare - c.breathing : 0) : env.w - s.length
  const breathing = spare - Math.max(0, display)
  strip(x, breathing, 'breathing', 'breathing room')
  x += breathing
  if (display > EPS) { strip(x, display, 'display', p.segmented ? 'display bay' : 'display space'); x += display }
  strip(x, c.side, 'structure', 'side panel')
  const seg: SegmentMeta | undefined = p.segmented ? { index: s.index, count, first: s.first, last: s.last, totalBooks: node.books.length, groupId: p.groupId, folder: node.path } : undefined
  const minW = p.segmented ? s.length : p.required
  return {
    kind: 'shelf', name: p.segmented ? `${node.name} (${s.index + 1}/${count})` : node.name, path: node.path, rect: { ...env }, offerKey: offer.key,
    min: { w: minW, d: c.depth },
    // Fixed geometry: any extra length is the shelf's own display space; nothing is passed to the books.
    ledger: { x: ledger(minW, env.w, env.w - minW), y: ledger(c.depth, env.d, env.d - c.depth) },
    regions, objects: [], children: kids,
    rules: {},
    meta: { body: { ...env }, height: c.height, v3: true, required: p.required, bookWidth: books.reduce((t, b) => t + b.w, 0), groupId: p.groupId, ...(seg ? { segment: seg } : {}) },
  }
}
