// World entity types shared by the area planner (Stage 1), the area renderer
// (Stage 2) and the scene. Everything is in world units (≈ metres in the
// miniature); fixtures and items face +Z (towards the default camera).

import type { FileKind, NodeId } from '../model/types'
import type { ThemeId } from './plan'

export type Vec3 = [number, number, number]
export interface AABB { min: Vec3; max: Vec3 }
export interface Rect { x: number; z: number; w: number; d: number }

export type ItemForm = 'spine' | 'box' | 'frame' | 'paper'
export type FixtureType = 'shelf' | 'table' | 'wall'
export type Prominence = 'campus' | 'major' | 'minor' | 'box'

export interface ItemEntity {
  nodeId: NodeId
  form: ItemForm
  kind: FileKind | 'folder'
  /** Center of the item. */
  pos: Vec3
  size: Vec3
  fixtureId: NodeId
}

export interface FixtureEntity {
  nodeId: NodeId
  type: FixtureType
  theme: ThemeId
  /** Center of the base (y = floor). */
  pos: Vec3
  size: Vec3
  levels: number
  bays: number
}

export interface CompartmentEntity {
  nodeId: NodeId
  fixtureId: NodeId
  /** Everything the compartment occupies (for framing and labels). */
  bounds: AABB
  /** One box per shelf level it occupies (for picking: never covers other files). */
  segments: AABB[]
}

export interface RoomEntity {
  nodeId: NodeId
  /** True for a building's own loose files (its "front desk"), not a subfolder. */
  lobby: boolean
  rect: Rect
  theme: ThemeId
  buildingId: NodeId
}

export interface BuildingEntity {
  nodeId: NodeId
  rect: Rect
  theme: ThemeId
  wallHeight: number
  /** The area (Stage 2 root) this building belongs to. */
  areaId: NodeId
  /** The building that holds an area root's own rooms and files. */
  main: boolean
}

export interface WallEntity {
  /** Center of the wall footprint at floor level. */
  pos: Vec3
  size: Vec3
  /** Outward normal on the ground plane, used for camera-facing cutaways. */
  normal: [number, number]
  exterior: boolean
  buildingId: NodeId
  theme: ThemeId
}

/** A Stage 2 root: a folder rendered as a compound of buildings (or one building). */
export interface AreaEntity {
  nodeId: NodeId
  rect: Rect
  theme: ThemeId
  prominence: Prominence
  /** Paved courtyard inside a campus. */
  plaza?: Rect
  /** Height of the ground plate (nested areas sit on top of their regions). */
  y: number
}

export type AbsorberMetaphor = 'district' | 'block' | 'yard' | 'square' | 'garden' | 'court'

/**
 * Stage 1: an ancestor folder drawn only as geography (roads, fences, paving,
 * a sign) because something important lies inside it.
 */
export interface RegionEntity {
  nodeId: NodeId
  rect: Rect
  metaphor: AbsorberMetaphor
  /** 1 for the outermost absorber below C:, 2 inside it, ... */
  depth: number
  y: number
  /** Where the entrance and its sign are (front edge). */
  gate: [number, number]
}

/** Streets, highways and paths drawn between the things in a region. */
export interface RoadEntity {
  rect: Rect
  kind: 'highway' | 'street' | 'path'
  y: number
}

export type AnchorLevel = 'land' | 'region' | 'area' | 'building' | 'room' | 'fixture' | 'compartment' | 'item' | 'box'

/** Levels whose contents are visible: the folder can be "stood in". */
export const OPEN_LEVELS: ReadonlySet<AnchorLevel> = new Set(['land', 'region', 'area', 'building', 'room', 'fixture', 'compartment'])

/** How specific a level is, for resolving overlapping clicks (higher wins). */
export const SPECIFICITY: Record<AnchorLevel, number> = { land: 0, region: 1, area: 2, building: 3, room: 4, fixture: 5, compartment: 6, box: 7, item: 7 }

export interface Anchor {
  nodeId: NodeId
  bounds: AABB
  /** The nearest node that is drawn in this world (itself when visible). */
  shownAs: NodeId
  level: AnchorLevel
}

export interface WorldContext {
  /** Folder this world is rooted at (C: for the main map). */
  rootId: NodeId
  kind: 'main' | 'box'
  /** 0 for the main map, 1 for a box opened from it, ... */
  depth: number
}

export interface WorldLayout {
  context: WorldContext
  /** The ground everything stands on. */
  ground: Rect
  regions: RegionEntity[]
  roads: RoadEntity[]
  areas: AreaEntity[]
  buildings: BuildingEntity[]
  rooms: RoomEntity[]
  walls: WallEntity[]
  fixtures: FixtureEntity[]
  compartments: CompartmentEntity[]
  items: ItemEntity[]
  anchors: Map<NodeId, Anchor>
  importance: Map<NodeId, number>
}
