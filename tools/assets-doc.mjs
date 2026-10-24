#!/usr/bin/env node
// Regenerates the "Assets" section of docs/ASSETS.md from assets-src/meshy/assets.jsonl.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const rows = readFileSync(join(ROOT, 'assets-src/meshy/assets.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l))

const USE = {
  'library-pavilion': 'Pipeline test only (not in the app)',
  fountain: 'Business plaza landmark', 'clock-tower': 'Business district landmark',
  'tree-round': 'Trees across the map', 'tree-cypress': 'Avenues and parkland', bench: 'Plazas, gallery',
  'lamp-post': 'Streets and plaza', planter: 'Business entrances', 'desk-office': 'Business rooms',
  'plant-pot': 'Interiors', 'table-boardroom': 'Board room', vault: 'Contracts archive',
  van: 'Operations yard', forklift: 'Operations yard', 'easel-board': 'Board and Strategy rooms',
  workbench: 'Studio project rooms', 'drafting-table': 'Studio project rooms', 'sculpture-rings': 'Gallery landmark',
  mailbox: 'Home district front doors', 'server-cabinet': 'Windows & Programs rooms',
}

const models = rows.filter((r) => r.type === 'model' || r.refine_task_id || r.type === 'text-to-3d')
const concepts = rows.filter((r) => r.type === 'concept')
const images = rows.filter((r) => r.type === 'image')
const sum = (rs) => rs.reduce((s, r) => s + (r.credits_used ?? 0), 0)

const modelTable = [
  '| Asset | Made from | Tier / model | Credits | Used for |',
  '| --- | --- | --- | --- | --- |',
  ...models.map((r) => {
    const tier = r.type === 'model' ? `${r.tier} / ${r.settings.ai_model}` : 'text-to-3D / meshy-7.1'
    const src = r.type === 'model' ? `concept \`${r.concept}\`` : 'text prompt'
    return `| \`${r.name}.glb\` | ${src} | ${tier} | ${r.credits_used} | ${USE[r.name] ?? ''} |`
  }),
].join('\n')

const section = `## Assets

### 3D models (${models.length}, ${sum(models)} credits)

${modelTable}

### Concept images (${concepts.length}, ${sum(concepts)} credits)

${concepts.map((c) => c.name).join(', ')}. Stored in \`assets-src/meshy/concepts/\`.

### Gallery photographs (${images.length}, ${sum(images)} credits)

Generated with text-to-image (nano-banana) from each picture's own description in the fictional dataset,
for the four albums the demo uses most: Travel\\2026 Kyoto, Travel\\2025 Lisbon, Family\\Elena Graduation 2026
and Garden. Full size (1024 px WebP) in \`public/photos/\`, wall thumbnails (320 px) in \`public/photos/thumbs/\`.
Other albums show a soft gradient made from the picture's palette. No people are real; prompts describe
generic people only.

### Totals

All logged operations: ${sum(rows)} credits (${rows.length} operations). Run \`npm run meshy -- budget\` for the
stage-2 total measured from the real account balance.
`

const p = join(ROOT, 'docs/ASSETS.md')
const doc = readFileSync(p, 'utf8')
writeFileSync(p, doc.slice(0, doc.indexOf('## Assets')) + section)
console.log(`ASSETS.md: ${models.length} models, ${concepts.length} concepts, ${images.length} images, ${sum(rows)} credits logged`)
