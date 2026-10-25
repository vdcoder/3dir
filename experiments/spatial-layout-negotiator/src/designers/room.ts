// Designer B — Room. Identical bookshelves (one per subfolder) stand in rows
// at the rear; one table with the room's loose files stands in front; the door
// is in the front wall. The family of offers is "k shelves per row" for
// k = 1..M, each with a table sized for that room width (plus a near-square
// table when there are few or no shelves). Growth keeps the rows: shelves stay
// identical, the table stays centered, and computer / display desks appear
// beside the table once there is room for them.

import { EPS, rect } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import type { Config } from '../config.ts'
import type { RoomNode } from '../model.ts'
import { boundOffers, compactest } from '../offers.ts'
import { ledger, offerByKey } from '../protocol.ts'
import type { Ctx, Designer, Measured, Obj, Offer, Placed } from '../protocol.ts'
import { chunk, growRows, measureRows } from '../rows.ts'
import type { Item, RowFrame, RowsMin } from '../rows.ts'

export interface TableSpec { variant: 'fit' | 'square' | 'wide' | 'long'; cols: number; rows: number; w: number; d: number }

export interface RoomPlan {
  perRow: number
  shelfW: number
  /** The offer each shelf uses (its packed arrangement); all are widened to `shelfW`. */
  shelfKeys: string[]
  table: TableSpec | null
  min: RowsMin
}

export function roomFrame(cfg: Config): RowFrame {
  const c = cfg.room
  return {
    padL: { size: c.wall, role: 'wall', label: 'side clearance' },
    padR: { size: c.wall, role: 'wall', label: 'side clearance' },
    padT: { size: c.rear, role: 'wall', label: 'rear wall' },
    padB: { size: c.entrance, role: 'entrance', label: 'entrance clearance' },
    gapX: { size: c.shelfGap, role: 'spacing', label: 'shelf gap' },
    gapY: { size: c.aisle, role: 'aisle', label: 'aisle' },
    minW: c.minW,
    minD: c.minD,
  }
}

export function tableSpec(cfg: Config, files: number, cols: number, variant: TableSpec['variant']): TableSpec {
  const f = cfg.room.file
  const m = cfg.room.tableMargin
  const c = Math.max(1, Math.min(cols, files))
  const r = Math.ceil(files / c)
  return { variant, cols: c, rows: r, w: c * f.w + (c - 1) * f.gap + 2 * m, d: r * f.d + (r - 1) * f.gap + 2 * m }
}

/** The table's envelope: the table plus side clearance and a chair zone in front. */
export const tableEnvelope = (cfg: Config, t: TableSpec): Item => ({ w: t.w + 2 * cfg.room.tableSide, d: t.d + cfg.room.chair })

function tableVariants(cfg: Config, files: number, blockW: number, shelves: number, ctx: Ctx): TableSpec[] {
  const out: TableSpec[] = []
  if (blockW > 0) {
    // As wide as the shelf block allows: the room's width stays the shelves'.
    const f = cfg.room.file
    const room = blockW - 2 * cfg.room.tableSide - 2 * cfg.room.tableMargin + f.gap
    const cols = Math.floor(room / (f.w + f.gap) + EPS)
    if (cols >= 1) out.push(tableSpec(cfg, files, cols, 'fit'))
    else ctx.stats.infeasible++
  }
  const squareCols = Math.ceil(Math.sqrt(files))
  if (shelves === 0 || (shelves <= 2 && files >= 9) || out.length === 0) out.push(tableSpec(cfg, files, squareCols, 'square'))
  if (shelves === 0) {
    out.push(tableSpec(cfg, files, Math.ceil(Math.sqrt(2 * files)), 'wide'))
    out.push(tableSpec(cfg, files, Math.ceil(Math.sqrt(files / 2)), 'long'))
  }
  const seen = new Set<number>()
  return out.filter((t) => (seen.has(t.cols) ? false : (seen.add(t.cols), true)))
}

function rowsOf(cfg: Config, M: number, p: Pick<RoomPlan, 'perRow' | 'shelfW' | 'table'>): Item[][] {
  const shelfRows = M ? chunk(Array.from({ length: M }, () => ({ w: p.shelfW, d: cfg.shelf.depth })), p.perRow) : []
  return p.table ? [...shelfRows, [tableEnvelope(cfg, p.table)]] : shelfRows
}

export const room: Designer<RoomNode> = {
  children: (node) => node.shelves,

  measure(node, kids, ctx) {
    const cfg = ctx.cfg
    const M = kids.length
    const N = node.files.length
    // All shelves in a room share one size: the widest one's minimum.
    const shelfOffers = kids.map((k) => k.offers.find((o) => o.key === 'packed') ?? compactest(k.offers))
    const shelfW = M ? Math.max(...shelfOffers.map((o) => o.w)) : 0
    const frame = roomFrame(cfg)
    const offers: Offer[] = []
    for (const k of M ? Array.from({ length: M }, (_, i) => i + 1) : [0]) {
      const blockW = M ? k * shelfW + (k - 1) * cfg.room.shelfGap : 0
      for (const table of N ? tableVariants(cfg, N, blockW, M, ctx) : [null]) {
        ctx.explore()
        const plan: RoomPlan = { perRow: k, shelfW, shelfKeys: shelfOffers.map((o) => o.key), table, min: undefined as unknown as RowsMin }
        plan.min = measureRows(rowsOf(cfg, M, plan), frame)
        const aspect = plan.min.w / plan.min.d
        offers.push({
          key: `shelves/row=${k}` + (table ? ` table=${table.variant}` : ''),
          w: plan.min.w, d: plan.min.d, plan,
          quality: { score: -Math.abs(Math.log(aspect / 1.3)), aspect, shelfRows: M ? Math.ceil(M / k) : 0 },
        })
      }
    }
    return boundOffers(offers, cfg.maxOffers, cfg.keepDominated)
  },

  arrange(m: Measured<RoomNode>, offer, env, ctx): Placed {
    const cfg = ctx.cfg
    const p = offer.plan as RoomPlan
    const M = m.children.length
    const shelfRows = M ? Math.ceil(M / p.perRow) : 0
    const grown = growRows(rowsOf(cfg, M, p), roomFrame(cfg), p.min, env, {
      absorb: cfg.absorb,
      padShareX: 0.5,
      // Shelves stay identical; the table row's slack and growth go to the table's envelope.
      rowMode: (r) => (r < shelfRows ? 'uniform' : 'proportional'),
      rowSlack: (r) => (r < shelfRows ? 'gaps' : 'items'),
      weightsY: { padT: 0.25, padB: 1, gapY: 1, band: 0 },
    })
    const children: Placed[] = m.children.map((kid, i) =>
      ctx.arrange(kid, offerByKey(kid, p.shelfKeys[i]), grown.items[Math.floor(i / p.perRow)][i % p.perRow]))
    if (p.table) children.push(arrangeTable(cfg, m.node, p.table, grown.items[shelfRows][0]))
    const rowGroups = chunk(Array.from({ length: M }, (_, i) => i), Math.max(1, p.perRow))
    if (p.table) rowGroups.push([M])
    const door = rect(env.x + env.w / 2 - cfg.room.door / 2, env.y + env.d - 0.12, cfg.room.door, 0.12)
    return {
      kind: 'room', name: m.node.name, path: m.node.path, synthetic: m.node.synthetic, rect: { ...env }, offerKey: offer.key, min: { w: offer.w, d: offer.d },
      ledger: { x: grown.ledgerX, y: grown.ledgerY, rows: grown.rowLedgers },
      regions: grown.regions, children,
      objects: [{ rect: door, kind: 'door', label: 'door', layer: 2 }],
      rules: { gapX: cfg.room.shelfGap, gapY: cfg.room.aisle, pad: { l: cfg.room.wall, r: cfg.room.wall, t: cfg.room.rear, b: cfg.room.entrance }, rowGroups, uniformKind: 'shelf' },
      meta: { perRow: p.perRow, table: p.table },
    }
  },
}

/** The file table: fixed size, centered at the back of its envelope; desks join it when space allows. */
function arrangeTable(cfg: Config, node: RoomNode, t: TableSpec, env: Rect): Placed {
  const c = cfg.room
  const min = tableEnvelope(cfg, t)
  const side = (env.w - t.w) / 2
  const tx = env.x + side
  const objects: Obj[] = [{ rect: rect(tx, env.y, t.w, t.d), kind: 'table', label: `table · ${node.files.length} files`, layer: 0, fixed: { w: t.w, d: t.d } }]
  node.files.forEach((name, i) => {
    const col = i % t.cols
    const row = Math.floor(i / t.cols)
    objects.push({ rect: rect(tx + c.tableMargin + col * (c.file.w + c.file.gap), env.y + c.tableMargin + row * (c.file.d + c.file.gap), c.file.w, c.file.d), kind: 'file', label: name, layer: 1, fixed: { w: c.file.w, d: c.file.d } })
  })
  // Growth: a computer desk to the left and a display table to the right, when they fit with clearance.
  if (side >= c.desk.w + 2 * c.desk.clear && env.d >= c.desk.d) {
    objects.push({ rect: rect(tx - c.desk.clear - c.desk.w, env.y, c.desk.w, c.desk.d), kind: 'desk', label: 'computer desk', layer: 0, fixed: { w: c.desk.w, d: c.desk.d } })
    objects.push({ rect: rect(tx + t.w + c.desk.clear, env.y, c.desk.w, c.desk.d), kind: 'desk', label: 'display table', layer: 0, fixed: { w: c.desk.w, d: c.desk.d } })
  }
  return {
    kind: 'table', name: `${node.name} · ${node.files.length} loose files`, path: node.path, synthetic: true, rect: { ...env }, offerKey: t.variant, min: { ...min },
    // A table is a fixed object: all extra space around it stays as clearance.
    ledger: { x: ledger(min.w, env.w, env.w - min.w), y: ledger(min.d, env.d, env.d - min.d) },
    regions: [], children: [], objects, rules: {},
    meta: { cols: t.cols, rows: t.rows },
  }
}
