import { describe, expect, it } from 'vitest'
import { buildIndex } from '../model/fs'
import type { FsNode } from '../model/types'
import * as nav from './navigation'

const t = '2026-01-01T00:00:00Z'
const folder = (id: string, parentId: string | null): FsNode => ({ id, name: id, parentId, type: 'folder', created: t, modified: t })
const file = (id: string, parentId: string): FsNode => ({ id, name: id + '.pdf', parentId, type: 'file', kind: 'pdf', sizeBytes: 1, created: t, modified: t })

const fs = buildIndex({
  label: 'test',
  nodes: [folder('c', null), folder('users', 'c'), folder('a', 'users'), folder('finance', 'a'), file('report', 'finance'), file('memo', 'a')],
})
const start = () => nav.initialNav(fs, 'c')

describe('linked navigation ON', () => {
  it('2D select highlights in world without moving the camera', () => {
    const s = nav.explorerSelect(fs, start(), 'users')
    expect(s.world.selectedId).toBe('users')
    expect(s.world.focusId).toBe('c')
    expect(s.world.frameNonce).toBe(0)
  })

  it('2D open moves the world into the folder', () => {
    const s = nav.explorerOpen(fs, start(), 'finance')
    expect(s.world.focusId).toBe('finance')
    expect(s.world.frameNonce).toBe(1)
    expect(s.explorer.expanded).toEqual(expect.arrayContaining(['c', 'users', 'a', 'finance']))
  })

  it('3D select shows the item in its folder in 2D', () => {
    const s = nav.worldSelect(fs, start(), 'report')
    expect(s.explorer.folderId).toBe('finance')
    expect(s.explorer.selectedId).toBe('report')
    expect(s.world.focusId).toBe('c') // selecting doesn't move the camera either
  })

  it('3D enter updates the 2D current folder', () => {
    const s = nav.worldEnter(fs, start(), 'a')
    expect(s.explorer.folderId).toBe('a')
    expect(s.world.focusId).toBe('a')
  })

  it('3D up returns to the parent and keeps the previous place selected', () => {
    const s = nav.worldUp(fs, nav.worldEnter(fs, start(), 'finance'))
    expect(s.world.focusId).toBe('a')
    expect(s.world.selectedId).toBe('finance')
    expect(s.explorer.selectedId).toBe('finance')
  })
})

describe('linked navigation OFF', () => {
  const off = () => nav.setLinked(fs, start(), false)

  it('views navigate independently', () => {
    let s = nav.explorerOpen(fs, off(), 'finance')
    s = nav.explorerSelect(fs, s, 'report')
    expect(s.world.focusId).toBe('c')
    expect(s.world.selectedId).toBeNull()
    s = nav.worldEnter(fs, s, 'users')
    expect(s.explorer.folderId).toBe('finance')
  })

  it('Show in World and Show in Explorer still act', () => {
    let s = nav.showInWorld(fs, off(), 'report')
    expect(s.world.focusId).toBe('finance')
    expect(s.world.frameId).toBe('report')
    expect(s.world.selectedId).toBe('report')
    expect(s.explorer.folderId).toBe('c')
    s = nav.showInExplorer(fs, s, 'memo')
    expect(s.explorer.folderId).toBe('a')
    expect(s.explorer.selectedId).toBe('memo')
  })

  it('turning linking back on syncs selection but not the camera', () => {
    let s = nav.explorerSelect(fs, off(), 'memo')
    s = nav.setLinked(fs, s, true)
    expect(s.world.selectedId).toBe('memo')
    expect(s.world.frameNonce).toBe(0)
  })
})

describe('explorer history', () => {
  it('supports back, forward and up', () => {
    let s = nav.explorerOpen(fs, start(), 'users')
    s = nav.explorerOpen(fs, s, 'finance')
    s = nav.explorerBack(fs, s)
    expect(s.explorer.folderId).toBe('users')
    s = nav.explorerForward(fs, s)
    expect(s.explorer.folderId).toBe('finance')
    s = nav.explorerUp(fs, s)
    expect(s.explorer.folderId).toBe('a')
    expect(s.explorer.selectedId).toBe('finance')
  })
})
