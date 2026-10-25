import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, MAX_ROOM_WIDTH, MAX_SHELF_SEGMENT_LENGTH, maxShelfSegment, maxTableWidth, segmentCapacity } from '../src/config.ts'
import { arrangeAt, createContext } from '../src/engine.ts'
import { join } from '../src/model.ts'
import type { RoomNode, ShelfNode } from '../src/model.ts'
import { InfeasibleError } from '../src/protocol.ts'
import type { Placed } from '../src/protocol.ts'
import { rng } from '../src/rng.ts'
import { extremeRoom, mixedRoom, shelfOfLength } from '../src/synth.ts'
import { allocateShelves } from '../src/v3/allocate.ts'
import type { ShelfPlanV3 } from '../src/v3/bookshelf.ts'
import type { RoomPlanV3, RoomRowMeta } from '../src/v3/room.ts'
import { exact, measureV3, validV3 } from './helpers.ts'

const cfg = DEFAULT_CONFIG
const P = 'C:\\Users\\Amanda\\Documents'
/** A shelf of one book: its required length is exactly `L` (one book of L − panels − breathing). */
const shelfOf = (parent: string, name: string, L: number): ShelfNode => ({ kind: 'shelf', name, path: join(parent, name), books: [{ name: `${name}.pdf`, w: +(L - 2 * cfg.shelf.side - cfg.shelf.breathing).toFixed(6) }] })
const roomOf = (name: string, lengths: number[], files = 0): RoomNode => {
  const path = join(P, name)
  return { kind: 'room', name, path, shelves: lengths.map((L, i) => shelfOf(path, `F${i}`, L)), files: Array.from({ length: files }, (_, i) => `f${i}.pdf`) }
}
const shelvesIn = (p: Placed) => p.children.filter((k) => k.kind === 'shelf')
const rowsOf = (p: Placed) => (p.meta!.rows as RoomRowMeta[])

describe('α.v3 Designer A — Bookshelf', () => {
  it('relates the two constants without double counting: MAX_SHELF_SEGMENT_LENGTH = MAX_ROOM_WIDTH − 2 × side clearance', () => {
    expect(MAX_ROOM_WIDTH).toBe(10)
    expect(MAX_SHELF_SEGMENT_LENGTH).toBeCloseTo(10 - 2 * cfg.room.wall, 12)
    // The fixture length already includes its side panels; books get the rest minus the minimum breathing room.
    expect(segmentCapacity(cfg)).toBeCloseTo(MAX_SHELF_SEGMENT_LENGTH - 2 * cfg.shelf.side - cfg.shelf.breathing, 12)
    expect(maxShelfSegment({ ...cfg, v3: { ...cfg.v3, maxRoomWidth: 12 } })).toBeCloseTo(11, 12)
  })

  it('measures one fixed length: books + panels + spacing + breathing, and never stretches books', () => {
    const r = rng(2)
    const s = shelfOfLength(P, 'Taxes', 1.4, r)
    const { ctx, m } = measureV3(s)
    expect(m.offers).toHaveLength(1)
    const sum = s.books.reduce((t, b) => t + b.w, 0)
    expect(m.offers[0].w).toBeCloseTo(2 * cfg.shelf.side + sum + cfg.shelf.spacing * (s.books.length - 1) + cfg.shelf.breathing, 9)
    const p = exact(ctx, m, m.offers[0])
    for (const b of p.children) expect(b.rect.w).toBeCloseTo(b.objects[0].rect.w, 12)
    // A row may give it a longer fixture (display space); a deeper one is refused.
    const longer = arrangeAt(m, m.offers[0], ctx, { w: m.offers[0].w + 0.8, d: cfg.shelf.depth })
    expect(longer.regions.find((g) => g.role === 'display')!.rect.w).toBeCloseTo(0.8, 9)
    expect(() => arrangeAt(m, m.offers[0], ctx, { w: m.offers[0].w, d: 0.6 })).toThrow(InfeasibleError)
  })

  it('splits a folder longer than one fixture into ordered, complete, full-length segments', () => {
    const s = shelfOfLength(P, 'Scans', 40, rng(3))
    const { m } = measureV3(s)
    const plan = m.offers[0].plan as ShelfPlanV3
    expect(plan.segmented).toBe(true)
    expect(plan.segments.length).toBeGreaterThanOrEqual(Math.ceil(40 / segmentCapacity(cfg)))
    let next = 0
    for (const seg of plan.segments) {
      expect(seg.first).toBe(next) // contiguous, in order: no book skipped, repeated or split
      expect(seg.last).toBeGreaterThan(seg.first)
      expect(seg.used).toBeLessThanOrEqual(MAX_SHELF_SEGMENT_LENGTH + 1e-9)
      expect(seg.length).toBe(MAX_SHELF_SEGMENT_LENGTH)
      next = seg.last
    }
    expect(next).toBe(s.books.length)
    // Every segment but the last is as full as it can be: the next book would not have fit.
    for (const seg of plan.segments.slice(0, -1)) expect(seg.used + cfg.shelf.spacing + s.books[seg.last].w).toBeGreaterThan(MAX_SHELF_SEGMENT_LENGTH)
  })

  it('reports a book wider than a whole segment as infeasible instead of bending the rules', () => {
    const giant: ShelfNode = { kind: 'shelf', name: 'Poster', path: join(P, 'Poster'), books: [{ name: 'banner', w: segmentCapacity(cfg) + 0.01 }] }
    expect(() => measureV3(giant)).toThrow(/no feasible shelf arrangement/)
  })
})

describe('α.v3 Designer B — Room: shortest-first shelving', () => {
  const L = [3.0, 1.0, 2.0, 4.5, 1.5, 1.2, 2.0]
  const inputs = L.map((length, child) => ({ child, length }))
  const lengthsOf = (rows: { members: number[] }[]) => rows.map((r) => r.members.map((i) => L[i]))

  it('allocates the C shortest to the first row, then fills rows in ascending order within the established width', () => {
    // Worked by hand (side clearance 0.5, shelf gap 0.4, MAX_ROOM_WIDTH 10):
    expect(lengthsOf(allocateShelves(cfg, inputs, [], 1)!.rows)).toEqual([[1.0], [1.2], [1.5], [2.0], [2.0], [3.0], [4.5]])
    expect(lengthsOf(allocateShelves(cfg, inputs, [], 2)!.rows)).toEqual([[1.0, 1.2], [1.5], [2.0], [2.0], [3.0], [4.5]])
    const c3 = allocateShelves(cfg, inputs, [], 3)!
    expect(lengthsOf(c3.rows)).toEqual([[1.0, 1.2, 1.5], [2.0, 2.0], [3.0], [4.5]])
    expect(c3.rows.map((r) => r.length)).toEqual([1.5, 2.0, 3.0, 4.5])
    expect(c3.width).toBeCloseTo(6.3, 9) // set by the first row; [3.0, 4.5] would need 10.4 m
    // C = 4: the first row (four shelves of 2.0 m) is 10.2 m wide, beyond MAX_ROOM_WIDTH: rejected.
    expect(allocateShelves(cfg, inputs, [], 4)).toBeNull()
    // A shelf wider than the room so far widens it to fit alone.
    expect(allocateShelves(cfg, inputs, [], 2)!.width).toBeCloseTo(2 * 0.5 + 4.5, 9)
  })

  it('offers exactly the feasible C values, and every offer is a valid room', () => {
    const { ctx, m } = measureV3(roomOf('Budgets', L, 12))
    const Cs = new Set(m.offers.map((o) => (o.plan as RoomPlanV3).C))
    expect(Cs.has(1)).toBe(true)
    expect(Cs.has(4)).toBe(false)
    for (const o of m.offers) validV3(exact(ctx, m, o))
  })

  it('normalizes shelves within a row to the row\'s longest, while rows keep different lengths', () => {
    const { ctx, m } = measureV3(roomOf('Budgets', L, 12))
    const o = m.offers.find((x) => (x.plan as RoomPlanV3).C === 3)!
    const p = exact(ctx, m, o)
    const rows = rowsOf(p).filter((r) => r.kind === 'shelves')
    for (const r of rows) {
      const ws = r.children.map((i) => p.children[i].rect.w)
      expect(new Set(ws.map((w) => w.toFixed(9))).size).toBe(1)
    }
    expect(new Set(rows.map((r) => r.length.toFixed(3))).size).toBe(rows.length) // independent rows
    // Shorter shelves in a row carry the difference as display space; their books are untouched.
    const first = rows[0].children.map((i) => p.children[i])
    const short = first.find((k) => (k.meta!.required as number) < rows[0].length - 1e-9)!
    expect(short.regions.find((g) => g.role === 'display')!.rect.w).toBeCloseTo(rows[0].length - (short.meta!.required as number), 9)
  })

  it('never stretches shelves to fill the room: spare width in a row is open floor', () => {
    const { ctx, m } = measureV3(roomOf('Budgets', L, 12))
    const o = m.offers.find((x) => (x.plan as RoomPlanV3).C === 2)!
    const p = arrangeAt(m, o, ctx, { w: o.w + 0.8, d: o.d })
    for (const r of rowsOf(p).filter((x) => x.kind === 'shelves')) for (const i of r.children) expect(p.children[i].rect.w).toBeCloseTo(r.length, 9)
    expect(p.regions.filter((g) => g.label === 'row end').length).toBeGreaterThan(0)
    validV3(p)
  })

  it('keeps the C = 1 fallback even when offers are bounded to one', () => {
    const { m } = measureV3(roomOf('Budgets', L, 12), { cfg: { maxOffers: 1 } })
    expect(m.offers).toHaveLength(1)
    expect((m.offers[0].plan as RoomPlanV3).C).toBe(1)
  })

  it('produces a valid, bounded C = 1 room for any finite set of folders and files (200 random rooms)', () => {
    const r = rng(77)
    for (let t = 0; t < 200; t++) {
      const n = Math.floor(r() * 9)
      const lengths = Array.from({ length: n }, () => (r() < 0.15 ? 9 + r() * 60 : 0.1 + r() * r() * 9))
      const node = mixedRoom(P, `Room ${t}`, lengths, Math.floor(r() * r() * 400), t + 1)
      const { ctx, m } = measureV3(node)
      const c1 = m.offers.find((o) => (o.plan as RoomPlanV3).C === 1)
      expect(c1, node.name).toBeDefined()
      for (const o of m.offers) {
        expect(o.w).toBeLessThanOrEqual(MAX_ROOM_WIDTH + 1e-9)
        validV3(exact(ctx, m, o))
      }
    }
  })
})

describe('α.v3 Designer B — Room: segmented stacks and the file table', () => {
  it('places every segment of a split folder in its own consecutive rear row, with dashed identity rails', () => {
    const node = mixedRoom(P, 'Records', [0.9, 2.2, 30, 1.4], 20)
    const { ctx, m } = measureV3(node)
    for (const o of m.offers) {
      const p = exact(ctx, m, o)
      validV3(p) // continuity, identity, markings, segment size
      const rows = rowsOf(p)
      const stack = rows.filter((x) => x.kind === 'stack')
      expect(stack.length).toBeGreaterThanOrEqual(4)
      expect(rows.slice(0, stack.length).every((x) => x.kind === 'stack')).toBe(true) // at the rear
      const segs = stack.map((x) => p.children[x.children[0]])
      expect(new Set(segs.map((s) => s.path)).size).toBe(1) // one canonical folder
      expect(segs.flatMap((s) => s.children.map((b) => b.name))).toEqual(node.shelves[2].books.map((b) => b.name))
      expect(p.rect.w).toBeCloseTo(MAX_ROOM_WIDTH, 9) // a full-length segment fits by construction
      expect(p.objects.filter((x) => x.kind === 'rail')).toHaveLength(2)
      expect(p.objects.filter((x) => x.kind === 'connector')).toHaveLength(2 * segs.length)
    }
    // Deterministic markings.
    const a = exact(ctx, m, m.offers[0]), b = exact(ctx, m, m.offers[0])
    expect(JSON.stringify(a.objects)).toBe(JSON.stringify(b.objects))
  })

  it('keeps every loose file on the one table, growing the table in depth rather than past the width limit', () => {
    const node: RoomNode = { kind: 'room', name: 'Inbox', path: join(P, 'Inbox'), shelves: [], files: Array.from({ length: 1500 }, (_, i) => `doc ${i}.pdf`) }
    const { ctx, m } = measureV3(node)
    for (const o of m.offers) {
      const t = (o.plan as RoomPlanV3).table!
      expect(t.w).toBeLessThanOrEqual(maxTableWidth(cfg) + 1e-9)
      expect(t.cols * t.rows).toBeGreaterThanOrEqual(1500)
      validV3(exact(ctx, m, o))
    }
    expect(Math.max(...m.offers.map((o) => (o.plan as RoomPlanV3).table!.rows))).toBeGreaterThan(40)
  })

  it('lays out the extreme room (≈1,000 m folder, 40 folders, 600 files) within MAX_ROOM_WIDTH', () => {
    const node = extremeRoom()
    const { ctx, m } = measureV3(node)
    for (const o of m.offers) {
      const p = exact(ctx, m, o)
      validV3(p)
      expect(p.rect.w).toBeLessThanOrEqual(MAX_ROOM_WIDTH + 1e-9)
      const segs = shelvesIn(p).filter((k) => k.meta!.segment)
      expect(segs.length).toBeGreaterThan(100)
      expect(segs.reduce((s, k) => s + k.children.length, 0)).toBe(node.shelves[0].books.length)
    }
  })
})

describe('α.v3 Designer B — Room: smart growth', () => {
  const node = mixedRoom('C:\\Users\\Amanda\\Documents\\Business\\Clients', 'Bayview Physiotherapy', [0.6, 1.8, 1.1, 2.6, 0.9], 24)
  const { ctx, m } = measureV3(node)
  const o = m.offers.find((x) => (x.plan as RoomPlanV3).C === 2) ?? m.offers[0]
  const base = exact(ctx, m, o)
  const fixed = (p: Placed) => p.children.map((k) => `${k.name}:${k.rect.w.toFixed(9)}x${k.rect.d.toFixed(9)}`)

  it('absorbs extra depth and width inside, with features, without touching shelves or the table', () => {
    for (const [dw, dd] of [[0, 3], [0, 8], [2.5, 6], [0.6, 0.9]]) {
      const p = arrangeAt(m, o, ctx, { w: o.w + dw, d: o.d + dd })
      validV3(p)
      expect(fixed(p)).toEqual(fixed(base))
      expect(p.ledger.x.absorbed).toBeCloseTo(dw, 9)
      expect(p.ledger.y.absorbed).toBeCloseTo(dd, 9)
      expect(p.ledger.x.passed + p.ledger.y.passed).toBeCloseTo(0, 9)
      const feats = p.meta!.features as unknown[]
      if (dd >= cfg.v3.zoneMin) expect(feats.length).toBeGreaterThan(0)
      else expect(feats).toHaveLength(0) // small growth stays as circulation
    }
  })

  it('chooses features by zone size and by the room\'s purpose, deterministically', () => {
    const p = arrangeAt(m, o, ctx, { w: o.w, d: o.d + 3 })
    const ids = (p.meta!.features as { id: string }[]).map((f) => f.id)
    expect(ids[0]).toBe('waiting') // a client room's front zone starts with a waiting area
    const q = arrangeAt(m, o, ctx, { w: o.w, d: o.d + 3 })
    expect(JSON.stringify(q)).toBe(JSON.stringify(p))
    const fin = mixedRoom('C:\\Users\\Amanda\\Documents\\Business\\Finance', 'Budgets', [0.6, 1.8, 1.1, 2.6], 10)
    const f = measureV3(fin)
    const fo = f.m.offers[0]
    const g = arrangeAt(f.m, fo, f.ctx, { w: Math.min(MAX_ROOM_WIDTH, fo.w + 2.5), d: fo.d })
    expect((g.meta!.features as { id: string }[])[0].id).toBe('workstations')
  })

  it('keeps a walkway from the door through the front zone, and refuses a room wider than MAX_ROOM_WIDTH', () => {
    const p = arrangeAt(m, o, ctx, { w: o.w, d: o.d + 5 })
    const door = p.objects.find((x) => x.kind === 'door')!
    const walk = p.regions.find((g) => g.role === 'walkway')!
    expect(walk.rect.x).toBeLessThanOrEqual(door.rect.x + 1e-9)
    expect(walk.rect.x + walk.rect.w).toBeGreaterThanOrEqual(door.rect.x + door.rect.w - 1e-9)
    expect(() => arrangeAt(m, o, ctx, { w: MAX_ROOM_WIDTH + 0.5, d: o.d })).toThrow(/MAX_ROOM_WIDTH/)
  })

  it('works for an empty room and a room of files only', () => {
    for (const n of [roomOf('Empty', []), roomOf('Notes', [], 7)]) {
      const r = measureV3(n)
      for (const x of r.m.offers) for (const [dw, dd] of [[0, 0], [3, 4]]) validV3(arrangeAt(r.m, x, r.ctx, { w: x.w + dw, d: x.d + dd }))
    }
  })

  it('reuses the measured plan: growing never searches', () => {
    const c = createContext({ version: 'v3' })
    const mm = c.measure(node)
    const explored = c.stats.explored
    for (const x of mm.offers) arrangeAt(mm, x, c, { w: Math.min(MAX_ROOM_WIDTH, x.w + 2), d: x.d + 6 })
    expect(c.stats.explored).toBe(explored)
  })
})
