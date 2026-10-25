// Sensitivity study: local absorption 20% / 10% / 5% × uniform / balanced child-offer sampling.
// Same datasets, same seeds, same hard constraints and minimum separators throughout.
// Usage: node --expose-gc src/study.ts   (writes results/sensitivity.{json,md} and gallery/sensitivity/)

import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_CONFIG } from './config.ts'
import type { Config } from './config.ts'
import { arrangeAt, createContext } from './engine.ts'
import { fmt } from './geometry.ts'
import type { LayoutNode } from './model.ts'
import { lookDrift, newAreaShares, snapshot } from './metrics.ts'
import type { Level, Snapshot } from './metrics.ts'
import { compactest } from './offers.ts'
import type { Placed } from './protocol.ts'
import { renderPanels } from './svg.ts'
import type { Panel } from './svg.ts'
import { demoHierarchy, syntheticHierarchy } from './synth.ts'
import { nodes, validate } from './validate.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const RESULTS = join(HERE, '..', 'results')
const SVG = join(HERE, '..', 'gallery', 'sensitivity')
mkdirSync(RESULTS, { recursive: true })
mkdirSync(SVG, { recursive: true })

type Sampling = 'uniform' | 'balanced'
const ABSORB = [0.2, 0.1, 0.05]
const SAMPLING: Sampling[] = ['uniform', 'balanced']
const SEEDS = [1, 2, 3, 4, 5]
const ALLOCS = [{ id: '2×', sx: 2, sy: 2 }, { id: '3× / 2.5×', sx: 3, sy: 2.5 }]
const DATASETS: { id: string; label: string; make: () => LayoutNode }[] = [
  { id: 'demo', label: 'Demo hierarchy (C:\\Users\\Amanda)', make: () => demoHierarchy() },
  { id: 'synth100', label: 'Synthetic, ~100 containers', make: () => syntheticHierarchy(100, 1).root },
  { id: 'synth1000', label: 'Synthetic, ~1,000 containers', make: () => syntheticHierarchy(1000, 1).root },
]
const LEVELS: Level[] = ['area', 'campus', 'building', 'room', 'shelf']

const cfgOf = (absorb: number, sampling: Sampling): Partial<Config> => ({ absorb, area: { ...DEFAULT_CONFIG.area, sampling } })
const cname = (absorb: number, sampling: Sampling) => `${Math.round(absorb * 100)}% · ${sampling}`

interface Run {
  dataset: string
  seed: number
  absorb: number
  sampling: Sampling
  measureMs: number
  arrangeMs: number
  violations: number
  layouts: number
  offersSig: string
  min: Snapshot
  grown: { alloc: string; snap: Snapshot; shares: Record<Level, number>; drift: number }[]
}

/** Exploratory arm beyond the requested grid (uniform sampling only; growth is unaffected by sampling). */
const EXTRA = [0.35, 0.5]

const runs: Run[] = []
const keep = new Map<string, { min: Placed; grown: Placed[] }>() // seed-1 layouts for drawings

for (const ds of DATASETS) {
  const root = ds.make()
  const grid = SAMPLING.flatMap((sampling) => ABSORB.map((absorb) => ({ sampling, absorb }))).concat(EXTRA.map((absorb) => ({ sampling: 'uniform' as Sampling, absorb })))
  for (const seed of SEEDS) for (const { sampling, absorb } of grid) {
    const ctx = createContext({ seed, cfg: cfgOf(absorb, sampling) })
    const t0 = performance.now()
    const m = ctx.measure(root)
    const t1 = performance.now()
    const offer = compactest(m.offers)
    const min = arrangeAt(m, offer, ctx, { w: offer.w, d: offer.d })
    const grownP = ALLOCS.map((a) => arrangeAt(m, offer, ctx, { w: offer.w * a.sx, d: offer.d * a.sy }))
    const t2 = performance.now()
    const all = [min, ...grownP]
    const violations = all.reduce((s, p) => s + validate(p, absorb).length, 0)
    const ms = snapshot(min)
    runs.push({
      dataset: ds.id, seed, absorb, sampling,
      measureMs: t1 - t0, arrangeMs: (t2 - t1) / all.length, violations, layouts: all.length,
      offersSig: JSON.stringify(m.offers.map((o) => [o.key, o.w, o.d])),
      min: ms,
      grown: grownP.map((p, i) => { const s = snapshot(p); return { alloc: ALLOCS[i].id, snap: s, shares: newAreaShares(ms, s), drift: lookDrift(ms, s) } }),
    })
    if (seed === 1) keep.set(`${ds.id}|${absorb}|${sampling}`, { min, grown: grownP })
  }
  console.log('done', ds.id)
}

// Measurement must not depend on the absorption rate (it only affects growth).
const absorbInvariant = runs.every((r) => runs.filter((x) => x.dataset === r.dataset && x.seed === r.seed && x.sampling === r.sampling).every((x) => x.offersSig === r.offersSig))

// ---------- Performance at ~5,000 containers ----------
const gc = (globalThis as { gc?: () => void }).gc
const big = syntheticHierarchy(5000, 1).root
const perf: { absorb: number; sampling: Sampling; measureMs: number; arrangeMinMs: number; arrange2xMs: number; explored: number }[] = []
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
for (const sampling of SAMPLING) for (const absorb of ABSORB) {
  const mm: number[] = [], a1: number[] = [], a2: number[] = []
  let explored = 0
  for (let i = -1; i < 3; i++) {
    gc?.()
    const ctx = createContext({ seed: 1, cfg: cfgOf(absorb, sampling) })
    const t0 = performance.now()
    const m = ctx.measure(big)
    const t1 = performance.now()
    const o = compactest(m.offers)
    arrangeAt(m, o, ctx, { w: o.w, d: o.d })
    const t2 = performance.now()
    arrangeAt(m, o, ctx, { w: o.w * 2, d: o.d * 2 })
    const t3 = performance.now()
    if (i >= 0) { mm.push(t1 - t0); a1.push(t2 - t1); a2.push(t3 - t2) }
    explored = ctx.stats.explored
  }
  perf.push({ absorb, sampling, measureMs: median(mm), arrangeMinMs: median(a1), arrange2xMs: median(a2), explored })
}
console.log('done performance')

// ---------- Aggregation ----------
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
const pick = (ds: string, absorb: number, sampling: Sampling) => runs.filter((r) => r.dataset === ds && r.absorb === absorb && r.sampling === sampling)
const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`
const range = (xs: number[], f: (v: number) => string) => `${f(mean(xs))} (${f(Math.min(...xs))}–${f(Math.max(...xs))})`
const totalLayouts = runs.reduce((s, r) => s + r.layouts, 0)
const totalViolations = runs.reduce((s, r) => s + r.violations, 0)

const env = {
  date: new Date().toISOString(), node: process.version, cpu: os.cpus()[0]?.model ?? 'unknown', cores: os.cpus().length,
  memoryGB: +(os.totalmem() / 1073741824).toFixed(1), platform: `${os.type()} ${os.release()} ${os.arch()}`,
}
writeFileSync(join(RESULTS, 'sensitivity.json'), JSON.stringify({ env, absorbInvariant, totalLayouts, totalViolations, runs, perf }, null, 2))

const md: string[] = []
md.push('# Sensitivity study — absorption rate × child-offer sampling', '')
md.push(`Measured ${env.date} on ${env.cpu} (${env.cores} cores, ${env.memoryGB} GB), ${env.platform}, Node ${env.node}.`, '')
md.push('**Factors.** Local absorption (each container keeps this share of each axis\' surplus): 20%, 10%, 5%. Child-offer sampling in the Area designer\'s randomized attempts: *uniform*, or *balanced*, where an offer\'s weight is its short side / long side (a 2 : 1 offer is half as likely as a square one; nothing is excluded). Both modes consume one random number per child, so the same seed gives paired runs. Attempt 0 (most compact offers) is identical in both.', '')
md.push(`**Held constant.** All hard constraints, minimum sizes and separator minimums; 100 Area attempts; the same three datasets; seeds ${SEEDS.join(', ')}; allocations: minimum, 2× on both axes, and 3× wide by 2.5× deep. The root takes its most compact offer.`, '')
md.push(`**Exploratory arm.** Beyond the requested grid, absorption 35% and 50% were also run (uniform sampling only, since sampling does not affect growth) to see which way the trend continues. They are marked *exploratory* and are not candidates in the requested comparison.`, '')
md.push(`**Validity.** ${totalLayouts} layouts, ${totalViolations} violations (each validated against its own absorption rate). Measurement is independent of the absorption rate: ${absorbInvariant ? 'confirmed (identical offers for every dataset, seed and sampling mode)' : 'NOT confirmed'}.`, '')

md.push('## 1. Sampling: compactness and proportions at minimum size', '')
md.push('Absorption has no effect here (it only changes growth), so each row is one sampling mode. Mean over 5 seeds (range).', '')
md.push('| dataset | sampling | root min area m² | root aspect | rooms % of root | area → children | children placed by areas, mean imbalance | …beyond 2.5 : 1 | buildings beyond 3 : 1 | measure ms |')
md.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|')
for (const ds of DATASETS) for (const s of SAMPLING) {
  const rs = pick(ds.id, 0.2, s)
  md.push(`| ${ds.label} | ${s} | ${range(rs.map((r) => r.min.rootArea), (v) => Math.round(v).toLocaleString('en-US'))} | ${range(rs.map((r) => r.min.rootW / r.min.rootD), (v) => v.toFixed(2))} | ${range(rs.map((r) => r.min.roomsShare), (v) => pct(v))} | ${range(rs.map((r) => r.min.childShare.area), (v) => pct(v, 0))} | ${range(rs.map((r) => r.min.areaChildImbalance), (v) => v.toFixed(2))} | ${range(rs.map((r) => r.min.areaChildExtreme), (v) => pct(v, 0))} | ${range(rs.map((r) => r.min.buildingExtreme), (v) => pct(v, 0))} | ${mean(pick(ds.id, 0.2, s).concat(pick(ds.id, 0.1, s), pick(ds.id, 0.05, s)).map((r) => r.measureMs)).toFixed(1)} |`)
}
md.push('', '"Imbalance" is |ln(width / depth)|: 0 for a square, 0.69 for 2 : 1, 1.10 for 3 : 1.', '')
md.push('Paired by seed (balanced − uniform), root minimum area:', '')
md.push('| dataset | mean change | seeds where balanced is smaller |')
md.push('|---|---:|---:|')
for (const ds of DATASETS) {
  const u = pick(ds.id, 0.2, 'uniform'), b = pick(ds.id, 0.2, 'balanced')
  const d = u.map((r, i) => b[i].min.rootArea / r.min.rootArea - 1)
  md.push(`| ${ds.label} | ${d.map((x) => x * 100).reduce((s, x) => s + x, 0) / d.length >= 0 ? '+' : ''}${(mean(d) * 100).toFixed(1)}% | ${d.filter((x) => x < -1e-9).length} of ${d.length} (equal in ${d.filter((x) => Math.abs(x) <= 1e-9).length}) |`)
}

md.push('', 'Paired by seed (balanced vs uniform): in how many of the 5 seeds balanced sampling did better, and worse.', '')
md.push('| dataset | lower mean imbalance of children placed by areas | fewer children beyond 2.5 : 1 | fewer buildings beyond 3 : 1 | building imbalance, uniform → balanced |')
md.push('|---|---:|---:|---:|---:|')
for (const ds of DATASETS) {
  const u = pick(ds.id, 0.2, 'uniform'), b = pick(ds.id, 0.2, 'balanced')
  const tally = (f: (r: Run) => number) => `${u.filter((r, i) => f(b[i]) < f(r) - 1e-9).length} better, ${u.filter((r, i) => f(b[i]) > f(r) + 1e-9).length} worse`
  md.push(`| ${ds.label} | ${tally((r) => r.min.areaChildImbalance)} | ${tally((r) => r.min.areaChildExtreme)} | ${tally((r) => r.min.buildingExtreme)} | ${mean(u.map((r) => r.min.buildingImbalance)).toFixed(2)} → ${mean(b.map((r) => r.min.buildingImbalance)).toFixed(2)} |`)
}

md.push('', '## 2. Absorption: how fast each level grows compared with the root', '')
md.push('Geometric-mean area factor of each kind of container (shelves: length factor) against the root\'s area factor; uniform sampling, mean over 5 seeds. A level growing faster than the root is being fed more than its share: its children cover only part of its width and depth, so passing them most of the surplus makes them grow faster than it does, and the effect compounds down the levels.', '')
md.push('| dataset | allocation | root × | absorb | areas × | campuses × | buildings × | rooms × | shelves (length) × |')
md.push('|---|---|---:|---:|---:|---:|---:|---:|---:|')
for (const ds of DATASETS) for (const alloc of ALLOCS) for (const absorb of [...ABSORB, ...EXTRA]) {
  const rs = pick(ds.id, absorb, 'uniform')
  const g = rs.map((r) => r.grown.find((x) => x.alloc === alloc.id)!)
  const rootX = mean(g.map((x) => x.snap.rootArea)) / mean(rs.map((r) => r.min.rootArea))
  md.push(`| ${ds.label} | ${alloc.id} | ${rootX.toFixed(1)} | ${Math.round(absorb * 100)}%${EXTRA.includes(absorb) ? ' *(exploratory)*' : ''} | ${LEVELS.map((k) => mean(g.map((x) => x.snap.growth[k])).toFixed(1)).join(' | ')} |`)
}

for (const [ai, alloc] of ALLOCS.entries()) {
  md.push('', `## 3${'ab'[ai]}. Absorption: quality after growth to ${alloc.id} the minimum`, '')
  md.push('Mean over 5 seeds. *Rooms % of root*: room floor as a share of the whole layout. *Furniture density*: shelves, tables and desks / room floor (at minimum it is the designed density). *Shelf fill*: book widths / shelf length. *Composition drift*: how far the balance between containers and the space around them moved from the minimum design (areas, campuses, buildings; percentage points). *New floor kept by*: where the extra area went.', '')
  md.push('| dataset | absorb | sampling | rooms % of root | furniture density | shelf fill | room area ×, shelf length × | composition drift | new floor kept by areas / campuses / buildings / rooms / shelves |')
  md.push('|---|---:|---|---:|---:|---:|---:|---:|---|')
  for (const ds of DATASETS) {
    const base = pick(ds.id, 0.2, 'uniform')
    md.push(`| ${ds.label} | minimum | – | ${pct(mean(base.map((r) => r.min.roomsShare)))} | ${pct(mean(base.map((r) => r.min.furnitureDensity)))} | ${pct(mean(base.map((r) => r.min.shelfFill)))} | 1.0, 1.0 | 0 | – |`)
    for (const [absorb, s] of [...ABSORB.flatMap((a) => SAMPLING.map((x) => [a, x] as const)), ...EXTRA.map((a) => [a, 'uniform' as Sampling] as const)]) {
      const g = pick(ds.id, absorb, s).map((r) => r.grown.find((x) => x.alloc === alloc.id)!)
      const sh = (k: Level) => pct(mean(g.map((x) => x.shares[k])), 0)
      md.push(`| ${ds.label} | ${Math.round(absorb * 100)}%${EXTRA.includes(absorb) ? ' *(exploratory)*' : ''} | ${s} | ${pct(mean(g.map((x) => x.snap.roomsShare)))} | ${pct(mean(g.map((x) => x.snap.furnitureDensity)))} | ${pct(mean(g.map((x) => x.snap.shelfFill)))} | ${mean(g.map((x) => x.snap.growth.room)).toFixed(2)}, ${mean(g.map((x) => x.snap.growth.shelf)).toFixed(2)} | ${mean(g.map((x) => x.drift)).toFixed(1)} | ${LEVELS.map(sh).join(' / ')} |`)
    }
  }
}

md.push('', '## 4. Performance at ~5,000 containers (seed 1, medians of 3 runs after a warm-up)', '')
md.push('| absorb | sampling | measure ms | arrange at minimum ms | arrange at 2× ms | candidates explored |')
md.push('|---:|---|---:|---:|---:|---:|')
for (const p of perf) md.push(`| ${Math.round(p.absorb * 100)}% | ${p.sampling} | ${p.measureMs.toFixed(1)} | ${p.arrangeMinMs.toFixed(1)} | ${p.arrange2xMs.toFixed(1)} | ${p.explored.toLocaleString('en-US')} |`)
writeFileSync(join(RESULTS, 'sensitivity.md'), md.join('\n') + '\n')
console.log('wrote results/sensitivity.{json,md}')

// ---------- Drawings (seed 1, identical datasets, one scale per sheet) ----------
const CONFIGS = ABSORB.flatMap((a) => SAMPLING.map((s) => ({ absorb: a, sampling: s })))
const findBy = (p: Placed, kind: string, path: string) => { for (const n of nodes(p)) if (n.kind === kind && n.path === path) return n; return null }
const scaleFor = (rects: { w: number; d: number }[], w: number, h: number) => Math.min(...rects.map((r) => Math.min((w - 52) / r.w, (h - 76) / r.d)))
const notesFor = (p: Placed, min: Snapshot) => {
  const s = snapshot(p)
  const sh = newAreaShares(min, s)
  return [
    `rooms ${pct(s.roomsShare)} of root · furniture density ${pct(s.furnitureDensity)} · shelf fill ${pct(s.shelfFill)}`,
    `new floor kept by areas ${pct(sh.area, 0)}, campuses ${pct(sh.campus, 0)}, buildings ${pct(sh.building, 0)}, rooms ${pct(sh.room, 0)}, shelves ${pct(sh.shelf, 0)}`,
  ]
}
const files: { file: string; title: string; caption: string }[] = []
function sheet(file: string, title: string, caption: string, panels: Panel[], opts: { columns?: number; panelW?: number; panelH?: number; intro?: string[] } = {}) {
  writeFileSync(join(SVG, file), renderPanels(panels, { title, columns: opts.columns ?? 2, panelW: opts.panelW, panelH: opts.panelH, intro: opts.intro }))
  files.push({ file, title, caption })
}

const AMM = 'C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami'
{
  // S1: the whole demo hierarchy grown 3× / 2.5×, six configurations at one scale.
  const ps = CONFIGS.map((c) => ({ c, k: keep.get(`demo|${c.absorb}|${c.sampling}`)! }))
  const S = scaleFor(ps.map(({ k }) => k.grown[1].rect), 620, 560)
  sheet('s1-demo-3x.svg', 'S1 · The demo hierarchy grown 3× wide and 2.5× deep', 'Rows: absorption 20%, 10%, 5%. Columns: uniform and balanced sampling. Same dataset, seed and scale.',
    ps.map(({ c, k }) => ({ title: cname(c.absorb, c.sampling), subtitle: `${fmt(k.grown[1].rect.w)} × ${fmt(k.grown[1].rect.d)} m (minimum ${fmt(k.min.rect.w)} × ${fmt(k.min.rect.d)})`, root: k.grown[1], depth: 3, scale: S, notes: notesFor(k.grown[1], snapshot(k.min)) })),
    { panelW: 620, panelH: 560, intro: ['Lower absorption leaves less space in roads, boundaries and plazas and pushes more into buildings and rooms.'] })

  // S2 and S3: the same room and building inside each of those layouts.
  for (const [file, kind, path, title] of [
    ['s2-budgets-room-3x.svg', 'room', `${AMM}\\Finance\\Budgets`, 'S2 · The Budgets room inside each 3× / 2.5× layout'],
    ['s3-finance-building-3x.svg', 'building', `${AMM}\\Finance`, 'S3 · The Finance building inside each 3× / 2.5× layout'],
  ] as const) {
    const items = CONFIGS.map((c) => { const k = keep.get(`demo|${c.absorb}|${c.sampling}`)!; return { c, n: findBy(k.grown[1], kind, path)!, m: findBy(k.min, kind, path)! } })
    const S2 = scaleFor(items.map((x) => x.n.rect), 620, 480)
    sheet(file, title, 'What the absorption rate does at the bottom of the hierarchy: same contents, same scale.',
      items.map(({ c, n, m }) => {
        const s = snapshot(n)
        return { title: cname(c.absorb, c.sampling), subtitle: `${fmt(n.rect.w)} × ${fmt(n.rect.d)} m (minimum ${fmt(m.rect.w)} × ${fmt(m.rect.d)}; ${(n.rect.w * n.rect.d / (m.rect.w * m.rect.d)).toFixed(1)}× the area)`, root: n, scale: S2, notes: [`furniture density ${pct(s.furnitureDensity)} · shelf fill ${pct(s.shelfFill)} · width kept ${pct(n.ledger.x.absorbed / Math.max(n.ledger.x.surplus, 1e-9), 0)} of surplus`] } as Panel
      }), { panelW: 620, panelH: 480 })
  }

  // S2b (exploratory): the same room with more absorption than the requested grid.
  {
    const items = [0.2, ...EXTRA].map((a) => { const k = keep.get(`demo|${a}|uniform`)!; return { a, n: findBy(k.grown[1], 'room', `${AMM}\\Finance\\Budgets`)!, m: findBy(k.min, 'room', `${AMM}\\Finance\\Budgets`)! } })
    const S2b = scaleFor(items.map((x) => x.n.rect), 520, 480)
    sheet('s2b-budgets-room-exploratory.svg', 'S2b · Exploratory: the Budgets room with 20%, 35% and 50% absorption (3× / 2.5×)', 'Outside the requested grid: the same room, dataset, seed and scale, with uniform sampling.',
      items.map(({ a, n, m }) => { const s = snapshot(n); return { title: `${Math.round(a * 100)}% · uniform${a > 0.2 ? ' (exploratory)' : ''}`, subtitle: `${fmt(n.rect.w)} × ${fmt(n.rect.d)} m (${(n.rect.w * n.rect.d / (m.rect.w * m.rect.d)).toFixed(1)}× the minimum area)`, root: n, scale: S2b, notes: [`furniture density ${pct(s.furnitureDensity)} · shelf fill ${pct(s.shelfFill)}`] } as Panel }),
      { columns: 3, panelW: 520, panelH: 480 })
  }

  // S4: sampling at minimum size (absorption cannot matter there).
  const pairs = (['demo', 'synth100'] as const).map((id) => SAMPLING.map((s) => ({ id, s, k: keep.get(`${id}|0.2|${s}`)! })))
  const panels: Panel[] = []
  for (const pair of pairs) {
    const S4 = scaleFor(pair.map((x) => x.k.min.rect), 620, 560)
    for (const { id, s, k } of pair) {
      const sn = snapshot(k.min)
      panels.push({ title: `${id === 'demo' ? 'Demo hierarchy' : 'Synthetic ~100'} · ${s} sampling · minimum`, subtitle: `${fmt(k.min.rect.w)} × ${fmt(k.min.rect.d)} m = ${Math.round(sn.rootArea).toLocaleString('en-US')} m²`, root: k.min, depth: 3, scale: S4, notes: [`rooms ${pct(sn.roomsShare)} of root · area→children ${pct(sn.childShare.area, 0)} · children placed by areas: imbalance ${sn.areaChildImbalance.toFixed(2)}, ${pct(sn.areaChildExtreme, 0)} beyond 2.5 : 1`] })
    }
  }
  sheet('s4-sampling-minimum.svg', 'S4 · Uniform vs balanced child-offer sampling, at minimum size', 'Seed 1, 100 attempts. Absorption does not change minimum layouts, so only sampling differs.', panels, { panelW: 620, panelH: 560 })

  // S5: a second dataset grown 2×.
  const ps5 = CONFIGS.map((c) => ({ c, k: keep.get(`synth100|${c.absorb}|${c.sampling}`)! }))
  const S5 = scaleFor(ps5.map(({ k }) => k.grown[0].rect), 620, 520)
  sheet('s5-synthetic-2x.svg', 'S5 · Synthetic ~100 containers grown 2× on both axes', 'Rows: absorption 20%, 10%, 5%. Columns: uniform and balanced sampling. Same dataset, seed and scale.',
    ps5.map(({ c, k }) => ({ title: cname(c.absorb, c.sampling), subtitle: `${fmt(k.grown[0].rect.w)} × ${fmt(k.grown[0].rect.d)} m`, root: k.grown[0], depth: 3, scale: S5, notes: notesFor(k.grown[0], snapshot(k.min)) })),
    { panelW: 620, panelH: 520 })
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Negotiator Sensitivity Sheets</title>
<style>body{font-family:Inter,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;padding:24px 16px 48px;background:#f4f3ef;color:#222}main{max-width:1300px;margin:0 auto}figure{margin:0 0 28px;background:#fff;border:1px solid #e2e0da;border-radius:10px;padding:14px}img{width:100%;height:auto}figcaption{margin-bottom:8px}figcaption b{display:block;font-size:16px}</style></head><body><main>
<h1>Sensitivity study — drawings</h1><p>Tables and method: <code>results/sensitivity.md</code>. ${totalLayouts} layouts, ${totalViolations} violations.</p>
${files.map((f) => `<figure><figcaption><b>${f.title}</b>${f.caption}</figcaption><a href="${f.file}"><img src="${f.file}" alt="${f.title}"></a></figure>`).join('\n')}
</main></body></html>`
writeFileSync(join(SVG, 'index.html'), html)
console.log(`wrote ${files.length} drawings to gallery/sensitivity/ (${totalLayouts} layouts, ${totalViolations} violations, absorb-invariant measurement: ${absorbInvariant})`)
