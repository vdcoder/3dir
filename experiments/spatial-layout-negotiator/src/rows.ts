// The row-layout mechanism shared by Room, Building and Campus: children sit
// in east–west rows; every child in a row shares the row's north–south depth.
// Designers supply their own frame (what padding and separators mean and how
// big they must be) and their own growth policy (where surplus goes).

import { EPS, rect } from './geometry.ts'
import type { Rect } from './geometry.ts'
import { ledger } from './protocol.ts'
import type { AxisLedger, Ctx, Measured, Offer, Region, RegionRole } from './protocol.ts'

export interface Item { w: number; d: number }
export interface Side { size: number; role: RegionRole; label: string }

export interface RowFrame {
  padL: Side; padR: Side
  /** rear (north) */
  padT: Side
  /** front (south): usually the entrance */
  padB: Side
  /** between neighbours in a row */
  gapX: Side
  /** between rows */
  gapY: Side
  /** Full-width bands that replace the separator after row `after` (a courtyard, a plaza). */
  bands?: { after: number; size: number; role: RegionRole; label: string }[]
  minW?: number
  minD?: number
}

export interface RowsMin {
  w: number
  d: number
  rowW: number[]
  rowD: number[]
  /** Extra front depth at minimum when the container's own minimum depth dominates. */
  dSlack: number
}

interface SepY { size: number; role: RegionRole; label: string; band: boolean }

/** The separators below each row (between rows, or a band after the last one). */
function separatorsY(rowCount: number, f: RowFrame): (SepY | null)[] {
  const out: (SepY | null)[] = []
  for (let r = 0; r < rowCount; r++) {
    const band = f.bands?.find((b) => b.after === r)
    if (band) out.push({ size: band.size, role: band.role, label: band.label, band: true })
    else if (r < rowCount - 1) out.push({ size: f.gapY.size, role: f.gapY.role, label: f.gapY.label, band: false })
    else out.push(null)
  }
  return out
}

export function measureRows(rows: Item[][], f: RowFrame): RowsMin {
  const rowW = rows.map((r) => f.padL.size + f.padR.size + r.reduce((s, it) => s + it.w, 0) + f.gapX.size * Math.max(0, r.length - 1))
  const rowD = rows.map((r) => Math.max(0, ...r.map((it) => it.d)))
  const w = Math.max(f.padL.size + f.padR.size, f.minW ?? 0, ...rowW)
  const seps = separatorsY(rows.length, f).reduce((s, x) => s + (x?.size ?? 0), 0)
  const natural = f.padT.size + f.padB.size + rowD.reduce((s, x) => s + x, 0) + seps
  const d = Math.max(natural, f.minD ?? 0)
  return { w, d, rowW, rowD, dSlack: d - natural }
}

export interface RowGrowth {
  /** Share of each axis' surplus kept for the container's own separators (default 0.2). */
  absorb: number
  /** Of the kept x share, the part that widens the outer pads (the rest widens the gaps in the row). */
  padShareX: number
  /** proportional: children grow with their width; uniform: identical children grow identically. */
  rowMode: (row: number) => 'proportional' | 'uniform'
  /** What a row narrower than the container does with its extra width, even at minimum size. */
  rowSlack: (row: number) => 'items' | 'gaps' | 'center'
  /** How the kept y share is split between the rear pad, front pad, gaps between rows, and bands. */
  weightsY: { padT: number; padB: number; gapY: number; band: number }
}

export interface RowsPlaced {
  /** Each child's envelope, by row. */
  items: Rect[][]
  /** The container's own space; with `items` it tiles the envelope exactly. */
  regions: Region[]
  ledgerX: AxisLedger
  rowLedgers: AxisLedger[]
  ledgerY: AxisLedger
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

/** Grows a measured row arrangement into `env` without changing its rows or order. */
export function growRows(rows: Item[][], f: RowFrame, m: RowsMin, env: Rect, g: RowGrowth): RowsPlaced {
  const R = rows.length
  const regions: Region[] = []

  // ---------- North–south: bands, rows, separators ----------
  const Sy = env.d - m.d
  const seps = separatorsY(R, f)
  let ownY = g.absorb * Sy
  let passY = Sy - ownY
  if (R === 0) { ownY = Sy; passY = 0 }
  const weights = [g.weightsY.padT, g.weightsY.padB, ...seps.map((s) => (s ? (s.band ? g.weightsY.band : g.weightsY.gapY) : 0))]
  const wSum = sum(weights)
  const extraY = weights.map((w) => (wSum > 0 ? (ownY * w) / wSum : 0))
  if (wSum <= 0) extraY[1] = ownY
  const sumD = sum(m.rowD)
  const rowD = m.rowD.map((d) => d + (sumD > 0 ? (passY * d) / sumD : passY / Math.max(1, R)))

  let y = env.y
  const padT = f.padT.size + extraY[0]
  if (padT > EPS) regions.push({ rect: rect(env.x, y, env.w, padT), role: f.padT.role, label: f.padT.label, axis: 'y' })
  y += padT
  const rowY: number[] = []
  for (let r = 0; r < R; r++) {
    rowY.push(y)
    y += rowD[r]
    const s = seps[r]
    if (s) {
      const size = s.size + extraY[2 + r]
      regions.push({ rect: rect(env.x, y, env.w, size), role: s.role, label: s.label, axis: 'y' })
      y += size
    }
  }
  const padB = env.y + env.d - y
  if (padB > EPS) regions.push({ rect: rect(env.x, y, env.w, padB), role: f.padB.role, label: f.padB.label, axis: 'y' })

  // ---------- East–west, row by row ----------
  const Sx = env.w - m.w
  const unit = Math.max(1, ...rows.map((r, i) => (g.rowMode(i) === 'uniform' ? r.length : 0)))
  const items: Rect[][] = []
  const rowLedgers: AxisLedger[] = []
  rows.forEach((row, r) => {
    const k = row.length
    const own = g.absorb * Sx
    const pass = Sx - own
    const slack = m.w - m.rowW[r]
    let pads = 0
    const gaps = new Array<number>(Math.max(0, k - 1)).fill(0)
    const grow = new Array<number>(k).fill(0)
    let kept = own
    const toSeparators = (v: number) => {
      if (k >= 2) gaps.forEach((_, i) => { gaps[i] += v / (k - 1) })
      else pads += v
    }
    if (k === 0) { pads = Sx + slack; kept = Sx }
    else {
      if (k >= 2) { pads += own * g.padShareX; toSeparators(own * (1 - g.padShareX)) } else pads += own
      const sw = sum(row.map((it) => it.w))
      if (g.rowMode(r) === 'uniform') {
        const each = pass / unit
        grow.fill(each)
        const leftover = pass - each * k
        kept += leftover
        toSeparators(leftover)
      } else row.forEach((it, i) => { grow[i] = sw > 0 ? (pass * it.w) / sw : pass / k })
      const how = g.rowSlack(r)
      if (how === 'items') row.forEach((it, i) => { grow[i] += g.rowMode(r) === 'uniform' || sw <= 0 ? slack / k : (slack * it.w) / sw })
      else if (how === 'gaps' && k >= 2) toSeparators(slack)
      else pads += slack
    }
    rowLedgers.push(ledger(m.w, env.w, kept, slack))

    const h = rowD[r]
    let x = env.x
    const left = f.padL.size + pads / 2
    regions.push({ rect: rect(x, rowY[r], left, h), role: f.padL.role, label: f.padL.label, axis: 'x' })
    x += left
    const placed: Rect[] = []
    row.forEach((it, i) => {
      const w = it.w + grow[i]
      placed.push(rect(x, rowY[r], w, h))
      x += w
      if (i < k - 1) {
        const gw = f.gapX.size + gaps[i]
        regions.push({ rect: rect(x, rowY[r], gw, h), role: f.gapX.role, label: f.gapX.label, axis: 'x' })
        x += gw
      }
    })
    const rightW = env.x + env.w - x
    if (rightW > EPS || k === 0) regions.push({ rect: rect(x, rowY[r], Math.max(0, rightW), h), role: f.padR.role, label: f.padR.label, axis: 'x' })
    items.push(placed)
  })

  const critical = m.rowW.length ? m.rowW.indexOf(Math.max(...m.rowW)) : -1
  return {
    items,
    regions: regions.filter((x) => x.rect.w > EPS && x.rect.d > EPS),
    ledgerX: critical >= 0 ? rowLedgers[critical] : ledger(m.w, env.w, Sx),
    rowLedgers,
    ledgerY: ledger(m.d, env.d, ownY, m.dSlack),
  }
}

/** The narrowest offer (ties: the better-scoring one). */
export function narrowest(offers: Offer[]): Offer | undefined {
  let best: Offer | undefined
  for (const o of offers) if (!best || o.w < best.w - EPS || (Math.abs(o.w - best.w) <= EPS && o.quality.score > best.quality.score)) best = o
  return best
}

/** Weight of the proportion preference in row negotiation (0 = smallest area only). */
export const ASPECT_PENALTY = 0.15

export interface RowDeal { depth: number; keys: string[]; widths: number[]; width: number }

/**
 * Children sharing an east–west row must accept one common depth. Try each
 * depth any child can offer; at that depth every child takes its narrowest
 * offer that fits; keep the depth giving the smallest row.
 */
export function negotiateRow(members: Measured[], gap: number, ctx: Ctx): RowDeal | null {
  const depths = [...new Set(members.flatMap((m) => m.offers.map((o) => o.d)))].sort((a, b) => a - b)
  let best: (RowDeal & { area: number }) | null = null
  for (const T of depths) {
    ctx.explore()
    const picks = members.map((m) => narrowest(m.offers.filter((o) => o.d <= T + EPS)))
    if (picks.some((p) => !p)) { ctx.stats.infeasible++; continue }
    const widths = picks.map((p) => p!.w)
    const width = sum(widths) + gap * Math.max(0, members.length - 1)
    // Smallest row, gently preferring members of reasonable proportions (no very long, thin rooms).
    const stretch = sum(picks.map((p) => Math.abs(Math.log(p!.w / T)))) / members.length
    const area = width * T * (1 + ASPECT_PENALTY * stretch)
    if (!best || area < best.area - EPS || (Math.abs(area - best.area) <= EPS && T < best.depth)) best = { depth: T, keys: picks.map((p) => p!.key), widths, width, area }
  }
  return best && { depth: best.depth, keys: best.keys, widths: best.widths, width: best.width }
}

/** Splits children into consecutive rows of `k`. */
export const chunk = <T>(xs: T[], k: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += k) out.push(xs.slice(i, i + k))
  return out
}
