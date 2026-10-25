// Designer E (α.v3) — Area. Measurement is α.v2's seeded packing unchanged
// (with balanced child-offer sampling by default): each attempt picks one offer
// per child and packs the exact child rectangles with separation P. An area's
// size is fixed by that measurement. Arrangement uses the saved blueprint
// exactly: the area is placed at its measured size and every child receives
// precisely its selected offer's dimensions. Nothing is stretched.

import type { AreaNode } from '../model.ts'
import type { Designer, Measured, Placed } from '../protocol.ts'
import { areaDesigner } from '../designers/area.ts'
import { exactSize } from './rowsV3.ts'

export const areaV3: Designer<AreaNode> = {
  children: areaDesigner.children,
  measure: areaDesigner.measure,
  arrange(m: Measured<AreaNode>, offer, env, ctx): Placed {
    exactSize(m, offer, env)
    // With no surplus, the α.v2 blueprint mapping is the identity: positions and sizes are the blueprint's.
    const p = areaDesigner.arrange(m, offer, env, ctx)
    return { ...p, meta: { ...p.meta, v3: true } }
  },
}
