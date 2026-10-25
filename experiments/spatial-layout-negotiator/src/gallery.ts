// Generates the SVG gallery and its index page.  Usage: node src/gallery.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join as pjoin } from 'node:path'
import { fileURLToPath } from 'node:url'
import { arrangeAt, createContext } from './engine.ts'
import { fmt } from './geometry.ts'
import type { Rect } from './geometry.ts'
import { join } from './model.ts'
import type { AreaNode, BuildingNode, CampusNode, LayoutNode } from './model.ts'
import { compactest } from './offers.ts'
import type { Ctx, Measured, Offer, Placed } from './protocol.ts'
import { rng } from './rng.ts'
import { renderPanels } from './svg.ts'
import type { Panel, Transform } from './svg.ts'
import { demoHierarchy, room, shelf } from './synth.ts'
import { nodes, validate } from './validate.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = pjoin(HERE, '..', 'gallery')
mkdirSync(OUT, { recursive: true })

interface Entry { file: string; title: string; caption: string }
const entries: Entry[] = []
let violations = 0

function save(file: string, title: string, caption: string, panels: Panel[], opts: { columns?: number; intro?: string[]; panelW?: number; panelH?: number } = {}) {
  for (const p of panels) {
    const v = validate(p.root, 0.2)
    violations += v.length
    for (const x of v.slice(0, 5)) console.error(`  ${file}: ${x.check} ${x.path} ${x.detail}`)
  }
  writeFileSync(pjoin(OUT, file), renderPanels(panels, { title, intro: opts.intro, columns: opts.columns, panelW: opts.panelW, panelH: opts.panelH }))
  entries.push({ file, title, caption })
  console.log('wrote', file)
}

function measure(node: LayoutNode, seed = 1, attempts?: number): { ctx: Ctx; m: Measured } {
  const ctx = createContext({ seed, attempts })
  return { ctx, m: ctx.measure(node) }
}
const grow = (ctx: Ctx, m: Measured, o: Offer, sx = 1, sy = 1) => arrangeAt(m, o, ctx, { w: o.w * sx, d: o.d * sy })
const pct = (a: number, b: number) => (b > 1e-9 ? `${Math.round((a / b) * 100)}%` : '–')
const led = (p: Placed, axis: 'x' | 'y') => {
  const l = p.ledger[axis]
  return `${axis === 'x' ? 'width' : 'depth'}: min ${fmt(l.min)} → ${fmt(l.alloc)} m; surplus ${fmt(l.surplus)}, kept ${fmt(l.absorbed)} (${pct(l.absorbed, l.surplus)}), passed down ${fmt(l.passed)}`
}
const find = (p: Placed, pred: (n: Placed) => boolean) => { for (const n of nodes(p)) if (pred(n)) return n; throw new Error('not found') }
const commonScale = (rects: Rect[], w = 520, h = 460) => Math.min(...rects.map((r) => Math.min((w - 52) / r.w, (h - 76) / r.d)))

// ---------- A. Bookshelf ----------
{
  const r = rng(11)
  const node = shelf('C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Finance\\Budgets', '2027 draft', 12, r)
  const { ctx, m } = measure(node)
  const panels: Panel[] = m.offers.map((o) => {
    const p = grow(ctx, m, o)
    return { title: `Offer "${o.key}" at minimum`, subtitle: `${fmt(o.w)} × ${fmt(o.d)} m · ${node.books.length} books, total book width ${fmt(node.books.reduce((s, b) => s + b.w, 0))} m`, root: p, notes: [led(p, 'x')] }
  })
  const packed = m.offers.find((o) => o.key === 'packed')!
  const big = arrangeAt(m, packed, ctx, { w: packed.w * 1.8, d: packed.d + 0.6 })
  panels.push({ title: 'Packed, expanded to 1.8× length and +0.6 m depth', subtitle: 'books keep their widths; slots and breathing room widen; depth stays 0.35 m (front clearance)', root: big, notes: [led(big, 'x'), led(big, 'y')] })
  const s = commonScale(panels.map((p) => p.root.rect), 640, 260)
  save('a-bookshelf.svg', 'Designer A — Bookshelf: minimum offers and an expanded shelf', 'Three real arrangements (packed, with a display bay, evenly spaced) at minimum length, and the packed shelf grown into a longer, deeper envelope.',
    panels.map((p) => ({ ...p, scale: s })), { columns: 2, panelW: 640, panelH: 260, intro: ['Top-down view, north up. Length grows; height (1.8 m) and depth (0.35 m) never change. Books keep their physical widths.'] })
}

// ---------- B. Room ----------
const budgetsRoom = room('C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Finance', 'Budgets', ['2025', '2026', '2027 draft', 'Forecasts', 'Archive'], 14, rng(21))
{
  const { ctx, m } = measure(budgetsRoom)
  const panels: Panel[] = m.offers.map((o) => {
    const p = grow(ctx, m, o)
    return { title: o.key, subtitle: `minimum ${fmt(o.w)} × ${fmt(o.d)} m · shelves ${fmt((o.plan as { shelfW: number }).shelfW)} m each`, root: p }
  })
  const s = commonScale(panels.map((p) => p.root.rect))
  save('b-room-offers.svg', 'Designer B — Room: the offer family (shelves per row = 1 … 5)', 'One room (5 subfolders → 5 identical shelves, 14 loose files on a table) measured as a family of shelf-row layouts; each table is sized for its room.',
    panels.map((p) => ({ ...p, scale: s })), { columns: 3, intro: ['All shelves in a room share the widest shelf\'s minimum length. Shelves stand at the rear, the file table in front, the door in the front wall.', 'Same scale in every panel.'] })

  const o = m.offers.find((x) => x.key.startsWith('shelves/row=3')) ?? compactest(m.offers)
  const sizes: [number, number, string][] = [[1, 1, 'minimum'], [1.35, 1.2, '1.35× wide, 1.2× deep'], [2.2, 1.6, '2.2× wide, 1.6× deep: desks appear']]
  const gp = sizes.map(([sx, sy, t]) => { const p = grow(ctx, m, o, sx, sy); return { title: `${o.key} — ${t}`, root: p, notes: [led(p, 'x'), led(p, 'y')] } as Panel })
  const s2 = commonScale(gp.map((p) => p.root.rect))
  save('b-room-growth.svg', 'Designer B — Room growth without a new search', 'The same saved room plan grown into larger envelopes: rows and identical shelves are preserved; 20% widens aisles and clearances; computer and display desks join the table when there is room.',
    gp.map((p) => ({ ...p, scale: s2 })), { columns: 3 })

  const filesOnly = room('C:\\Users\\Amanda\\Pictures', 'Screenshots', [], 20, rng(3))
  const fewShelves = room('C:\\Users\\Amanda\\Documents', 'Recipes', ['Family'], 16, rng(4))
  const a = measure(filesOnly), b = measure(fewShelves)
  const pp: Panel[] = [
    ...a.m.offers.map((x) => ({ title: `No shelves, 20 files — ${x.key}`, subtitle: `${fmt(x.w)} × ${fmt(x.d)} m`, root: grow(a.ctx, a.m, x) })),
    ...b.m.offers.map((x) => ({ title: `1 shelf, 16 files — ${x.key}`, subtitle: `${fmt(x.w)} × ${fmt(x.d)} m`, root: grow(b.ctx, b.m, x) })),
  ]
  const s3 = commonScale(pp.map((p) => p.root.rect))
  save('b-room-square-tables.svg', 'Designer B — Rooms of loose files: near-square tables', 'With no shelves, or few shelves and many files, the room also offers a table about √N files on a side (here 5 × 4 for 20 files).',
    pp.map((p) => ({ ...p, scale: s3 })), { columns: 3 })
}

// ---------- C. Building: three rooms of different minimum depths at one shared depth ----------
{
  const path = 'C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami\\Clients'
  const r = rng(31)
  const b: BuildingNode = {
    kind: 'building', name: 'Clients', path, files: [],
    rooms: [
      room(path, 'Front desk', [], 3, r),
      room(path, 'Archive', ['2022', '2023', '2024', '2025'], 2, r, [10, 24]),
      room(path, 'Records', ['Agreements', 'Orders'], 26, r),
    ],
  }
  const { ctx, m } = measure(b)
  const own = m.children.map((k) => Math.min(...k.offers.map((o) => o.d)))
  const o = m.offers.find((x) => x.key === 'rooms/row=3')!
  const annotate = (p: Placed) => (t: Transform) => p.children.map((c) => {
    const y = t.Y(c.rect.y + c.min.d)
    return `<path d="M${t.X(c.rect.x)},${y} H${t.X(c.rect.x + c.rect.w)}" stroke="#d6336c" stroke-width="1.4" stroke-dasharray="5 3"/><text x="${t.X(c.rect.x) + 4}" y="${y - 3}" font-size="9.5" fill="#d6336c">this room's offer: ${fmt(c.min.d)} m deep</text>`
  }).join('')
  const sizes: [number, number, string][] = [[1, 1, 'at minimum'], [1.5, 1.4, 'grown 1.5× wide, 1.4× deep']]
  const panels = sizes.map(([sx, sy, t]) => {
    const p = grow(ctx, m, o, sx, sy)
    return { title: `One row of three rooms, ${t}`, subtitle: `shared row depth ${fmt(p.children[0].rect.d)} m; the rooms' own smallest depths: ${own.map(fmt).join(', ')} m`, root: p, annotate: annotate(p), notes: [led(p, 'x'), led(p, 'y'), ...p.children.map((c) => `${c.name}: offer "${c.offerKey}" min ${fmt(c.min.w)} × ${fmt(c.min.d)} → ${fmt(c.rect.w)} × ${fmt(c.rect.d)} m`)] } as Panel
  })
  const s = commonScale(panels.map((p) => p.root.rect), 640, 520)
  const others = m.offers.filter((x) => x !== o).map((x) => ({ title: `Building offer "${x.key}"`, subtitle: `${fmt(x.w)} × ${fmt(x.d)} m`, root: grow(ctx, m, x) }) as Panel)
  const s2 = commonScale(others.map((p) => p.root.rect), 640, 520)
  save('c-building-shared-depth.svg', 'Designer C — Building: three rooms aligned at one shared depth', 'Acceptance test: rooms whose offers have different minimum depths sit side by side at one common depth; each room grows its saved plan into it (dashed: the depth that room\'s own offer needs).',
    [...panels.map((p) => ({ ...p, scale: s })), ...others.map((p) => ({ ...p, scale: s2 }))], { columns: 2, panelW: 640, panelH: 520 })
}

// ---------- D. Campus grids ----------
const ammCampus = ((demoHierarchy().children[0] as AreaNode).children[0] as AreaNode).children[0] as CampusNode
{
  const { ctx, m } = measure(ammCampus)
  const panels: Panel[] = m.offers.map((o) => {
    const p = grow(ctx, m, o)
    return { title: `Campus offer "${o.key}"`, subtitle: `${fmt(o.w)} × ${fmt(o.d)} m · rows ${(o.plan as { rowCount: number }).rowCount} · file building first`, root: p, depth: 2 }
  })
  save('d-campus-grids.svg', 'Designer D — Campus: the same buildings in several grid configurations', 'AmandaMedicalMiami (4 buildings + a file building for its loose files) as 1, 2, 3 … buildings per row. Buildings in a row share a depth; streets separate rows; with two or more rows a central courtyard is part of the minimum.',
    panels, { columns: 3, intro: ['Each panel at its own scale (see the scale bars).'] })
}

// ---------- E. Area: packing candidates, and a saved blueprint grown ----------
const projects: AreaNode = (() => {
  const r = rng(41)
  const path = 'C:\\Users\\Amanda\\Projects'
  const bld = (name: string, rooms: [string, string[], number][]): BuildingNode => {
    const p = join(path, name)
    return { kind: 'building', name, path: p, files: [], rooms: rooms.map(([n, s, f]) => room(p, n, s, f, r)) }
  }
  const camp: CampusNode = {
    kind: 'campus', name: 'Garden Planner App', path: join(path, 'Garden Planner App'), files: ['README.md'], importance: 1,
    buildings: ['Design', 'Source', 'Releases'].map((n) => {
      const bp = join(join(path, 'Garden Planner App'), n)
      return { kind: 'building', name: n, path: bp, files: [], rooms: [room(bp, 'Current', ['v1', 'v2'], 4, r), room(bp, 'Old', ['2024'], 2, r)] } satisfies BuildingNode
    }),
  }
  return {
    kind: 'area', name: 'Projects', path, level: 2,
    children: [camp, bld('Novel - The Lantern Keeper', [['Drafts', ['Part 1', 'Part 2', 'Part 3'], 3], ['Research', ['Maps'], 6]]), bld('Home Renovation', [['Quotes', [], 7]]), bld('Photography', [['Edits', ['2025', '2026'], 2], ['Prints', [], 3]]), bld('Taxes Helper', [['Scripts', ['Python'], 1]]), bld('Wedding 2027', [['Vendors', ['Venues', 'Catering'], 5]]), bld('Old Experiments', [['Misc', [], 9]])],
  }
})()
{
  const { ctx, m } = measure(projects, 5, 100)
  const panels: Panel[] = m.offers.map((o) => {
    const p = grow(ctx, m, o)
    const bp = o.plan as { attempt: number; seed: number; fill: number; order: number[] }
    return { title: `Blueprint from attempt #${bp.attempt}`, subtitle: `${fmt(o.w)} × ${fmt(o.d)} m · fill ${pct(bp.fill, 1)} · score ${o.quality.score.toFixed(3)} · seed ${bp.seed}`, root: p, depth: 1, notes: [`placement order: ${bp.order.map((i) => m.children[i].node.name.split(' ')[0]).join(' → ')}`] }
  })
  save('e-area-candidates.svg', 'Designer E — Area: distinct packings retained from 100 seeded attempts', 'Projects (a campus and six buildings), as a level-2 area, packed on an X/Y marking grid with a 3.5 m path around every child. The best distinct attempts are kept as blueprints; narrow, square and wide ones all survive.',
    panels, { columns: 3, intro: [`Explored ${ctx.stats.explored} candidates, kept ${m.offers.length} blueprints. Separators are the area's own space: boundary band, front band (sign and gate), and streets between children.`] })

  const o = m.offers[0]
  const a = grow(ctx, m, o)
  const b = grow(ctx, m, o, 1.6, 1.3)
  const s = commonScale([b.rect])
  const growthNote = (p: Placed) => {
    const ratios = p.children.map((c) => c.rect.w / c.min.w)
    return `children's width factors: ${Math.min(...ratios).toFixed(3)} … ${Math.max(...ratios).toFixed(3)} (all equal: proportional growth)`
  }
  save('e-area-blueprint-growth.svg', 'Designer E — A saved blueprint, before and after growth', 'The selected blueprint is stretched, not re-searched: order, adjacency and clearances are kept; 20% of each axis\' surplus widens the boundary and streets, 80% widens the children in proportion to their size.',
    [{ title: `Blueprint #${(o.plan as { attempt: number }).attempt} at minimum`, root: a, depth: 2, scale: s, notes: [led(a, 'x'), led(a, 'y')] },
      { title: 'Same blueprint grown 1.6× wide and 1.3× deep (no new search)', root: b, depth: 2, scale: s, notes: [led(b, 'x'), led(b, 'y'), growthNote(b)] }],
    { columns: 2, panelW: 700, panelH: 640 })
}

// ---------- The whole hierarchy, and a very large growth ----------
function chain(p: Placed): Placed[] {
  const campus = find(p, (n) => n.kind === 'campus' && n.name === 'AmandaMedicalMiami')
  const building = find(campus, (n) => n.kind === 'building' && n.name === 'Finance')
  const rm = find(building, (n) => n.kind === 'room' && n.name === 'Budgets')
  const sh = find(rm, (n) => n.kind === 'shelf' && n.name === '2027 draft')
  return [p, campus, building, rm, sh]
}
function chainPanels(root: Placed, label: string): Panel[] {
  const c = chain(root)
  const names = ['Area', 'Campus', 'Building', 'Room', 'Bookshelf']
  return c.map((n, i) => ({
    title: `${i + 1}. ${names[i]}: ${n.name}`,
    subtitle: `${label} · ${fmt(n.rect.w)} × ${fmt(n.rect.d)} m (min ${fmt(n.min.w)} × ${fmt(n.min.d)})`,
    root: n,
    depth: i === 0 ? 3 : 4,
    highlight: c[i + 1] ? [{ rect: c[i + 1].rect, label: `→ ${c[i + 1].name}` }] : [],
    notes: [led(n, 'x'), led(n, 'y')],
  }))
}
{
  const { ctx, m } = measure(demoHierarchy(), 7, 100)
  const o = compactest(m.offers)
  const mid = grow(ctx, m, o, 1.1, 1.1)
  save('f-hierarchy.svg', 'The complete hierarchy: Area → Campus → Building → Room → Bookshelf', 'C:\\Users\\Amanda (fictional) laid out by the five designers. Each panel zooms into the outlined child: the AmandaMedicalMiami campus, its Finance building, the Budgets room, and its "2027 draft" shelf.',
    chainPanels(mid, 'allocated 1.1× the minimum'), { columns: 3, intro: ['Nested areas (Amanda → Documents → Business) use separator families by level: highway, street, path. Residual buildings hold each area folder\'s other subfolders.'] })

  const big = grow(ctx, m, o, 3, 2.5)
  const small = grow(ctx, m, o)
  const levels = chain(big)
  const minChain = chain(small)
  const table = levels.map((n, i) => `${['Area', 'Campus', 'Building', 'Room', 'Shelf'][i]} ${n.name}: width +${fmt(n.rect.w - minChain[i].rect.w)} m (kept ${fmt(n.ledger.x.absorbed)}, passed ${fmt(n.ledger.x.passed)}); depth +${fmt(n.rect.d - minChain[i].rect.d)} m (kept ${fmt(n.ledger.y.absorbed)}, passed ${fmt(n.ledger.y.passed)})`)
  save('g-large-growth.svg', 'A very large growth: 3× wider and 2.5× deeper at the root', 'The same measured hierarchy allocated 3× its minimum width and 2.5× its depth. Each level keeps its share (wider highways and streets, larger courtyard and plaza, wider corridors and aisles, longer shelf) and passes the rest down; books never change size.',
    chainPanels(big, 'allocated 3× / 2.5× the minimum'), { columns: 3, intro: table })
}

// ---------- Index ----------
const bench = pjoin(HERE, '..', 'results', 'benchmarks.md')
const benchHtml = existsSync(bench) ? `<h2>Benchmarks</h2><pre>${readFileSync(bench, 'utf8').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>` : ''
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Layout Negotiator Gallery</title>
<style>
body { font-family: Inter, 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 24px 16px 48px; background: #f4f3ef; color: #222; }
main { max-width: 1200px; margin: 0 auto; }
h1 { font-size: 22px; margin: 0 0 6px; } p.lead { color: #555; margin: 0 0 24px; }
figure { margin: 0 0 28px; background: #fff; border: 1px solid #e2e0da; border-radius: 10px; padding: 14px; }
figure img { width: 100%; height: auto; display: block; }
figcaption { font-size: 14px; margin-bottom: 10px; } figcaption b { display: block; font-size: 16px; margin-bottom: 4px; }
pre { background: #fff; border: 1px solid #e2e0da; border-radius: 10px; padding: 14px; overflow: auto; font-size: 12px; }
</style></head><body><main>
<h1>Spatial Layout Negotiator α.v2 — gallery</h1>
<p class="lead">Five specialized designers, one measure/arrange protocol, 20% of every surplus kept at each level. All layouts below passed the validator (${violations} violations). Open any image for full size.</p>
<p class="lead"><a href="sensitivity/index.html">Sensitivity study</a>: absorption 20% / 10% / 5% × uniform / balanced child-offer sampling, on identical datasets and seeds.</p>
${entries.map((e) => `<figure><figcaption><b>${e.title}</b>${e.caption}</figcaption><a href="${e.file}"><img src="${e.file}" alt="${e.title}"></a></figure>`).join('\n')}
${benchHtml}
</main></body></html>`
writeFileSync(pjoin(OUT, 'index.html'), html)
console.log(`index.html (${entries.length} drawings, ${violations} violations)`)
if (violations) process.exitCode = 1
