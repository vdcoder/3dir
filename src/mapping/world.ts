// Composes world layouts and decides which world a node is seen in.
//
//   main world  = Stage 1 (area planner + geography) + Stage 2 for each area
//   box-world   = Stage 2 rooted at one folder (a closed archive box opened)
//
// A node's world is derived from the node alone (contextFor): start on the
// main map; if the node is hidden inside a closed box, open that box; repeat.
// Every folder therefore has a world in which it is open, at any depth, and
// the world never changes filesystem identity.

import type { FsIndex } from '../model/fs'
import type { NodeId } from '../model/types'
import { makeThemeOf, planDrive, type PlanArea, type PlanRegion } from './areaPlanner'
import { buildArea, emitArea, emptyLayout, rectBox, type AnchorFn, type BuiltArea } from './areaRenderer'
import { layoutGeography, type Geography } from './geography'
import { makeImportance, type ImportanceFn } from './importance'
import { OPEN_LEVELS, type Anchor, type WorldContext, type WorldLayout } from './types'

function anchorWriter(out: WorldLayout): AnchorFn {
  return (nodeId, bounds, level, shownAs = nodeId) => {
    if (!out.anchors.has(nodeId)) out.anchors.set(nodeId, { nodeId, bounds, shownAs, level })
  }
}

/** Nodes below `rootId` without an anchor inherit their nearest anchored ancestor's. */
function inheritAnchors(fs: FsIndex, out: WorldLayout, rootId: NodeId, importance: ImportanceFn) {
  const walk = (id: NodeId, parent: Anchor | undefined) => {
    let a = out.anchors.get(id)
    if (!a && parent) {
      a = { nodeId: id, bounds: parent.bounds, shownAs: parent.shownAs, level: parent.level }
      out.anchors.set(id, a)
    }
    out.importance.set(id, importance(id))
    for (const c of fs.children(id)) walk(c.id, a)
  }
  walk(rootId, undefined)
}

export interface MainWorld { layout: WorldLayout; plan: PlanRegion; geography: Geography }

export function composeMainWorld(fs: FsIndex, importance: ImportanceFn = makeImportance(fs)): MainWorld {
  const root = fs.roots()[0]
  const themeOf = makeThemeOf(fs)
  const plan = planDrive(fs)
  const built = new Map<PlanArea, BuiltArea>()
  const build = (a: PlanArea) => {
    let b = built.get(a)
    if (!b) {
      b = buildArea(fs, a.nodeId, themeOf, a.prominence, importance, new Set(a.skip))
      built.set(a, b)
    }
    return b
  }
  const geography = layoutGeography(plan, (a) => { const b = build(a); return { w: b.w, d: b.d } })

  const out = emptyLayout({ rootId: root.id, kind: 'main', depth: 0 })
  out.ground = geography.land
  const anchor = anchorWriter(out)
  anchor(root.id, rectBox(geography.land, 0, 4), 'land')
  // Regions first, so a region keeps its own anchor even when its residual
  // area (same folder) is drawn inside it.
  for (const r of geography.regions) {
    out.regions.push({ nodeId: r.node.nodeId, rect: r.rect, metaphor: r.node.metaphor as Exclude<typeof r.node.metaphor, 'land'>, depth: r.node.depth, y: r.y, gate: r.gate })
    anchor(r.node.nodeId, rectBox(r.rect, 0, 3), 'region')
  }
  out.roads.push(...geography.roads)
  for (const a of geography.areas) emitArea(out, build(a.node), a.rect.x, a.rect.z, a.y, anchor)
  inheritAnchors(fs, out, root.id, importance)
  return { layout: out, plan, geography }
}

/** A box-world: the Stage 2 renderer rooted at `rootId`, on a ground of its own. */
export function composeBoxWorld(fs: FsIndex, rootId: NodeId, depth: number, importance: ImportanceFn = makeImportance(fs)): WorldLayout {
  const themeOf = makeThemeOf(fs)
  const built = buildArea(fs, rootId, themeOf, 'box', importance)
  const out = emptyLayout({ rootId, kind: 'box', depth })
  const margin = 6
  const x = -built.w / 2
  const z = -built.d / 2
  out.ground = { x: x - margin, z: z - margin, w: built.w + 2 * margin, d: built.d + 2 * margin }
  emitArea(out, built, x, z, 0.012, anchorWriter(out))
  inheritAnchors(fs, out, rootId, importance)
  return out
}

/** Caches worlds and answers "in which world is this node open?". */
export class WorldCatalog {
  readonly main: MainWorld
  private boxes = new Map<NodeId, WorldLayout>()
  readonly importance: ImportanceFn
  readonly rootId: NodeId

  constructor(private fs: FsIndex) {
    this.importance = makeImportance(fs)
    this.main = composeMainWorld(fs, this.importance)
    this.rootId = fs.roots()[0].id
  }

  /** The world rooted at `contextRoot` (C: is the main map). */
  get(contextRoot: NodeId): WorldLayout {
    if (contextRoot === this.rootId) return this.main.layout
    let w = this.boxes.get(contextRoot)
    if (!w) {
      w = composeBoxWorld(this.fs, contextRoot, this.depthOf(contextRoot), this.importance)
      this.boxes.set(contextRoot, w)
    }
    return w
  }

  /** The chain of worlds leading to `nodeId`: [C:, box, box inside it, ...]. */
  chainFor(nodeId: NodeId): NodeId[] {
    const chain = [this.rootId]
    for (let guard = 0; guard < 256; guard++) {
      const ctx = chain[chain.length - 1]
      const a = this.get(ctx).anchors.get(nodeId)
      if (!a) return chain
      const n = this.fs.get(nodeId)
      const visible = a.shownAs === nodeId && (n?.type === 'file' || OPEN_LEVELS.has(a.level))
      if (visible || ctx === nodeId) return chain
      // Hidden in (or itself) a closed box: open the box that holds it.
      const box = a.shownAs
      if (box === ctx) return chain
      chain.push(box)
    }
    return chain
  }

  /** The world in which `nodeId` is open (folders) or visible (files). */
  contextFor(nodeId: NodeId): NodeId {
    const c = this.chainFor(nodeId)
    return c[c.length - 1]
  }

  /** Number of boxes opened to reach the box-world of `boxId`, without building that world. */
  private depthOf(boxId: NodeId): number {
    let ctx = this.rootId
    for (let depth = 1; depth < 256; depth++) {
      const a = this.get(ctx).anchors.get(boxId)
      if (!a || a.shownAs === boxId) return depth
      ctx = a.shownAs
    }
    return 1
  }

  context(contextRoot: NodeId): WorldContext {
    return this.get(contextRoot).context
  }
}
