import { useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ThemeId } from '../mapping/plan'
import type { NodeId } from '../model/types'
import { Boxes, type BoxSpec } from './Boxes'
import { LAND, layout, PALETTE } from './worldData'
import { usePick } from './usePick'

const THEMES: ThemeId[] = ['business', 'studio', 'gallery', 'home', 'system']

export function Land() {
  const l = layout.land
  const pick = usePick()
  return (
    <group>
      {/* The model board: a thick base with a grass top. */}
      <RoundedBox args={[l.w, 3, l.d]} radius={1.2} smoothness={4} position={[l.x + l.w / 2, -1.52, l.z + l.d / 2]} receiveShadow
        onClick={(e) => { e.stopPropagation(); pick(null, 'click') }}>
        <meshStandardMaterial color={LAND.grass} roughness={0.95} />
      </RoundedBox>
      <mesh position={[l.x + l.w / 2, -3.2, l.z + l.d / 2]}>
        <boxGeometry args={[l.w - 1.4, 0.6, l.d - 1.4]} />
        <meshStandardMaterial color={LAND.base} roughness={0.9} />
      </mesh>
      <Walkways />
      {layout.districts.map((d) => (
        <group key={d.key}>
          <RoundedBox args={[d.rect.w + 4, 0.08, d.rect.d + 4]} radius={0.04} smoothness={2} position={[d.rect.x + d.rect.w / 2, 0.04, d.rect.z + d.rect.d / 2]} receiveShadow
            onClick={(e) => { e.stopPropagation(); pick(d.nodeIds.length === 1 && layout.anchors.get(d.nodeIds[0])?.level === 'district' ? d.nodeIds[0] : null, 'click') }}
            onDoubleClick={(e) => { e.stopPropagation(); if (d.nodeIds.length === 1) pick(d.nodeIds[0], 'double') }}>
            <meshStandardMaterial color={PALETTE[d.theme].ground} roughness={0.92} />
          </RoundedBox>
          {d.plaza && (
            <RoundedBox args={[d.plaza.w, 0.06, d.plaza.d]} radius={0.03} smoothness={2} position={[d.plaza.x + d.plaza.w / 2, 0.1, d.plaza.z + d.plaza.d / 2]} receiveShadow
              onClick={(e) => { e.stopPropagation(); pick(d.nodeIds[0], 'click') }}>
              <meshStandardMaterial color="#efe9de" roughness={0.8} />
            </RoundedBox>
          )}
        </group>
      ))}
    </group>
  )
}

function Walkways() {
  const boxes = useMemo(() => {
    const out: BoxSpec[] = []
    for (const w of layout.walkways) {
      for (let i = 0; i < w.points.length - 1; i++) {
        const [ax, az] = w.points[i]
        const [bx, bz] = w.points[i + 1]
        const len = Math.hypot(bx - ax, bz - az)
        if (len < 0.01) continue
        const horizontal = Math.abs(bx - ax) > Math.abs(bz - az)
        out.push({
          pos: [(ax + bx) / 2, 0.015, (az + bz) / 2],
          size: horizontal ? [len + w.width, 0.03, w.width] : [w.width, 0.03, len + w.width],
          color: w.kind === 'avenue' ? LAND.avenue : LAND.path,
        })
      }
    }
    return out
  }, [])
  return <Boxes boxes={boxes} castShadow={false} />
}

// ---------- Buildings ----------

export function Buildings() {
  const pick = usePick()
  const floors = useMemo(() => {
    const byTheme = new Map<ThemeId, { specs: BoxSpec[]; ids: NodeId[] }>()
    for (const r of layout.rooms) {
      const e = byTheme.get(r.theme) ?? { specs: [], ids: [] }
      e.specs.push({ pos: [r.rect.x + r.rect.w / 2, 0.1, r.rect.z + r.rect.d / 2], size: [r.rect.w, 0.08, r.rect.d], color: r.lobby ? PALETTE[r.theme].lobbyFloor : PALETTE[r.theme].floor })
      e.ids.push(r.lobby ? r.buildingId : r.nodeId)
      byTheme.set(r.theme, e)
    }
    return byTheme
  }, [])

  return (
    <group>
      {[...floors].map(([theme, f]) => (
        <Boxes key={theme} boxes={f.specs} castShadow={false} onPick={(i, _e, kind) => pick(f.ids[i], kind)} />
      ))}
      {THEMES.map((t) => <ThemeWalls key={t} theme={t} />)}
    </group>
  )
}

/** Walls of one theme. Walls facing the camera drop to a low sill (dollhouse cutaway). */
function ThemeWalls({ theme }: { theme: ThemeId }) {
  const walls = useMemo(() => layout.walls.filter((w) => w.theme === theme), [theme])
  const wallRef = useRef<THREE.InstancedMesh | null>(null)
  const capRef = useRef<THREE.InstancedMesh | null>(null)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const heights = useRef<Float32Array>(new Float32Array(walls.length).fill(-1))
  const last = useRef(new THREE.Vector3(Infinity, 0, 0))
  const pick = usePick()

  const base = useMemo<BoxSpec[]>(() => walls.map((w) => ({ pos: [w.pos[0], w.size[1] / 2, w.pos[2]], size: w.size })), [walls])
  const caps = useMemo<BoxSpec[]>(() => walls.map((w) => ({ pos: [w.pos[0], w.size[1], w.pos[2]], size: [w.size[0] + 0.06, 0.08, w.size[2] + 0.06] })), [walls])

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
      const facing = (w.normal[0] * dx + w.normal[1] * dz) / len > 0.15
      const full = w.size[1]
      const target = facing ? (w.exterior ? 0.55 : Math.min(full, 0.55)) : full
      const h = heights.current[i] < 0 ? target : THREE.MathUtils.lerp(heights.current[i], target, 0.25)
      if (Math.abs(h - heights.current[i]) < 0.002) return
      heights.current[i] = Math.abs(h - target) < 0.01 ? target : h
      changed = true
      const hh = heights.current[i]
      m.makeScale(w.size[0], hh, w.size[2]).setPosition(w.pos[0], hh / 2 + 0.06, w.pos[2])
      wm.setMatrixAt(i, m)
      m.makeScale(w.size[0] + 0.06, 0.08, w.size[2] + 0.06).setPosition(w.pos[0], hh + 0.1, w.pos[2])
      cm.setMatrixAt(i, m)
    })
    if (changed) {
      wm.instanceMatrix.needsUpdate = true
      cm.instanceMatrix.needsUpdate = true
      // Keep animating until walls settle.
      last.current.set(Infinity, 0, 0)
      invalidate()
    }
  })

  const onPick = (i: number, e: ThreeEvent<PointerEvent | MouseEvent>, kind: 'click' | 'double' | 'over' | 'out') => { void e; pick(walls[i].buildingId, kind) }
  return (
    <group>
      <Boxes boxes={base} color={PALETTE[theme].wall} roughness={0.9} meshRef={wallRef} onPick={onPick} />
      <Boxes boxes={caps} color={PALETTE[theme].wallCap} roughness={0.8} meshRef={capRef} castShadow={false} onPick={onPick} />
    </group>
  )
}
