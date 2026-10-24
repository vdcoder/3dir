import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ThemeId } from '../mapping/plan'
import type { NodeId } from '../model/types'
import { fs } from '../state/store'
import { Boxes, type BoxSpec } from './Boxes'
import { grass, paving, planks, signTexture, terrazzo, worldMapMaterial } from './textures'
import { accentOf, LAND, layout, PALETTE } from './worldData'
import { usePick, type PickKind } from './usePick'
import { refreshShadows } from './shadows'

const THEMES: ThemeId[] = ['business', 'studio', 'gallery', 'home', 'system']
const unitBox = new THREE.BoxGeometry(1, 1, 1)

const mix = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()
const shade = (hex: string, k: number) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString() }

// ---------- Surface materials (world-space textures) ----------

function useSurfaces() {
  return useMemo(() => {
    const ground: Record<ThemeId, THREE.Material> = {
      business: worldMapMaterial(paving('#e4ddd1', 11, 6), 7.2, { roughness: 0.9 }),
      studio: worldMapMaterial(paving('#ddccae', 12, 5), 6, { roughness: 0.92 }),
      gallery: worldMapMaterial(paving('#ddbca3', 13, 8), 6.4, { roughness: 0.9 }),
      home: worldMapMaterial(grass('#bfd09f', 14), 18, { roughness: 1 }),
      system: worldMapMaterial(terrazzo('#c3c6c6', 15), 5, { roughness: 0.95 }),
    }
    const floor: Record<ThemeId, THREE.Material> = {
      business: worldMapMaterial(planks('#d6bd97', 21, 10), 4.5, { roughness: 0.7 }),
      studio: worldMapMaterial(planks('#cfa676', 22, 7), 4.5, { roughness: 0.75 }),
      gallery: worldMapMaterial(terrazzo('#ede8e0', 23), 3, { roughness: 0.55 }),
      home: worldMapMaterial(planks('#d3b289', 24, 8), 4.5, { roughness: 0.75 }),
      system: worldMapMaterial(paving('#c7cbce', 25, 8), 4, { roughness: 0.8 }),
    }
    const lobby = worldMapMaterial(paving('#e9e1d3', 26, 4), 2.4, { roughness: 0.6 })
    const land = worldMapMaterial(grass(LAND.grass, 31), 26, { roughness: 1 })
    const plaza = worldMapMaterial(paving('#efe8dc', 32, 4), 4, { roughness: 0.75 })
    const path = worldMapMaterial(paving(LAND.path, 33, 3), 3, { roughness: 0.9 })
    return { ground, floor, lobby, land, plaza, path }
  }, [])
}

// ---------- Land, district grounds, walkways ----------

export function Land() {
  const l = layout.land
  const pick = usePick()
  const surf = useSurfaces()
  return (
    <group>
      {/* The model board: a grass top on a thick wooden base. */}
      <RoundedBox args={[l.w, 1.2, l.d]} radius={0.5} smoothness={3} position={[l.x + l.w / 2, -0.6, l.z + l.d / 2]} receiveShadow material={surf.land}
        onClick={(e) => { e.stopPropagation(); pick(null, 'click') }} />
      <RoundedBox args={[l.w + 1.2, 2.6, l.d + 1.2]} radius={0.7} smoothness={3} position={[l.x + l.w / 2, -2.1, l.z + l.d / 2]}>
        <meshStandardMaterial color="#6f5a45" roughness={0.75} />
      </RoundedBox>
      <Walkways material={surf.path} />
      {layout.districts.map((d) => {
        const single = d.nodeIds.length === 1 ? d.nodeIds[0] : null
        return (
          <group key={d.key}>
            <RoundedBox args={[d.rect.w + 4, 0.1, d.rect.d + 4]} radius={0.05} smoothness={2} position={[d.rect.x + d.rect.w / 2, 0.05, d.rect.z + d.rect.d / 2]} receiveShadow material={surf.ground[d.theme]}
              onClick={(e) => { e.stopPropagation(); pick(single && layout.anchors.get(single)?.level === 'district' ? single : null, 'click') }}
              onDoubleClick={(e) => { e.stopPropagation(); if (single) pick(single, 'double') }} />
            {d.plaza && (
              <RoundedBox args={[d.plaza.w, 0.08, d.plaza.d]} radius={0.04} smoothness={2} position={[d.plaza.x + d.plaza.w / 2, 0.12, d.plaza.z + d.plaza.d / 2]} receiveShadow material={surf.plaza}
                onClick={(e) => { e.stopPropagation(); pick(d.nodeIds[0], 'click') }}
                onDoubleClick={(e) => { e.stopPropagation(); pick(d.nodeIds[0], 'double') }} />
            )}
          </group>
        )
      })}
    </group>
  )
}

function Walkways({ material }: { material: THREE.Material }) {
  const boxes = useMemo(() => {
    const out: BoxSpec[] = []
    for (const w of layout.walkways) {
      for (let i = 0; i < w.points.length - 1; i++) {
        const [ax, az] = w.points[i]
        const [bx, bz] = w.points[i + 1]
        const len = Math.hypot(bx - ax, bz - az)
        if (len < 0.01) continue
        const horizontal = Math.abs(bx - ax) > Math.abs(bz - az)
        out.push({ pos: [(ax + bx) / 2, 0.02, (az + bz) / 2], size: horizontal ? [len + w.width, 0.04, w.width] : [w.width, 0.04, len + w.width] })
      }
    }
    return out
  }, [])
  return <MaterialBoxes boxes={boxes} material={material} castShadow={false} />
}

/** Instanced boxes with a shared custom material. */
function MaterialBoxes({ boxes, material, castShadow = true, onPick }: { boxes: BoxSpec[]; material: THREE.Material; castShadow?: boolean; onPick?: (i: number, kind: PickKind) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    boxes.forEach((b, i) => { m.makeScale(...b.size).setPosition(...b.pos); mesh.setMatrixAt(i, m) })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [boxes])
  if (!boxes.length) return null
  return (
    <instancedMesh ref={ref} args={[unitBox, material, boxes.length]} castShadow={castShadow} receiveShadow
      onClick={onPick ? (e) => { if (e.instanceId !== undefined) { e.stopPropagation(); onPick(e.instanceId, 'click') } } : undefined}
      onDoubleClick={onPick ? (e) => { if (e.instanceId !== undefined) { e.stopPropagation(); onPick(e.instanceId, 'double') } } : undefined}
      onPointerMove={onPick ? (e) => { if (e.instanceId !== undefined) { e.stopPropagation(); onPick(e.instanceId, 'over') } } : undefined}
      onPointerOut={onPick ? (e) => { if (e.instanceId !== undefined) onPick(e.instanceId, 'out') } : undefined}
    />
  )
}

// ---------- Buildings ----------

export function Buildings() {
  const pick = usePick()
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
        const accent = accentOf(r.buildingId)
        rugs.specs.push({ pos: [r.rect.x + r.rect.w / 2, 0.185, r.rect.z + r.rect.d / 2], size: [r.rect.w - 0.9, 0.012, r.rect.d - 0.9], color: mix(accent, '#efe6d6', 0.35) })
        rugs.ids.push(r.nodeId)
        rugs.specs.push({ pos: [r.rect.x + r.rect.w / 2, 0.19, r.rect.z + r.rect.d / 2], size: [r.rect.w - 1.3, 0.012, r.rect.d - 1.3], color: mix(accent, '#f6efe2', 0.74) })
        rugs.ids.push(r.nodeId)
      }
    }
    return { floors, lobbies, rugs }
  }, [])

  return (
    <group>
      {[...floors].map(([theme, f]) => (
        <MaterialBoxes key={theme} boxes={f.specs} material={surf.floor[theme]} castShadow={false} onPick={(i, kind) => pick(f.ids[i], kind)} />
      ))}
      <MaterialBoxes boxes={lobbies.specs} material={surf.lobby} castShadow={false} onPick={(i, kind) => pick(lobbies.ids[i], kind)} />
      <Boxes boxes={rugs.specs} castShadow={false} roughness={1} onPick={(i, _e, kind) => pick(rugs.ids[i], kind)} />
      {THEMES.map((t) => <Facades key={t} theme={t} />)}
      <Signs />
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
  const walls = useMemo(() => layout.walls.filter((w) => w.theme === theme), [theme])
  const pal = PALETTE[theme]
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const pick = usePick()
  const heights = useRef<Float32Array>(new Float32Array(walls.length).fill(-1))
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
    const caps: BoxSpec[] = walls.map((w) => ({ pos: [w.pos[0], w.size[1], w.pos[2]], size: [w.size[0] + 0.14, w.exterior ? 0.2 : 0.08, w.size[2] + 0.14], color: w.exterior ? accentOf(w.buildingId) : shade(pal.wallCap, 0.05) }))
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
    // Trims follow their wall.
    const place = (mesh: THREE.InstancedMesh | null, list: Trim[], glass: boolean) => {
      if (!mesh) return
      list.forEach((t, j) => {
        const w = walls[t.wall]
        const h = heights.current[t.wall]
        const alongX = w.size[0] > w.size[2]
        const x = w.pos[0] + (alongX ? t.along : 0)
        const z = w.pos[2] + (alongX ? 0 : t.along)
        if (glass) {
          const visible = h > 2.25
          const gh = 1.1
          if (visible) m.makeScale(alongX ? t.width : w.size[0] + 0.04, gh, alongX ? w.size[2] + 0.04 : t.width).setPosition(x, 0.06 + 1.0 + gh / 2, z)
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

  const onPick = (i: number, _e: unknown, kind: PickKind) => pick(walls[i].buildingId, kind)
  const trimPick = (list: Trim[]) => (i: number, _e: unknown, kind: PickKind) => pick(walls[list[i].wall].buildingId, kind)
  return (
    <group>
      <Boxes boxes={wallBoxes} color={pal.wall} roughness={0.92} meshRef={wallRef} onPick={onPick} />
      <Boxes boxes={caps} roughness={0.7} meshRef={capRef} onPick={onPick} />
      <Boxes boxes={base} roughness={0.9} castShadow={false} />
      <Boxes boxes={pilasterInit} color={shade(pal.wall, -0.035)} roughness={0.9} meshRef={trimRef} onPick={trimPick(pilasters)} />
      <Boxes boxes={windowInit} color="#c4d8e2" roughness={0.12} metalness={0.05} castShadow={false} meshRef={glassRef} onPick={trimPick(windows)} />
    </group>
  )
}

/** Monument signs with real lettering in front of business, studio and gallery buildings. */
function Signs() {
  const pick = usePick()
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => { void document.fonts.ready.then(() => setFontsReady(true)) }, [])
  const signs = useMemo(() => {
    if (!fontsReady) return []
    return layout.buildings
      .filter((b) => b.theme === 'business' || b.theme === 'studio' || b.theme === 'gallery')
      .map((b) => {
        const name = fs.get(b.nodeId)!.name
        const accent = accentOf(b.nodeId)
        const tex = signTexture(name, undefined, accent)
        const w = Math.min(3.2, Math.max(2.0, name.length * 0.2))
        return { id: b.nodeId, tex, w, x: b.rect.x + b.rect.w / 2, z: b.rect.z + b.rect.d + 0.95, accent }
      })
  }, [fontsReady])
  return (
    <group>
      {signs.map((s) => (
        <group key={s.id} position={[s.x, 0, s.z]} rotation={[0, 0, 0]}
          onClick={(e) => { e.stopPropagation(); pick(s.id, 'click') }}
          onDoubleClick={(e) => { e.stopPropagation(); pick(s.id, 'double') }}>
          <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[s.w + 0.3, 0.32, 0.42]} />
            <meshStandardMaterial color="#d9d1c3" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.62, 0]} rotation={[-0.18, 0, 0]} castShadow>
            <boxGeometry args={[s.w, s.w / 4, 0.12]} />
            <meshStandardMaterial attach="material-0" color={s.accent} />
            <meshStandardMaterial attach="material-1" color={s.accent} />
            <meshStandardMaterial attach="material-2" color={s.accent} />
            <meshStandardMaterial attach="material-3" color={s.accent} />
            <meshStandardMaterial attach="material-4" map={s.tex} roughness={0.6} />
            <meshStandardMaterial attach="material-5" color={s.accent} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
