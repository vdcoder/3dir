import { EPS } from './geometry.ts'
import type { Offer } from './protocol.ts'

/**
 * Keeps a bounded, useful set of offers:
 * 1. drops exact duplicates (same size; the better-scoring one stays),
 * 2. drops offers dominated in width, depth and score at once,
 * 3. if still too many, keeps the smallest, the best-scoring, and an even
 *    spread of proportions (narrow ... wide).
 */
export function boundOffers(offers: Offer[], max: number, keepDominated = false): Offer[] {
  const bySize = new Map<string, Offer>()
  for (const o of offers) {
    const k = `${o.w.toFixed(4)}x${o.d.toFixed(4)}`
    const prev = bySize.get(k)
    if (!prev || o.quality.score > prev.quality.score + EPS) bySize.set(k, o)
  }
  const unique = [...bySize.values()]
  const dominated = (a: Offer, b: Offer) =>
    b.w <= a.w + EPS && b.d <= a.d + EPS && b.quality.score >= a.quality.score - EPS &&
    (b.w < a.w - EPS || b.d < a.d - EPS || b.quality.score > a.quality.score + EPS)
  const front = keepDominated ? unique : unique.filter((a) => !unique.some((b) => b !== a && dominated(a, b)))
  front.sort((a, b) => a.w / a.d - b.w / b.d || a.key.localeCompare(b.key))
  if (front.length <= max) return front
  const keep = new Set<Offer>()
  keep.add(front.reduce((m, o) => (o.w * o.d < m.w * m.d ? o : m)))
  keep.add(front.reduce((m, o) => (o.quality.score > m.quality.score ? o : m)))
  for (let i = 0; keep.size < max && i < max * 2; i++) {
    const idx = Math.round((i / Math.max(1, max - 1)) * (front.length - 1))
    keep.add(front[Math.min(front.length - 1, idx)])
  }
  for (const o of front) { if (keep.size >= max) break; keep.add(o) }
  return front.filter((o) => keep.has(o))
}

/** The offer a parent takes when it has no other preference: smallest area, then squarest. */
export function compactest(offers: Offer[]): Offer {
  return offers.reduce((m, o) => {
    const a = o.w * o.d, b = m.w * m.d
    if (a < b - EPS) return o
    if (a > b + EPS) return m
    return Math.abs(Math.log(o.w / o.d)) < Math.abs(Math.log(m.w / m.d)) ? o : m
  })
}
