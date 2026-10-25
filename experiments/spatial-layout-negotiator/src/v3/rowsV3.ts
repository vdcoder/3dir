// Designers C and D (α.v3) — Building and Campus. Both measure exactly as in
// α.v2 (children in rows of k = 1..n, each row negotiating one common depth)
// and are then placed at exactly their measured size: there is no surplus.
//
// Building: rooms in a row receive the row's common depth, and rows narrower
// than the building are stretched horizontally by widening their rooms (up to
// MAX_ROOM_WIDTH each); the rooms absorb both differences inside. Walls,
// partitions, corridors and the entrance hall keep their designed sizes. Width
// no room can take (all at MAX_ROOM_WIDTH) is a lobby at the row's east end.
//
// Campus: buildings keep their exact footprints. A row is as deep as its
// deepest building; a row narrower than the campus gives each building's cell
// an equal share of the spare width. Each building is centered in its cell,
// the rest of the cell is grounds, and an entrance walk joins the building's
// door to the street, courtyard or plaza in front of the row. Paths, streets,
// the courtyard, plaza and boundary keep their designed widths.

import { EPS, freeRects, rect, bottom } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import type { BuildingNode, CampusNode } from '../model.ts'
import { InfeasibleError, ledger, offerByKey } from '../protocol.ts'
import type { AxisLedger, Ctx, Designer, Measured, Obj, Offer, Placed, Region } from '../protocol.ts'
import type { RowFrame } from '../rows.ts'
import { building, buildingFrame } from '../designers/building.ts'
import { campus, campusFrame } from '../designers/campus.ts'
import type { RowContainerPlan } from '../designers/rowContainer.ts'

/** α.v3 containers above the room are placed at exactly the size they measured. */
export function exactSize(m: Measured, offer: Offer, env: Rect) {
  const t = (v: number) => 1e-6 * Math.max(1, v)
  if (Math.abs(env.w - offer.w) > t(offer.w) || Math.abs(env.d - offer.d) > t(offer.d)) {
    throw new InfeasibleError(m.node.path, `α.v3 places a ${m.node.kind} at exactly its measured size ${offer.w.toFixed(3)} × ${offer.d.toFixed(3)} m, not ${env.w.toFixed(3)} × ${env.d.toFixed(3)} m`)
  }
}

/** Equal shares of `amount`, each capped; returns the shares (their sum may be less than `amount`). */
export function waterFill(amount: number, caps: number[]): number[] {
  const out = caps.map(() => 0)
  let left = amount
  let open = caps.map((_, i) => i).filter((i) => caps[i] > EPS)
  while (left > EPS && open.length) {
    const share = left / open.length
    for (const i of open) { const g = Math.min(share, caps[i] - out[i]); out[i] += g; left -= g }
    open = open.filter((i) => caps[i] - out[i] > EPS)
  }
  return out
}

interface Frame { rowY: number[]; regions: Region[]; inner: { x: number; w: number } }

/** North–south structure at exactly the measured size: rear pad, rows, separators/bands, front pad. */
function verticalFrame(f: RowFrame, rowD: number[], env: Rect): Frame {
  const regions: Region[] = []
  const add = (r: Rect, s: { role: Region['role']; label: string }, axis: 'x' | 'y') => { if (r.w > EPS && r.d > EPS) regions.push({ rect: r, role: s.role, label: s.label, axis }) }
  let y = env.y
  add(rect(env.x, y, env.w, f.padT.size), f.padT, 'y')
  y += f.padT.size
  const rowY: number[] = []
  rowD.forEach((d, r) => {
    rowY.push(y)
    add(rect(env.x, y, f.padL.size, d), f.padL, 'x')
    add(rect(env.x + env.w - f.padR.size, y, f.padR.size, d), f.padR, 'x')
    y += d
    const band = f.bands?.find((b) => b.after === r)
    const sep = band ?? (r < rowD.length - 1 ? f.gapY : null)
    if (sep) { add(rect(env.x, y, env.w, sep.size), sep, 'y'); y += sep.size }
  })
  // The front pad also takes any depth the container's own minimum adds (an empty container).
  add(rect(env.x, y, env.w, env.y + env.d - y), f.padB, 'y')
  return { rowY, regions, inner: { x: env.x + f.padL.size, w: env.w - f.padL.size - f.padR.size } }
}

const zero = (min: number): AxisLedger => ledger(min, min, 0)

export const buildingV3: Designer<BuildingNode> = {
  children: building.children,
  measure: building.measure,

  arrange(m: Measured<BuildingNode>, offer, env, ctx: Ctx): Placed {
    exactSize(m, offer, env)
    const cfg = ctx.cfg
    const p = offer.plan as RowContainerPlan
    const f = buildingFrame(cfg)
    const fr = verticalFrame(f, p.deals.map((d) => d.depth), env)
    const regions = fr.regions
    const children: Placed[] = []
    const rowGroups: number[][] = []
    const rowLedgers: AxisLedger[] = []
    const lobbies: number[] = []
    const widened: number[] = []
    p.deals.forEach((deal, r) => {
      const y = fr.rowY[r]
      const k = deal.widths.length
      const slack = fr.inner.w - deal.widths.reduce((s, w) => s + w, 0) - (k - 1) * f.gapX.size
      // The row is stretched horizontally by its rooms, each up to MAX_ROOM_WIDTH.
      const extra = waterFill(slack, deal.widths.map((w) => cfg.v3.maxRoomWidth - w))
      const lobby = slack - extra.reduce((s, e) => s + e, 0)
      let x = fr.inner.x
      const group: number[] = []
      deal.keys.forEach((key, j) => {
        const kid = m.children[r * p.perRow + j]
        const w = deal.widths[j] + extra[j]
        group.push(children.length)
        // The common row depth and any extra width are imposed here; the room absorbs both inside.
        children.push(ctx.arrange(kid, offerByKey(kid, key), rect(x, y, w, deal.depth)))
        widened.push(extra[j])
        x += w
        if (j < k - 1) { regions.push({ rect: rect(x, y, f.gapX.size, deal.depth), role: f.gapX.role, label: f.gapX.label, axis: 'x' }); x += f.gapX.size }
      })
      if (lobby > EPS) regions.push({ rect: rect(x, y, lobby, deal.depth), role: 'lobby', label: 'lobby', axis: 'x' })
      lobbies.push(Math.max(0, lobby))
      rowGroups.push(group)
      rowLedgers.push(ledger(offer.w, env.w, 0, slack > EPS ? slack : undefined))
    })
    const objects: Obj[] = [{ rect: rect(env.x + env.w / 2 - 0.9, env.y + env.d - 0.3, 1.8, 0.3), kind: 'door', label: 'main entrance', layer: 2 }]
    return {
      kind: 'building', name: m.node.name, path: m.node.path, synthetic: m.node.synthetic, rect: { ...env }, offerKey: offer.key, min: { w: offer.w, d: offer.d },
      ledger: { x: zero(offer.w), y: zero(offer.d), rows: rowLedgers },
      regions: regions.filter((g) => g.rect.w > EPS && g.rect.d > EPS), objects, children,
      rules: { gapX: f.gapX.size, gapY: f.gapY.size, pad: { l: f.padL.size, r: f.padR.size, t: f.padT.size, b: f.padB.size }, rowGroups },
      meta: { v3: true, perRow: p.perRow, rowDepths: p.deals.map((d) => d.depth), lobbies, widened },
    }
  },
}

export const campusV3: Designer<CampusNode> = {
  children: campus.children,
  measure: campus.measure,

  arrange(m: Measured<CampusNode>, offer, env, ctx: Ctx): Placed {
    exactSize(m, offer, env)
    const cfg = ctx.cfg
    const p = offer.plan as RowContainerPlan
    const f = campusFrame(cfg, p.rowCount)
    const fr = verticalFrame(f, p.deals.map((d) => d.depth), env)
    const regions = fr.regions
    const children: Placed[] = []
    const cells: Rect[] = []
    const walks: (Rect | null)[] = []
    const rowLedgers: AxisLedger[] = []
    p.deals.forEach((deal, r) => {
      const y = fr.rowY[r]
      const k = deal.widths.length
      const slack = fr.inner.w - deal.widths.reduce((s, w) => s + w, 0) - (k - 1) * f.gapX.size
      let x = fr.inner.x
      deal.keys.forEach((key, j) => {
        const kid = m.children[r * p.perRow + j]
        const o = offerByKey(kid, key)
        const cell = rect(x, y, o.w + slack / k, deal.depth)
        // Natural size, centered in its cell: never resized.
        const b = rect(cell.x + (cell.w - o.w) / 2, cell.y + (cell.d - o.d) / 2, o.w, o.d)
        children.push(ctx.arrange(kid, o, b))
        let walk: Rect | null = null
        if (bottom(cell) - bottom(b) > EPS) {
          const ww = Math.min(cfg.v3.campusWalk, o.w)
          walk = rect(b.x + o.w / 2 - ww / 2, bottom(b), ww, bottom(cell) - bottom(b))
          regions.push({ rect: walk, role: 'walk', label: 'entrance walk', axis: 'x' })
        }
        for (const g of freeRects(cell, walk ? [b, walk] : [b])) regions.push({ rect: g, role: 'ground', label: 'grounds' })
        cells.push(cell)
        walks.push(walk)
        x += cell.w
        if (j < k - 1) { regions.push({ rect: rect(x, y, f.gapX.size, deal.depth), role: f.gapX.role, label: f.gapX.label, axis: 'x' }); x += f.gapX.size }
      })
      rowLedgers.push(ledger(offer.w, env.w, 0, slack > EPS ? slack : undefined))
    })
    const objects: Obj[] = [{ rect: rect(env.x + env.w / 2 - 3, env.y + env.d - 0.3, 6, 0.3), kind: 'door', label: 'campus gate', layer: 2 }]
    return {
      kind: 'campus', name: m.node.name, path: m.node.path, rect: { ...env }, offerKey: offer.key, min: { w: offer.w, d: offer.d },
      ledger: { x: zero(offer.w), y: zero(offer.d), rows: rowLedgers },
      regions: regions.filter((g) => g.rect.w > EPS && g.rect.d > EPS), objects, children,
      rules: { minSep: f.gapX.size, pad: { l: f.padL.size, r: f.padR.size, t: f.padT.size, b: f.padB.size } },
      meta: { v3: true, perRow: p.perRow, rowDepths: p.deals.map((d) => d.depth), cells, walks, rowOf: p.deals.flatMap((d, r) => d.keys.map(() => r)) },
    }
  },
}
