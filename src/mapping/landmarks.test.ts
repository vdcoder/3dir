import { describe, expect, it } from 'vitest'
import { dataset } from '../data/seed'
import { buildIndex } from '../model/fs'
import { planDecor } from './decor'
import { LANDMARKS } from './plan'
import { footprint } from './props'
import { WorldCatalog } from './world'

const fs = buildIndex(dataset)
const main = () => new WorldCatalog(fs).main.layout

describe('landmarks', () => {
  const layout = main()

  it('are exactly the curated ones, each a real folder, each once', () => {
    const want = LANDMARKS.map((l) => fs.resolve(l.path)?.id)
    expect(want.every(Boolean)).toBe(true)
    expect(layout.landmarks.map((l) => l.nodeId).sort()).toEqual([...want].sort())
  })

  it('stay where they are when the world is compiled again', () => {
    expect(JSON.stringify(main().landmarks)).toBe(JSON.stringify(layout.landmarks))
  })

  it('pins rise from the shelf or wall that holds their folder', () => {
    for (const p of layout.landmarks.filter((l) => l.kind === 'pin')) {
      const a = layout.anchors.get(p.nodeId)!
      const b = (layout.anchors.get(a.shownAs) ?? a).bounds
      expect(p.pos[0]).toBeGreaterThanOrEqual(b.min[0])
      expect(p.pos[0]).toBeLessThanOrEqual(b.max[0])
      expect(p.pos[2]).toBeGreaterThanOrEqual(b.min[2])
      expect(p.pos[2]).toBeLessThanOrEqual(b.max[2])
      expect(p.pos[1]).toBe(b.max[1])
      expect(p.top).toBeGreaterThan(p.pos[1])
    }
  })

  it('the clock tower stands in its campus plaza, clear of the fountain, and is drawn there', () => {
    const t = layout.landmarks.find((l) => l.kind === 'tower')!
    const area = layout.areas.find((a) => a.nodeId === t.nodeId)!
    const p = area.plaza!
    const [tw, td] = footprint('clock-tower')
    expect(t.pos[0] - tw / 2).toBeGreaterThanOrEqual(p.x)
    expect(t.pos[2] - td / 2).toBeGreaterThanOrEqual(p.z)
    const fountain = footprint('fountain')[0] / 2
    expect(Math.hypot(t.pos[0] - (p.x + p.w / 2), t.pos[2] - (p.z + p.d / 2))).toBeGreaterThan(fountain + tw / 2)
    const decor = planDecor(layout, (id) => fs.get(id)!.name)
    expect(decor.filter((d) => d.prop === 'clock-tower').map((d) => [d.pos[0], d.pos[2]])).toEqual([[t.pos[0], t.pos[2]]])
  })

  it('box-worlds carry no pins', () => {
    const catalog = new WorldCatalog(fs)
    const q3 = fs.resolve('C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Clients\\Biscayne Senior Living\\Orders\\2026\\Q3')!
    expect(catalog.get(q3.id).landmarks).toEqual([])
  })
})
