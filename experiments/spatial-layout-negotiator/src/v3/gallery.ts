// The α.v3 gallery: labelled SVG sheets A–I and an index page.  Usage: node src/v3/gallery.ts
// Every drawn layout is validated (α.v3 sheets with validateV3, α.v2 panels with the α.v2 validator).

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join as pjoin } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_CONFIG, MAX_ROOM_WIDTH, MAX_SHELF_SEGMENT_LENGTH } from '../config.ts'
import { arrangeAt, createContext, layout } from '../engine.ts'
import type { Options } from '../engine.ts'
import { fmt, rect } from '../geometry.ts'
import type { Rect } from '../geometry.ts'
import { join } from '../model.ts'
import type { AreaNode, BuildingNode, CampusNode, LayoutNode } from '../model.ts'
import { compactest } from '../offers.ts'
import { offerByKey } from '../protocol.ts'
import type { Ctx, Measured, Offer, Placed } from '../protocol.ts'
import { rng } from '../rng.ts'
import { renderPanels } from '../svg.ts'
import type { Panel, Transform } from '../svg.ts'
import { demoHierarchy, extremeRoom, mixedRoom, room, shelfOfLength, syntheticHierarchy } from '../synth.ts'
import { nodes, validate } from '../validate.ts'
import type { ShelfPlanV3 } from './bookshelf.ts'
import type { PlacedFeature } from './features.ts'
import type { RoomPlanV3, RoomRowMeta } from './room.ts'
import { validateV3 } from './validate.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = pjoin(HERE, '..', '..', 'gallery', 'v3')
mkdirSync(OUT, { recursive: true })

interface Entry { file: string; title: string; caption: string }
const entries: Entry[] = []
let violations = 0
let drawn = 0

function save(file: string, title: string, caption: string, panels: Panel[], opts: { columns?: number; intro?: string[]; panelW?: number; panelH?: number } = {}, v2Panels: number[] = []) {
  panels.forEach((p, i) => {
    const v = v2Panels.includes(i) ? validate(p.root, 0.2) : validateV3(p.root)
    drawn++
    violations += v.length
    for (const x of v.slice(0, 5)) console.error(`  ${file}: ${x.check} ${x.path} ${x.detail}`)
  })
  writeFileSync(pjoin(OUT, file), renderPanels(panels.map((p) => ({ cull: true, ...p })), { title, intro: opts.intro, columns: opts.columns, panelW: opts.panelW, panelH: opts.panelH }))
  entries.push({ file, title, caption })
  console.log('wrote', file)
}

const measure3 = (node: LayoutNode, opts: Options = {}): { ctx: Ctx; m: Measured } => { const ctx = createContext({ version: 'v3', ...opts }); return { ctx, m: ctx.measure(node) } }
const at = (ctx: Ctx, m: Measured, o: Offer, dw = 0, dd = 0) => arrangeAt(m, o, ctx, { w: o.w + dw, d: o.d + dd })
const scaleFor = (rects: { w: number; d: number }[], w: number, h: number) => Math.min(...rects.map((r) => Math.min((w - 52) / r.w, (h - 76) / r.d)))
const find = (p: Placed, pred: (n: Placed) => boolean) => { for (const n of nodes(p)) if (pred(n)) return n; throw new Error('not found') }
const rowsOf = (p: Placed) => p.meta!.rows as RoomRowMeta[]
const featuresOf = (p: Placed) => (p.meta!.features as PlacedFeature[]).map((f) => f.label)
const MAG = '#c2255c'
const cfgWall = DEFAULT_CONFIG.room.wall
const txt = (x: number, y: number, s: string, size = 9, fill = MAG, anchor = 'start', weight = 500) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`
const dashed = (x1: number, y1: number, x2: number, y2: number, color = MAG, w = 1.2, dash = '4 2') => `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-dasharray="${dash}" fill="none"/>`
const box = (t: Transform, r: Rect, color = MAG, dash = '6 3') => `<rect x="${t.X(r.x).toFixed(1)}" y="${t.Y(r.y).toFixed(1)}" width="${(r.w * t.S).toFixed(1)}" height="${(r.d * t.S).toFixed(1)}" fill="none" stroke="${color}" stroke-width="1.4" stroke-dasharray="${dash}"/>`

/** Each ordinary shelf's own required length (tick) and each row's common length (label east of the row, where it fits). */
const shelfMarks = (p: Placed, opts: { own?: boolean; outside?: boolean } = {}) => (t: Transform) => {
  const out: string[] = []
  rowsOf(p).forEach((r, i) => {
    if (r.kind !== 'shelves') return
    const ks = r.children.map((j) => p.children[j])
    for (const k of ks) {
      const req = k.meta!.required as number
      if (req < r.length - 1e-6) {
        const x = t.X(k.rect.x + req)
        out.push(dashed(x, t.Y(k.rect.y) - 3, x, t.Y(k.rect.y + k.rect.d) + 3, MAG, 1.4, '2 1.5'))
      }
      if (opts.own && k.rect.w * t.S > 30) out.push(txt(t.X(k.rect.x) + 1, t.Y(k.rect.y) - 3, `own ${fmt(req)}`, 8.5))
    }
    const last = ks[ks.length - 1]
    const label = `${ks.length} × ${fmt(r.length)} m`
    const room = (p.rect.x + p.rect.w - cfgWall - (last.rect.x + last.rect.w)) * t.S
    if (opts.outside) out.push(txt(t.X(p.rect.x + p.rect.w) + 6, t.Y(last.rect.y + last.rect.d) - 1, `row ${i + 1 - rowsOf(p).filter((x) => x.kind === 'stack').length}: ${label}`, 9.5))
    else if (room > label.length * 5 + 6) out.push(txt(t.X(last.rect.x + last.rect.w) + 4, t.Y(last.rect.y + last.rect.d) - 1, label, 9))
  })
  return out.join('')
}

// ---------- A. Shortest-first shelving, C = 1 … 4 ----------
const reports = mixedRoom('C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Finance', 'Reports', [0.55, 2.6, 0.85, 1.45, 0.7, 2.2, 1.0, 1.8, 1.15], 14, 5)
{
  // Every C is kept for this sheet (no Pareto pruning), so all four can be compared.
  const { ctx, m } = measure3(reports, { cfg: { keepDominated: true, maxOffers: 40 } })
  const reqs = m.children.map((k) => k.offers[0].w)
  const panels: Panel[] = [1, 2, 3, 4].map((C) => {
    const o = m.offers.find((x) => (x.plan as RoomPlanV3).C === C && (x.plan as RoomPlanV3).table?.variant === 'fit')!
    const p = at(ctx, m, o)
    const rows = rowsOf(p).filter((r) => r.kind === 'shelves')
    return {
      title: `C = ${C}: ${rows.length} shelf rows`, subtitle: `${fmt(o.w)} × ${fmt(o.d)} m · room width set by ${C === 1 ? 'the longest shelf alone' : 'the first row of the ' + C + ' shortest'}`,
      root: p, annotate: shelfMarks(p),
      notes: rows.map((r, i) => `row ${i + 1}: ${r.children.map((j) => fmt(p.children[j].meta!.required as number)).join(' + ')} m → ${r.children.length} × ${fmt(r.length)} m`),
    }
  })
  const S = scaleFor(panels.map((p) => p.root.rect), 400, 560)
  save('a-shortest-first.svg', 'A · Shortest-first shelving: the same nine folders with C = 1, 2, 3 and 4 shelves per row',
    'Shelves sorted by required length; the first row takes the C shortest and sets the room width; later rows take shelves in order while they fit that width. Ticks: where each shelf\'s own requirement ends (the rest is display space).',
    panels.map((p) => ({ ...p, scale: S })), { columns: 4, panelW: 400, panelH: 560, intro: [`Required lengths (m): ${reqs.map(fmt).join(', ')}. Sorted: ${[...reqs].sort((a, b) => a - b).map(fmt).join(', ')}. Same scale in every panel.`] })
}

// ---------- B. Per-row normalization ----------
{
  const { ctx, m } = measure3(reports, { cfg: { keepDominated: true, maxOffers: 40 } })
  const o = m.offers.find((x) => (x.plan as RoomPlanV3).C === 3 && (x.plan as RoomPlanV3).table?.variant === 'fit')!
  const p = at(ctx, m, o)
  const rows = rowsOf(p).filter((r) => r.kind === 'shelves')
  const lastShelf = p.children[rows[rows.length - 1].children[0]]
  const focus = rect(0, 0, p.rect.w, lastShelf.rect.y + lastShelf.rect.d + 0.5)
  save('b-per-row-normalization.svg', 'B · Per-row normalization: equal shelves within a row, different lengths between rows',
    'The C = 3 room from sheet A, zoomed on its shelves. In each row every fixture takes the row\'s longest required length; shorter folders keep the difference as display space (orange). Rows are independent.',
    [{ title: 'Shelf rows of the C = 3 offer', subtitle: `room ${fmt(p.rect.w)} × ${fmt(p.rect.d)} m · row lengths ${rows.map((r) => fmt(r.length)).join(' m, ')} m`, root: p, focus, annotate: shelfMarks(p, { own: true, outside: true }),
      notes: rows.map((r, i) => `row ${i + 1}: own lengths ${r.children.map((j) => fmt(p.children[j].meta!.required as number)).join(', ')} m → all ${fmt(r.length)} m; display space ${r.children.map((j) => fmt(r.length - (p.children[j].meta!.required as number))).join(', ')} m`) }],
    { columns: 1, panelW: 1240, panelH: 430 })
}

// ---------- C. A segmented shelf ----------
{
  const node = mixedRoom('C:\\Users\\Amanda\\OneDrive - Alder & Finch\\Board', 'Minutes', [0.9, 1.6, 2.1], 18, 8)
  node.shelves.push(shelfOfLength(node.path, 'Board minutes 1998-2026', 40, rng(81)))
  const { ctx, m } = measure3(node)
  const o = compactest(m.offers)
  const p = at(ctx, m, o)
  const segs = p.children.filter((k) => k.meta?.segment)
  const plan = m.children[3].offers[0].plan as ShelfPlanV3
  const stackEnd = segs[segs.length - 1].rect.y + segs[segs.length - 1].rect.d
  save('c-segmented-shelf.svg', `C · A segmented shelf: one ${fmt(plan.required)} m folder as ${segs.length} consecutive ${fmt(MAX_SHELF_SEGMENT_LENGTH)} m segments`,
    'The folder "Board minutes 1998-2026" needs more than one fixture, so its books are split in order (never splitting a book) into full-length segments, one dedicated row each, at the rear. Dashed rails on both sides, a connector to every segment and one label mark them as one folder; the last segment keeps its spare length as a display bay.',
    [
      { title: `The whole room (offer "${o.key}")`, subtitle: `${fmt(p.rect.w)} × ${fmt(p.rect.d)} m · MAX_ROOM_WIDTH ${MAX_ROOM_WIDTH} m`, root: p },
      { title: 'The stack, zoomed', subtitle: `segments of ${fmt(MAX_SHELF_SEGMENT_LENGTH)} m: fixture = 2 side panels + books + spacing + breathing`, root: p, focus: rect(0, 0, p.rect.w, stackEnd + 0.6),
        notes: plan.segments.map((s) => `segment ${s.index + 1}/${plan.segments.length}: books ${s.first + 1}–${s.last} of ${node.shelves[3].books.length}, ${fmt(s.used)} m used of ${fmt(s.length)} m${s.index === plan.segments.length - 1 ? ` (display bay ${fmt(s.length - s.used)} m)` : ''}`) },
    ], { columns: 2, panelW: 620, panelH: 620, intro: ['All segments have the folder\'s canonical path, a segment index and count, and one shared group id; any of them resolves to the same folder.'] })
}

// ---------- D. The extreme room ----------
{
  const node = extremeRoom()
  const { ctx, m } = measure3(node)
  const o = compactest(m.offers)
  const p = at(ctx, m, o)
  const segs = p.children.filter((k) => k.meta?.segment)
  const ordinary = p.children.filter((k) => k.kind === 'shelf' && !k.meta?.segment)
  const table = p.children.find((k) => k.kind === 'table')!
  const lastSeg = segs[segs.length - 1]
  const W = p.rect.w
  save('d-extreme-room.svg', 'D · The extreme room: ≈1,000 m of one folder, 40 other folders and 600 loose files',
    `A bounded-width room (${fmt(W)} m ≤ MAX_ROOM_WIDTH) that grows only in depth: ${segs.length} segments in a consecutive stack at the rear, ${ordinary.length} ordinary shelves in shortest-first rows, and one file table holding all ${node.files.length} files.`,
    [
      { title: 'The whole room', subtitle: `${fmt(p.rect.w)} × ${fmt(p.rect.d)} m · offer "${o.key}"`, root: p },
      { title: 'Rear: the first segments with their rails', root: p, focus: rect(0, 0, W, 9) },
      { title: 'Where the stack ends and ordinary rows begin', root: p, focus: rect(0, lastSeg.rect.y - 3, W, 9) },
      { title: 'Front: the last shelf rows and the file table', root: p, focus: rect(0, p.rect.d - (p.rect.d - table.rect.y) - 6, W, p.rect.d - table.rect.y + 6),
        notes: [`table ${(table.meta!.cols as number)} × ${(table.meta!.rows as number)} files (${fmt(table.objects[0].rect.w)} × ${fmt(table.objects[0].rect.d)} m)`] },
    ], { columns: 4, panelW: 400, panelH: 900, intro: [`${node.shelves[0].books.length.toLocaleString('en-US')} books in the long folder (${fmt(m.children[0].offers[0].plan ? (m.children[0].offers[0].plan as ShelfPlanV3).required : 0)} m required). Offers kept: ${m.offers.map((x) => `"${x.key}" ${fmt(x.w)} × ${fmt(x.d)} m`).join(', ')}.`] })
}

// ---------- E. Smart room expansion ----------
{
  const node = mixedRoom('C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Clients', 'Bayview Physiotherapy', [0.6, 1.8, 1.1, 2.6, 0.9], 24)
  const { ctx, m } = measure3(node)
  const o = m.offers.find((x) => (x.plan as RoomPlanV3).C === 3) ?? m.offers[0]
  const sizes: [number, number, string][] = [[0, 0, 'at its minimum'], [0, 3.5, '3.5 m deeper'], [0, 9, '9 m deeper'], [3, 6, '3 m wider and 6 m deeper']]
  const panels: Panel[] = sizes.map(([dw, dd, label]) => {
    const p = at(ctx, m, o, dw, dd)
    return { title: `${node.name} — ${label}`, subtitle: `${fmt(p.rect.w)} × ${fmt(p.rect.d)} m (min ${fmt(o.w)} × ${fmt(o.d)})`, root: p, notes: [featuresOf(p).join(' · ') || 'no features: shelves, table and clearances only'] }
  })
  const S = scaleFor(panels.map((p) => p.root.rect), 400, 720)
  // The same growth in rooms with other purposes picks other features first.
  const others = ([
    [mixedRoom('C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Operations', 'Staff Training', [0.8, 1.2, 0.7], 6, 3), 3, 7],
    [mixedRoom('C:\\Users\\Amanda\\Documents\\Personal', 'Home', [1.1, 0.6, 1.5], 9, 4), 4.5, 6],
    [mixedRoom('C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Finance', 'Budgets', [1.4, 0.9, 2.0, 1.2], 12, 6), 3, 7],
  ] as const).map(([n, dw, dd]) => { const r = measure3(n); const oo = compactest(r.m.offers); const p = at(r.ctx, r.m, oo, dw, dd); return { title: `${n.name} — ${fmt(dw)} m wider, ${fmt(dd)} m deeper`, subtitle: `${fmt(p.rect.w)} × ${fmt(p.rect.d)} m (min ${fmt(oo.w)} × ${fmt(oo.d)})`, root: p, notes: [featuresOf(p).join(' · ')] } as Panel })
  const S2 = scaleFor(others.map((p) => p.root.rect), 400, 720)
  save('e-smart-room-expansion.svg', 'E · Smart room growth: the same room given more depth and width',
    'Shelves, segments and the file table never change. Extra depth becomes a front zone (with a walkway to the door) and, when there is a lot, a middle zone between the shelves and the table; extra width becomes a side zone. Features come from a fixed library; what fits nothing stays as circulation. A client room starts with a waiting area; training, home and finance rooms prefer a classroom, a lounge and workstations.',
    [...panels.map((p) => ({ ...p, scale: S })), ...others.map((p) => ({ ...p, scale: S2 }))], { columns: 4, panelW: 400, panelH: 720 })
}

// ---------- F. Building row alignment ----------
{
  const path = 'C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Clients'
  const r = rng(31)
  const b: BuildingNode = { kind: 'building', name: 'Clients', path, files: [], rooms: [room(path, 'Front desk', [], 3, r), room(path, 'Archive', ['2022', '2023', '2024', '2025'], 2, r, [10, 24]), room(path, 'Records', ['Agreements', 'Orders'], 26, r)] }
  const { ctx, m } = measure3(b)
  const o = m.offers.find((x) => x.key === 'rooms/row=3')!
  const p = at(ctx, m, o)
  const depth = (p.meta!.rowDepths as number[])[0]
  const annotate = (t: Transform) => p.children.filter((c) => depth - c.min.d > 0.01).map((c) => {
    const y = t.Y(c.rect.y + c.min.d)
    return dashed(t.X(c.rect.x), y, t.X(c.rect.x + c.rect.w), y) + txt(t.X(c.rect.x) + 3, y - 3, `own ${fmt(c.min.d)} m · absorbs ${fmt(depth - c.min.d)} m`, 9)
  }).join('')
  const alone = p.children.map((c, i) => at(ctx, m.children[i], offerByKey(m.children[i], c.offerKey)))
  const S = scaleFor([p.rect], 420, 480)
  save('f-building-alignment.svg', 'F · Building alignment: three rooms of different minimum depths share one row depth',
    'The building keeps its measured footprint, walls, partitions and entrance hall. The rooms in its row take the common depth; the shallower rooms absorb the difference inside (here as deeper entrance clearance or a front zone) while their shelves and table keep the geometry of their own minimum layout (bottom row, same scale).',
    [
      { title: `Clients — one row of three rooms at ${fmt(depth)} m`, subtitle: `${fmt(p.rect.w)} × ${fmt(p.rect.d)} m (exactly its measured offer "${o.key}")`, root: p, annotate, scale: S,
        notes: p.children.map((c) => `${c.name}: "${c.offerKey}" ${fmt(c.min.w)} × ${fmt(c.min.d)} → ${fmt(c.rect.w)} × ${fmt(c.rect.d)} m`) },
      ...alone.map((a) => ({ title: `${a.name} at its own minimum`, subtitle: `${fmt(a.rect.w)} × ${fmt(a.rect.d)} m — the same shelves and table`, root: a, scale: S })),
    ], { columns: 4, panelW: 420, panelH: 480 })
}

// ---------- G. Campus centering ----------
{
  const P = 'C:\\Users\\Amanda\\OneDrive - Alder & Finch'
  const bld = (name: string, rooms: [string, number[], number][]): BuildingNode => { const p = join(P, name); return { kind: 'building', name, path: p, files: [], rooms: rooms.map(([n, ls, f], i) => mixedRoom(p, n, ls, f, i + 1)) } }
  const c: CampusNode = { kind: 'campus', name: 'OneDrive - Alder & Finch', path: P, files: [], buildings: [bld('Archive', [['Boxes', Array(7).fill(4.0), 0], ['Scans', Array(7).fill(3.2), 0]]), bld('Board', [['Meetings', [1.0, 1.4, 0.8], 8]]), bld('Contracts', [['Clients', Array(5).fill(3.0), 0], ['Vendors', [1.5, 2.0], 4]])] }
  const { ctx, m } = measure3(c)
  const panels = ['buildings/row=3', 'buildings/row=2'].map((key) => {
    const o = m.offers.find((x) => x.key === key)!
    const p = at(ctx, m, o)
    const cells = p.meta!.cells as Rect[]
    const annotate = (t: Transform) => cells.map((r, i) => box(t, r) + txt(t.X(r.x + r.w) - 3, t.Y(r.y + r.d) + 11, `cell ${fmt(r.w)} × ${fmt(r.d)}`, 9, MAG, 'end') + txt(t.X(p.children[i].rect.x) + 3, t.Y(p.children[i].rect.y) - 3, `${fmt(p.children[i].rect.w)} × ${fmt(p.children[i].rect.d)} (offer ${fmt(p.children[i].min.w)} × ${fmt(p.children[i].min.d)})`, 9, '#1c5d99')).join('')
    return { title: `Campus offer "${key}"`, subtitle: `${fmt(p.rect.w)} × ${fmt(p.rect.d)} m · row depths ${(p.meta!.rowDepths as number[]).map(fmt).join(', ')} m`, root: p, depth: 2, annotate,
      notes: p.children.map((b, i) => `${b.name}: ${fmt(b.rect.w)} × ${fmt(b.rect.d)} m in a ${fmt(cells[i].w)} × ${fmt(cells[i].d)} m cell, centered; entrance walk ${(p.meta!.walks as (Rect | null)[])[i] ? fmt((p.meta!.walks as Rect[])[i].d) + ' m' : 'not needed'}`) } as Panel
  })
  save('g-campus-centering.svg', 'G · Campus centering: buildings of unequal size, never resized',
    'Each row is as deep as its deepest building. Buildings keep their measured footprints and sit centered in their cells (dashed); the rest of each cell is grounds, and an entrance walk joins each shorter building\'s door to the street or plaza in front. Paths (3 m), streets (6 m), the courtyard and the plaza keep their designed widths.',
    panels, { columns: 2, panelW: 620, panelH: 560 })
}

// ---------- H. Area exact packing ----------
{
  const res = layout(demoHierarchy(), { version: 'v3', seed: 7 })
  const root = res.placed
  const docs = find(root, (n) => n.kind === 'area' && n.name === 'Documents')
  const business = find(docs, (n) => n.kind === 'area' && n.name === 'Business')
  const amm = find(business, (n) => n.kind === 'campus' && n.name === 'AmandaMedicalMiami')
  const fin = find(amm, (n) => n.kind === 'building' && n.name === 'Finance')
  const rm = find(fin, (n) => n.kind === 'room' && n.name === 'Budgets')
  const sh = rm.children.find((k) => k.kind === 'shelf')!
  const chain = [root, docs, business, amm, fin, rm, sh]
  const names = ['Area', 'Area', 'Area', 'Campus', 'Building', 'Room', 'Bookshelf']
  const devOf = (n: Placed) => Math.max(0, ...n.children.map((k) => Math.max(Math.abs(k.rect.w - k.min.w), Math.abs(k.rect.d - k.min.d))))
  const dev = (n: Placed) => (devOf(n) < 1e-9 ? 0 : devOf(n))
  save('h-area-exact-packing.svg', 'H · Exact packing: Area → Area → Area → Campus → Building → Room → Bookshelf',
    'C:\\Users\\Amanda (fictional) laid out by α.v3 at exactly its measured size. Every area places each child at precisely its selected offer\'s dimensions (largest deviation shown under each area: 0); campuses and buildings keep theirs; only rooms grow inside.',
    chain.map((n, i) => ({
      title: `${i + 1}. ${names[i]}: ${n.name}`, subtitle: `${fmt(n.rect.w)} × ${fmt(n.rect.d)} m — selected offer ${fmt(n.min.w)} × ${fmt(n.min.d)} m`,
      root: n, depth: i < 3 ? 2 : 4, highlight: chain[i + 1] ? [{ rect: chain[i + 1].rect, label: `→ ${chain[i + 1].name}` }] : [],
      notes: n.kind === 'area' ? [`${n.children.length} children, each at its offer size: largest deviation ${dev(n) === 0 ? '0 m (below 1 nm)' : dev(n).toExponential(1) + ' m'}`] : n.kind === 'campus' || n.kind === 'building' ? [`children placed at their offers' sizes${n.kind === 'building' ? ' (rooms then take the row depth)' : ''}`] : n.kind === 'room' ? [`offer "${n.offerKey}" · ${featuresOf(n).join(', ') || 'no features'}`] : [`${n.children.length} books at their own widths`],
    })), { columns: 4, panelW: 400, panelH: 420 })
}

// ---------- I. α.v2 vs α.v3 on the same tree ----------
{
  const { root } = syntheticHierarchy(100, 1)
  const a = layout(root, { version: 'v2', seed: 1 }).placed
  const b = layout(root, { version: 'v3', seed: 1 }).placed
  const S = scaleFor([a.rect, b.rect], 620, 660)
  const stats = (p: Placed) => {
    let rooms = 0, roomArea = 0, maxW = 0, feats = 0
    for (const n of nodes(p)) if (n.kind === 'room') { rooms++; roomArea += n.rect.w * n.rect.d; maxW = Math.max(maxW, n.rect.w); feats += ((n.meta?.features as unknown[]) ?? []).length }
    return `${fmt(p.rect.w)} × ${fmt(p.rect.d)} m = ${Math.round(p.rect.w * p.rect.d).toLocaleString('en-US')} m² · rooms ${(roomArea / (p.rect.w * p.rect.d) * 100).toFixed(1)}% of the root · widest room ${fmt(maxW)} m · ${feats} room features`
  }
  const bPath = 'C:\\Root\\Area 0.1\\Campus 1'
  const ca = find(a, (n) => n.path === bPath), cb = find(b, (n) => n.path === bPath)
  const S2 = scaleFor([ca.rect, cb.rect], 620, 460)
  save('i-v2-vs-v3.svg', 'I · The same synthetic tree (~100 containers, seed 1) laid out by α.v2 and α.v3',
    'Left: α.v2 at its minimum size (uniform sampling, 20% absorption). Right: α.v3 (balanced sampling, exact sizes). Same scale in each row. Bottom: the same campus in both.',
    [
      { title: 'α.v2', subtitle: stats(a), root: a, depth: 3, scale: S },
      { title: 'α.v3', subtitle: stats(b), root: b, depth: 3, scale: S },
      { title: `α.v2 — ${ca.name}`, subtitle: `${fmt(ca.rect.w)} × ${fmt(ca.rect.d)} m`, root: ca, scale: S2 },
      { title: `α.v3 — ${cb.name}`, subtitle: `${fmt(cb.rect.w)} × ${fmt(cb.rect.d)} m`, root: cb, scale: S2 },
    ], { columns: 2, panelW: 620, panelH: 660 }, [0, 2])
}

// ---------- J. A known weakness: one very deep room sets its whole row's depth ----------
{
  const d = demoHierarchy()
  const budgets = ((((d.children[0] as AreaNode).children[0] as AreaNode).children[0] as CampusNode).buildings[0]).rooms.find((r) => r.name === 'Budgets')!
  budgets.shelves.push(shelfOfLength(budgets.path, 'Scans 1998-2026', 1000, rng(5)))
  const finPath = budgets.path.slice(0, budgets.path.lastIndexOf('\\'))
  const b3 = find(layout(d, { version: 'v3', seed: 1 }).placed, (n) => n.kind === 'building' && n.path === finPath)
  const b2 = find(layout(d, { version: 'v2', seed: 1 }).placed, (n) => n.kind === 'building' && n.path === finPath)
  const inv = b3.children.find((k) => k.name === 'Invoices')!
  save('j-known-weakness-deep-row.svg', 'J · Known weakness: one very deep room sets the depth of its whole building row',
    `The demo with one ≈1,000 m folder added to Finance › Budgets. α.v3 keeps that room 10 m wide and ${fmt(b3.children.find((k) => k.name === 'Budgets')!.rect.d)} m deep, but Invoices shares its row and must take the same depth: ${fmt(inv.min.w)} × ${fmt(inv.min.d)} m becomes ${fmt(inv.rect.w)} × ${fmt(inv.rect.d)} m of mostly open floor. α.v2 (right, at another scale) instead makes the room and the whole building over a kilometre wide.`,
    [
      { title: `α.v3 — Finance building, ${fmt(b3.rect.w)} × ${fmt(b3.rect.d)} m`, subtitle: `row depths ${(b3.meta!.rowDepths as number[]).map(fmt).join(', ')} m`, root: b3, notes: b3.children.map((k) => `${k.name}: ${fmt(k.min.w)} × ${fmt(k.min.d)} → ${fmt(k.rect.w)} × ${fmt(k.rect.d)} m`) },
      { title: `α.v3 — the top of the Budgets / Invoices row`, root: b3, focus: rect(b3.rect.x, b3.rect.y, b3.rect.w, 24) },
      { title: `α.v2 — Finance building, ${fmt(b2.rect.w)} × ${fmt(b2.rect.d)} m`, subtitle: 'every shelf in Budgets is as long as its longest (≈1,068 m)', root: b2 },
    ], { columns: 3, panelW: 520, panelH: 760 }, [2])
}

// ---------- Index ----------
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Negotiator α.v3 Gallery</title>
<style>
body { font-family: Inter, 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 24px 16px 48px; background: #f4f3ef; color: #222; }
main { max-width: 1300px; margin: 0 auto; } h1 { font-size: 22px; margin: 0 0 6px; } p.lead { color: #555; margin: 0 0 24px; }
figure { margin: 0 0 28px; background: #fff; border: 1px solid #e2e0da; border-radius: 10px; padding: 14px; }
figure img { width: 100%; height: auto; display: block; } figcaption { font-size: 14px; margin-bottom: 10px; } figcaption b { display: block; font-size: 16px; margin-bottom: 4px; }
</style></head><body><main>
<h1>Spatial Layout Negotiator α.v3 — gallery</h1>
<p class="lead">Pack exact. Center naturally. Grow intelligently only inside rooms. MAX_ROOM_WIDTH ${MAX_ROOM_WIDTH} m, MAX_SHELF_SEGMENT_LENGTH ${MAX_SHELF_SEGMENT_LENGTH} m. ${drawn} drawn layouts validated: ${violations} violations. <a href="../index.html">α.v2 gallery</a> · <a href="../sensitivity/index.html">sensitivity study</a></p>
${entries.map((e) => `<figure><figcaption><b>${e.title}</b>${e.caption}</figcaption><a href="${e.file}"><img src="${e.file}" alt="${e.title}"></a></figure>`).join('\n')}
</main></body></html>`
writeFileSync(pjoin(OUT, 'index.html'), html)
console.log(`index.html (${entries.length} sheets, ${drawn} layouts, ${violations} violations)`)
void DEFAULT_CONFIG
if (violations) process.exitCode = 1
