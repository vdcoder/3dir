// Input: a canonical folder hierarchy, already shaped into the five kinds of
// container this experiment knows. Every node carries its real canonical path;
// the engine never invents folders. (A "files" room or building holds a
// folder's own loose files and keeps that folder's path; it is marked synthetic.)

export interface Book { name: string; w: number }

export interface ShelfNode { kind: 'shelf'; name: string; path: string; books: Book[] }
export interface RoomNode { kind: 'room'; name: string; path: string; shelves: ShelfNode[]; files: string[]; synthetic?: boolean }
export interface BuildingNode { kind: 'building'; name: string; path: string; rooms: RoomNode[]; files: string[]; synthetic?: boolean; importance?: number }
export interface CampusNode { kind: 'campus'; name: string; path: string; buildings: BuildingNode[]; files: string[]; importance?: number }
export interface AreaNode {
  kind: 'area'
  name: string
  path: string
  /** Child areas, campuses, and residual buildings (a folder's remaining contents). */
  children: (AreaNode | CampusNode | BuildingNode)[]
  /** 0..1; the most important child is favoured near the front of its area. */
  importance?: number
  /** Hierarchy level when drawn on its own (otherwise: the number of enclosing areas). */
  level?: number
}

export type LayoutNode = ShelfNode | RoomNode | BuildingNode | CampusNode | AreaNode
export type Kind = LayoutNode['kind']

/** A shelf from a count and an average width, when individual widths are unknown. */
export function shelfFromAverage(name: string, path: string, count: number, averageWidth: number): ShelfNode {
  return { kind: 'shelf', name, path, books: Array.from({ length: count }, (_, i) => ({ name: `${name} ${i + 1}`, w: averageWidth })) }
}

export const join = (parent: string, name: string) => `${parent}\\${name}`

/** Real canonical containment: `child` is `parent` or lies below it. */
export const within = (child: string, parent: string) => child === parent || child.startsWith(parent + '\\')
