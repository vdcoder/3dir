// Click resolution policy, shared by every pickable thing in the world.
//
// The world is nested: a binder sits inside its shelf, the shelf in a room,
// the room in a building. A ray often grazes a container (a shelf's side
// panel, a compartment's volume) just before the thing the user aimed at.
// Rule: the nearest hit wins, unless something nested inside it is hit almost
// as near (within `reach`); then the most specific nested thing wins. An
// unrelated thing behind the nearest hit never wins. Decorative props and
// highlights are not pickable at all.

import type { NodeId } from '../model/types'
import { SPECIFICITY, type AnchorLevel } from '../mapping/types'

export interface PickHit {
  nodeId: NodeId
  level: AnchorLevel
  distance: number
}

export const PICK_REACH = 0.45

/**
 * @param isWithin (a, b) => is node a the same as or inside node b (canonically)
 */
export function resolvePick(hits: PickHit[], isWithin: (a: NodeId, b: NodeId) => boolean, reach = PICK_REACH): PickHit | null {
  if (hits.length === 0) return null
  const sorted = [...hits].sort((a, b) => a.distance - b.distance)
  const first = sorted[0]
  let best = first
  for (const h of sorted) {
    if (h.distance > first.distance + reach) break
    if (h.nodeId !== first.nodeId && !isWithin(h.nodeId, first.nodeId)) continue
    if (SPECIFICITY[h.level] > SPECIFICITY[best.level]) best = h
  }
  return best
}
