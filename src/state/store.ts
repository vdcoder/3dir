import { create } from 'zustand'
import { buildIndex, type FsIndex } from '../model/fs'
import type { NodeId } from '../model/types'
import { dataset, DEMO_USER } from '../data/seed'
import { WorldCatalog } from '../mapping/world'
import * as nav from './navigation'

export const fs: FsIndex = buildIndex(dataset)
export const ROOT_ID = fs.roots()[0].id
export const DEMO_HOME_ID = fs.resolve(`C:\\Users\\${DEMO_USER}`)?.id ?? ROOT_ID
/** All worlds: the main map and box-worlds (built on demand, cached). */
export const catalog = new WorldCatalog(fs)

type View = nav.View

interface Store extends nav.NavState {
  hoverId: NodeId | null
  previewId: NodeId | null
  /** The item the inspector describes: the latest selection made in either view. */
  detailsId: NodeId | null
  /** Alt held: show every interactive target and its name. */
  revealMode: boolean

  navigate(view: View, folderId: NodeId, select?: NodeId | null): void
  back(view: View): void
  forward(view: View): void
  up(view: View): void
  overview(view: View): void
  select(view: View, id: NodeId | null): void
  reveal(view: View, id: NodeId): void
  /** Search result: reveal it in the world (and in the explorer when unlinked). */
  goTo(id: NodeId): void
  setLinked(linked: boolean): void
  toggleExpanded(id: NodeId): void
  setHover(id: NodeId | null): void
  openPreview(id: NodeId | null): void
  closeDetails(): void
  setRevealMode(on: boolean): void

  // Short names used across the UI.
  explorerOpen(id: NodeId): void
  explorerSelect(id: NodeId | null): void
  worldEnter(id: NodeId): void
  worldSelect(id: NodeId | null): void
  showInWorld(id: NodeId): void
  showInExplorer(id: NodeId): void
}

export const useStore = create<Store>((set) => {
  // Apply a pure navigation rule; the inspector follows the latest selection.
  const apply = (fn: (s: nav.NavState) => nav.NavState) =>
    set((s) => {
      const next = fn({ linked: s.linked, explorer: s.explorer, world: s.world })
      let detailsId = s.detailsId
      if (next.world.selectedId !== s.world.selectedId) detailsId = next.world.selectedId
      if (next.explorer.selectedId !== s.explorer.selectedId) detailsId = next.explorer.selectedId
      return { ...next, detailsId }
    })

  return {
    ...nav.initialNav(fs, ROOT_ID),
    hoverId: null,
    previewId: null,
    detailsId: null,
    revealMode: false,

    navigate: (view, id, sel = null) => apply((s) => nav.navigate(fs, s, view, id, sel)),
    back: (view) => apply((s) => nav.back(fs, s, view)),
    forward: (view) => apply((s) => nav.forward(fs, s, view)),
    up: (view) => apply((s) => nav.up(fs, s, view)),
    overview: (view) => apply((s) => nav.overview(fs, s, view)),
    select: (view, id) => apply((s) => nav.select(fs, s, view, id)),
    reveal: (view, id) => apply((s) => nav.reveal(fs, s, view, id)),
    goTo: (id) => apply((s) => {
      const w = nav.reveal(fs, s, 'world', id)
      return w.linked ? w : nav.reveal(fs, w, 'explorer', id)
    }),
    setLinked: (linked) => apply((s) => nav.setLinked(fs, s, linked)),
    toggleExpanded: (id) => set((s) => nav.toggleExpanded(s, id)),
    setHover: (hoverId) => set({ hoverId }),
    closeDetails: () => set({ detailsId: null }),
    openPreview: (previewId) => set({ previewId }),
    setRevealMode: (revealMode) => set({ revealMode }),

    explorerOpen: (id) => apply((s) => nav.navigate(fs, s, 'explorer', id)),
    explorerSelect: (id) => apply((s) => nav.select(fs, s, 'explorer', id)),
    worldEnter: (id) => apply((s) => nav.navigate(fs, s, 'world', id)),
    worldSelect: (id) => apply((s) => nav.select(fs, s, 'world', id)),
    showInWorld: (id) => apply((s) => nav.reveal(fs, s, 'world', id)),
    showInExplorer: (id) => apply((s) => nav.reveal(fs, s, 'explorer', id)),
  }
})

/** The folder whose world the camera is in (C: or an opened box). */
export const useContextRoot = () => useStore((s) => catalog.contextFor(s.world.location))
