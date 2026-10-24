import { describe, expect, it } from 'vitest'
import { buildIndex } from './fs'
import type { FsDataset, FsNode } from './types'

const t = '2026-01-01T00:00:00Z'
const folder = (id: string, name: string, parentId: string | null): FsNode => ({
  id, name, parentId, type: 'folder', created: t, modified: t,
})
const file = (id: string, name: string, parentId: string): FsNode => ({
  id, name, parentId, type: 'file', kind: 'spreadsheet', sizeBytes: 1024, created: t, modified: t,
})

const dataset: FsDataset = {
  label: 'test',
  nodes: [
    folder('c', 'C:', null),
    folder('users', 'Users', 'c'),
    folder('amanda', 'Amanda', 'users'),
    file('budget', 'Budget 10.xlsx', 'amanda'),
    file('budget2', 'Budget 9.xlsx', 'amanda'),
    folder('docs', 'Documents', 'amanda'),
  ],
}

describe('buildIndex', () => {
  const fs = buildIndex(dataset)

  it('builds canonical Windows paths', () => {
    expect(fs.path('c')).toBe('C:\\')
    expect(fs.path('budget')).toBe('C:\\Users\\Amanda\\Budget 10.xlsx')
  })

  it('resolves paths case-insensitively with either separator', () => {
    expect(fs.resolve('c:/users/AMANDA/documents/')?.id).toBe('docs')
    expect(fs.resolve('C:\\')?.id).toBe('c')
    expect(fs.resolve('C:\\Nope')).toBeUndefined()
  })

  it('lists folders first, then names in natural order', () => {
    expect(fs.children('amanda').map((n) => n.id)).toEqual(['docs', 'budget2', 'budget'])
  })

  it('returns ancestry from root to node', () => {
    expect(fs.ancestry('docs').map((n) => n.id)).toEqual(['c', 'users', 'amanda', 'docs'])
  })

  it('rejects duplicate sibling names and missing parents', () => {
    expect(() => buildIndex({ label: 'x', nodes: [folder('c', 'C:', null), folder('a', 'A', 'c'), folder('b', 'a', 'c')] })).toThrow(/duplicate name/)
    expect(() => buildIndex({ label: 'x', nodes: [folder('a', 'A', 'missing')] })).toThrow(/missing parent/)
  })
})
