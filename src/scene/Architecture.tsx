import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ThemeId } from '../mapping/plan'
import type { AbsorberMetaphor, Rect, RegionEntity } from '../mapping/types'
import type { NodeId } from '../model/types'
import { fs } from '../state/store'
import { Boxes, type BoxSpec } from './Boxes'
import { pickable } from './picking'
import { refreshShadows } from './shadows'
import { asphalt, brick, cardboard, grass, paving, planks, signTexture, terrazzo, tiles, worldMapMaterial } from './textures'
import { accentOf, LAND, PALETTE, REGION_LOOK, useLayout } from './worldData'

const THEMES: ThemeId[] = ['business', 'medical', 'studio', 'gallery', 'home', 'system']
const unitBox = new THREE.BoxGeometry(1, 1, 1)

const mix = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()
const shade = (hex: string, k: number) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString() }

// ---------- Surface materials (world-space textures, created once) ----------

let surfaces: ReturnType<typeof makeSurfaces> | null = null
function makeSurfaces() {
  return {
    ground: {
      business: worldMapMaterial(paving('#e4ddd1', 11, 6), 7.2, { roughness: 0.9 }),
      medical: worldMapMaterial(tiles('#eeece6', 17, 4), 5.6, { roughness: 0.7 }),
      studio: worldMapMaterial(paving('#ddccae', 12, 5), 6, { roughness: 0.92 }),
      gallery: worldMapMaterial(paving('#ddbca3', 13, 8), 6.4, { roughness: 0.9 }),
      home: worldMapMaterial(grass('#bfd09f', 14), 18, { roughness: 1 }),
      system: worldMapMaterial(terrazzo('#c3c6c6', 15), 5, { roughness: 0.95 }),
    } as Record<ThemeId, THREE.Material>,
    floor: {
      business: worldMapMaterial(planks('#d6bd97', 21, 10), 4.5, { roughness: 0.7 }),
      medical: worldMapMaterial(tiles('#f1f2ee', 27, 6), 3.2, { roughness: 0.5 }),
      studio: worldMapMaterial(planks('#cfa676', 22, 7), 4.5, { roughness: 0.75 }),
      gallery: worldMapMaterial(terrazzo('#ede8e0', 23), 3, { roughness: 0.55 }),
      home: worldMapMaterial(planks('#d3b289', 24, 8), 4.5, { roughness: 0.75 }),
      system: worldMapMaterial(paving('#c7cbce', 25, 8), 4, { roughness: 0.8 }),
    } as Record<ThemeId, THREE.Material>,
    lobby: worldMapMaterial(paving('#e9e1d3', 26, 4), 2.4, { roughness: 0.6 }),
    land: worldMapMaterial(grass(LAND.grass, 31), 26, { roughness: 1 }),
    plaza: worldMapMaterial(paving('#efe8dc', 32, 4), 4, { roughness: 0.75 }),
    campus: worldMapMaterial(tiles('#f2efe8', 34, 3), 4.8, { roughness: 0.6 }),
    region: {
      district: worldMapMaterial(asphalt('#9a9c9a', 41), 10, { roughness: 0.95 }),
      block: worldMapMaterial(grass('#c9d6b1', 42), 16, { roughness: 1 }),
      yard: worldMapMaterial(paving('#d8d6d1', 43, 3), 3.6, { roughness: 0.9 }),
      square: worldMapMaterial(brick('#b9785e', 44), 3.2, { roughness: 0.9 }),
      garden: worldMapMaterial(terrazzo('#d8d2c2', 45), 2.4, { roughness: 1 }),
      court: worldMapMaterial(tiles('#e2dccf', 46, 5), 3.6, { roughness: 0.8 }),
    } as Record<AbsorberMetaphor, THREE.Material>,
    road: {
      highway: worldMapMaterial(asphalt('#7f8283', 51), 9, { roughness: 0.95 }),
      street: worldMapMaterial(asphalt('#8c8e8f', 52), 9, { roughness: 0.95 }),
      path: worldMapMaterial(paving(LAND.path, 33, 3), 3, { roughness: 0.9 }),
    },
    box: worldMapMaterial(cardboard('#c9a273', 61), 6, { roughness: 0.95 }),
  }
}
const useSurfaces = () => (surfaces ??= makeSurfaces())

/** Instanced boxes with a shared custom material. */
function MaterialBoxes({ boxes, material, castShadow = true, pick }: { boxes: BoxSpec[]; material: THREE.Material; castShadow?: boolean; pick?: (i: number) => NodeId | null }) {
  return <Boxes boxes={boxes} material={material} castShadow={castShadow} pick={pick} />
}

// ---------- Ground: land, roads, regions, areas (or the inside of a box) ----------

export function Ground() {
  const layout = useLayout()
  const surf = useSurfaces()
  const g = layout.ground
  const isBox = layout.context.kind === 'box'
  const rootId = layout.context.rootId
  return (
    <group>
      {isBox ? (
        <BoxFloor rect={g} rootId={rootId} material={surf.box} />
      ) : (
        <>
          <RoundedBox args={[g.w, 1.2, g.d]} radius={0.5} smoothness={3} position={[g.x + g.w / 2, -0.6, g.z + g.d / 2]} receiveShadow material={surf.land} userData={pickable(() => rootId)} />
          <RoundedBox args={[g.w + 1.2, 2.6, g.d + 1.2]} radius={0.7} smoothness={3} position={[g.x + g.w / 2, -2.1, g.z + g.d / 2]} raycast={() => {}}>
            <meshStandardMaterial color="#6f5a45" roughness={0.75} />
          </RoundedBox>
        </>
      )}
      <Roads />
      <Regions />
      <AreaPads />
    </group>
  )
}

function BoxFloor({ rect: g, rootId, material }: { rect: Rect; rootId: NodeId; material: THREE.Material }) {
  // The opened box: a cardboard floor with low cardboard walls around it.
  const rim = 1.1
  const t = 0.35
  const walls: BoxSpec[] = [
    { pos: [g.x + g.w / 2, rim / 2, g.z - t / 2], size: [g.w + 2 * t, rim, t] },
    { pos: [g.x + g.w / 2, rim / 2 - 0.45, g.z + g.d + t / 2], size: [g.w + 2 * t, rim - 0.9, t] },
    { pos: [g.x - t / 2, rim / 2, g.z + g.d / 2], size: [t, rim, g.d] },
    { pos: [g.x + g.w + t / 2, rim / 2, g.z + g.d / 2], size: [t, rim, g.d] },
  ]
  return (
    <group>
      <mesh position={[g.x + g.w / 2, -0.05, g.z + g.d / 2]} receiveShadow material={material} userData={pickable(() => rootId)}>
        <boxGeometry args={[g.w, 0.1, g.d]} />
      </mesh>
      <Boxes boxes={walls} material={material} pick={() => rootId} />
    </group>
  )
}

function Roads() {
  const layout = useLayout()
  const surf = useSurfaces()
  const groups = useMemo(() => {
    const out: Record<'highway' | 'street' | 'path', BoxSpec[]> = { highway: [], street: [], path: [] }
    const marks: BoxSpec[] = []
    for (const r of layout.roads) {
      const { rect: q, y } = r
      out[r.kind].push({ pos: [q.x + q.w / 2, y + 0.006, q.z + q.d / 2], size: [q.w, 0.012, q.d] })
      if (r.kind === 'highway') {
        // Dashed center line.
        const horizontal = q.w >= q.d
        const len = horizontal ? q.w : q.d
        for (let t = 1.2; t < len - 1.2; t += 3) {
          marks.push(horizontal
            ? { pos: [q.x + t, y + 0.014, q.z + q.d / 2], size: [1.4, 0.004, 0.14] }
            : { pos: [q.x + q.w / 2, y + 0.014, q.z + t], size: [0.14, 0.004, 1.4] })
        }
      }
    }
    return { out, marks }
  }, [layout])
  return (
    <group>
      <MaterialBoxes boxes={groups.out.highway} material={surf.road.highway} castShadow={false} />
      <MaterialBoxes boxes={groups.out.street} material={surf.road.street} castShadow={false} />
      <MaterialBoxes boxes={groups.out.path} material={surf.road.path} castShadow={false} />
      <Boxes boxes={groups.marks} color="#f4efe2" castShadow={false} receiveShadow={false} />
    </group>
  )
}

/** Perimeter of a rect as boxes, leaving a gate gap centered on the front (south) edge. */
function perimeter(r: Rect, y: number, height: number, thick: number, gate: number): BoxSpec[] {
  const h = height
  const yc = y + h / 2
  const half = (r.w - gate) / 2
  return [
    { pos: [r.x + r.w / 2, yc, r.z + thick / 2], size: [r.w, h, thick] },
    { pos: [r.x + thick / 2, yc, r.z + r.d / 2], size: [thick, h, r.d] },
    { pos: [r.x + r.w - thick / 2, yc, r.z + r.d / 2], size: [thick, h, r.d] },
    { pos: [r.x + half / 2, yc, r.z + r.d - thick / 2], size: [half, h, thick] },
    { pos: [r.x + r.w - half / 2, yc, r.z + r.d - thick / 2], size: [half, h, thick] },
  ]
}

/** Fence: posts and two rails along the perimeter, with a gate. */
function fence(r: Rect, y: number, gate: number): { posts: BoxSpec[]; rails: BoxSpec[] } {
  const posts: BoxSpec[] = []
  const rails: BoxSpec[] = []
  const inset = 0.15
  const edges: [number, number, number, number][] = [
    [r.x + inset, r.z + inset, r.x + r.w - inset, r.z + inset],
    [r.x + inset, r.z + inset, r.x + inset, r.z + r.d - inset],
    [r.x + r.w - inset, r.z + inset, r.x + r.w - inset, r.z + r.d - inset],
    [r.x + inset, r.z + r.d - inset, r.x + r.w / 2 - gate / 2, r.z + r.d - inset],
    [r.x + r.w / 2 + gate / 2, r.z + r.d - inset, r.x + r.w - inset, r.z + r.d - inset],
  ]
  for (const [ax, az, bx, bz] of edges) {
    const len = Math.hypot(bx - ax, bz - az)
    const n = Math.max(1, Math.round(len / 1.3))
    for (let i = 0; i <= n; i++) posts.push({ pos: [ax + ((bx - ax) * i) / n, y + 0.45, az + ((bz - az) * i) / n], size: [0.09, 0.9, 0.09] })
    for (const ry of [0.38, 0.72]) {
      rails.push({ pos: [(ax + bx) / 2, y + ry, (az + bz) / 2], size: [Math.abs(bx - ax) + 0.05, 0.05, Math.abs(bz - az) + 0.05] })
    }
  }
  return { posts, rails }
}

function Regions() {
  const layout = useLayout()
  const surf = useSurfaces()
  const parts = useMemo(() => {
    const plates = new Map<AbsorberMetaphor, { specs: BoxSpec[]; ids: NodeId[] }>()
    const borders: { specs: BoxSpec[]; ids: NodeId[] } = { specs: [], ids: [] }
    const hedges: { specs: BoxSpec[]; ids: NodeId[] } = { specs: [], ids: [] }
    const posts: { specs: BoxSpec[]; ids: NodeId[] } = { specs: [], ids: [] }
    const add = (bucket: { specs: BoxSpec[]; ids: NodeId[] }, specs: BoxSpec[], id: NodeId) => { bucket.specs.push(...specs); specs.forEach(() => bucket.ids.push(id)) }
    for (const r of layout.regions) {
      const q = r.rect
      const e = plates.get(r.metaphor) ?? { specs: [], ids: [] }
      e.specs.push({ pos: [q.x + q.w / 2, r.y - 0.01, q.z + q.d / 2], size: [q.w, 0.02, q.d] })
      e.ids.push(r.nodeId)
      plates.set(r.metaphor, e)
      const look = REGION_LOOK[r.metaphor]
      const gate = Math.min(4, q.w * 0.3)
      switch (r.metaphor) {
        case 'district': add(borders, perimeter(q, r.y, 0.14, 0.45, 0).map((b) => ({ ...b, color: look.border })), r.nodeId); break
        case 'block': add(borders, perimeter(q, r.y, 0.1, 1.1, 0).map((b) => ({ ...b, color: look.border })), r.nodeId); break
        case 'yard': { const f = fence(q, r.y, gate); add(posts, f.posts.map((b) => ({ ...b, color: look.border })), r.nodeId); add(posts, f.rails.map((b) => ({ ...b, color: shade(look.border, 0.08) })), r.nodeId); break }
        case 'square': add(borders, perimeter(q, r.y, 0.42, 0.32, gate).map((b) => ({ ...b, color: look.border })), r.nodeId); break
        case 'garden': add(hedges, perimeter(q, r.y, 0.75, 0.6, gate).map((b) => ({ ...b, color: look.border })), r.nodeId); break
        case 'court': add(borders, perimeter(q, r.y, 0.35, 0.3, gate).map((b) => ({ ...b, color: look.border })), r.nodeId); break
      }
    }
    return { plates, borders, hedges, posts }
  }, [layout])
  return (
    <group>
      {[...parts.plates].map(([m, p]) => (
        <MaterialBoxes key={m} boxes={p.specs} material={surf.region[m]} castShadow={false} pick={(i) => p.ids[i]} />
      ))}
      <Boxes boxes={parts.borders.specs} roughness={0.9} pick={(i) => parts.borders.ids[i]} />
      <Boxes boxes={parts.hedges.specs} roughness={1} pick={(i) => parts.hedges.ids[i]} />
      <Boxes boxes={parts.posts.specs} roughness={0.8} pick={(i) => parts.posts.ids[i]} />
      <RegionSigns />
    </group>
  )
}

function AreaPads() {
  const layout = useLayout()
  const surf = useSurfaces()
  return (
    <group>
      {layout.areas.map((a) => (
        <group key={a.nodeId + a.rect.x}>
          <mesh position={[a.rect.x + a.rect.w / 2, a.y - 0.01, a.rect.z + a.rect.d / 2]} receiveShadow material={a.prominence === 'campus' ? surf.campus : surf.ground[a.theme]} userData={pickable(() => a.nodeId)}>
            <boxGeometry args={[a.rect.w, 0.02, a.rect.d]} />
          </mesh>
          {a.plaza && (
            <mesh position={[a.plaza.x + a.plaza.w / 2, a.y + 0.012, a.plaza.z + a.plaza.d / 2]} receiveShadow material={surf.plaza} userData={pickable(() => a.nodeId)}>
              <boxGeometry args={[a.plaza.w, 0.02, a.plaza.d]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// ---------- Signs with real lettering ----------

function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => { void document.fonts.ready.then(() => setReady(true)) }, [])
  return ready
}

function SignBoard({ id, x, z, y = 0, w, accent, tex, posts = false }: { id: NodeId; x: number; z: number; y?: number; w: number; accent: string; tex: THREE.Texture; posts?: boolean }) {
  const user = useMemo(() => pickable(() => id), [id])
  const h = w / 4
  return (
    <group position={[x, y, z]}>
      {posts ? (
        <>
          {[-w / 2 + 0.12, w / 2 - 0.12].map((px) => (
            <mesh key={px} position={[px, 0.55, 0]} castShadow userData={user}>
              <boxGeometry args={[0.1, 1.1, 0.1]} />
              <meshStandardMaterial color="#5b4a3a" />
            </mesh>
          ))}
          <mesh position={[0, 1.1 + h / 2 - 0.15, 0]} castShadow userData={user}>
            <boxGeometry args={[w, h, 0.1]} />
            {[0, 1, 2, 3].map((i) => <meshStandardMaterial key={i} attach={`material-${i}`} color={accent} />)}
            <meshStandardMaterial attach="material-4" map={tex} roughness={0.6} />
            <meshStandardMaterial attach="material-5" color={accent} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.16, 0]} castShadow receiveShadow userData={user}>
            <boxGeometry args={[w + 0.3, 0.32, 0.42]} />
            <meshStandardMaterial color="#d9d1c3" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.62, 0]} rotation={[-0.18, 0, 0]} castShadow userData={user}>
            <boxGeometry args={[w, h, 0.12]} />
            {[0, 1, 2, 3].map((i) => <meshStandardMaterial key={i} attach={`material-${i}`} color={accent} />)}
            <meshStandardMaterial attach="material-4" map={tex} roughness={0.6} />
            <meshStandardMaterial attach="material-5" color={accent} />
          </mesh>
        </>
      )}
    </group>
  )
}

/** Each absorber region names its folder at the gate. */
function RegionSigns() {
  const layout = useLayout()
  const fontsReady = useFontsReady()
  const signs = useMemo(() => (fontsReady ? layout.regions.map((r: RegionEntity) => {
    const name = fs.get(r.nodeId)!.name
    const look = REGION_LOOK[r.metaphor]
    const w = Math.min(3.6, Math.max(2.2, name.length * 0.24))
    return { r, name, w, accent: look.sign, tex: signTexture(name, undefined, look.sign) }
  }) : []), [layout, fontsReady])
  return (
    <group>
      {signs.map((s) => (
        <SignBoard key={s.r.nodeId} id={s.r.nodeId} x={s.r.gate[0] - Math.min(4, s.r.rect.w * 0.3) / 2 - s.w / 2 - 0.4} z={s.r.gate[1] - 0.6} y={s.r.y} w={s.w} accent={s.accent} tex={s.tex} posts />
      ))}
    </group>
  )
}

// ---------- Buildings ----------

export function Buildings() {
  const layout = useLayout()
  const surf = useSurfaces()
  const { floors, lobbies, rugs } = useMemo(() => {
    const floors = new Map<ThemeId, { specs: BoxSpec[]; ids: NodeId[] }>()
    const lobbies: { specs: BoxSpec[]; ids: NodeId[] } = { specs: [], ids: [] }
    const rugs: { specs: BoxSpec[]; ids: NodeId[] } = { specs: [], ids: [] }
    for (const r of layout.rooms) {
      const spec: BoxSpec = { pos: [r.rect.x + r.rect.w / 2, 0.14, r.rect.z + r.rect.d / 2], size: [r.rect.w, 0.08, r.rect.d] }
      const id = r.lobby ? r.buildingId : r.nodeId
      if (r.lobby && r.theme !== 'home') { lobbies.specs.push(spec); lobbies.ids.push(id) }
      else {
        const e = floors.get(r.theme) ?? { specs: [], ids: [] }
        e.specs.push(spec)
        e.ids.push(id)
        floors.set(r.theme, e)
      }
      if (!r.lobby && r.theme !== 'gallery' && r.theme !== 'system' && r.rect.w > 3 && r.rect.d > 3) {
        const accent = accentOf(r.buildingId, r.theme)
        rugs.specs.push({ pos: [r.rect.x + r.rect.w / 2, 0.185, r.rect.z + r.rect.d / 2], size: [r.rect.w - 0.9, 0.012, r.rect.d - 0.9], color: mix(accent, '#efe6d6', 0.35) })
        rugs.ids.push(r.nodeId)
        rugs.specs.push({ pos: [r.rect.x + r.rect.w / 2, 0.19, r.rect.z + r.rect.d / 2], size: [r.rect.w - 1.3, 0.012, r.rect.d - 1.3], color: mix(accent, '#f6efe2', 0.74) })
        rugs.ids.push(r.nodeId)
      }
    }
    return { floors, lobbies, rugs }
  }, [layout])

  return (
    <group>
      {[...floors].map(([theme, f]) => (
        <MaterialBoxes key={theme} boxes={f.specs} material={surf.floor[theme]} castShadow={false} pick={(i) => f.ids[i]} />
      ))}
      <MaterialBoxes boxes={lobbies.specs} material={surf.lobby} castShadow={false} pick={(i) => lobbies.ids[i]} />
      <Boxes boxes={rugs.specs} castShadow={false} roughness={1} pick={(i) => rugs.ids[i]} />
      {THEMES.map((t) => <Facades key={t} theme={t} />)}
      <BuildingSigns />
    </group>
  )
}

const hidden = (n: number): BoxSpec[] => Array.from({ length: n }, () => ({ pos: [0, -10, 0], size: [0.001, 0.001, 0.001] }))

interface Trim { wall: number; kind: 'pilaster' | 'window'; along: number; width: number }

/**
 * Walls of one theme with cornices, base course, pilasters and windows.
 * Walls facing the camera drop to a low sill (dollhouse cutaway); their
 * pilasters follow and their windows disappear.
 */
function Facades({ theme }: { theme: ThemeId }) {
  const layout = useLayout()
  const walls = useMemo(() => layout.walls.filter((w) => w.theme === theme), [layout, theme])
  const pal = PALETTE[theme]
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const heights = useRef<Float32Array>(new Float32Array(0))
  if (heights.current.length !== walls.length) heights.current = new Float32Array(walls.length).fill(-1)
  const last = useRef(new THREE.Vector3(Infinity, 0, 0))
  const settling = useRef(false)
  const wallRef = useRef<THREE.InstancedMesh | null>(null)
  const capRef = useRef<THREE.InstancedMesh | null>(null)
  const trimRef = useRef<THREE.InstancedMesh | null>(null)
  const glassRef = useRef<THREE.InstancedMesh | null>(null)

  const { pilasters, windows, base, caps } = useMemo(() => {
    const trims: Trim[] = []
    walls.forEach((w, i) => {
      if (!w.exterior) return
      const alongX = w.size[0] > w.size[2]
      const len = alongX ? w.size[0] : w.size[2]
      const bays = Math.max(1, Math.round(len / 2.9))
      const bay = len / bays
      for (let b = 0; b <= bays; b++) trims.push({ wall: i, kind: 'pilaster', along: -len / 2 + b * bay, width: 0.26 })
      if (w.size[1] > 2.3) for (let b = 0; b < bays; b++) if (bay > 1.6) trims.push({ wall: i, kind: 'window', along: -len / 2 + (b + 0.5) * bay, width: Math.min(1.25, bay - 0.8) })
    })
    const base: BoxSpec[] = walls.filter((w) => w.exterior).map((w) => ({ pos: [w.pos[0], 0.24, w.pos[2]], size: [w.size[0] + (w.size[0] > w.size[2] ? 0.02 : 0.1), 0.34, w.size[2] + (w.size[0] > w.size[2] ? 0.1 : 0.02)], color: shade(pal.wall, -0.1) }))
    const caps: BoxSpec[] = walls.map((w) => ({ pos: [w.pos[0], w.size[1], w.pos[2]], size: [w.size[0] + 0.14, w.exterior ? 0.2 : 0.08, w.size[2] + 0.14], color: w.exterior ? accentOf(w.buildingId, w.theme) : shade(pal.wallCap, 0.05) }))
    return { pilasters: trims.filter((t) => t.kind === 'pilaster'), windows: trims.filter((t) => t.kind === 'window'), base, caps }
  }, [walls, pal])

  const pilasterInit = useMemo(() => hidden(pilasters.length), [pilasters])
  const windowInit = useMemo(() => hidden(windows.length), [windows])
  const wallBoxes = useMemo<BoxSpec[]>(() => walls.map((w) => ({ pos: [w.pos[0], w.size[1] / 2 + 0.06, w.pos[2]], size: w.size })), [walls])

  useFrame(() => {
    const wm = wallRef.current
    const cm = capRef.current
    if (!wm || !cm || walls.length === 0) return
    if (camera.position.distanceToSquared(last.current) < 0.01) return
    last.current.copy(camera.position)
    const m = new THREE.Matrix4()
    let changed = false
    walls.forEach((w, i) => {
      const dx = camera.position.x - w.pos[0]
      const dz = camera.position.z - w.pos[2]
      const len = Math.hypot(dx, dz) || 1
      const facingCam = (w.normal[0] * dx + w.normal[1] * dz) / len > 0.15
      const full = w.size[1]
      const target = facingCam ? Math.min(full, 0.62) : full
      const prev = heights.current[i]
      const h = prev < 0 ? target : THREE.MathUtils.lerp(prev, target, 0.25)
      const next = Math.abs(h - target) < 0.01 ? target : h
      if (Math.abs(next - prev) < 0.001) return
      heights.current[i] = next
      changed = true
      m.makeScale(w.size[0], next, w.size[2]).setPosition(w.pos[0], next / 2 + 0.06, w.pos[2])
      wm.setMatrixAt(i, m)
      m.makeScale(w.size[0] + 0.14, w.exterior && next > 1 ? 0.2 : 0.08, w.size[2] + 0.14).setPosition(w.pos[0], next + 0.1, w.pos[2])
      cm.setMatrixAt(i, m)
    })
    if (!changed) {
      if (settling.current) { settling.current = false; refreshShadows() }
      return
    }
    settling.current = true
    const place = (mesh: THREE.InstancedMesh | null, list: Trim[], glass: boolean) => {
      if (!mesh) return
      list.forEach((t, j) => {
        const w = walls[t.wall]
        const h = heights.current[t.wall]
        const alongX = w.size[0] > w.size[2]
        const x = w.pos[0] + (alongX ? t.along : 0)
        const z = w.pos[2] + (alongX ? 0 : t.along)
        if (glass) {
          const gh = 1.1
          if (h > 2.25) m.makeScale(alongX ? t.width : w.size[0] + 0.04, gh, alongX ? w.size[2] + 0.04 : t.width).setPosition(x, 0.06 + 1.0 + gh / 2, z)
          else m.makeScale(0.0001, 0.0001, 0.0001).setPosition(x, -5, z)
        } else {
          m.makeScale(alongX ? t.width : w.size[0] + 0.12, h, alongX ? w.size[2] + 0.12 : t.width).setPosition(x, h / 2 + 0.06, z)
        }
        mesh.setMatrixAt(j, m)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    place(trimRef.current, pilasters, false)
    place(glassRef.current, windows, true)
    wm.instanceMatrix.needsUpdate = true
    cm.instanceMatrix.needsUpdate = true
    last.current.set(Infinity, 0, 0)
    invalidate()
  })

  const wallPick = (i: number) => walls[i]?.buildingId ?? null
  const trimPick = (list: Trim[]) => (i: number) => walls[list[i]?.wall]?.buildingId ?? null
  return (
    <group>
      <Boxes boxes={wallBoxes} color={pal.wall} roughness={0.92} meshRef={wallRef} pick={wallPick} />
      <Boxes boxes={caps} roughness={0.7} meshRef={capRef} pick={wallPick} />
      <Boxes boxes={base} roughness={0.9} castShadow={false} />
      <Boxes boxes={pilasterInit} color={shade(pal.wall, -0.035)} roughness={0.9} meshRef={trimRef} pick={trimPick(pilasters)} />
      <Boxes boxes={windowInit} color="#c4d8e2" roughness={0.12} metalness={0.05} castShadow={false} meshRef={glassRef} pick={trimPick(windows)} />
    </group>
  )
}

/** Lettered monument signs at building entrances (offices, studio, gallery, and every area's main building). */
function BuildingSigns() {
  const layout = useLayout()
  const fontsReady = useFontsReady()
  const signs = useMemo(() => {
    if (!fontsReady) return []
    return layout.buildings
      .filter((b) => b.theme !== 'home' && b.theme !== 'system' || layout.context.kind === 'box')
      .map((b) => {
        const name = fs.get(b.nodeId)!.name
        const accent = accentOf(b.nodeId, b.theme)
        const w = Math.min(3.2, Math.max(2.0, name.length * 0.2))
        return { id: b.nodeId, tex: signTexture(name, undefined, accent), w, x: b.rect.x + b.rect.w / 2, z: b.rect.z + b.rect.d + 0.95, accent }
      })
  }, [layout, fontsReady])
  return (
    <group>
      {signs.map((s) => <SignBoard key={s.id} id={s.id} x={s.x} z={s.z} w={s.w} accent={s.accent} tex={s.tex} />)}
    </group>
  )
}

export { unitBox }
