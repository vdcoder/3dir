// Independent checks of a finished layout. Returns every violation found.

import { area, bottom, contains, EPS, overlaps, right, separation } from './geometry.ts'
import type { Rect } from './geometry.ts'
import { within } from './model.ts'
import type { AxisLedger, Placed } from './protocol.ts'

export interface Violation { path: string; name: string; check: string; detail: string }

const tol = (scale: number) => EPS * Math.max(1, scale)

export function validate(root: Placed, absorb: number): Violation[] {
  const out: Violation[] = []
  const fail = (n: Placed, check: string, detail: string) => out.push({ path: n.path, name: n.name, check, detail })

  const checkLedger = (n: Placed, axis: string, l: AxisLedger, alloc: number, min: number) => {
    const t = tol(alloc)
    if (Math.abs(l.alloc - alloc) > t) fail(n, 'ledger', `${axis}: ledger allocation ${l.alloc} ≠ actual ${alloc}`)
    if (Math.abs(l.min - min) > t) fail(n, 'ledger', `${axis}: ledger minimum ${l.min} ≠ ${min}`)
    if (Math.abs(l.absorbed + l.passed - l.surplus) > t) fail(n, 'ledger', `${axis}: absorbed ${l.absorbed} + passed ${l.passed} ≠ surplus ${l.surplus}`)
    if (l.surplus < -t) fail(n, 'ledger', `${axis}: negative surplus ${l.surplus}`)
    if (l.absorbed < absorb * l.surplus - t) fail(n, 'ledger', `${axis}: absorbed ${l.absorbed} < ${absorb} × surplus ${l.surplus}`)
    if (l.passed < -t) fail(n, 'ledger', `${axis}: passed ${l.passed} < 0`)
  }

  const walk = (n: Placed, parent: Placed | null) => {
    const r = n.rect
    const t = tol(Math.max(r.w, r.d))
    // Allocation is never below the selected minimum.
    if (r.w < n.min.w - t || r.d < n.min.d - t) fail(n, 'min-size', `${r.w.toFixed(3)} × ${r.d.toFixed(3)} < minimum ${n.min.w.toFixed(3)} × ${n.min.d.toFixed(3)}`)
    if (!(r.w >= 0 && r.d >= 0) || ![r.x, r.y, r.w, r.d].every(Number.isFinite)) fail(n, 'geometry', `bad rectangle ${JSON.stringify(r)}`)
    if (parent) {
      if (!contains(parent.rect, r, tol(Math.max(parent.rect.w, parent.rect.d)))) fail(n, 'containment', `outside ${parent.name}`)
      // Canonical containment: real descendants only; synthetic containers keep their folder's path.
      const ok = n.synthetic ? n.path === parent.path : within(n.path, parent.path) && n.path !== parent.path
      if (!ok) fail(n, 'canonical', `${n.path} is not a canonical descendant of ${parent.path}`)
    }
    checkLedger(n, 'x', n.ledger.x, r.w, n.min.w)
    checkLedger(n, 'y', n.ledger.y, r.d, n.min.d)
    for (const [i, l] of (n.ledger.rows ?? []).entries()) checkLedger(n, `x(row ${i})`, l, r.w, n.min.w)

    const kids = n.children
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      if (overlaps(kids[i].rect, kids[j].rect)) fail(n, 'overlap', `${kids[i].name} overlaps ${kids[j].name}`)
    }
    // All of the envelope is accounted for: children + the container's own regions tile it exactly.
    if (kids.length || n.regions.length) {
      const covered = kids.reduce((s, k) => s + area(k.rect), 0) + n.regions.reduce((s, g) => s + area(g.rect), 0)
      if (Math.abs(covered - area(r)) > tol(area(r)) * 10) fail(n, 'accounting', `children + own regions = ${covered.toFixed(4)} m² ≠ envelope ${area(r).toFixed(4)} m²`)
      for (const g of n.regions) {
        if (!contains(r, g.rect, t)) fail(n, 'accounting', `region ${g.label} outside`)
        for (const k of kids) if (overlaps(g.rect, k.rect)) fail(n, 'accounting', `region ${g.label} overlaps ${k.name}`)
      }
      for (let i = 0; i < n.regions.length; i++) for (let j = i + 1; j < n.regions.length; j++) {
        if (overlaps(n.regions[i].rect, n.regions[j].rect)) fail(n, 'accounting', `regions ${n.regions[i].label} and ${n.regions[j].label} overlap`)
      }
    }
    // Fixed physical objects: inside, not colliding, original size.
    for (const o of n.objects) {
      if (!contains(r, o.rect, t)) fail(n, 'object', `${o.kind} ${o.label ?? ''} outside its container`)
      if (o.fixed && (Math.abs(o.rect.w - o.fixed.w) > t || Math.abs(o.rect.d - o.fixed.d) > t)) fail(n, 'fixed-size', `${o.kind} resized to ${o.rect.w} × ${o.rect.d}`)
    }
    for (let i = 0; i < n.objects.length; i++) for (let j = i + 1; j < n.objects.length; j++) {
      const a = n.objects[i], b = n.objects[j]
      if (a.layer === b.layer && overlaps(a.rect, b.rect)) fail(n, 'object', `${a.kind} overlaps ${b.kind}`)
    }
    // Clearances.
    const ru = n.rules
    if (ru.pad) for (const k of kids) {
      const p = ru.pad
      if (k.rect.x - r.x < p.l - t || right(r) - right(k.rect) < p.r - t || k.rect.y - r.y < p.t - t || bottom(r) - bottom(k.rect) < p.b - t) fail(n, 'clearance', `${k.name} is closer to the edge than the minimum padding`)
    }
    if (ru.minSep !== undefined) for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      if (separation(kids[i].rect, kids[j].rect) < ru.minSep - t) fail(n, 'clearance', `${kids[i].name} and ${kids[j].name} closer than ${ru.minSep}`)
    }
    if (ru.rowGroups) {
      const rows = ru.rowGroups.map((g) => g.map((i) => kids[i]))
      rows.forEach((row) => {
        // Row alignment: same top and same depth for everyone in an east–west row.
        for (const k of row) if (Math.abs(k.rect.y - row[0].rect.y) > t || Math.abs(k.rect.d - row[0].rect.d) > t) fail(n, 'row-alignment', `${k.name} not aligned with ${row[0].name}`)
        const sorted = [...row].sort((a, b) => a.rect.x - b.rect.x)
        for (let i = 1; i < sorted.length; i++) if (sorted[i].rect.x - right(sorted[i - 1].rect) < (ru.gapX ?? 0) - t) fail(n, 'clearance', `${sorted[i - 1].name} and ${sorted[i].name} closer than ${ru.gapX}`)
      })
      for (let i = 1; i < rows.length; i++) {
        const gap = Math.min(...rows[i].map((k) => k.rect.y)) - Math.max(...rows[i - 1].map((k) => bottom(k.rect)))
        if (gap < (ru.gapY ?? 0) - t) fail(n, 'clearance', `rows ${i - 1} and ${i} closer than ${ru.gapY}`)
      }
    }
    if (ru.uniformKind) {
      const same = kids.filter((k) => k.kind === ru.uniformKind)
      for (const k of same) if (Math.abs(k.rect.w - same[0].rect.w) > t || Math.abs(k.rect.d - same[0].rect.d) > t) fail(n, 'uniform', `${k.name} differs from ${same[0].name}`)
    }
    for (const k of kids) walk(k, n)
  }
  walk(root, null)
  return out
}

export function* nodes(p: Placed): Generator<Placed> {
  yield p
  for (const c of p.children) yield* nodes(c)
}

export function countContainers(p: Placed): number {
  let n = 0
  for (const x of nodes(p)) if (x.kind !== 'book' && x.kind !== 'table') n++
  return n
}

/** Share of the root's area taken by rooms, and by children at the top level. */
export function utilization(p: Placed): { rooms: number; topLevel: number } {
  let rooms = 0
  for (const x of nodes(p)) if (x.kind === 'room') rooms += area(x.rect)
  return { rooms: rooms / area(p.rect), topLevel: p.children.reduce((s, c) => s + area(c.rect), 0) / area(p.rect) }
}

export const rectOf = (p: Placed): Rect => p.rect
