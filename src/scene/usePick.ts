import { useCallback } from 'react'
import type { NodeId } from '../model/types'
import { fs, useStore } from '../state/store'

export type PickKind = 'click' | 'double' | 'over' | 'out'

/** Shared pointer behavior for every pickable thing in the world. */
export function usePick() {
  return useCallback((id: NodeId | null, kind: PickKind) => {
    const s = useStore.getState()
    if (kind === 'over') {
      if (s.hoverId !== id) s.setHover(id)
      document.body.style.cursor = id ? 'pointer' : ''
      return
    }
    if (kind === 'out') {
      if (s.hoverId === id) s.setHover(null)
      document.body.style.cursor = ''
      return
    }
    if (kind === 'click') {
      s.worldSelect(id)
      return
    }
    // Double click: enter folders, open files.
    if (!id) return
    const n = fs.get(id)
    if (n?.type === 'folder') s.worldEnter(id)
    else if (n) { s.worldSelect(id); s.openPreview(id) }
  }, [])
}
