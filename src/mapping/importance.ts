// Importance of folders and files (0..1): curated values for named places,
// simple rules for everything else. Importance drives geography (Stage 1),
// label priority and ordering; it never follows size or file count.

import type { FsIndex } from '../model/fs'
import type { NodeId } from '../model/types'
import { IMPORTANCE } from './plan'

export type ImportanceFn = (id: NodeId) => number

export function makeImportance(fs: FsIndex, curatedByPath: Record<string, number> = IMPORTANCE): ImportanceFn {
  const curated = new Map<NodeId, number>()
  for (const [p, v] of Object.entries(curatedByPath)) {
    const n = fs.resolve(p)
    if (n) curated.set(n.id, v)
  }
  const cache = new Map<NodeId, number>()
  const importance = (id: NodeId): number => {
    const hit = cache.get(id)
    if (hit !== undefined) return hit
    let v = curated.get(id)
    if (v === undefined) {
      const n = fs.get(id)
      const parent = n?.parentId ? importance(n.parentId) : 0.5
      // Uncurated things inherit a little less of their parent's importance;
      // recently changed files get a small bump.
      v = n?.type === 'file' ? Math.min(1, parent * 0.8 + (n.modified >= '2026-09-01' ? 0.15 : 0)) : Math.min(parent * 0.85, 0.7)
    }
    cache.set(id, v)
    return v
  }
  return importance
}

/** Curated importance (or 0) only: what the area planner promotes. */
export function curatedImportance(fs: FsIndex, curatedByPath: Record<string, number> = IMPORTANCE): Map<NodeId, number> {
  const m = new Map<NodeId, number>()
  for (const [p, v] of Object.entries(curatedByPath)) {
    const n = fs.resolve(p)
    if (n) m.set(n.id, v)
  }
  return m
}
