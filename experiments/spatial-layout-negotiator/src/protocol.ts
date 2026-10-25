// The shared two-pass protocol.
//
// Pass 1, MEASURE (bottom-up): every container asks its children for their
// offers, searches its own small family of arrangements, and reports a bounded
// list of offers. An offer is a real arrangement with its minimum size and the
// recipe ("plan") needed to reproduce it, including the children's chosen offers.
//
// Pass 2, ARRANGE (top-down): the parent picks an offer and allocates an
// envelope at least that large; the child grows the saved plan into it. No
// search is allowed in this pass: `explore()` throws if called.

import type { Config } from './config.ts'
import type { Rect } from './geometry.ts'
import type { Kind, LayoutNode } from './model.ts'

export interface Offer {
  /** Unique among the container's offers, e.g. "rooms/row=2". */
  key: string
  /** Minimum width and depth of this arrangement. */
  w: number
  d: number
  /** Designer-specific recipe: grouping, positions, chosen child offers. */
  plan: unknown
  /** Higher is nicer; designers also record what they measured. */
  quality: { score: number } & Record<string, number>
}

export interface Measured<N extends LayoutNode = LayoutNode> {
  node: N
  offers: Offer[]
  children: Measured[]
}

/** How a container used its allocation along one axis. absorbed + passed = surplus. */
export interface AxisLedger {
  min: number
  alloc: number
  surplus: number
  /** Kept for the container's own padding, separators and open space. */
  absorbed: number
  /** Handed to the children's envelopes. */
  passed: number
  /** Space a narrower row has even at minimum size (part of the arrangement, not surplus). */
  slack?: number
}

export type RegionRole =
  | 'padding' | 'wall' | 'separator' | 'aisle' | 'corridor' | 'entrance' | 'clearance' | 'breathing' | 'display'
  | 'structure' | 'spacing' | 'street' | 'path' | 'courtyard' | 'plaza' | 'boundary' | 'open'
  // α.v3: furnished room zones, leftover interior circulation, campus grounds and entrance walks, building lobbies
  | 'feature' | 'circulation' | 'walkway' | 'ground' | 'walk' | 'lobby'

/** Space that belongs to the container itself (not to any child). */
export interface Region {
  rect: Rect
  role: RegionRole
  label: string
  /** axis along which its thickness is measured */
  axis?: 'x' | 'y'
  /** separator family (area designer), e.g. "street" */
  family?: string
  /** α.v3 room features: which feature fills this zone. */
  feature?: string
}

/** A physical, fixed-size thing inside a leaf (a book, a table, a file, a desk, a sign, a door). */
export interface Obj { rect: Rect; kind: string; label?: string; /** objects only collide within a layer */ layer: number; fixed?: { w: number; d: number } }

export interface Placed {
  kind: Kind | 'book' | 'table'
  name: string
  path: string
  synthetic?: boolean
  rect: Rect
  offerKey: string
  min: { w: number; d: number }
  ledger: { x: AxisLedger; y: AxisLedger; rows?: AxisLedger[] }
  regions: Region[]
  objects: Obj[]
  children: Placed[]
  /** What the validator should hold this container to. */
  rules: {
    gapX?: number
    gapY?: number
    /** minimum separation between any two children (area packing) */
    minSep?: number
    pad?: { l: number; r: number; t: number; b: number }
    rowGroups?: number[][]
    /** children of this kind must all have identical dimensions */
    uniformKind?: string
  }
  meta?: Record<string, unknown>
}

export interface Stats {
  /** Candidate arrangements generated during measurement. */
  explored: number
  /** Offers kept and reported to parents. */
  retained: number
  /** Candidates rejected as geometrically impossible. */
  infeasible: number
  measured: number
  arranged: number
  /** Per designer: own measurement time (children excluded), candidates explored, offers retained. */
  byKind: Partial<Record<Kind, { ms: number; explored: number; retained: number; containers: number }>>
}

export class InfeasibleError extends Error {
  path: string
  constructor(path: string, reason: string) {
    super(`${path}: ${reason}`)
    this.path = path
  }
}

export interface Ctx {
  cfg: Config
  /** Which designer set lays the hierarchy out: α.v2 (20% absorption) or α.v3 (fixed geometry, smart rooms). */
  version: 'v2' | 'v3'
  seed: number
  phase: 'measure' | 'arrange'
  /** While measuring: the chain of containers above the one being measured (root first). */
  ancestors: LayoutNode[]
  stats: Stats
  /** Count candidate arrangements; forbidden while arranging. */
  explore(n?: number): void
  measure(node: LayoutNode): Measured
  arrange(m: Measured, offer: Offer, env: Rect): Placed
}

export interface Designer<N extends LayoutNode = LayoutNode> {
  /** The children it lays out (canonical children plus any synthetic files container). */
  children(node: N, ctx: Ctx): LayoutNode[]
  measure(node: N, kids: Measured[], ctx: Ctx): Offer[]
  arrange(m: Measured<N>, offer: Offer, env: Rect, ctx: Ctx): Placed
}

export const offerByKey = (m: Measured, key: string): Offer => {
  const o = m.offers.find((x) => x.key === key)
  if (!o) throw new Error(`${m.node.path}: no offer "${key}"`)
  return o
}

/** A ledger for an axis where the container keeps `absorbed` and passes the rest down. */
export const ledger = (min: number, alloc: number, absorbed: number, slack?: number): AxisLedger => {
  const surplus = alloc - min
  return { min, alloc, surplus, absorbed, passed: surplus - absorbed, ...(slack ? { slack } : {}) }
}
