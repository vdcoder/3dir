// α.v2 vs α.v3 on identical datasets and seeds.  Usage: node --expose-gc src/v3/compare.ts
// Writes results/v3-comparison.{json,md}. α.v2 is measured at its minimum size (its most compact
// state, no external enlargement); α.v3 at the only size it has.

import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAX_ROOM_WIDTH } from '../config.ts'
import { arrangeAt, createContext, layout } from '../engine.ts'
import type { AreaNode, LayoutNode, RoomNode } from '../model.ts'
import { compactest } from '../offers.ts'
import { rng } from '../rng.ts'
import { demoHierarchy, extremeRoom, shelfOfLength, syntheticHierarchy, withLongShelves } from '../synth.ts'
import { validate } from '../validate.ts'
import { layoutMetrics } from './metrics.ts'
import type { LayoutMetrics } from './metrics.ts'
import { validateV3 } from './validate.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', '..', 'results')
mkdirSync(OUT, { recursive: true })
const gc = (globalThis as { gc?: () => void }).gc
const heap = () => { for (let i = 0; i < 4; i++) gc?.(); return process.memoryUsage().heapUsed }
/** Retained heap per tree: keep three alive; a negative difference is collector noise and reads as 0. */
const MB = (bytes: number) => r2(Math.max(0, bytes) / 3 / 1048576)
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const r2 = (v: number) => +v.toFixed(2)
type Version = 'v2' | 'v3'
const VERSIONS: Version[] = ['v2', 'v3']

/** The demo with one ≈1,000 m folder added to the AmandaMedicalMiami › Finance › Budgets room. */
function demoWithLongFolder(): AreaNode {
  const d = demoHierarchy()
  const visit = (n: LayoutNode): RoomNode | null => {
    if (n.kind === 'room') return n.name === 'Budgets' && n.path.includes('AmandaMedicalMiami') ? n : null
    const kids: LayoutNode[] = n.kind === 'area' ? n.children : n.kind === 'campus' ? n.buildings : n.kind === 'building' ? n.rooms : []
    for (const k of kids) { const f = visit(k); if (f) return f }
    return null
  }
  const room = visit(d)!
  room.shelves.push(shelfOfLength(room.path, 'Scans 1998-2026', 1000, rng(5)))
  return d
}

interface Dataset { id: string; label: string; size: string; seeds: number[]; root: LayoutNode; runs: number }
const DATASETS: Dataset[] = [
  { id: 'demo', label: 'Demo hierarchy', size: 'small', seeds: [1, 2, 3, 4, 5], root: demoHierarchy(), runs: 7 },
  { id: 'synth100', label: 'Synthetic ~100', size: 'small', seeds: [1, 2, 3, 4, 5], root: syntheticHierarchy(100, 1).root, runs: 7 },
  { id: 'synth1000', label: 'Synthetic ~1,000', size: 'medium', seeds: [1, 2, 3, 4, 5], root: syntheticHierarchy(1000, 1).root, runs: 5 },
  { id: 'synth5000', label: 'Synthetic ~5,000', size: 'large', seeds: [1], root: syntheticHierarchy(5000, 1).root, runs: 3 },
  { id: 'demo-long', label: 'Demo + one ≈1,000 m folder', size: 'extreme', seeds: [1, 2, 3, 4, 5], root: demoWithLongFolder(), runs: 5 },
  { id: 'synth1000-long', label: 'Synthetic ~1,000, 3% of folders 10–400 m', size: 'extreme', seeds: [1, 2, 3, 4, 5], root: withLongShelves(syntheticHierarchy(1000, 1).root, 0.03, [10, 400], 1), runs: 5 },
  { id: 'extreme-room', label: 'The extreme room alone (≈1,000 m + 40 folders + 600 files)', size: 'extreme', seeds: [1], root: extremeRoom(), runs: 5 },
]

interface Run { seed: number; metrics: LayoutMetrics; violations: number; explored: number; retained: number; infeasible: number }
interface Perf { measureMs: number; arrangeMs: number; planKB: number; placedHeapMB: number }
interface Row { dataset: string; label: string; size: string; version: Version; runs: Run[]; perf: Perf; error?: string }

const rows: Row[] = []
for (const ds of DATASETS) for (const version of VERSIONS) {
  const runs: Run[] = []
  let error: string | undefined
  try {
    for (const seed of ds.seeds) {
      const r = layout(ds.root, { version, seed })
      const v = version === 'v2' ? validate(r.placed, 0.2) : validateV3(r.placed, r.ctx.cfg)
      runs.push({ seed, metrics: layoutMetrics(r.placed, r.ctx.cfg), violations: v.length, explored: r.ctx.stats.explored, retained: r.ctx.stats.retained, infeasible: r.ctx.stats.infeasible })
    }
    // Timing: seed 1, a warm-up, then the median of `runs` runs.
    const m: number[] = [], a: number[] = []
    for (let i = -1; i < ds.runs; i++) {
      gc?.()
      const ctx = createContext({ version, seed: 1 })
      const t0 = performance.now()
      const meas = ctx.measure(ds.root)
      const t1 = performance.now()
      const o = compactest(meas.offers)
      arrangeAt(meas, o, ctx, { w: o.w, d: o.d })
      const t2 = performance.now()
      if (i >= 0) { m.push(t1 - t0); a.push(t2 - t1) }
    }
    // Memory: the saved plans the arrange pass reuses (serialized, input tree excluded), and the
    // retained heap of placed trees (three kept alive, after forced GC).
    const planKB = Math.round(JSON.stringify(createContext({ version, seed: 1 }).measure(ds.root), (k, v) => (k === 'node' ? undefined : v)).length / 1024)
    const keepP: unknown[] = []
    const h1 = heap()
    for (let i = 0; i < 3; i++) keepP.push(layout(ds.root, { version, seed: 1 }).placed)
    const h2 = heap()
    void keepP.length
    rows.push({ dataset: ds.id, label: ds.label, size: ds.size, version, runs, perf: { measureMs: r2(median(m)), arrangeMs: r2(median(a)), planKB, placedHeapMB: MB(h2 - h1) } })
  } catch (e) {
    error = (e as Error).message
    rows.push({ dataset: ds.id, label: ds.label, size: ds.size, version, runs, perf: { measureMs: NaN, arrangeMs: NaN, planKB: NaN, placedHeapMB: NaN }, error })
  }
  const last = rows[rows.length - 1]
  console.log(`${ds.id.padEnd(15)} ${version}: ${error ? 'ERROR ' + error : `measure ${last.perf.measureMs} ms, arrange ${last.perf.arrangeMs} ms, violations ${runs.reduce((s, r) => s + r.violations, 0)}`}`)
}

const env = { date: new Date().toISOString(), node: process.version, cpu: os.cpus()[0]?.model ?? 'unknown', cores: os.cpus().length, memoryGB: +(os.totalmem() / 1073741824).toFixed(1), platform: `${os.type()} ${os.release()} ${os.arch()}`, gcExposed: !!gc }
writeFileSync(join(OUT, 'v3-comparison.json'), JSON.stringify({ env, maxRoomWidth: MAX_ROOM_WIDTH, rows }, null, 2))

// ---------- Markdown ----------
const meanOf = (row: Row, f: (m: LayoutMetrics) => number) => row.runs.reduce((s, r) => s + f(r.metrics), 0) / Math.max(1, row.runs.length)
const get = (ds: string, v: Version) => rows.find((r) => r.dataset === ds && r.version === v)!
const n0 = (v: number) => Math.round(v).toLocaleString('en-US')
const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`
const pair = (ds: string, f: (row: Row) => string) => `${f(get(ds, 'v2'))} / ${f(get(ds, 'v3'))}`
const md: string[] = []
md.push('# α.v2 vs α.v3 — same datasets, same seeds', '')
md.push(`Measured ${env.date} on ${env.cpu} (${env.cores} cores, ${env.memoryGB} GB), ${env.platform}, Node ${env.node}. α.v2 is laid out at its minimum size (its most compact state; no external enlargement, uniform sampling, 20% absorption). α.v3 is laid out at the only size it has (balanced sampling, MAX_ROOM_WIDTH ${MAX_ROOM_WIDTH} m). Geometry: mean over the seeds listed; timings: seed 1, median of 3–7 runs after a warm-up; memory: serialized size of the saved plans (offers and their recipes, input tree excluded) and retained heap of one placed tree (three kept alive, forced GC: ${env.gcExposed}). Timings on this shared VM vary by about ±20% between runs.`, '')
md.push('Each cell shows **α.v2 / α.v3**.', '')
md.push('## 1. Validity', '')
md.push('| dataset | size | seeds | layouts | validator failures | containers (books excluded) |')
md.push('|---|---|---:|---:|---|---|')
for (const ds of DATASETS) md.push(`| ${ds.label} | ${ds.size} | ${ds.seeds.length} | ${ds.seeds.length * 2} | ${pair(ds.id, (r) => r.error ? 'error' : String(r.runs.reduce((s, x) => s + x.violations, 0)))} | ${pair(ds.id, (r) => n0(Object.entries(r.runs[0]?.metrics.containers ?? {}).filter(([k]) => k !== 'table').reduce((s, [, v]) => s + v, 0)))} |`)
md.push('', '## 2. Performance (seed 1)', '')
md.push('| dataset | measure ms | arrange ms | candidates explored | offers retained | saved plans KB | placed tree heap MB |')
md.push('|---|---|---|---|---|---|---|')
for (const ds of DATASETS) md.push(`| ${ds.label} | ${pair(ds.id, (r) => String(r.perf.measureMs))} | ${pair(ds.id, (r) => String(r.perf.arrangeMs))} | ${pair(ds.id, (r) => n0(r.runs[0]?.explored ?? NaN))} | ${pair(ds.id, (r) => n0(r.runs[0]?.retained ?? NaN))} | ${pair(ds.id, (r) => n0(r.perf.planKB))} | ${pair(ds.id, (r) => String(r.perf.placedHeapMB))} |`)
md.push('', '## 3. World size and rooms', '')
md.push('| dataset | root area m² | rooms % of root | mean room m² | room imbalance (mean \\|ln w/d\\|) | rooms beyond 3 : 1 | worst room ratio | widest room m | rooms wider than MAX |')
md.push('|---|---|---|---|---|---|---|---|---|')
for (const ds of DATASETS) md.push(`| ${ds.label} | ${pair(ds.id, (r) => n0(meanOf(r, (m) => m.rootArea)))} | ${pair(ds.id, (r) => pct(meanOf(r, (m) => m.roomsShare)))} | ${pair(ds.id, (r) => meanOf(r, (m) => m.meanRoomArea).toFixed(1))} | ${pair(ds.id, (r) => meanOf(r, (m) => m.roomImbalance).toFixed(2))} | ${pair(ds.id, (r) => pct(meanOf(r, (m) => m.roomBeyond3), 0))} | ${pair(ds.id, (r) => meanOf(r, (m) => m.roomWorst).toFixed(1))} | ${pair(ds.id, (r) => meanOf(r, (m) => m.roomMaxW).toFixed(1))} | ${pair(ds.id, (r) => meanOf(r, (m) => m.roomsOverMax).toFixed(1))} |`)
md.push('', '## 4. Floor use', '')
md.push('*Unused floor*: floor that is neither a child, furniture, a feature zone, nor the designed minimum of a band (aisle, clearance, wall, corridor, street, path, courtyard, plaza, boundary, entrance); open floor without a purpose (α.v3 row ends, open circulation, lobbies, campus grounds; α.v2 widened bands and table envelopes) is unused. Area packing gaps are listed separately (both versions pack areas the same way).', '')
md.push('| dataset | unused, % of root | unused in rooms, % of room floor | unused per room m² | unused in buildings m² | unused in campuses m² | area own space, % of root | furniture density |')
md.push('|---|---|---|---|---|---|---|---|')
for (const ds of DATASETS) md.push(`| ${ds.label} | ${pair(ds.id, (r) => pct(meanOf(r, (m) => m.unused.share)))} | ${pair(ds.id, (r) => pct(meanOf(r, (m) => m.unused.roomShare)))} | ${pair(ds.id, (r) => meanOf(r, (m) => m.unused.perRoom).toFixed(1))} | ${pair(ds.id, (r) => n0(meanOf(r, (m) => m.unused.building)))} | ${pair(ds.id, (r) => n0(meanOf(r, (m) => m.unused.campus)))} | ${pair(ds.id, (r) => pct(meanOf(r, (m) => m.areaOwnShare)))} | ${pair(ds.id, (r) => pct(meanOf(r, (m) => m.furnitureDensity)))} |`)
md.push('', '## 5. Shelves, segments and room features', '')
md.push('| dataset | shelf fill (books / fixture length) | shelf-row occupancy | physical shelves | segments (stacks) | rooms grown by their building | room features | feature types (α.v3) |')
md.push('|---|---|---|---|---|---|---|---|')
for (const ds of DATASETS) {
  const v3 = get(ds.id, 'v3')
  const types: Record<string, number> = {}
  for (const r of v3.runs) for (const [k, n] of Object.entries(r.metrics.featureTypes)) types[k] = (types[k] ?? 0) + n / v3.runs.length
  md.push(`| ${ds.label} | ${pair(ds.id, (r) => pct(meanOf(r, (m) => m.shelfFill)))} | ${pair(ds.id, (r) => pct(meanOf(r, (m) => m.rowOccupancy)))} | ${pair(ds.id, (r) => n0(meanOf(r, (m) => m.shelves)))} | ${pair(ds.id, (r) => `${n0(meanOf(r, (m) => m.segments))} (${n0(meanOf(r, (m) => m.stacks))})`)} | ${pair(ds.id, (r) => `${n0(meanOf(r, (m) => m.grownRooms))} of ${n0(meanOf(r, (m) => m.rooms))}`)} | ${pair(ds.id, (r) => meanOf(r, (m) => m.features).toFixed(1))} | ${Object.entries(types).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n.toFixed(1)}`).join(', ') || '–'} |`)
}
md.push('', '## 6. Extreme shelf lengths', '')
md.push('| dataset | root size m (seed 1) | widest room m | deepest room m | measure ms | arrange ms |')
md.push('|---|---|---|---|---|---|')
for (const ds of DATASETS.filter((d) => d.size === 'extreme')) {
  const f = (r: Row) => r.runs[0] ? `${r.runs[0].metrics.rootW.toFixed(1)} × ${r.runs[0].metrics.rootD.toFixed(1)}` : 'error'
  md.push(`| ${ds.label} | ${pair(ds.id, f)} | ${pair(ds.id, (r) => meanOf(r, (m) => m.roomMaxW).toFixed(1))} | ${pair(ds.id, (r) => r.runs[0] ? '' + deepest(r) : '–')} | ${pair(ds.id, (r) => String(r.perf.measureMs))} | ${pair(ds.id, (r) => String(r.perf.arrangeMs))} |`)
}
function deepest(r: Row): string { return r.runs[0].metrics.roomMaxD.toFixed(1) }
writeFileSync(join(OUT, 'v3-comparison.md'), md.join('\n') + '\n')
console.log('wrote results/v3-comparison.{json,md}')
