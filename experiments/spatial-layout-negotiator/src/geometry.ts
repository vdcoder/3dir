// Plain 2D geometry in meters. x runs west → east (width, "w"), y runs
// north → south (depth, "d"). The front / entrance of every container is
// its south side (largest y).

export interface Rect { x: number; y: number; w: number; d: number }

export const EPS = 1e-6

export const rect = (x: number, y: number, w: number, d: number): Rect => ({ x, y, w, d })
export const area = (r: Rect) => r.w * r.d
export const right = (r: Rect) => r.x + r.w
export const bottom = (r: Rect) => r.y + r.d

/** Interiors intersect (touching edges is fine). */
export function overlaps(a: Rect, b: Rect, eps = EPS): boolean {
  return a.x < right(b) - eps && b.x < right(a) - eps && a.y < bottom(b) - eps && b.y < bottom(a) - eps
}

export function contains(outer: Rect, inner: Rect, eps = EPS): boolean {
  return inner.x >= outer.x - eps && inner.y >= outer.y - eps && right(inner) <= right(outer) + eps && bottom(inner) <= bottom(outer) + eps
}

/** Clear distance between two rectangles (0 when they touch or overlap). */
export function separation(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - right(a), a.x - right(b), 0)
  const dy = Math.max(b.y - bottom(a), a.y - bottom(b), 0)
  // Rectangles side by side are separated along one axis; diagonal ones by the larger gap.
  return Math.max(dx, dy)
}

export const round = (v: number, digits = 2) => {
  const k = 10 ** digits
  return Math.round(v * k) / k
}

export const fmt = (v: number) => (Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : v.toFixed(Math.abs(v) < 1 ? 2 : 1))

/**
 * The free space of `outer` minus `holes`, as non-overlapping rectangles that
 * tile it exactly (vertical-strip decomposition, merged where possible).
 */
export function freeRects(outer: Rect, holes: Rect[]): Rect[] {
  const xs = new Set<number>([outer.x, right(outer)])
  for (const h of holes) { xs.add(Math.max(outer.x, h.x)); xs.add(Math.min(right(outer), right(h))) }
  const cols = [...xs].sort((a, b) => a - b)
  const strips: Rect[] = []
  for (let i = 0; i + 1 < cols.length; i++) {
    const x0 = cols[i], x1 = cols[i + 1]
    if (x1 - x0 <= EPS) continue
    const mid = (x0 + x1) / 2
    const blocked = holes.filter((h) => h.x <= mid && right(h) >= mid).map((h) => [Math.max(outer.y, h.y), Math.min(bottom(outer), bottom(h))] as const).sort((a, b) => a[0] - b[0])
    let y = outer.y
    for (const [y0, y1] of blocked) {
      if (y0 - y > EPS) strips.push(rect(x0, y, x1 - x0, y0 - y))
      y = Math.max(y, y1)
    }
    if (bottom(outer) - y > EPS) strips.push(rect(x0, y, x1 - x0, bottom(outer) - y))
  }
  // Merge horizontally adjacent strips with the same vertical extent.
  const merged: Rect[] = []
  for (const s of strips.sort((a, b) => a.y - b.y || a.d - b.d || a.x - b.x)) {
    const last = merged[merged.length - 1]
    if (last && Math.abs(last.y - s.y) < EPS && Math.abs(last.d - s.d) < EPS && Math.abs(right(last) - s.x) < EPS) last.w += s.w
    else merged.push({ ...s })
  }
  return merged
}
