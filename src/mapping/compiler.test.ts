import { describe, expect, it } from 'vitest'
import { compile } from '../data/compile'
import type { SeedFolder, SeedNode } from '../data/seedTypes'
import { buildIndex } from '../model/fs'
import { planAreas, planDrive, planRegions, type PlanNode } from './areaPlanner'
import { buildArea } from './areaRenderer'
import { layoutGeography, packRows } from './geography'
import { makeImportance } from './importance'
import { OPEN_LEVELS, type Rect } from './types'
import { WorldCatalog } from './world'

const files = (prefix: string, n: number, ext = 'xlsx'): SeedNode[] => Array.from({ length: n }, (_, i) => ({ file: `${prefix} ${i + 1}.${ext}` }))
const dir = (name: string, children: SeedNode[] = []): SeedFolder => ({ folder: name, children })

// A small drive shaped like the owner's AmandaMedicalMiami example.
const root: SeedFolder = dir('C:', [
  dir('Windows', [dir('System32', [dir('drivers', [dir('etc', files('hosts', 1, 'txt'))]), ...files('lib', 12, 'dll')]), dir('Fonts', files('font', 6, 'ttf'))]),
  dir('Program Files', [dir('Google', [dir('Chrome', [dir('Application', [dir('155.0.7610.88', [dir('Locales', files('locale', 8, 'pak')), dir('Extensions', [dir('Temp', files('x', 2, 'dat'))]), ...files('chrome', 3, 'dll')]), ...files('chrome', 2, 'exe')])])])]),
  dir('Users', [
    dir('Amanda', [
      dir('Desktop', files('note', 3, 'txt')),
      dir('Downloads', files('dl', 10, 'pdf')),
      dir('Documents', [
        dir('Recipes', files('recipe', 4, 'docx')),
        dir('Personal Finance', [dir('Taxes', files('tax', 3, 'pdf')), dir('Insurance', files('policy', 2, 'pdf'))]),
        dir('Business', [
          dir('AmandaMedicalMiami', [
            dir('Finance', [dir('Budgets', [dir('2027 draft', files('budget', 4))]), dir('Invoices', [dir('2026', [dir('Q3', files('inv', 6, 'pdf'))])])]),
            dir('Operations', [dir('Inventory', files('count', 3)), dir('Fleet', [dir('Van 1', [dir('Maintenance', files('log', 2))])])]),
            dir('Legal', [dir('Contracts', files('contract', 4, 'pdf'))]),
            dir('Clients', [dir('Bayview Physio', [dir('Orders', [dir('2026', [dir('Q3', [dir('Delivery confirmations', files('dc', 3, 'pdf'))])])])])]),
            ...files('overview', 1, 'pdf'),
          ]),
          dir('Side projects', files('idea', 2, 'docx')),
        ]),
      ]),
      dir('Pictures', [dir('Travel', [dir('2026 Kyoto', files('photo', 6, 'jpg'))]), dir('Garden', files('g', 3, 'jpg'))]),
      dir('Projects', [dir('Garden Planner App', [dir('src', files('file', 4, 'ts'))])]),
      dir('OneDrive - Alder & Finch', [dir('Finance', [dir('Budgets', [dir('FY2027', files('draft', 5))])]), dir('Contracts', [dir('Clients', files('msa', 2, 'pdf'))])]),
    ]),
    dir('Victor', [dir('Music', files('song', 4, 'mp3')), dir('Documents', files('setlist', 2, 'docx'))]),
  ]),
])

const fs = buildIndex(compile('test', root))
const id = (p: string) => fs.resolve(p)!.id
const AMM = 'C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami'
const allFolders = (): string[] => {
  const out: string[] = []
  const walk = (nid: string) => { if (fs.get(nid)!.type === 'folder') { out.push(nid); fs.children(nid).forEach((c) => walk(c.id)) } }
  walk(fs.roots()[0].id)
  return out
}
const inside = (a: Rect, b: Rect) => a.x >= b.x - 1e-6 && a.z >= b.z - 1e-6 && a.x + a.w <= b.x + b.w + 1e-6 && a.z + a.d <= b.z + b.d + 1e-6
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.z < b.z + b.d - 1e-6 && b.z < a.z + a.d - 1e-6

describe('Stage 1a: area planner', () => {
  const plan = planDrive(fs)
  const regions = planRegions(plan)
  const areas = planAreas(plan)
  const regionOf = (p: string) => regions.find((r) => r.nodeId === id(p))

  it('absorbs the ancestors of an important folder into nested geography', () => {
    expect(plan.kind).toBe('land')
    expect(regionOf('C:\\Users')?.metaphor).toBe('district')
    expect(regionOf('C:\\Users\\Amanda')?.metaphor).toBe('block')
    expect(regionOf('C:\\Users\\Amanda\\Documents')?.metaphor).toBe('yard')
    expect(regionOf('C:\\Users\\Amanda\\Documents\\Business')?.metaphor).toBe('square')
  })

  it('makes the important folder a campus area and other promoted folders major areas', () => {
    const amm = areas.find((a) => a.nodeId === id(AMM))
    expect(amm?.prominence).toBe('campus')
    expect(areas.find((a) => a.nodeId === id('C:\\Users\\Amanda\\Pictures'))?.prominence).toBe('major')
    expect(areas.find((a) => a.nodeId === id('C:\\Users\\Amanda\\OneDrive - Alder & Finch'))?.prominence).toBe('major')
  })

  it('keeps unimportant folders compact, inside their parent\'s residual area', () => {
    const residualC = areas.find((a) => a.residual && a.nodeId === fs.roots()[0].id)
    expect(residualC?.prominence).toBe('minor')
    expect(residualC?.skip).toEqual([id('C:\\Users')])
    expect(areas.some((a) => a.nodeId === id('C:\\Windows'))).toBe(false)
    // Victor's home is part of the Users residual area, not promoted.
    expect(areas.find((a) => a.residual && a.nodeId === id('C:\\Users'))?.skip).toEqual([id('C:\\Users\\Amanda')])
  })

  it('covers every folder exactly once (as a region, an area, or inside one area)', () => {
    const owner = new Map<string, string>()
    const claim = (folder: string, by: string) => {
      expect(owner.has(folder), `${fs.path(folder)} claimed twice`).toBe(false)
      owner.set(folder, by)
    }
    const walkArea = (fid: string, skip: Set<string>, by: string) => {
      claim(fid, by)
      for (const c of fs.children(fid)) if (c.type === 'folder' && !skip.has(c.id)) walkArea(c.id, new Set(), by)
    }
    const walkPlan = (n: PlanNode) => {
      if (n.kind === 'area') {
        if (n.residual) for (const c of fs.children(n.nodeId)) { if (c.type === 'folder' && !n.skip.includes(c.id)) walkArea(c.id, new Set(), n.nodeId) }
        else walkArea(n.nodeId, new Set(), n.nodeId)
      } else { claim(n.nodeId, n.nodeId); n.children.forEach(walkPlan) }
    }
    walkPlan(plan)
    for (const f of allFolders()) expect(owner.has(f), fs.path(f)).toBe(true)
  })

  it('never invents folders', () => {
    for (const r of regions) expect(fs.get(r.nodeId)?.type).toBe('folder')
    for (const a of areas) expect(fs.get(a.nodeId)?.type).toBe('folder')
  })
})

describe('Stage 1b: geography', () => {
  const plan = planDrive(fs)
  const imp = makeImportance(fs)
  const geo = layoutGeography(plan, (a) => buildArea(fs, a.nodeId, () => 'home', a.prominence, imp, new Set(a.skip)))

  it('nests every region and area inside its real parent region', () => {
    const rectOf = (nid: string) => geo.regions.find((r) => r.node.nodeId === nid)?.rect
    for (const r of geo.regions) {
      const parent = fs.get(r.node.nodeId)!.parentId!
      expect(inside(r.rect, rectOf(parent) ?? geo.land), fs.path(r.node.nodeId)).toBe(true)
    }
    for (const a of geo.areas) {
      const container = a.node.residual ? a.node.nodeId : fs.get(a.node.nodeId)!.parentId!
      expect(inside(a.rect, rectOf(container) ?? geo.land), fs.path(a.node.nodeId)).toBe(true)
    }
  })

  it('never overlaps siblings', () => {
    const rects = [...geo.regions.map((r) => ({ p: fs.get(r.node.nodeId)!.parentId, rect: r.rect })), ...geo.areas.map((a) => ({ p: a.node.residual ? a.node.nodeId : fs.get(a.node.nodeId)!.parentId, rect: a.rect }))]
    rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => { if (a.p === b.p) expect(overlap(a.rect, b.rect)).toBe(false) }))
  })

  it('puts the branch holding the important campus in front at every level', () => {
    // Front = largest z. Within Amanda's block, Documents (which holds the campus) is in the front row.
    const front = (r: Rect) => r.z + r.d
    const docs = geo.regions.find((r) => r.node.nodeId === id('C:\\Users\\Amanda\\Documents'))!
    const siblings = geo.areas.filter((a) => !a.node.residual && fs.get(a.node.nodeId)!.parentId === id('C:\\Users\\Amanda'))
    for (const s of siblings) expect(front(docs.rect)).toBeGreaterThanOrEqual(front(s.rect) - 1e-6)
  })

  it('packs rows with the most important item centered in the front row', () => {
    const p = packRows([
      { key: 'a', w: 4, d: 4, importance: 0.7, name: 'a' },
      { key: 'b', w: 4, d: 4, importance: 1, name: 'b' },
      { key: 'c', w: 4, d: 4, importance: 0.8, name: 'c' },
    ], 1, 10)
    const b = p.placements.find((x) => x.key === 'b')!
    const xs = p.placements.map((x) => x.x).sort((m, n) => m - n)
    expect(b.x).toBe(xs[1])
  })

  it('lets much less important things recede to the back of their row', () => {
    const p = packRows([
      { key: 'heart', w: 4, d: 8, importance: 1, name: 'heart' },
      { key: 'system', w: 4, d: 4, importance: 0.1, name: 'system' },
    ], 1, 10)
    const sys = p.placements.find((x) => x.key === 'system')!
    const heart = p.placements.find((x) => x.key === 'heart')!
    expect(sys.z).toBe(0)
    expect(heart.z + 8).toBeGreaterThan(sys.z + 4)
  })

  it('is deterministic', () => {
    const again = layoutGeography(planDrive(fs), (a) => buildArea(fs, a.nodeId, () => 'home', a.prominence, imp, new Set(a.skip)))
    expect(JSON.stringify(again)).toBe(JSON.stringify(geo))
  })
})

describe('worlds and box-worlds', () => {
  const catalog = new WorldCatalog(fs)

  it('opens every folder somewhere, at any depth (no dead ends)', () => {
    for (const f of allFolders()) {
      const ctx = catalog.contextFor(f)
      const a = catalog.get(ctx).anchors.get(f)
      expect(a, fs.path(f)).toBeDefined()
      expect(a!.shownAs, fs.path(f)).toBe(f)
      expect(OPEN_LEVELS.has(a!.level), `${fs.path(f)} is ${a!.level}`).toBe(true)
    }
  })

  it('shows every file in some world', () => {
    const walk = (nid: string) => {
      const n = fs.get(nid)!
      if (n.type === 'file') {
        const a = catalog.get(catalog.contextFor(nid)).anchors.get(nid)
        expect(a?.shownAs, fs.path(nid)).toBe(nid)
      } else fs.children(nid).forEach((c) => walk(c.id))
    }
    walk(fs.roots()[0].id)
  })

  it('opens the deep Chrome version folder through box-worlds', () => {
    const deep = id('C:\\Program Files\\Google\\Chrome\\Application\\155.0.7610.88\\Extensions\\Temp')
    const chain = catalog.chainFor(deep)
    expect(chain.length).toBeGreaterThan(1)
    expect(chain[0]).toBe(fs.roots()[0].id)
    const world = catalog.get(chain[chain.length - 1])
    expect(world.context.kind).toBe('box')
    expect(world.context.depth).toBe(chain.length - 1)
  })

  it('opening a box changes the world, not the folder', () => {
    const box = catalog.main.layout.items.find((i) => i.form === 'box')!
    expect(catalog.main.layout.anchors.get(box.nodeId)?.level).toBe('box')
    expect(catalog.contextFor(box.nodeId)).toBe(box.nodeId)
    const world = catalog.get(box.nodeId)
    expect(world.anchors.get(box.nodeId)?.level).toBe('area')
    // The box's parent is open on the main map again (Up leaves the box-world).
    expect(catalog.contextFor(fs.get(box.nodeId)!.parentId!)).toBe(fs.roots()[0].id)
  })
})
