// Landmarks are part of the compiled world, not decoration: their places are
// chosen here, deterministically, from the curated list in plan.ts.

import type { FsIndex } from '../model/fs'
import { LANDMARKS } from './plan'
import type { LandmarkEntity, WorldLayout } from './types'

/** How far a pin rises above what holds its folder. */
export const PIN_RISE = 3.2
/** The clock tower's height and how far it stands in from the plaza's back-left corner. */
export const TOWER_HEIGHT = 13
const TOWER_INSET = 2.2

export function planLandmarks(fs: FsIndex, layout: WorldLayout): LandmarkEntity[] {
  const out: LandmarkEntity[] = []
  for (const l of LANDMARKS) {
    const n = fs.resolve(l.path)
    if (!n) continue
    if (l.kind === 'tower') {
      // In the plaza of the campus for that folder, wherever that campus is drawn.
      const area = layout.areas.find((a) => a.nodeId === n.id && a.plaza)
      if (!area?.plaza) continue
      const p = area.plaza
      out.push({ nodeId: n.id, kind: 'tower', title: l.title, pos: [p.x + TOWER_INSET, area.y, p.z + TOWER_INSET], top: TOWER_HEIGHT })
      continue
    }
    // Pins orient you on the big map; inside a box everything is already close.
    if (layout.context.kind !== 'main') continue
    const a = layout.anchors.get(n.id)
    if (!a) continue
    const b = layout.anchors.get(a.shownAs)?.bounds ?? a.bounds
    const base = b.max[1]
    out.push({ nodeId: n.id, kind: 'pin', title: l.title, pos: [(b.min[0] + b.max[0]) / 2, base, (b.min[2] + b.max[2]) / 2], top: base + PIN_RISE })
  }
  return out
}
