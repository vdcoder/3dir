// Designer D — Campus. Buildings in rows of k (k = 1..B) sharing row depths,
// separated by paths and streets, inside a boundary, with an entrance plaza at
// the front and, with two or more rows, a central courtyard between them.
// The campus's own loose files get a dedicated file building in the first row.

import type { Config } from '../config.ts'
import type { BuildingNode, CampusNode, LayoutNode } from '../model.ts'
import type { RowFrame } from '../rows.ts'
import { rowContainer } from './rowContainer.ts'

export const fileBuilding = (c: CampusNode): BuildingNode => ({ kind: 'building', name: `${c.name} · files`, path: c.path, rooms: [], files: c.files, synthetic: true })

export const campus = rowContainer<CampusNode>({
  kind: 'campus',
  childrenOf: (c): LayoutNode[] => [...(c.files.length ? [fileBuilding(c)] : []), ...c.buildings],
  frame: (cfg, rowCount) => campusFrame(cfg, rowCount),
  // The courtyard and plaza take the largest part of the campus's own share. Buildings stand
  // free: a short row spreads its buildings out (open ground) instead of stretching them.
  growth: () => ({ padShareX: 0.4, rowMode: () => 'proportional', rowSlack: () => 'gaps', weightsY: { padT: 0.5, padB: 1, gapY: 1, band: 2 } }),
  empty: () => ({ w: 12, d: 12 }),
  door: () => ({ w: 6, label: 'campus gate' }),
})

export function campusFrame(cfg: Config, rowCount: number): RowFrame {
  const c = cfg.campus
  return {
    padL: { size: c.boundary, role: 'boundary', label: 'boundary' },
    padR: { size: c.boundary, role: 'boundary', label: 'boundary' },
    padT: { size: c.boundary, role: 'boundary', label: 'boundary' },
    padB: { size: c.entrance, role: 'plaza', label: 'entrance plaza' },
    gapX: { size: c.path, role: 'path', label: 'path' },
    gapY: { size: c.street, role: 'street', label: 'street' },
    // A recognizable courtyard in the middle of the campus (its size is part of the minimum).
    bands: rowCount >= 2 ? [{ after: Math.ceil(rowCount / 2) - 1, size: c.courtyard, role: 'courtyard', label: 'central courtyard' }] : [],
    minW: 12,
    minD: 12,
  }
}
