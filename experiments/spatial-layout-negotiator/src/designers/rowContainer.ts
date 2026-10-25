// The common mechanism behind Building and Campus: children in east–west
// rows of k (k = 1..n), each row negotiating one shared depth. The two
// designers differ in what their children are, their frame (walls, corridors,
// streets, courtyard) and how they spend their own share of the surplus.

import type { Config } from '../config.ts'
import { rect } from '../geometry.ts'
import type { LayoutNode } from '../model.ts'
import { boundOffers } from '../offers.ts'
import { offerByKey } from '../protocol.ts'
import type { Ctx, Designer, Measured, Obj, Offer, Placed } from '../protocol.ts'
import { chunk, growRows, measureRows, negotiateRow } from '../rows.ts'
import type { RowDeal, RowFrame, RowGrowth, RowsMin } from '../rows.ts'

export interface RowContainerPlan { perRow: number; deals: RowDeal[]; min: RowsMin; rowCount: number }

export interface RowContainerSpec<N extends LayoutNode> {
  kind: 'building' | 'campus'
  childrenOf(node: N): LayoutNode[]
  frame(cfg: Config, rowCount: number): RowFrame
  growth(cfg: Config): Omit<RowGrowth, 'absorb'>
  /** Size of an empty container (no children at all). */
  empty(cfg: Config): { w: number; d: number }
  /** The entrance in the front edge. */
  door(cfg: Config): { w: number; label: string }
}

const itemsOf = (deals: RowDeal[]) => deals.map((deal) => deal.widths.map((w) => ({ w, d: deal.depth })))

export function rowContainer<N extends LayoutNode>(spec: RowContainerSpec<N>): Designer<N> {
  return {
    children: (node) => spec.childrenOf(node),

    measure(_node, kids, ctx: Ctx) {
      const cfg = ctx.cfg
      const n = kids.length
      const offers: Offer[] = []
      if (n === 0) {
        ctx.explore()
        const e = spec.empty(cfg)
        const f = { ...spec.frame(cfg, 0), minW: e.w, minD: e.d }
        const min = measureRows([], f)
        return [{ key: 'empty', w: min.w, d: min.d, plan: { perRow: 0, deals: [], min, rowCount: 0 } satisfies RowContainerPlan, quality: { score: 0 } }]
      }
      for (let k = 1; k <= n; k++) {
        const groups = chunk(kids, k)
        const deals = groups.map((g) => negotiateRow(g, spec.frame(cfg, groups.length).gapX.size, ctx))
        if (deals.some((d) => !d)) { ctx.stats.infeasible++; continue }
        const ok = deals as RowDeal[]
        const min = measureRows(itemsOf(ok), spec.frame(cfg, groups.length))
        const aspect = min.w / min.d
        const used = ok.reduce((s, d) => s + d.width * d.depth, 0)
        offers.push({
          key: `${spec.kind === 'building' ? 'rooms' : 'buildings'}/row=${k}`, w: min.w, d: min.d,
          plan: { perRow: k, deals: ok, min, rowCount: groups.length } satisfies RowContainerPlan,
          quality: { score: -Math.abs(Math.log(aspect / 1.4)) + used / (min.w * min.d), aspect, fill: used / (min.w * min.d), rows: groups.length },
        })
      }
      return boundOffers(offers, cfg.maxOffers, cfg.keepDominated)
    },

    arrange(m: Measured<N>, offer, env, ctx): Placed {
      const cfg = ctx.cfg
      const p = offer.plan as RowContainerPlan
      const frame = { ...spec.frame(cfg, p.rowCount), ...(p.rowCount === 0 ? { minW: offer.w, minD: offer.d } : {}) }
      const grown = growRows(itemsOf(p.deals), frame, p.min, env, { absorb: cfg.absorb, ...spec.growth(cfg) })
      const children: Placed[] = []
      const rowGroups: number[][] = []
      p.deals.forEach((deal, r) => {
        const group: number[] = []
        deal.keys.forEach((key, j) => {
          const kid = m.children[r * p.perRow + j]
          group.push(children.length)
          // The row's common depth is imposed here; the child grows its saved plan into it.
          children.push(ctx.arrange(kid, offerByKey(kid, key), grown.items[r][j]))
        })
        rowGroups.push(group)
      })
      const door = spec.door(cfg)
      const objects: Obj[] = [{ rect: rect(env.x + env.w / 2 - door.w / 2, env.y + env.d - 0.3, door.w, 0.3), kind: 'door', label: door.label, layer: 2 }]
      return {
        kind: spec.kind, name: m.node.name, path: m.node.path, synthetic: (m.node as { synthetic?: boolean }).synthetic,
        rect: { ...env }, offerKey: offer.key, min: { w: offer.w, d: offer.d },
        ledger: { x: grown.ledgerX, y: grown.ledgerY, rows: grown.rowLedgers },
        regions: grown.regions, objects, children,
        rules: { gapX: frame.gapX.size, gapY: Math.min(frame.gapY.size, ...(frame.bands ?? []).map((b) => b.size)), pad: { l: frame.padL.size, r: frame.padR.size, t: frame.padT.size, b: frame.padB.size }, rowGroups },
        meta: { perRow: p.perRow, rowDepths: p.deals.map((d) => d.depth) },
      }
    },
  }
}
