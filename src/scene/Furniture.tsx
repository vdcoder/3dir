import { useMemo } from 'react'
import type { ItemEntity } from '../mapping/layout'
import type { ThemeId } from '../mapping/plan'
import type { NodeId } from '../model/types'
import { fs } from '../state/store'
import { KIND_STYLE } from '../ui/kinds'
import { Boxes, type BoxSpec } from './Boxes'
import { layout, PALETTE } from './worldData'
import { usePick } from './usePick'

const SHELF_BASE = 0.14
const SHELF_LEVEL = 0.64
const SIDE = 0.05
const SHELF_BACK: Record<ThemeId, string> = { business: '#ece3d3', studio: '#f1e6d4', gallery: '#ffffff', home: '#efe4d2', system: '#dfe2e4' }

interface Parts { specs: BoxSpec[]; ids: NodeId[] }

/** Shelves, tables and display walls, split into wood/dark parts per theme. */
export function Fixtures() {
  const pick = usePick()
  const groups = useMemo(() => {
    const wood = new Map<ThemeId, Parts>()
    const dark = new Map<ThemeId, Parts>()
    const back = new Map<ThemeId, Parts>()
    const add = (m: Map<ThemeId, Parts>, t: ThemeId, s: BoxSpec, id: NodeId) => {
      const e = m.get(t) ?? { specs: [], ids: [] }
      e.specs.push(s)
      e.ids.push(id)
      m.set(t, e)
    }
    for (const f of layout.fixtures) {
      const [x, , z] = f.pos
      const [W, H, D] = f.size
      const id = f.nodeId
      if (f.type === 'shelf') {
        add(dark, f.theme, { pos: [x, SHELF_BASE / 2, z], size: [W, SHELF_BASE, D] }, id)
        add(back, f.theme, { pos: [x, H / 2, z - D / 2 + 0.015], size: [W - 0.02, H - 0.02, 0.03] }, id)
        const innerW = W - 2 * SIDE
        const bayW = (innerW - (f.bays - 1) * SIDE) / f.bays
        for (let b = 0; b <= f.bays; b++) {
          const sx = x - W / 2 + SIDE / 2 + b * (bayW + SIDE)
          add(wood, f.theme, { pos: [sx, H / 2, z], size: [SIDE, H, D] }, id)
        }
        for (let l = 0; l <= f.levels; l++) {
          add(wood, f.theme, { pos: [x, SHELF_BASE + l * SHELF_LEVEL - 0.015, z], size: [W, 0.03, D] }, id)
        }
      } else if (f.type === 'table') {
        add(wood, f.theme, { pos: [x, H - 0.025, z], size: [W, 0.05, D] }, id)
        for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          add(dark, f.theme, { pos: [x + lx * (W / 2 - 0.08), (H - 0.05) / 2, z + lz * (D / 2 - 0.08)], size: [0.05, H - 0.05, 0.05] }, id)
        }
      } else {
        // Gallery display wall on a plinth.
        add(wood, f.theme, { pos: [x, 0.06, z], size: [W + 0.12, 0.12, D + 0.16] }, id)
        add(dark, f.theme, { pos: [x, H / 2 + 0.06, z], size: [W, H, D] }, id)
      }
    }
    return { wood, dark, back }
  }, [])

  return (
    <group>
      {[...groups.wood].map(([t, p]) => (
        <Boxes key={'w' + t} boxes={p.specs} color={PALETTE[t].wood} roughness={0.75} onPick={(i, _e, k) => pick(p.ids[i], k)} />
      ))}
      {[...groups.back].map(([t, p]) => (
        <Boxes key={'b' + t} boxes={p.specs} color={SHELF_BACK[t]} roughness={0.9} onPick={(i, _e, k) => pick(p.ids[i], k)} />
      ))}
      {[...groups.dark].map(([t, p]) => (
        <Boxes key={'d' + t} boxes={p.specs} color={t === 'gallery' ? '#f4f1ec' : PALETTE[t].woodDark} roughness={0.8} onPick={(i, _e, k) => pick(p.ids[i], k)} />
      ))}
    </group>
  )
}

const CARDBOARD = '#c8a275'
const FRAME = '#3f3833'

function itemColor(it: ItemEntity): string {
  if (it.form === 'box') return CARDBOARD
  if (it.form === 'frame') return FRAME
  return KIND_STYLE[it.kind].color
}

/** Every visible file (and archive box) as an instanced, pickable object. */
export function Items() {
  const pick = usePick()
  const { bodies, labels, pictures } = useMemo(() => {
    const bodies: BoxSpec[] = []
    const labels: BoxSpec[] = []
    const pictures: BoxSpec[] = []
    for (const it of layout.items) {
      bodies.push({ pos: it.pos, size: it.size, color: itemColor(it) })
      const [x, y, z] = it.pos
      const [w, h, d] = it.size
      if (it.form === 'spine') {
        // A small paper label on the spine, like a binder.
        labels.push({ pos: [x, y + h * 0.18, z + d / 2 + 0.002], size: [w * 0.62, Math.min(0.07, h * 0.2), 0.004], color: '#f6f3ec' })
      } else if (it.form === 'box') {
        labels.push({ pos: [x, y + h * 0.1, z + d / 2 + 0.002], size: [w * 0.55, h * 0.3, 0.004], color: '#f3efe6' })
      } else if (it.form === 'frame') {
        const n = fs.get(it.nodeId)
        const pal = n?.type === 'file' && n.preview?.format === 'image' ? n.preview.palette : undefined
        pictures.push({ pos: [x, y, z + d / 2 + 0.002], size: [w - 0.07, h - 0.07, 0.006], color: pal?.[0] ?? KIND_STYLE[it.kind].color })
      } else if (it.form === 'paper') {
        labels.push({ pos: [x, y + h / 2 + 0.002, z], size: [w * 0.8, 0.003, d * 0.8], color: '#fbfaf6' })
      }
    }
    return { bodies, labels, pictures }
  }, [])

  return (
    <group>
      <Boxes boxes={bodies} roughness={0.7} onPick={(i, _e, k) => pick(layout.items[i].nodeId, k)} />
      <Boxes boxes={labels} castShadow={false} roughness={0.9} />
      <Boxes boxes={pictures} castShadow={false} roughness={0.6} />
    </group>
  )
}
