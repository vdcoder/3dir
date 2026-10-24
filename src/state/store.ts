import { create } from 'zustand'
import { buildIndex, type FsIndex } from '../model/fs'
import type { NodeId } from '../model/types'
import { dataset, DEMO_USER } from '../data/seed'
import * as nav from './navigation'

export const fs: FsIndex = buildIndex(dataset)
export const ROOT_ID = fs.roots()[0].id
export const DEMO_HOME_ID = fs.resolve(`C:\\Users\\${DEMO_USER}`)?.id ?? ROOT_ID

interface Store extends nav.NavState {
  hoverId: NodeId | null
  previewId: NodeId | null
  /** The item the details card describes: the latest selection made in either view. */
  detailsId: NodeId | null
  explorerSelect(id: NodeId | null): void
  explorerOpen(id: NodeId): void
  explorerBack(): void
  explorerForward(): void
  explorerUp(): void
  toggleExpanded(id: NodeId): void
  worldSelect(id: NodeId | null): void
  worldEnter(id: NodeId): void
  worldUp(): void
  showInWorld(id: NodeId): void
  showInExplorer(id: NodeId): void
  goTo(id: NodeId): void
  setLinked(linked: boolean): void
  setHover(id: NodeId | null): void
  openPreview(id: NodeId | null): void
  closeDetails(): void
}

export const useStore = create<Store>((set) => {
  // Apply a pure navigation rule to the nav part of the store.
  const run =
    <A extends unknown[]>(fn: (fs: FsIndex, s: nav.NavState, ...args: A) => nav.NavState) =>
    (...args: A) =>
      set((s) => {
        const next = fn(fs, { linked: s.linked, explorer: s.explorer, world: s.world }, ...args)
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
    explorerSelect: run(nav.explorerSelect),
    explorerOpen: run(nav.explorerOpen),
    explorerBack: run(nav.explorerBack),
    explorerForward: run(nav.explorerForward),
    explorerUp: run(nav.explorerUp),
    toggleExpanded: (id) => set((s) => nav.toggleExpanded(s, id)),
    worldSelect: run(nav.worldSelect),
    worldEnter: run(nav.worldEnter),
    worldUp: run(nav.worldUp),
    showInWorld: run(nav.showInWorld),
    showInExplorer: run(nav.showInExplorer),
    goTo: run(nav.goTo),
    setLinked: run(nav.setLinked),
    setHover: (hoverId) => set({ hoverId }),
    closeDetails: () => set({ detailsId: null }),
    openPreview: (previewId) => set({ previewId }),
  }
})
