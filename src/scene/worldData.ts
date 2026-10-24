import { computeLayout, type AABB, type WorldLayout } from '../mapping/layout'
import type { ThemeId } from '../mapping/plan'
import type { NodeId } from '../model/types'
import { fs } from '../state/store'

/** The world layout for the default view, computed once. */
export const layout: WorldLayout = computeLayout(fs)

export const anchorOf = (id: NodeId) => layout.anchors.get(id)

export function center(b: AABB): [number, number, number] {
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2]
}

/** Is `id` the same as or inside `ancestorId`? */
export function isWithin(id: NodeId, ancestorId: NodeId): boolean {
  return fs.ancestry(id).some((n) => n.id === ancestorId)
}

// ---------- Materials palette ----------

export interface ThemePalette {
  ground: string
  wall: string
  wallCap: string
  floor: string
  lobbyFloor: string
  wood: string
  woodDark: string
  accent: string
}

export const PALETTE: Record<ThemeId, ThemePalette> = {
  business: { ground: '#ddd6ca', wall: '#efe9df', wallCap: '#d9cfbf', floor: '#e6dfd3', lobbyFloor: '#d8cbb6', wood: '#7a5a40', woodDark: '#5d4330', accent: '#b8925a' },
  studio: { ground: '#d9c7a8', wall: '#f3ece1', wallCap: '#c49a6c', floor: '#d4b08a', lobbyFloor: '#c9a47c', wood: '#b98c5d', woodDark: '#9a7049', accent: '#d97a4a' },
  gallery: { ground: '#e3c9b5', wall: '#f8f6f2', wallCap: '#e2d8cc', floor: '#ece6dd', lobbyFloor: '#e0d6c9', wood: '#4b4440', woodDark: '#3a3431', accent: '#8a6cb8' },
  home: { ground: '#b9c99c', wall: '#f2e8d8', wallCap: '#c8775a', floor: '#dcc6a3', lobbyFloor: '#d2b892', wood: '#a37a55', woodDark: '#86603f', accent: '#c8775a' },
  system: { ground: '#c4c7c6', wall: '#d3d6d8', wallCap: '#a9aeb3', floor: '#c2c6ca', lobbyFloor: '#b8bcc1', wood: '#8d949c', woodDark: '#737a82', accent: '#7d8796' },
}

export const LAND = { grass: '#b5c79a', base: '#7d6a55', baseTop: '#a08a70', path: '#ebe5da', avenue: '#e4ddd0' }
