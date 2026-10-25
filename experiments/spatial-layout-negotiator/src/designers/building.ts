// Designer C — Building. Rooms in rows of k (k = 1..R); rooms in a row share
// one depth; walls, corridors and an entrance hall separate them. A building's
// own loose files get a dedicated files room in the first row.

import type { Config } from '../config.ts'
import type { BuildingNode, LayoutNode, RoomNode } from '../model.ts'
import type { RowFrame } from '../rows.ts'
import { rowContainer } from './rowContainer.ts'

export const filesRoom = (b: BuildingNode): RoomNode => ({ kind: 'room', name: `${b.name} · files`, path: b.path, shelves: [], files: b.files, synthetic: true })

export const building = rowContainer<BuildingNode>({
  kind: 'building',
  childrenOf: (b): LayoutNode[] => [...(b.files.length ? [filesRoom(b)] : []), ...b.rooms],
  frame: (cfg) => buildingFrame(cfg),
  // 20% goes to walls/partitions (x) and corridors, the hall and setbacks (y); rooms get the rest.
  growth: () => ({ padShareX: 0.5, rowMode: () => 'proportional', rowSlack: () => 'items', weightsY: { padT: 0.5, padB: 1, gapY: 1.5, band: 0 } }),
  empty: () => ({ w: 4, d: 4 }),
  door: () => ({ w: 1.8, label: 'main entrance' }),
})

export function buildingFrame(cfg: Config): RowFrame {
  const c = cfg.building
  return {
    padL: { size: c.wall, role: 'wall', label: 'exterior wall' },
    padR: { size: c.wall, role: 'wall', label: 'exterior wall' },
    padT: { size: c.rear, role: 'wall', label: 'rear wall' },
    padB: { size: c.entrance, role: 'entrance', label: 'entrance hall' },
    gapX: { size: c.roomWall, role: 'wall', label: 'partition' },
    gapY: { size: c.corridor, role: 'corridor', label: 'corridor' },
  }
}
