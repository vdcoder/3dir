// The Room's expansion features: a small, deterministic furnishing library.
//
// Each feature declares the smallest zone it fits (furniture never rotates, so
// the minimum is given as width × depth), the largest extent it takes (so one
// zone can hold several features), the zones it prefers, and optional
// keywords that make it the first choice for a room. Furniture pieces have
// fixed physical sizes; a feature repeats its unit (a desk, a seat, a chair)
// as often as its zone allows and centers the result. Zones are filled in
// bands, front to back and west to east; whatever is left that no feature
// fits stays as interior circulation.

import { EPS, rect } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import type { Obj, Region } from '../protocol.ts'

export type FeatureId = 'workstations' | 'classroom' | 'waiting' | 'lounge' | 'reading' | 'plants'
export type ZoneKind = 'front' | 'middle' | 'side'

export interface Feature {
  id: FeatureId
  /** Smallest zone (furniture plus the feature margin on every side). */
  min: { w: number; d: number }
  /** Largest extent the feature takes in a zone. */
  max: { w: number; d: number }
  /** Rooms whose name or path matches prefer this feature. */
  suits?: RegExp
  /** Plants may appear more than once in a room; other features at most once. */
  repeatable?: boolean
  /** Furniture for the inner rectangle (zone minus margins); empty if it does not fit. */
  furnish(r: Rect): Obj[]
  label(objs: Obj[]): string
}

const piece = (x: number, y: number, w: number, d: number, kind: string, label?: string): Obj => ({ rect: rect(x, y, w, d), kind, layer: 0, fixed: { w, d }, ...(label ? { label } : {}) })

/** Fits `n` items of size `s` with gaps `g` into `len`. */
const fit = (len: number, s: number, g: number) => Math.max(0, Math.floor((len + g + EPS) / (s + g)))
const span = (n: number, s: number, g: number) => n * s + Math.max(0, n - 1) * g

export const FEATURES: Record<FeatureId, Feature> = {
  workstations: {
    id: 'workstations', min: { w: 1.8, d: 1.85 }, max: { w: 10, d: 6.5 },
    suits: /financ|budget|report|invoice|tax|payroll|account|source|script|code|design|project|operation|inventor|forecast/i,
    furnish(r) {
      // Desk 1.2 × 0.6 with a chair in front; 0.5 m between desks, 0.9 m aisles between desk rows.
      const cols = fit(r.w, 1.2, 0.5), rows = fit(r.d, 1.25, 0.9)
      if (!cols || !rows) return []
      const x0 = r.x + (r.w - span(cols, 1.2, 0.5)) / 2, y0 = r.y + (r.d - span(rows, 1.25, 0.9)) / 2
      const out: Obj[] = []
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = x0 + i * 1.7, y = y0 + j * 2.15
        out.push(piece(x, y, 1.2, 0.6, 'desk', 'workstation'), piece(x + 0.35, y + 0.75, 0.5, 0.5, 'chair'))
      }
      return out
    },
    label: (o) => { const n = o.filter((x) => x.kind === 'desk').length; return `workstations · ${n} desk${n === 1 ? '' : 's'}` },
  },
  classroom: {
    id: 'classroom', min: { w: 3.0, d: 4.4 }, max: { w: 9, d: 9 },
    suits: /train|class|course|lesson|school|staff|meeting|board|seminar/i,
    furnish(r) {
      // Board and teacher's desk at the north; rows of student desks with chairs behind them.
      const cols = fit(r.w, 0.6, 0.3), rows = fit(r.d - 1.5, 1.0, 0.3)
      if (cols < 2 || rows < 2 || r.w < 2.0) return []
      const cx = r.x + r.w / 2
      const out: Obj[] = [piece(cx - 1.0, r.y, 2.0, 0.1, 'board', 'board'), piece(cx - 0.6, r.y + 0.4, 1.2, 0.6, 'desk', "teacher's desk")]
      const x0 = r.x + (r.w - span(cols, 0.6, 0.3)) / 2
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = x0 + i * 0.9, y = r.y + 1.5 + j * 1.3
        out.push(piece(x, y, 0.6, 0.45, 'student desk'), piece(x + 0.075, y + 0.55, 0.45, 0.45, 'chair'))
      }
      return out
    },
    label: (o) => `classroom · ${o.filter((x) => x.kind === 'student desk').length} seats`,
  },
  waiting: {
    id: 'waiting', min: { w: 1.8, d: 2.05 }, max: { w: 7, d: 3.6 },
    suits: /client|patient|front desk|reception|visitor|customer|support|physio|care|living/i,
    furnish(r) {
      // Chairs along the north edge (a side table after every three), leg room in front;
      // a facing row along the south edge when the zone is deep enough.
      const row = (y: number): Obj[] => {
        const items: string[] = []
        let len = 0
        for (let i = 0; ; i++) {
          const kind = i % 4 === 3 ? 'side table' : 'chair'
          const s = kind === 'chair' ? 0.55 : 0.5
          if (len + (items.length ? 0.1 : 0) + s > r.w + EPS) break
          len += (items.length ? 0.1 : 0) + s
          items.push(kind)
        }
        while (items.length && items[items.length - 1] === 'side table') { items.pop(); len -= 0.6 }
        if (items.filter((k) => k === 'chair').length < 2) return []
        let x = r.x + (r.w - len) / 2
        return items.map((k) => { const s = k === 'chair' ? 0.55 : 0.5; const o = piece(x, y + (0.55 - s) / 2, s, s, k); x += s + 0.1; return o })
      }
      if (r.d < 1.45 - EPS) return []
      const first = row(r.y)
      if (!first.length) return []
      return r.d >= 2.3 - EPS ? [...first, ...row(r.y + r.d - 0.55)] : first
    },
    label: (o) => `waiting area · ${o.filter((x) => x.kind === 'chair').length} chairs`,
  },
  lounge: {
    id: 'lounge', min: { w: 4.0, d: 2.75 }, max: { w: 6, d: 4.5 },
    suits: /home|family|personal|music|video|picture|garden|travel|recipe|living room|lounge/i,
    furnish(r) {
      // Sofa at the north, coffee table in front of it, an armchair on each side.
      if (r.w < 3.4 - EPS || r.d < 2.15 - EPS) return []
      const cx = r.x + r.w / 2, y0 = r.y + (r.d - 2.15) / 2
      return [
        piece(cx - 1.0, y0, 2.0, 0.9, 'sofa', 'sofa'),
        piece(cx - 0.55, y0 + 1.35, 1.1, 0.6, 'coffee table'),
        piece(cx - 0.55 - 0.35 - 0.8, y0 + 1.25, 0.8, 0.8, 'armchair'),
        piece(cx + 0.55 + 0.35, y0 + 1.25, 0.8, 0.8, 'armchair'),
      ]
    },
    label: () => 'lounge',
  },
  reading: {
    id: 'reading', min: { w: 2.2, d: 2.5 }, max: { w: 5, d: 4 },
    suits: /research|archive|library|book|letter|novel|draft|legal|contract|complian|polic|licen|manual|record/i,
    furnish(r) {
      // A study table with two chairs on each side; an armchair and side table when there is room.
      if (r.w < 1.6 - EPS || r.d < 1.9 - EPS) return []
      const extra = r.w >= 1.6 + 0.6 + 0.8 + 0.1 + 0.45 - EPS
      const total = extra ? 1.6 + 0.6 + 0.8 + 0.1 + 0.45 : 1.6
      const x0 = r.x + (r.w - total) / 2, y0 = r.y + (r.d - 1.9) / 2
      const out: Obj[] = [piece(x0, y0 + 0.55, 1.6, 0.8, 'study table', 'study table')]
      for (const dx of [0.25, 0.9]) out.push(piece(x0 + dx, y0, 0.45, 0.45, 'chair'), piece(x0 + dx, y0 + 1.45, 0.45, 0.45, 'chair'))
      if (extra) out.push(piece(x0 + 2.2, y0 + 0.55, 0.8, 0.8, 'armchair'), piece(x0 + 3.1, y0 + 0.725, 0.45, 0.45, 'side table'))
      return out
    },
    label: () => 'reading & study',
  },
  plants: {
    id: 'plants', min: { w: 1.1, d: 1.1 }, max: { w: 3, d: 3 }, repeatable: true,
    furnish(r) {
      // Pots of 0.5 m along the longer side, 1 m apart.
      const along = r.w >= r.d
      const n = fit(along ? r.w : r.d, 0.5, 0.5)
      if (!n || Math.min(r.w, r.d) < 0.5 - EPS) return []
      const len = span(n, 0.5, 0.5)
      return Array.from({ length: n }, (_, i) => along
        ? piece(r.x + (r.w - len) / 2 + i, r.y + (r.d - 0.5) / 2, 0.5, 0.5, 'plant')
        : piece(r.x + (r.w - 0.5) / 2, r.y + (r.d - len) / 2 + i, 0.5, 0.5, 'plant'))
    },
    label: (o) => `plants · ${o.length}`,
  },
}

/** Preferred order of features in each kind of zone (a room's matching features go first). */
const ORDER: Record<ZoneKind, FeatureId[]> = {
  front: ['waiting', 'lounge', 'classroom', 'reading', 'workstations', 'plants'],
  middle: ['reading', 'workstations', 'classroom', 'lounge', 'waiting', 'plants'],
  side: ['workstations', 'reading', 'lounge', 'waiting', 'classroom', 'plants'],
}

export function featureOrder(zone: ZoneKind, semantics: string): FeatureId[] {
  const base = ORDER[zone]
  const match = base.filter((id) => FEATURES[id].suits?.test(semantics))
  return [...match, ...base.filter((id) => !match.includes(id))]
}

export interface PlacedFeature { id: FeatureId; label: string; rect: Rect; zone: ZoneKind }

/** Most bands across a zone, and the most plant groups per zone. */
const BAND = 6
const MAX_PLANTS = 2

/**
 * Fills one zone. `axis` is the direction features follow each other ('x': west → east,
 * 'y': north → south); bands of at most 6 m are stacked across it. Every part of the
 * zone ends up in exactly one region: a feature, or interior circulation.
 */
export function furnishZone(zone: Rect, kind: ZoneKind, axis: 'x' | 'y', semantics: string, used: Set<FeatureId>, margin: number): { regions: Region[]; objects: Obj[]; features: PlacedFeature[] } {
  const regions: Region[] = []
  const objects: Obj[] = []
  const features: PlacedFeature[] = []
  const order = featureOrder(kind, semantics)
  const along = axis === 'x' ? zone.w : zone.d
  const across = axis === 'x' ? zone.d : zone.w
  const minAcross = Math.min(...order.map((id) => (axis === 'x' ? FEATURES[id].min.d : FEATURES[id].min.w)))
  let plants = 0
  let a0 = 0
  const available = (x: Feature, alongRoom: number, acrossRoom: number) => {
    if (x.repeatable ? plants >= MAX_PLANTS : used.has(x.id)) return false
    const needAlong = axis === 'x' ? x.min.w : x.min.d
    const needAcross = axis === 'x' ? x.min.d : x.min.w
    return needAlong <= alongRoom + EPS && needAcross <= acrossRoom + EPS
  }
  while (across - a0 > EPS) {
    // A band is as thick as the first feature that fits needs (at most 6 m); a thin remainder joins it.
    const lead = order.map((id) => FEATURES[id]).find((x) => available(x, along, across - a0))
    let band = Math.min(across - a0, BAND, lead ? (axis === 'x' ? lead.max.d : lead.max.w) : BAND)
    if (across - a0 - band < minAcross) band = across - a0
    let pos = 0
    while (along - pos > EPS) {
      const rem = along - pos
      const f = order.map((id) => FEATURES[id]).find((x) => available(x, rem, band))
      if (!f) break
      let len = Math.min(rem, axis === 'x' ? f.max.w : f.max.d)
      if (rem - len < 1.1) len = rem // a tail too small for anything joins this feature
      const r = axis === 'x' ? rect(zone.x + pos, zone.y + a0, len, band) : rect(zone.x + a0, zone.y + pos, band, len)
      const inner = rect(r.x + margin, r.y + margin, r.w - 2 * margin, r.d - 2 * margin)
      const objs = f.furnish(inner)
      if (!objs.length) break
      const label = f.label(objs)
      regions.push({ rect: r, role: 'feature', label, feature: f.id })
      objects.push(...objs)
      features.push({ id: f.id, label, rect: r, zone: kind })
      if (f.repeatable) plants++
      else used.add(f.id)
      pos += len
    }
    if (along - pos > EPS) {
      const r = axis === 'x' ? rect(zone.x + pos, zone.y + a0, along - pos, band) : rect(zone.x + a0, zone.y + pos, band, along - pos)
      regions.push({ rect: r, role: 'circulation', label: 'open circulation' })
    }
    a0 += band
  }
  return { regions, objects, features }
}
