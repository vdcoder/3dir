// Navigation and selection rules shared by the 2D explorer and the 3D world.
//
// Each view has:
//   location  - the folder it is "in" (explorer list, world camera focus)
//   history   - previous/next locations; only real navigation is recorded
//   selection - the item it points at; selecting NEVER navigates
// Commands:
//   Back / Forward  - move through that view's history
//   Up              - the canonical parent of the location (never history)
//   Overview        - the C: map
//   navigate        - open a folder (tree, list, double-click, label, pin)
//   reveal          - go to an item's folder and select it (Show in World /
//                     Show in Explorer / search)
// Linked ON: both views share location, history and selection; the camera
// moves only when the world's location changes or an item is revealed.
// Linked OFF: views are independent; reveal still works on its view.

import type { FsIndex } from '../model/fs'
import type { NodeId } from '../model/types'

export type View = 'explorer' | 'world'

export interface ViewNav {
  location: NodeId
  back: NodeId[]
  forward: NodeId[]
  selectedId: NodeId | null
}

export interface ExplorerNav extends ViewNav {
  /** Folders open in the tree. */
  expanded: NodeId[]
}

export interface WorldNav extends ViewNav {
  /** Bumped whenever the camera should (re)frame `frameId`. */
  frameNonce: number
  /** What the camera frames: the location, or a revealed item in it. */
  frameId: NodeId
}

export interface NavState {
  linked: boolean
  explorer: ExplorerNav
  world: WorldNav
}

const HISTORY_LIMIT = 100

export function initialNav(fs: FsIndex, rootId: NodeId): NavState {
  return {
    linked: true,
    explorer: { location: rootId, back: [], forward: [], selectedId: null, expanded: expandTo(fs, [], rootId) },
    world: { location: rootId, back: [], forward: [], selectedId: null, frameNonce: 0, frameId: rootId },
  }
}

/** `expanded` plus every folder from the root down to `id` (inclusive when it is a folder). */
function expandTo(fs: FsIndex, expanded: NodeId[], id: NodeId | null): NodeId[] {
  if (!id) return expanded
  const set = new Set(expanded)
  for (const n of fs.ancestry(id)) if (n.type === 'folder') set.add(n.id)
  return [...set]
}

/** The folder an item lives in, or the item itself when it is a folder. */
export function folderOf(fs: FsIndex, id: NodeId): NodeId {
  const n = fs.get(id)
  if (!n) return id
  return n.type === 'folder' ? n.id : (n.parentId ?? n.id)
}

// ---------- Primitive moves on one view ----------

function moved<T extends ViewNav>(v: T, location: NodeId, pushHistory = true): T {
  if (location === v.location) return v
  if (!pushHistory) return { ...v, location }
  return { ...v, location, back: [...v.back, v.location].slice(-HISTORY_LIMIT), forward: [] }
}

function withWorldFrame(w: WorldNav, frameId: NodeId): WorldNav {
  return { ...w, frameId, frameNonce: w.frameNonce + 1 }
}

/** Apply a change made in `view` to the other view as well when linked. */
function mirror(fs: FsIndex, s: NavState, view: View, prevWorldLocation: NodeId, frameId?: NodeId): NavState {
  let { explorer, world } = s
  if (s.linked) {
    const src = view === 'explorer' ? explorer : world
    if (view === 'explorer') world = { ...world, location: src.location, back: src.back, forward: src.forward, selectedId: src.selectedId }
    else explorer = { ...explorer, location: src.location, back: src.back, forward: src.forward, selectedId: src.selectedId }
  }
  explorer = { ...explorer, expanded: expandTo(fs, expandTo(fs, explorer.expanded, explorer.location), explorer.selectedId ? folderOf(fs, explorer.selectedId) : null) }
  // The camera moves when the world's location changed, or on an explicit reveal.
  if (frameId) world = withWorldFrame(world, frameId)
  else if (world.location !== prevWorldLocation) world = withWorldFrame(world, world.location)
  return { ...s, explorer, world }
}

function update(fs: FsIndex, s: NavState, view: View, fn: (v: ViewNav) => ViewNav, frameId?: NodeId): NavState {
  const prevWorld = s.world.location
  const next = view === 'explorer' ? { ...s, explorer: { ...s.explorer, ...fn(s.explorer) } } : { ...s, world: { ...s.world, ...fn(s.world) } }
  return mirror(fs, next, view, prevWorld, frameId)
}

// ---------- Commands ----------

/** Open a folder in a view (tree, list, world double-click, label, pin, breadcrumb). */
export function navigate(fs: FsIndex, s: NavState, view: View, folderId: NodeId, select: NodeId | null = null): NavState {
  if (fs.get(folderId)?.type !== 'folder') return s
  return update(fs, s, view, (v) => ({ ...moved(v, folderId), selectedId: select }))
}

export function back(fs: FsIndex, s: NavState, view: View): NavState {
  const v = s[view]
  const prev = v.back.at(-1)
  if (!prev) return s
  return update(fs, s, view, (x) => ({ ...x, location: prev, back: x.back.slice(0, -1), forward: [x.location, ...x.forward], selectedId: null }))
}

export function forward(fs: FsIndex, s: NavState, view: View): NavState {
  const next = s[view].forward[0]
  if (!next) return s
  return update(fs, s, view, (x) => ({ ...x, location: next, back: [...x.back, x.location].slice(-HISTORY_LIMIT), forward: x.forward.slice(1), selectedId: null }))
}

/** The canonical parent of the view's location; the folder we left stays selected. */
export function up(fs: FsIndex, s: NavState, view: View): NavState {
  const here = s[view].location
  const parent = fs.get(here)?.parentId
  if (!parent) return s
  return navigate(fs, s, view, parent, here)
}

export function overview(fs: FsIndex, s: NavState, view: View): NavState {
  return navigate(fs, s, view, fs.roots()[0].id)
}

/** Point at an item without going anywhere. */
export function select(fs: FsIndex, s: NavState, view: View, id: NodeId | null): NavState {
  return update(fs, s, view, (v) => ({ ...v, selectedId: id }))
}

/** Go to an item's folder in a view and select it there (Show in World / Show in Explorer). */
export function reveal(fs: FsIndex, s: NavState, view: View, id: NodeId): NavState {
  const n = fs.get(id)
  if (!n) return s
  const folder = n.type === 'folder' ? (n.parentId ?? n.id) : (n.parentId ?? n.id)
  // A folder is revealed inside its parent, like a file; the root is revealed as itself.
  const target = n.parentId ? folder : n.id
  const frame = view === 'world' || s.linked ? id : undefined
  return update(fs, s, view, (v) => ({ ...moved(v, target), selectedId: n.parentId ? id : null }), frame)
}

export function setLinked(fs: FsIndex, s: NavState, linked: boolean): NavState {
  if (!linked) return { ...s, linked }
  // Linking again: the explorer joins the world (the camera never jumps).
  const w = s.world
  const explorer: ExplorerNav = {
    ...s.explorer,
    location: w.location, back: w.back, forward: w.forward,
    selectedId: w.selectedId ?? s.explorer.selectedId,
    expanded: expandTo(fs, s.explorer.expanded, w.location),
  }
  return { ...s, linked, explorer, world: { ...w, selectedId: explorer.selectedId } }
}

export function toggleExpanded(s: NavState, id: NodeId): NavState {
  const has = s.explorer.expanded.includes(id)
  const expanded = has ? s.explorer.expanded.filter((x) => x !== id) : [...s.explorer.expanded, id]
  return { ...s, explorer: { ...s.explorer, expanded } }
}
