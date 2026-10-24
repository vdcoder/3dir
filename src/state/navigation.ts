// Pure navigation/selection rules shared by the 2D explorer and the 3D world.
// Meanings (charter section 5):
//   selection     - the one item a view is pointing at (highlight + details)
//   current folder - the folder whose contents the 2D list shows
//   expansion     - which tree nodes are open in the 2D tree
//   world focus   - the folder the 3D camera is "in" (what's framed and detailed)
//
// Linked ON:
//   2D select   -> world highlights the same item, camera does NOT move
//   2D open     -> world focus follows (camera moves)
//   3D select   -> 2D shows the item's folder and selects it
//   3D enter    -> 2D current folder follows
// Linked OFF: views are independent. Show in World / Show in Explorer always act.

import type { FsIndex } from '../model/fs'
import type { NodeId } from '../model/types'

export interface ExplorerState {
  folderId: NodeId
  selectedId: NodeId | null
  expanded: NodeId[]
  back: NodeId[]
  forward: NodeId[]
}

export interface WorldState {
  focusId: NodeId
  selectedId: NodeId | null
  /** Bumped when the camera should (re)frame `frameId`, even if focus didn't change. */
  frameNonce: number
  /** What the camera should frame: the focus folder or a specific item in it. */
  frameId: NodeId
}

export interface NavState {
  linked: boolean
  explorer: ExplorerState
  world: WorldState
}

export function initialNav(fs: FsIndex, rootId: NodeId, explorerFolderId = rootId): NavState {
  return {
    linked: true,
    explorer: {
      folderId: explorerFolderId,
      selectedId: null,
      expanded: withAncestors(fs, explorerFolderId, []),
      back: [],
      forward: [],
    },
    world: { focusId: rootId, selectedId: null, frameNonce: 0, frameId: rootId },
  }
}

/** Expanded list plus every ancestor folder of id (so it is visible in the tree). */
function withAncestors(fs: FsIndex, id: NodeId, expanded: NodeId[]): NodeId[] {
  const set = new Set(expanded)
  const chain = fs.ancestry(id)
  for (const n of chain.slice(0, -1)) set.add(n.id)
  if (fs.get(id)?.type === 'folder') set.add(id)
  return [...set]
}

/** The folder an item lives in, or the item itself when it is a folder. */
export function folderOf(fs: FsIndex, id: NodeId): NodeId {
  const n = fs.get(id)
  if (!n) return id
  return n.type === 'folder' ? n.id : (n.parentId ?? n.id)
}

function explorerGo(fs: FsIndex, e: ExplorerState, folderId: NodeId, selectedId: NodeId | null, pushHistory = true): ExplorerState {
  const moved = folderId !== e.folderId
  return {
    folderId,
    selectedId,
    expanded: withAncestors(fs, folderId, e.expanded),
    back: moved && pushHistory ? [...e.back, e.folderId].slice(-50) : e.back,
    forward: moved && pushHistory ? [] : e.forward,
  }
}

function worldGo(w: WorldState, focusId: NodeId, frameId: NodeId = focusId): WorldState {
  return { ...w, focusId, frameId, frameNonce: w.frameNonce + 1 }
}

// ---- 2D explorer actions ----

export function explorerSelect(fs: FsIndex, s: NavState, id: NodeId | null): NavState {
  const explorer = { ...s.explorer, selectedId: id }
  const world = s.linked ? { ...s.world, selectedId: id } : s.world
  void fs
  return { ...s, explorer, world }
}

export function explorerOpen(fs: FsIndex, s: NavState, folderId: NodeId): NavState {
  if (fs.get(folderId)?.type !== 'folder') return s
  const explorer = explorerGo(fs, s.explorer, folderId, null)
  const world = s.linked ? { ...worldGo(s.world, folderId), selectedId: null } : s.world
  return { ...s, explorer, world }
}

export function explorerBack(fs: FsIndex, s: NavState): NavState {
  const prev = s.explorer.back.at(-1)
  if (!prev) return s
  const e = s.explorer
  const explorer: ExplorerState = {
    ...explorerGo(fs, e, prev, null, false),
    back: e.back.slice(0, -1),
    forward: [e.folderId, ...e.forward],
  }
  const world = s.linked ? { ...worldGo(s.world, prev), selectedId: null } : s.world
  return { ...s, explorer, world }
}

export function explorerForward(fs: FsIndex, s: NavState): NavState {
  const next = s.explorer.forward[0]
  if (!next) return s
  const e = s.explorer
  const explorer: ExplorerState = {
    ...explorerGo(fs, e, next, null, false),
    back: [...e.back, e.folderId],
    forward: e.forward.slice(1),
  }
  const world = s.linked ? { ...worldGo(s.world, next), selectedId: null } : s.world
  return { ...s, explorer, world }
}

export function explorerUp(fs: FsIndex, s: NavState): NavState {
  const parent = fs.get(s.explorer.folderId)?.parentId
  if (!parent) return s
  const next = explorerOpen(fs, s, parent)
  // Keep the folder we came from selected, like Windows Explorer.
  return explorerSelect(fs, next, s.explorer.folderId)
}

export function toggleExpanded(s: NavState, id: NodeId): NavState {
  const has = s.explorer.expanded.includes(id)
  const expanded = has ? s.explorer.expanded.filter((x) => x !== id) : [...s.explorer.expanded, id]
  return { ...s, explorer: { ...s.explorer, expanded } }
}

// ---- 3D world actions ----

export function worldSelect(fs: FsIndex, s: NavState, id: NodeId | null): NavState {
  const world = { ...s.world, selectedId: id }
  if (!s.linked || id === null) return { ...s, world }
  const n = fs.get(id)
  if (!n) return { ...s, world }
  // Show the item inside its folder in 2D, selected.
  const parent = n.parentId ?? n.id
  const explorer = explorerGo(fs, s.explorer, parent, id)
  return { ...s, world, explorer }
}

export function worldEnter(fs: FsIndex, s: NavState, folderId: NodeId): NavState {
  if (fs.get(folderId)?.type !== 'folder') return s
  const world = { ...worldGo(s.world, folderId), selectedId: null }
  const explorer = s.linked ? explorerGo(fs, s.explorer, folderId, null) : s.explorer
  return { ...s, world, explorer }
}

export function worldUp(fs: FsIndex, s: NavState): NavState {
  const parent = fs.get(s.world.focusId)?.parentId
  if (!parent) return s
  const from = s.world.focusId
  const next = worldEnter(fs, s, parent)
  // Keep the place we left identified, in both views when linked.
  return worldSelect(fs, next, from)
}

// ---- Explicit commands (work regardless of linking) ----

export function showInWorld(fs: FsIndex, s: NavState, id: NodeId): NavState {
  const n = fs.get(id)
  if (!n) return s
  const focus = n.type === 'folder' ? n.id : (n.parentId ?? n.id)
  const world: WorldState = { ...worldGo(s.world, focus, id), selectedId: id }
  return { ...s, world }
}

export function showInExplorer(fs: FsIndex, s: NavState, id: NodeId): NavState {
  const n = fs.get(id)
  if (!n) return s
  const parent = n.parentId ?? n.id
  return { ...s, explorer: explorerGo(fs, s.explorer, parent, id) }
}

/** Search result: an explicit "take me there" in both views. */
export function goTo(fs: FsIndex, s: NavState, id: NodeId): NavState {
  return showInWorld(fs, showInExplorer(fs, s, id), id)
}

export function setLinked(fs: FsIndex, s: NavState, linked: boolean): NavState {
  if (!linked) return { ...s, linked }
  // Turning linking back on: the world adopts the explorer's selection only.
  // The camera stays where it is (no silent teleport).
  void fs
  return { ...s, linked, world: { ...s.world, selectedId: s.explorer.selectedId } }
}
