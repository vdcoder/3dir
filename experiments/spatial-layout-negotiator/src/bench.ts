// Benchmarks of the two passes, independent of SVG generation.
// Usage: node --expose-gc src/bench.ts   (writes results/benchmarks.{json,md})

import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { arrangeAt, createContext } from './engine.ts'
import { compactest } from './offers.ts'
import type { Stats } from './protocol.ts'
import { syntheticHierarchy } from './synth.ts'
import { countContainers, nodes, utilization, validate } from './validate.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'results')
mkdirSync(OUT, { recursive: true })

const gc = (globalThis as { gc?: () => void }).gc
const heap = () => { gc?.(); gc?.(); return process.memoryUsage().heapUsed }
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const MB = (b: number) => +(b / 1048576).toFixed(2)
const r2 = (v: number) => +v.toFixed(2)

interface Row {
  target: number
  containers: number
  books: number
  attempts: number
  runs: number
  measureMs: number
  arrangeMs: number
  arrange2xMs: number
  totalMs: number
  measuredHeapMB: number
  placedHeapMB: number
  /** Serialized size of the offers and saved plans the arrange pass reuses. */
  planKB: number
  areaMs: number
  /** Share of each kind of container's area taken by its children (at minimum size). */
  fill: Record<string, number>
  explored: number
  retained: number
  infeasible: number
  roomShare: number
  topLevelShare: number
  rootW: number
  rootD: number
  violations: number
  byKind: Stats['byKind']
}

/** Per kind: Σ children's area / Σ container area (rooms: furniture envelopes, and physical furniture). */
function fillByLevel(p: ReturnType<typeof arrangeAt>): Record<string, number> {
  const acc: Record<string, [number, number]> = {}
  const add = (k: string, a: number, b: number) => { const x = (acc[k] ??= [0, 0]); x[0] += a; x[1] += b }
  for (const n of nodes(p)) {
    if (n.kind === 'book' || n.kind === 'table' || n.kind === 'shelf') continue
    const own = n.rect.w * n.rect.d
    add(n.kind, n.children.reduce((s, c) => s + c.rect.w * c.rect.d, 0), own)
    if (n.kind === 'room') {
      let phys = 0
      for (const c of n.children) {
        if (c.kind === 'shelf') { const b = c.meta!.body as { w: number; d: number }; phys += b.w * b.d }
        else for (const o of c.objects) if (o.layer === 0) phys += o.rect.w * o.rect.d
      }
      add('room furniture', phys, own)
    }
  }
  return Object.fromEntries(Object.entries(acc).map(([k, [a, b]]) => [k, r2((a / b) * 100)]))
}

const rows: Row[] = []
const SIZES = [10, 100, 1000, 5000]
const BUDGETS = [10, 100, 1000]

for (const target of SIZES) {
  const { root } = syntheticHierarchy(target, 1)
  for (const attempts of BUDGETS) {
    const runs = target >= 5000 || attempts >= 1000 ? 3 : 7
    const m1: number[] = [], a1: number[] = [], a2: number[] = [], am: number[] = []
    let last: { stats: Stats; placed: ReturnType<typeof arrangeAt>; placed2: ReturnType<typeof arrangeAt>; w: number; d: number; json: number } | null = null
    for (let i = -1; i < runs; i++) { // i = -1: warm-up, not recorded
      gc?.()
      const ctx = createContext({ seed: 1, attempts })
      const t0 = performance.now()
      const m = ctx.measure(root)
      const t1 = performance.now()
      const offer = compactest(m.offers)
      const t2 = performance.now()
      const placed = arrangeAt(m, offer, ctx, { w: offer.w, d: offer.d })
      const t3 = performance.now()
      const placed2 = arrangeAt(m, offer, ctx, { w: offer.w * 2, d: offer.d * 2 })
      const t4 = performance.now()
      if (i >= 0) { m1.push(t1 - t0); a1.push(t3 - t2); a2.push(t4 - t3); am.push(ctx.stats.byKind.area?.ms ?? 0) }
      // Size of everything the arrange pass needs: the offers and their saved plans (input tree excluded).
      const json = i === runs - 1 ? JSON.stringify(m, (k, v) => (k === 'node' ? undefined : v)).length : 0
      last = { stats: ctx.stats, placed, placed2, w: offer.w, d: offer.d, json }
    }
    const L = last!
    // Memory: retained heap of measured trees and of placed trees (several kept alive, after forced GC).
    const K = 3
    const keepM: unknown[] = [], keepP: unknown[] = []
    const h0 = heap()
    for (let i = 0; i < K; i++) keepM.push(createContext({ seed: 1, attempts }).measure(root))
    const h1 = heap()
    for (let i = 0; i < K; i++) {
      const ctx = createContext({ seed: 1, attempts })
      const m = ctx.measure(root)
      const o = compactest(m.offers)
      keepP.push(arrangeAt(m, o, ctx, { w: o.w, d: o.d }))
    }
    const h2 = heap()
    void keepM.length; void keepP.length
    const violations = validate(L.placed, 0.2).length + validate(L.placed2, 0.2).length
    const u = utilization(L.placed)
    let books = 0
    for (const n of nodes(L.placed)) if (n.kind === 'book') books++
    const row: Row = {
      target, containers: countContainers(L.placed), books, attempts, runs,
      measureMs: r2(median(m1)), arrangeMs: r2(median(a1)), arrange2xMs: r2(median(a2)), totalMs: r2(median(m1) + median(a1)),
      measuredHeapMB: MB((h1 - h0) / K), placedHeapMB: MB((h2 - h1) / K), planKB: Math.round(L.json / 1024),
      areaMs: r2(median(am)), fill: fillByLevel(L.placed),
      explored: L.stats.explored, retained: L.stats.retained, infeasible: L.stats.infeasible,
      roomShare: r2(u.rooms * 100), topLevelShare: r2(u.topLevel * 100), rootW: r2(L.w), rootD: r2(L.d), violations,
      byKind: Object.fromEntries(Object.entries(L.stats.byKind).map(([k, v]) => [k, { ...v, ms: r2(v.ms) }])),
    }
    rows.push(row)
    console.log(`${String(target).padStart(5)} containers (${row.containers} placed), ${String(attempts).padStart(4)} attempts: measure ${row.measureMs} ms, arrange ${row.arrangeMs} ms (2×: ${row.arrange2xMs}), explored ${row.explored}, violations ${violations}`)
  }
}

const env = {
  date: new Date().toISOString(),
  node: process.version,
  v8: process.versions.v8,
  platform: `${os.type()} ${os.release()} ${os.arch()}`,
  cpu: os.cpus()[0]?.model ?? 'unknown',
  cores: os.cpus().length,
  memoryGB: +(os.totalmem() / 1073741824).toFixed(1),
  gcExposed: !!gc,
  peakRssMB: MB(process.resourceUsage().maxRSS * 1024),
}
writeFileSync(join(OUT, 'benchmarks.json'), JSON.stringify({ env, rows }, null, 2))

const at = (attempts: number) => rows.filter((r) => r.attempts === attempts)
const md: string[] = []
md.push('# Benchmarks — Spatial Layout Negotiator α.v2', '')
md.push(`Measured ${env.date} on ${env.cpu} (${env.cores} cores, ${env.memoryGB} GB), ${env.platform}, Node ${env.node} (V8 ${env.v8}). Timings are medians of 3–7 runs after a warm-up run. Heap figures are the retained heap of one measured tree (offers and saved plans) and of one placed tree, from keeping three of each alive after forced GC (gc exposed: ${env.gcExposed}). Peak RSS of the whole benchmark process: ${env.peakRssMB} MB. SVG generation is not included.`, '')
md.push('Synthetic hierarchies (seed 1): campuses of 1–4 buildings, buildings of 1–4 rooms, rooms of 0–4 shelves with 4–18 books and 0–9 loose files, grouped into nested areas of 2–5 children. "Containers" counts areas, campuses, buildings, rooms (including files rooms) and shelves; books and tables are not containers.', '')
md.push('## Both passes, default Area budget (100 attempts)', '')
md.push('| target | containers | books | measure ms | arrange ms (1×) | arrange ms (2×) | total ms | measured heap MB | saved plans KB | placed heap MB | explored | retained | infeasible | violations |')
md.push('|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
for (const r of at(100)) md.push(`| ${r.target} | ${r.containers} | ${r.books} | ${r.measureMs} | ${r.arrangeMs} | ${r.arrange2xMs} | ${r.totalMs} | ${r.measuredHeapMB} | ${r.planKB} | ${r.placedHeapMB} | ${r.explored} | ${r.retained} | ${r.infeasible} | ${r.violations} |`)
md.push('', '## Space utilization at minimum size (100 attempts)', '')
md.push('Share of each container\'s area occupied by its children, summed over all containers of that kind. The rest is the container\'s own space: boundaries, separators, streets, courtyards, corridors, aisles and entrance zones. "Room furniture" is the physical footprint of shelves, tables and desks.', '')
md.push('| target | area → children | campus → buildings | building → rooms | room → furniture envelopes | room → furniture | rooms % of root |')
md.push('|---:|---:|---:|---:|---:|---:|---:|')
for (const r of at(100)) md.push(`| ${r.target} | ${r.fill.area ?? '–'} | ${r.fill.campus ?? '–'} | ${r.fill.building ?? '–'} | ${r.fill.room ?? '–'} | ${r.fill['room furniture'] ?? '–'} | ${r.roomShare} |`)
md.push('', '## Area search budget: 10 vs 100 vs 1,000 attempts', '')
md.push('| target | attempts | measure ms | of which Area designer ms | explored | retained | root min size m | root min area m² | rooms % of root | violations |')
md.push('|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|')
for (const r of rows) md.push(`| ${r.target} | ${r.attempts} | ${r.measureMs} | ${r.areaMs} | ${r.explored} | ${r.retained} | ${r.rootW} × ${r.rootD} | ${Math.round(r.rootW * r.rootD)} | ${r.roomShare} | ${r.violations} |`)
const big = rows.find((r) => r.target === 1000 && r.attempts === 100)!
md.push('', '## Where the measuring time goes (1,000 containers, 100 attempts, last run)', '')
md.push('| designer | containers | own measure ms | candidates explored | offers retained | retained per container |')
md.push('|---|---:|---:|---:|---:|---:|')
for (const [k, v] of Object.entries(big.byKind)) md.push(`| ${k} | ${v!.containers} | ${v!.ms} | ${v!.explored} | ${v!.retained} | ${(v!.retained / v!.containers).toFixed(1)} |`)
writeFileSync(join(OUT, 'benchmarks.md'), md.join('\n') + '\n')
console.log('wrote results/benchmarks.json and results/benchmarks.md')
