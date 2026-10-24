import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { assetUrl } from '../assetUrl'
import type { ItemEntity } from '../mapping/types'
import type { ThemeId } from '../mapping/plan'
import type { NodeId } from '../model/types'
import { fs } from '../state/store'
import { KIND_STYLE } from '../ui/kinds'
import { Boxes, type BoxSpec } from './Boxes'
import { PALETTE, useLayout } from './worldData'

const SHELF_BASE = 0.14
const SHELF_LEVEL = 0.64
const SIDE = 0.05
const SHELF_BACK: Record<ThemeId, string> = { business: '#ece3d3', medical: '#eef3f1', studio: '#f1e6d4', gallery: '#ffffff', home: '#efe4d2', system: '#dfe2e4' }

interface Parts { specs: BoxSpec[]; ids: NodeId[] }

/** Shelves, tables and display walls, split into wood/dark parts per theme. */
export function Fixtures() {
  const layout = useLayout()
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
    // Invisible volumes so the gap between binders still picks the compartment.
    const compartments: Parts = { specs: [], ids: [] }
    for (const c of layout.compartments) {
      for (const b of c.segments) {
        compartments.specs.push({ pos: [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2], size: [b.max[0] - b.min[0] + 0.02, b.max[1] - b.min[1] + 0.02, b.max[2] - b.min[2] + 0.02] })
        compartments.ids.push(c.nodeId)
      }
    }
    return { wood, dark, back, compartments }
  }, [layout])

  return (
    <group>
      {[...groups.wood].map(([t, p]) => (
        <Boxes key={'w' + t} boxes={p.specs} color={PALETTE[t].wood} roughness={0.75} pick={(i) => p.ids[i]} />
      ))}
      {[...groups.back].map(([t, p]) => (
        <Boxes key={'b' + t} boxes={p.specs} color={SHELF_BACK[t]} roughness={0.9} pick={(i) => p.ids[i]} />
      ))}
      {[...groups.dark].map(([t, p]) => (
        <Boxes key={'d' + t} boxes={p.specs} color={t === 'gallery' ? '#f4f1ec' : PALETTE[t].woodDark} roughness={0.8} pick={(i) => p.ids[i]} />
      ))}
      <Boxes boxes={groups.compartments.specs} hidden pick={(i) => groups.compartments.ids[i]} />
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
  const layout = useLayout()
  useInvalidateBridge()
  const { bodies, labels } = useMemo(() => {
    const bodies: BoxSpec[] = []
    const labels: BoxSpec[] = []
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
      } else if (it.form === 'paper') {
        labels.push({ pos: [x, y + h / 2 + 0.002, z], size: [w * 0.8, 0.003, d * 0.8], color: '#fbfaf6' })
      }
    }
    return { bodies, labels }
  }, [layout])

  return (
    <group>
      <Boxes boxes={bodies} roughness={0.7} pick={(i) => layout.items[i]?.nodeId ?? null} />
      <Boxes boxes={labels} castShadow={false} roughness={0.9} />
      <Pictures />
    </group>
  )
}

const pictureGeometry = new THREE.PlaneGeometry(1, 1)

/** The image on each frame: the generated photo when there is one, else a soft gradient from its palette. */
function Pictures() {
  const layout = useLayout()
  const frames = useMemo(() => layout.items.filter((i) => i.form === 'frame').map((it) => {
    const n = fs.get(it.nodeId)
    const p = n?.type === 'file' && n.preview?.format === 'image' ? n.preview : undefined
    return { it, src: p?.src ? p.src.replace('photos/', 'photos/thumbs/') : undefined, palette: p?.palette ?? [KIND_STYLE[it.kind].color, '#ddd'], user: { pick: () => it.nodeId } }
  }), [layout])
  const materials = useMemo(() => {
    const loader = new THREE.TextureLoader()
    return frames.map((f) => {
      const map = f.src ? loader.load(assetUrl(f.src), () => invalidateAll()) : gradientTexture(f.palette)
      map.colorSpace = THREE.SRGBColorSpace
      return new THREE.MeshStandardMaterial({ map, roughness: 0.55 })
    })
  }, [frames])
  return (
    <group>
      {frames.map((f, i) => (
        <mesh key={f.it.nodeId} geometry={pictureGeometry} material={materials[i]}
          position={[f.it.pos[0], f.it.pos[1], f.it.pos[2] + f.it.size[2] / 2 + 0.004]}
          scale={[f.it.size[0] - 0.1, f.it.size[1] - 0.1, 1]}
          userData={f.user} />
      ))}
    </group>
  )
}

let invalidateAll = () => {}
export function useInvalidateBridge() {
  const invalidate = useThree((s) => s.invalidate)
  invalidateAll = invalidate
}

const gradientCache = new Map<string, THREE.Texture>()
function gradientTexture(palette: string[]): THREE.Texture {
  const key = palette.join()
  const hit = gradientCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 48
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0, 0, 64, 48)
  palette.forEach((col, i) => grd.addColorStop(i / Math.max(1, palette.length - 1), col))
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 48)
  const t = new THREE.CanvasTexture(c)
  gradientCache.set(key, t)
  return t
}
