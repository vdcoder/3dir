import { describe, expect, it } from 'vitest'
import { arrangeAt, layout } from '../src/engine.ts'
import type { Rect } from '../src/geometry.ts'
import type { Placed } from '../src/protocol.ts'
import { demoHierarchy, mixedRoom } from '../src/synth.ts'
import { nodes } from '../src/validate.ts'
import type { RoomPlanV3, RoomRowMeta } from '../src/v3/room.ts'
import { validateV3 } from '../src/v3/validate.ts'
import { measureV3 } from './helpers.ts'

// Valid layouts to corrupt: the demo world, and a grown room with a segmented folder, ordinary rows,
// a file table, feature zones and a walkway.
const world = layout(demoHierarchy(), { version: 'v3', seed: 1 }).placed
const node = mixedRoom('C:\\Users\\Amanda\\Documents\\Business\\Clients', 'Records', [0.6, 0.8, 0.9, 1.4, 1.7, 2.6, 30], 40)
const { ctx, m } = measureV3(node)
// An offer with at least two ordinary rows, one of them holding several shelves.
const offer = m.offers.find((o) => {
  const ord = (o.plan as RoomPlanV3).rows.filter((r) => r.kind === 'shelves')
  return ord.length >= 2 && ord.some((r) => r.members.length > 1)
})!
const roomP = arrangeAt(m, offer, ctx, { w: offer.w, d: offer.d + 7 })

const checks = (p: Placed) => new Set(validateV3(p).map((v) => v.check))
const find = (p: Placed, pred: (n: Placed) => boolean) => { for (const n of nodes(p)) if (pred(n)) return n; throw new Error('not found') }
const corrupt = (base: Placed, f: (p: Placed) => void) => { const p = structuredClone(base); f(p); return checks(p) }
const rows = (p: Placed) => p.meta!.rows as RoomRowMeta[]

describe('α.v3 validator: every new invariant catches a deliberate violation', () => {
  it('starts from valid layouts', () => {
    expect(validateV3(world)).toEqual([])
    expect(validateV3(roomP)).toEqual([])
    expect(rows(roomP).filter((r) => r.kind === 'stack').length).toBeGreaterThan(2)
    expect((roomP.meta!.features as unknown[]).length).toBeGreaterThan(0)
  })

  it('1 · an area child not at its offer size', () => {
    expect(corrupt(world, (p) => { const a = find(p, (n) => n.kind === 'area'); a.children[0].rect.d -= 0.5 })).toContain('area-exact')
  })

  it('2 · a resized building in a campus, and any container off its measured size', () => {
    const c = corrupt(world, (p) => { const b = find(p, (n) => n.kind === 'building' && !!n.meta?.v3 && find(p, (x) => x.kind === 'campus').children.includes(n)); b.rect.w += 0.4 })
    expect(c).toContain('campus-exact')
    expect(c).toContain('exact-size')
  })

  it('3 · an off-center building, and a building whose entrance walk is missing', () => {
    expect(corrupt(world, (p) => { const c = find(p, (n) => n.kind === 'campus'); c.children[0].rect.x += 0.3 })).toContain('campus-centering')
    expect(corrupt(world, (p) => {
      const c = find(p, (n) => n.kind === 'campus' && (n.meta!.walks as (Rect | null)[]).some(Boolean))
      const walks = c.meta!.walks as (Rect | null)[]
      walks[walks.findIndex(Boolean)] = null
    })).toContain('campus-entrance')
  })

  it('4 · a room not at its row\'s common depth', () => {
    expect(corrupt(world, (p) => { const b = find(p, (n) => n.kind === 'building' && (n.rules.rowGroups?.[0]?.length ?? 0) > 1); (b.meta!.rowDepths as number[])[0] += 0.5 })).toContain('row-depth')
  })

  it('4b · a corridor or path widened to consume space', () => {
    expect(corrupt(world, (p) => { const b = find(p, (n) => n.kind === 'building' && n.regions.some((g) => g.role === 'corridor')); b.regions.find((g) => g.role === 'corridor')!.rect.d += 0.4 })).toContain('fixed-separator')
  })

  it('5 · a room that passes growth to its contents', () => {
    expect(corrupt(roomP, (p) => { p.ledger.y.absorbed = 0; p.ledger.y.passed = p.ledger.y.surplus })).toContain('room-growth')
    expect(corrupt(roomP, (p) => { const t = p.children.find((k) => k.kind === 'table')!; t.rect.w += 0.2 })).toContain('room-growth')
  })

  it('6 · a room wider than MAX_ROOM_WIDTH', () => {
    expect(corrupt(roomP, (p) => { p.rect.w = 10.5 })).toContain('room-width')
  })

  it('7 · unequal shelves in one ordinary row', () => {
    expect(corrupt(roomP, (p) => { const r = rows(p).find((x) => x.kind === 'shelves' && x.children.length > 1)!; p.children[r.children[1]].rect.w += 0.1 })).toContain('row-uniform')
  })

  it('9 · rows not allocated shortest-first', () => {
    expect(corrupt(roomP, (p) => {
      const rs = rows(p)
      const ord = rs.map((r, i) => [r, i] as const).filter(([r]) => r.kind === 'shelves')
      const [a, b] = [ord[0][1], ord[ord.length - 1][1]]
      ;[rs[a], rs[b]] = [rs[b], rs[a]]
    })).toContain('shortest-first')
  })

  it('10–12 · an oversized segment, a broken stack, a missing book, a missing rail', () => {
    const seg = (p: Placed) => p.children.find((k) => k.meta?.segment)!
    expect(corrupt(roomP, (p) => { seg(p).rect.w = 9.6 })).toContain('segment-size')
    expect(corrupt(roomP, (p) => { const rs = rows(p); const i = rs.findIndex((r) => r.kind === 'stack'); rs.push(rs.splice(i, 1)[0]) })).toContain('segment-continuity')
    expect(corrupt(roomP, (p) => { seg(p).children.pop() })).toContain('segment-identity')
    expect(corrupt(roomP, (p) => { p.objects.splice(p.objects.findIndex((o) => o.kind === 'rail'), 1) })).toContain('segment-markings')
  })

  it('13 · a loose file missing from the table', () => {
    expect(corrupt(roomP, (p) => { const t = p.children.find((k) => k.kind === 'table')!; t.objects.splice(t.objects.findIndex((o) => o.kind === 'file'), 1) })).toContain('file-table')
  })

  it('14 · a room without its C = 1 fallback offer', () => {
    expect(corrupt(roomP, (p) => { p.meta!.offerKeys = (p.meta!.offerKeys as string[]).filter((k) => !k.startsWith('C=1')) })).toContain('fallback')
  })

  it('15 · furniture on a shelf or outside its zone, and a front zone without a walkway', () => {
    expect(corrupt(roomP, (p) => { const o = p.objects.find((x) => x.layer === 0)!; const s = p.children[0].rect; o.rect = { ...o.rect, x: s.x + 0.1, y: s.y } })).toContain('collision')
    expect(corrupt(roomP, (p) => { p.regions = p.regions.filter((g) => g.role !== 'walkway') })).toContain('collision')
  })
})
