import { describe, expect, it } from 'vitest'
import { buildIndex } from '../model/fs'
import type { FsNode } from '../model/types'
import * as nav from './navigation'

const t = '2026-01-01T00:00:00Z'
const folder = (id: string, parentId: string | null): FsNode => ({ id, name: id, parentId, type: 'folder', created: t, modified: t })
const file = (id: string, parentId: string): FsNode => ({ id, name: id + '.pdf', parentId, type: 'file', kind: 'pdf', sizeBytes: 1, created: t, modified: t })

// c ─ users ─ a ─ finance ─ budgets ─ fy27 ─ draft.pdf
//                 └ memo.pdf     └ reports ─ q3
const fs = buildIndex({
  label: 'test',
  nodes: [
    folder('c', null), folder('users', 'c'), folder('a', 'users'), folder('finance', 'a'),
    folder('budgets', 'finance'), folder('fy27', 'budgets'), file('draft', 'fy27'),
    folder('reports', 'finance'), folder('q3', 'reports'), file('memo', 'a'),
  ],
})
const start = () => nav.initialNav(fs, 'c')
const W = 'world' as const
const E = 'explorer' as const

describe('selection never navigates', () => {
  it('3D selection keeps both locations and history (was: explorer jumped into the item folder)', () => {
    let s = nav.navigate(fs, start(), W, 'finance')
    const before = s
    s = nav.select(fs, s, W, 'draft')
    expect(s.world.location).toBe('finance')
    expect(s.explorer.location).toBe('finance')
    expect(s.explorer.back).toEqual(before.explorer.back)
    expect(s.world.frameNonce).toBe(before.world.frameNonce)
    expect(s.explorer.selectedId).toBe('draft')
    // The explorer tree reveals where the selection lives.
    expect(s.explorer.expanded).toEqual(expect.arrayContaining(['finance', 'budgets', 'fy27']))
  })

  it('2D selection highlights in the world without moving the camera', () => {
    const s = nav.select(fs, start(), E, 'users')
    expect(s.world.selectedId).toBe('users')
    expect(s.world.frameNonce).toBe(0)
  })
})

describe('Up is canonical, Back/Forward are history', () => {
  it('Up goes to the parent of where you are (was: parent of the last clicked item)', () => {
    let s = nav.navigate(fs, start(), W, 'finance')
    s = nav.select(fs, s, W, 'draft')
    s = nav.up(fs, s, E)
    expect(s.world.location).toBe('a')
    expect(s.explorer.location).toBe('a')
    expect(s.world.selectedId).toBe('finance') // the place we left stays identified
  })

  it('Back only revisits places actually visited (was: replayed clicks)', () => {
    let s = nav.navigate(fs, start(), W, 'finance')
    s = nav.select(fs, s, W, 'fy27')
    s = nav.select(fs, s, W, 'q3')
    s = nav.back(fs, s, E)
    expect(s.world.location).toBe('c')
    s = nav.forward(fs, s, E)
    expect(s.world.location).toBe('finance')
  })

  it('Up from a deep place walks the real ancestry; Back retraces the jump', () => {
    let s = nav.reveal(fs, start(), W, 'draft') // search jump straight to the file
    expect(s.world.location).toBe('fy27')
    s = nav.up(fs, s, W)
    expect(s.world.location).toBe('budgets')
    s = nav.up(fs, s, W)
    expect(s.world.location).toBe('finance')
    s = nav.back(fs, s, W)
    expect(s.world.location).toBe('budgets')
    s = nav.back(fs, s, W)
    expect(s.world.location).toBe('fy27')
    s = nav.back(fs, s, W)
    expect(s.world.location).toBe('c')
  })

  it('Overview returns to C: and is itself a history step', () => {
    let s = nav.navigate(fs, start(), E, 'q3')
    s = nav.overview(fs, s, W)
    expect(s.world.location).toBe('c')
    s = nav.back(fs, s, W)
    expect(s.world.location).toBe('q3')
  })

  it('every location change frames the camera; selection does not', () => {
    let s = nav.navigate(fs, start(), E, 'finance')
    expect(s.world.frameNonce).toBe(1)
    s = nav.select(fs, s, E, 'budgets')
    expect(s.world.frameNonce).toBe(1)
    s = nav.up(fs, s, W)
    expect(s.world.frameNonce).toBe(2)
    s = nav.back(fs, s, W)
    expect(s.world.frameNonce).toBe(3)
  })
})

describe('linked OFF', () => {
  const off = () => nav.setLinked(fs, start(), false)

  it('views navigate independently with their own history', () => {
    let s = nav.navigate(fs, off(), E, 'finance')
    s = nav.navigate(fs, s, W, 'users')
    expect(s.explorer.location).toBe('finance')
    expect(s.world.location).toBe('users')
    s = nav.back(fs, s, E)
    expect(s.explorer.location).toBe('c')
    expect(s.world.location).toBe('users')
    s = nav.select(fs, s, E, 'users')
    expect(s.world.selectedId).toBeNull()
  })

  it('Show in World and Show in Explorer act on their view only', () => {
    let s = nav.reveal(fs, off(), W, 'draft')
    expect(s.world.location).toBe('fy27')
    expect(s.world.frameId).toBe('draft')
    expect(s.world.selectedId).toBe('draft')
    expect(s.explorer.location).toBe('c')
    s = nav.reveal(fs, s, E, 'memo')
    expect(s.explorer.location).toBe('a')
    expect(s.explorer.selectedId).toBe('memo')
    expect(s.world.location).toBe('fy27')
  })

  it('linking again: the explorer joins the world, the camera stays', () => {
    let s = nav.navigate(fs, off(), W, 'q3')
    s = nav.navigate(fs, s, E, 'a')
    const nonce = s.world.frameNonce
    s = nav.setLinked(fs, s, true)
    expect(s.explorer.location).toBe('q3')
    expect(s.world.frameNonce).toBe(nonce)
    s = nav.up(fs, s, E)
    expect(s.world.location).toBe('reports')
  })
})

describe('reveal', () => {
  it('reveals a folder inside its parent, selected', () => {
    const s = nav.reveal(fs, start(), W, 'budgets')
    expect(s.world.location).toBe('finance')
    expect(s.world.selectedId).toBe('budgets')
    expect(s.world.frameId).toBe('budgets')
  })

  it('history is shared while linked', () => {
    let s = nav.navigate(fs, start(), E, 'users')
    s = nav.navigate(fs, s, W, 'a')
    expect(s.explorer.back).toEqual(['c', 'users'])
    expect(s.world.back).toEqual(['c', 'users'])
  })
})
