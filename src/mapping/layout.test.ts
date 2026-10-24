import { describe, expect, it } from 'vitest'
import { compile } from '../data/compile'
import type { SeedFolder, SeedNode } from '../data/seedTypes'
import { buildIndex } from '../model/fs'
import { computeLayout, type Rect } from './layout'

const files = (prefix: string, n: number, ext = 'xlsx'): SeedNode[] => Array.from({ length: n }, (_, i) => ({ file: `${prefix} ${i + 1}.${ext}` }))

const root: SeedFolder = {
  folder: 'C:',
  children: [
    { folder: 'Windows', children: [{ folder: 'System32', children: files('lib', 30, 'dll') }, { folder: 'Fonts', children: files('font', 8, 'ttf') }] },
    { folder: 'Program Files', children: [{ folder: 'App', children: files('app', 4, 'exe') }] },
    {
      folder: 'Users',
      children: [
        {
          folder: 'Amanda',
          children: [
            { folder: 'Desktop', children: files('note', 3, 'txt') },
            { folder: 'Downloads', children: files('dl', 20, 'pdf') },
            { folder: 'Documents', children: [{ folder: 'Recipes', children: files('recipe', 5, 'docx') }] },
            { folder: 'Pictures', children: [{ folder: 'Travel', children: [{ folder: '2026 Kyoto', children: files('photo', 12, 'jpg') }] }] },
            { folder: 'Projects', children: [{ folder: 'Garden Planner App', children: [{ folder: 'src', children: files('file', 6, 'ts') }] }] },
            {
              folder: 'OneDrive - Alder & Finch',
              children: [
                {
                  folder: 'Finance',
                  children: [
                    { folder: 'Budgets', children: [{ folder: 'FY2026', children: files('budget', 6) }, { folder: 'FY2027', children: files('draft', 9) }] },
                    { folder: 'Reports', children: [{ folder: 'Quarterly', children: [{ folder: '2026 Q3', children: [...files('report', 4, 'pdf'), { folder: 'Working papers', children: files('wp', 3) }] }] }] },
                  ],
                },
                { folder: 'Contracts', children: [{ folder: 'Clients', children: [{ folder: 'Oakridge Hotels', children: files('msa', 3, 'pdf') }] }] },
                { folder: 'Operations', children: [{ folder: 'Inventory', children: files('count', 4) }] },
                { folder: 'Board', children: files('minutes', 4, 'docx') },
              ],
            },
          ],
        },
        { folder: 'Victor', children: [{ folder: 'Music', children: files('song', 5, 'mp3') }] },
      ],
    },
  ],
}

const fs = buildIndex(compile('test', root))
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.z < b.z + b.d - 1e-6 && b.z < a.z + a.d - 1e-6

describe('computeLayout', () => {
  const layout = computeLayout(fs)

  it('gives every node an anchor', () => {
    const all: string[] = []
    const walk = (id: string) => { all.push(id); fs.children(id).forEach((c) => walk(c.id)) }
    walk(fs.roots()[0].id)
    for (const id of all) expect(layout.anchors.has(id), id).toBe(true)
  })

  it('is deterministic', () => {
    const again = computeLayout(fs)
    expect(JSON.stringify(again.buildings)).toBe(JSON.stringify(layout.buildings))
    expect(JSON.stringify(again.items)).toBe(JSON.stringify(layout.items))
  })

  it('never overlaps districts, buildings or rooms', () => {
    const ds = layout.districts.map((d) => d.rect)
    ds.forEach((a, i) => ds.slice(i + 1).forEach((b) => expect(overlap(a, b)).toBe(false)))
    const bs = layout.buildings.map((b) => b.rect)
    bs.forEach((a, i) => bs.slice(i + 1).forEach((b) => expect(overlap(a, b)).toBe(false)))
    for (const b of layout.buildings) {
      const rooms = layout.rooms.filter((r) => r.buildingId === b.nodeId).map((r) => r.rect)
      rooms.forEach((a, i) => rooms.slice(i + 1).forEach((r) => expect(overlap(a, r)).toBe(false)))
    }
  })

  it('keeps fixtures inside their rooms', () => {
    for (const f of layout.fixtures) {
      const room = layout.rooms.find((r) => r.rect.x <= f.pos[0] && f.pos[0] <= r.rect.x + r.rect.w && r.rect.z <= f.pos[2] && f.pos[2] <= r.rect.z + r.rect.d)
      expect(room, f.nodeId).toBeDefined()
      expect(f.pos[0] - f.size[0] / 2).toBeGreaterThanOrEqual(room!.rect.x - 1e-6)
      expect(f.pos[0] + f.size[0] / 2).toBeLessThanOrEqual(room!.rect.x + room!.rect.w + 1e-6)
    }
  })

  it('promotes deep business folders to the top-level map', () => {
    const finance = fs.resolve('C:\\Users\\Amanda\\OneDrive - Alder & Finch\\Finance')!
    const b = layout.buildings.find((x) => x.nodeId === finance.id)
    expect(b?.promoted).toBe(true)
    expect(b?.districtKey).toBe('business')
    // Its real parent still points to it with a signpost.
    expect(layout.portals.some((p) => p.nodeId === fs.resolve('C:\\Users\\Amanda\\OneDrive - Alder & Finch')!.id)).toBe(true)
  })

  it('shows deep folders as boxes and anchors their files to the box', () => {
    const wp = fs.resolve('C:\\Users\\Amanda\\OneDrive - Alder & Finch\\Finance\\Reports\\Quarterly\\2026 Q3\\Working papers')!
    const inside = fs.children(wp.id)[0]
    expect(layout.anchors.get(inside.id)?.shownAs).toBe(layout.anchors.get(wp.id)?.shownAs)
  })
})
