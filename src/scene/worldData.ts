import { createContext, useContext } from 'react'
import type { ThemeId } from '../mapping/plan'
import type { AABB, AbsorberMetaphor, WorldLayout } from '../mapping/types'
import type { NodeId } from '../model/types'
import { catalog, fs } from '../state/store'

/** The world currently shown (main map or a box-world). */
export const LayoutContext = createContext<WorldLayout>(catalog.main.layout)
export const useLayout = () => useContext(LayoutContext)

export function center(b: AABB): [number, number, number] {
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2]
}

/** Is `id` the same as or inside `ancestorId`? */
export function isWithin(id: NodeId, ancestorId: NodeId): boolean {
  for (let n = fs.get(id); n; n = n.parentId ? fs.get(n.parentId) : undefined) if (n.id === ancestorId) return true
  return false
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
  medical: { ground: '#e6e7e1', wall: '#fbfbf8', wallCap: '#d7e4e1', floor: '#eef0ec', lobbyFloor: '#e2e8e5', wood: '#8a6a4e', woodDark: '#6b5240', accent: '#2a8a80' },
  studio: { ground: '#d9c7a8', wall: '#f3ece1', wallCap: '#c49a6c', floor: '#d4b08a', lobbyFloor: '#c9a47c', wood: '#b98c5d', woodDark: '#9a7049', accent: '#d97a4a' },
  gallery: { ground: '#e3c9b5', wall: '#f8f6f2', wallCap: '#e2d8cc', floor: '#ece6dd', lobbyFloor: '#e0d6c9', wood: '#4b4440', woodDark: '#3a3431', accent: '#8a6cb8' },
  home: { ground: '#b9c99c', wall: '#f2e8d8', wallCap: '#c8775a', floor: '#dcc6a3', lobbyFloor: '#d2b892', wood: '#a37a55', woodDark: '#86603f', accent: '#c8775a' },
  system: { ground: '#c4c7c6', wall: '#d3d6d8', wallCap: '#a9aeb3', floor: '#c2c6ca', lobbyFloor: '#b8bcc1', wood: '#8d949c', woodDark: '#737a82', accent: '#7d8796' },
}

export const LAND = { grass: '#b5c79a', base: '#7d6a55', baseTop: '#a08a70', path: '#ebe5da', avenue: '#e4ddd0' }

/** Ground and border look of each absorber metaphor (Stage 1 geography). */
export const REGION_LOOK: Record<AbsorberMetaphor, { floor: string; border: string; sign: string }> = {
  district: { floor: '#a3b987', border: '#d8d4cb', sign: '#3d4650' },
  block: { floor: '#cfd8bd', border: '#e4e0d6', sign: '#4b5a3c' },
  yard: { floor: '#d6d4cf', border: '#8c8274', sign: '#5d5348' },
  square: { floor: '#b9785e', border: '#9b5a44', sign: '#6d3b2a' },
  garden: { floor: '#d8d2c2', border: '#6f8f5a', sign: '#45603a' },
  court: { floor: '#e2dccf', border: '#b7ab97', sign: '#6a604f' },
}

// ---------- Building identity colors ----------

const NAMED_ACCENT: Partial<Record<ThemeId, Record<string, string>>> = {
  business: { Finance: '#2f6b4f', Contracts: '#7a2f38', Operations: '#34557a', Board: '#a8813a', Strategy: '#2d7a78', 'Shared with me': '#8a817a' },
  medical: { Finance: '#2a7f74', Operations: '#3b6ea8', Legal: '#6d4c8f', Clients: '#d0704f' },
  studio: { Projects: '#c0643c', Documents: '#55783f' },
  gallery: { Pictures: '#7b4f8e' },
  home: { Amanda: '#c8775a', Victor: '#6f8f6a', Elena: '#5d86b0', Guest: '#b59a6a', Public: '#8f8a84' },
  system: { Windows: '#5b7590', 'Program Files': '#6d7f8f', 'Program Files (x86)': '#7d8b97', ProgramData: '#8a949c' },
}
const SPARE = ['#6b8e7f', '#a0765a', '#5f7aa0', '#9a6a8a', '#7c8f4e', '#b07a46']

/** The signature color of a building (roofline, sign, rugs, label). */
export function accentOf(buildingId: NodeId, theme: ThemeId): string {
  const name = fs.get(buildingId)?.name ?? ''
  const named = NAMED_ACCENT[theme]?.[name]
  if (named) return named
  let h = 0
  for (const ch of buildingId) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return theme === 'system' ? PALETTE.system.accent : SPARE[h % SPARE.length]
}

/** Box-worlds get a slightly different atmosphere so you know you're inside a box. */
export function atmosphere(layout: WorldLayout) {
  if (layout.context.kind === 'main') return { hemiSky: '#fdf8ef', hemiGround: '#a99f8c', sun: '#ffefd8', exposure: 1.05, background: 'main' as const }
  const warm = layout.context.depth % 2 === 1
  return warm
    ? { hemiSky: '#fff1dc', hemiGround: '#b49a74', sun: '#ffe2b8', exposure: 1.0, background: 'box-warm' as const }
    : { hemiSky: '#eef3f8', hemiGround: '#9aa3ad', sun: '#f3f1ea', exposure: 1.0, background: 'box-cool' as const }
}
