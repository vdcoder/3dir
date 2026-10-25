// Designer A — Bookshelf. A straight dimensional calculation: the books sit
// side by side; the shelf's depth (and height) never change. Offers are three
// real arrangements: packed, with a display bay, and evenly spaced ("roomy").
// Growth widens the book slots (80%) and the breathing room (20%); books keep
// their size. Extra depth is front clearance, never a deeper shelf.

import { EPS, rect } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import { join } from '../model.ts'
import type { ShelfNode } from '../model.ts'
import { ledger } from '../protocol.ts'
import type { Designer, Measured, Offer, Placed, Region } from '../protocol.ts'

export type ShelfArrangement = 'packed' | 'display' | 'roomy'

export interface ShelfPlan {
  arrangement: ShelfArrangement
  /** Books before the display bay. */
  split: number
  /** Extra breathing to reach the minimum shelf length. */
  minFill: number
  /** Extra space between neighbouring books in the roomy arrangement. */
  roomyGap: number
  bay: number
}

const books = (n: ShelfNode) => n.books

export const bookshelf: Designer<ShelfNode> = {
  children: () => [],

  measure(node, _kids, ctx) {
    const c = ctx.cfg.shelf
    const bad = books(node).find((b) => !(Number.isFinite(b.w) && b.w > 0))
    if (bad) { ctx.stats.infeasible++; return [] }
    const n = books(node).length
    const total = books(node).reduce((s, b) => s + b.w, 0)
    const natural = 2 * c.side + total + c.spacing * Math.max(0, n - 1) + c.breathing
    const L = Math.max(c.minLength, natural)
    const minFill = L - natural
    const offers: Offer[] = []
    const add = (key: ShelfArrangement, w: number, plan: Omit<ShelfPlan, 'arrangement' | 'minFill'>, score: number) => {
      ctx.explore()
      offers.push({ key, w, d: c.depth, plan: { arrangement: key, minFill, ...plan } satisfies ShelfPlan, quality: { score, breathing: (w - total) / w, books: n } })
    }
    add('packed', L, { split: n, roomyGap: 0, bay: 0 }, 0)
    if (n >= 4) add('display', L + c.displayBay, { split: Math.ceil(n / 2), roomyGap: 0, bay: c.displayBay }, 0.6)
    if (n >= 2) {
      const extra = c.roomyShare * total
      add('roomy', L + extra, { split: n, roomyGap: extra / (n - 1), bay: 0 }, 0.4)
    }
    return offers
  },

  arrange(m: Measured<ShelfNode>, offer, env, ctx): Placed {
    const c = ctx.cfg.shelf
    const p = offer.plan as ShelfPlan
    const list = books(m.node)
    const n = list.length
    const S = env.w - offer.w
    const own = n ? ctx.cfg.absorb * S : S
    const perSlot = n ? (S - own) / n : 0
    // The shelf keeps its share as breathing room (in the display bay and at the end).
    const bayExtra = p.arrangement === 'display' ? own / 2 : 0
    const body = rect(env.x, env.y, env.w, c.depth)
    const regions: Region[] = []
    const kids: Placed[] = []
    const strip = (x: number, w: number, role: Region['role'], label: string) => {
      if (w > EPS) regions.push({ rect: rect(x, env.y, w, c.depth), role, label, axis: 'x' })
    }
    let x = env.x
    strip(x, c.side, 'structure', 'side panel')
    x += c.side
    list.forEach((b, i) => {
      if (p.arrangement === 'display' && i === p.split) {
        strip(x, p.bay + bayExtra, 'display', 'display bay')
        x += p.bay + bayExtra
      }
      const slot = rect(x, env.y, b.w + perSlot, c.depth)
      const book = rect(x + perSlot / 2, env.y + (c.depth - c.bookDepth) / 2, b.w, c.bookDepth)
      kids.push({
        kind: 'book', name: b.name, path: join(m.node.path, b.name), rect: slot, offerKey: 'book', min: { w: b.w, d: c.depth },
        ledger: { x: ledger(b.w, slot.w, slot.w - b.w), y: ledger(c.depth, c.depth, 0) },
        regions: [], children: [], rules: {},
        objects: [{ rect: book, kind: 'book', label: b.name, layer: 0, fixed: { w: b.w, d: c.bookDepth } }],
      })
      x += slot.w
      if (i < n - 1 && !(p.arrangement === 'display' && i + 1 === p.split)) {
        strip(x, c.spacing + p.roomyGap, 'spacing', 'spacing')
        x += c.spacing + p.roomyGap
      }
    })
    const end = env.x + env.w - c.side - x
    strip(x, end, 'breathing', 'breathing room')
    x += end
    strip(x, c.side, 'structure', 'side panel')
    if (env.d - c.depth > EPS) regions.push({ rect: rect(env.x, env.y + c.depth, env.w, env.d - c.depth), role: 'clearance', label: 'front clearance', axis: 'y' })
    return {
      kind: 'shelf', name: m.node.name, path: m.node.path, rect: { ...env }, offerKey: offer.key, min: { w: offer.w, d: offer.d },
      // x: books are fixed, so the 80% widens their slots (spacing); y: all extra depth is clearance.
      ledger: { x: ledger(offer.w, env.w, own), y: ledger(offer.d, env.d, env.d - offer.d) },
      regions, objects: [], children: kids,
      rules: { gapX: c.spacing },
      meta: { body, arrangement: p.arrangement, height: c.height },
    }
  },
}

export const shelfBody = (p: Placed): Rect => (p.meta?.body as Rect) ?? p.rect
