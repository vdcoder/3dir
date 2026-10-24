// Visualization/mapping configuration: how canonical nodes are placed in the
// world. Kept separate from src/model so one dataset can have several views
// (charter section 7). The actual importance rules and layouts come later.

import type { NodeId } from '../model/types'

/** One way of presenting the same dataset, e.g. a personal or professional look. */
export interface ViewConfig {
  id: string
  name: string
  /** Curated importance per node, 0..1. Nodes not listed fall back to rules. */
  importance: Record<NodeId, number>
}

/** Where a node appears in the world. A node may later get several placements. */
export interface Placement {
  nodeId: NodeId
  position: [number, number, number]
  rotationY: number
  scale: number
  /** True when shown above its real depth (a promoted nested destination). */
  promoted: boolean
}
