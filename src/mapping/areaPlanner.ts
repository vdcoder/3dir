// Stage 1a — the area planner (Spatial Compiler α.v1).
//
// Decides, for the whole drive, which folders deserve their own prominent
// area and how their ancestors are drawn. Importance promotion through nested
// absorption:
//   - a folder with curated importance >= PROMOTE_AT becomes an AREA, rendered
//     by the Stage 2 area renderer (campus if >= CAMPUS_AT);
//   - an ancestor of such a folder becomes a REGION: drawn only as geography
//     (district streets, a city block, a fenced yard, a brick square...), so
//     it costs little space or architecture but stays visibly around it;
//   - a region's (or the drive's) remaining files and subfolders form its
//     RESIDUAL area, rendered compactly by Stage 2.
// Every folder is covered exactly once, the canonical hierarchy is never
// altered, and nothing is invented: regions and areas are real folders.

import type { FsIndex } from '../model/fs'
import type { NodeId } from '../model/types'
import { curatedImportance } from './importance'
import { CAMPUS_AT, PROMOTE_AT, THEMES, type ThemeId } from './plan'
import type { AbsorberMetaphor, Prominence } from './types'

export interface PlanArea {
  kind: 'area'
  nodeId: NodeId
  prominence: Prominence
  importance: number
  /** For a residual area: children drawn elsewhere (as their own areas/regions). */
  skip: NodeId[]
  residual: boolean
}

export interface PlanRegion {
  kind: 'region' | 'land'
  nodeId: NodeId
  metaphor: AbsorberMetaphor | 'land'
  /** 0 for the land (C:), 1 for the outermost region below it, ... */
  depth: number
  /** Importance of the most important thing inside. */
  importance: number
  children: PlanNode[]
}

export type PlanNode = PlanArea | PlanRegion

/** Metaphor of an absorber region by nesting depth (1 = outermost). */
export const METAPHORS: AbsorberMetaphor[] = ['district', 'block', 'yard', 'square', 'garden', 'court']
export const metaphorAt = (depth: number): AbsorberMetaphor => METAPHORS[Math.min(depth, METAPHORS.length) - 1]

export interface PlannerOptions {
  /** Curated importance by canonical path (defaults to plan.ts). */
  importance?: Record<string, number>
}

export function planDrive(fs: FsIndex, opts: PlannerOptions = {}): PlanRegion {
  const root = fs.roots()[0]
  const curated = curatedImportance(fs, opts.importance)
  const promoted = (id: NodeId) => (curated.get(id) ?? 0) >= PROMOTE_AT

  // Most important promoted folder inside each folder (0 if none), stopping
  // at promoted folders: Stage 1 never promotes inside a promoted area.
  const below = new Map<NodeId, number>()
  const promotedBelow = (id: NodeId): number => {
    const hit = below.get(id)
    if (hit !== undefined) return hit
    let best = 0
    for (const c of fs.children(id)) {
      if (c.type !== 'folder') continue
      best = Math.max(best, promoted(c.id) ? curated.get(c.id)! : promotedBelow(c.id))
    }
    below.set(id, best)
    return best
  }

  const plan = (id: NodeId, depth: number): PlanRegion => {
    const children: PlanNode[] = []
    const drawnElsewhere: NodeId[] = []
    for (const c of fs.children(id)) {
      if (c.type !== 'folder') continue
      if (promoted(c.id)) {
        const imp = curated.get(c.id)!
        children.push({ kind: 'area', nodeId: c.id, prominence: imp >= CAMPUS_AT ? 'campus' : 'major', importance: imp, skip: [], residual: false })
        drawnElsewhere.push(c.id)
      } else if (promotedBelow(c.id) > 0) {
        children.push(plan(c.id, depth + 1))
        drawnElsewhere.push(c.id)
      }
    }
    // Whatever is left (files, unremarkable subfolders) stays with this folder.
    const rest = fs.children(id).some((c) => !drawnElsewhere.includes(c.id))
    if (rest) children.push({ kind: 'area', nodeId: id, prominence: 'minor', importance: 0.3, skip: drawnElsewhere, residual: true })
    return {
      kind: depth === 0 ? 'land' : 'region',
      nodeId: id,
      metaphor: depth === 0 ? 'land' : metaphorAt(depth),
      depth,
      importance: Math.max(promotedBelow(id), 0.3),
      children,
    }
  }
  return plan(root.id, 0)
}

/** Theme of a folder: the nearest configured ancestor's (plan.ts THEMES). */
export function makeThemeOf(fs: FsIndex, themes: Record<string, ThemeId> = THEMES): (id: NodeId) => ThemeId {
  const byId = new Map<NodeId, ThemeId>()
  for (const [p, t] of Object.entries(themes)) {
    const n = fs.resolve(p)
    if (n) byId.set(n.id, t)
  }
  const cache = new Map<NodeId, ThemeId>()
  return (id: NodeId) => {
    const hit = cache.get(id)
    if (hit) return hit
    let t: ThemeId = 'home'
    for (const n of [...fs.ancestry(id)].reverse()) {
      const v = byId.get(n.id)
      if (v) { t = v; break }
    }
    cache.set(id, t)
    return t
  }
}

/** Every area in a plan (depth-first), for tests and tooling. */
export function planAreas(p: PlanNode): PlanArea[] {
  return p.kind === 'area' ? [p] : p.children.flatMap(planAreas)
}

export function planRegions(p: PlanNode): PlanRegion[] {
  return p.kind === 'area' ? [] : [p, ...p.children.flatMap(planRegions)]
}
