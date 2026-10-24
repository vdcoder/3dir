#!/usr/bin/env node
// Meshy asset tooling with hard credit caps. Run through `npm run meshy -- ...`
// (sets NODE_USE_ENV_PROXY=1 so the cloud proxy can inject the API key; the key
// is never handled here).
//
//   balance                         current credit balance
//   budget                          credits logged since the stage-2 start
//   concept  --name <slug> --prompt "<text>" [--aspect 1:1] [--keep-bg]
//            text-to-image (nano-banana, 3 credits) -> assets-src/meshy/concepts/<slug>.png
//   model    --name <slug> --concept <slug> [--tier prop|hero] [--polycount N]
//            [--texture-size 1024] --max-credits N
//            image-to-3d from a concept: prop = meshy-t2.5 smart topology (15),
//            hero = meshy-7.1 with PBR maps (30)
//   generate --name <slug> --prompt "<text>" --max-credits 30
//            text-to-3d preview + 2K refine (meshy-7.1, 30)
//   image    --name <slug> --prompt "<text>" [--aspect 4:3] [--out public/photos]
//            text-to-image for in-app pictures (3 credits) -> <out>/<slug>.webp
//
// Every paid call is appended to assets-src/meshy/assets.jsonl with its credits.

import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://api.meshy.ai/openapi'
const LOG = join(ROOT, 'assets-src/meshy/assets.jsonl')
const CONCEPTS = join(ROOT, 'assets-src/meshy/concepts')
const STAGE2_START = '2026-10-24T00:30:00Z'
const STAGE2_START_BALANCE = 3290
// List prices (credits). Logged per operation; the stage total comes from the real balance.
const PRICE = { concept: 3, image: 3, prop: 15, hero: 30, textTo3d: 30 }
const STYLE =
  'Isolated single object on a plain white background, three-quarter view from slightly above. ' +
  'Stylized miniature architectural scale-model style: clean simplified forms, soft matte painted materials, ' +
  'gentle bevels, warm natural palette, crisp readable silhouette, no text, no people, no ground plane.'

async function api(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text}`)
  return JSON.parse(text)
}

const balance = async () => (await api('/v1/balance')).balance

async function wait(path, label) {
  for (;;) {
    const t = await api(path)
    process.stdout.write(`\r${label}: ${t.status} ${t.progress ?? 0}%   `)
    if (['SUCCEEDED', 'FAILED', 'CANCELED'].includes(t.status)) {
      process.stdout.write('\n')
      if (t.status !== 'SUCCEEDED') throw new Error(`${label} ${t.status}: ${t.task_error?.message}`)
      return t
    }
    await new Promise((r) => setTimeout(r, 6_000))
  }
}

function args(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue
    const k = argv[i].slice(2)
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) out[k] = true
    else { out[k] = v; i++ }
  }
  return out
}

const slug = (s) => { if (!/^[a-z0-9-]+$/.test(s ?? '')) throw new Error('--name must be a lowercase slug'); return s }
const log = (entry) => { mkdirSync(dirname(LOG), { recursive: true }); appendFileSync(LOG, JSON.stringify({ date: new Date().toISOString(), ...entry }) + '\n') }
const entries = () => (existsSync(LOG) ? readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [])

async function download(url, path) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download failed ${r.status}`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, Buffer.from(await r.arrayBuffer()))
}

function optimize(raw, out, textureSize) {
  mkdirSync(dirname(out), { recursive: true })
  execFileSync('npx', ['-y', '@gltf-transform/cli@4', 'optimize', raw, out,
    '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', String(textureSize)], { stdio: 'inherit' })
}

async function concept(a) {
  const name = slug(a.name)
  if (!a.prompt) throw new Error('need --prompt')
  const body = {
    ai_model: 'nano-banana',
    prompt: `${a.prompt}. ${a.raw ? '' : STYLE}`.trim(),
    aspect_ratio: a.aspect ?? '1:1',
    remove_background: !a['keep-bg'],
  }
  const { result } = await api('/v1/text-to-image', body)
  const t = await wait(`/v1/text-to-image/${result}`, `concept ${name}`)
  await download(t.image_urls[0], join(CONCEPTS, `${name}.png`))
  const used = PRICE.concept
  log({ type: 'concept', name, task_id: result, credits_used: used, prompt: body.prompt })
  writeFileSync(join(CONCEPTS, `${name}.json`), JSON.stringify({ task_id: result, prompt: body.prompt }, null, 2))
  console.log(`concept ${name}: ${used} credits -> assets-src/meshy/concepts/${name}.png`)
}

async function image(a) {
  const name = slug(a.name)
  const outDir = join(ROOT, a.out ?? 'public/photos')
  const body = { ai_model: 'nano-banana', prompt: a.prompt, aspect_ratio: a.aspect ?? '4:3' }
  const { result } = await api('/v1/text-to-image', body)
  const t = await wait(`/v1/text-to-image/${result}`, `image ${name}`)
  const raw = join(ROOT, 'assets-src/meshy/images', `${name}.png`)
  await download(t.image_urls[0], raw)
  mkdirSync(outDir, { recursive: true })
  execFileSync('python3', ['-I', '-c', `
from PIL import Image
im = Image.open(${JSON.stringify(raw)}).convert('RGB')
im.thumbnail((1024, 1024))
im.save(${JSON.stringify(join(outDir, name + '.webp'))}, 'WEBP', quality=82)
`], { stdio: 'inherit' })
  const used = PRICE.image
  log({ type: 'image', name, task_id: result, credits_used: used, prompt: body.prompt })
  console.log(`image ${name}: ${used} credits`)
}

async function model(a) {
  const name = slug(a.name)
  const tier = a.tier ?? 'prop'
  const cost = tier === 'hero' ? PRICE.hero : PRICE.prop
  const max = Number(a['max-credits'])
  if (!max || cost > max) throw new Error(`model costs ${cost}; pass --max-credits >= ${cost}`)
  const c = JSON.parse(readFileSync(join(CONCEPTS, `${slug(a.concept)}.json`), 'utf8'))
  const body = tier === 'hero'
    ? { input_task_id: c.task_id, ai_model: 'meshy-7.1', should_texture: true, enable_pbr: true, texture_resolution: '2k', should_remesh: true, topology: 'triangle', target_polycount: Number(a.polycount ?? 30000), target_formats: ['glb'] }
    : { input_task_id: c.task_id, model_type: 'smart-topology', ai_model: 'meshy-t2.5', should_texture: true, enable_pbr: false, texture_resolution: '2k', target_polycount: Number(a.polycount ?? 8000), target_formats: ['glb'] }
  if ((await balance()) < cost) throw new Error('not enough credits')
  const { result } = await api('/v1/image-to-3d', body)
  const t = await wait(`/v1/image-to-3d/${result}`, `model ${name}`)
  const raw = join(ROOT, 'assets-src/meshy', `${name}.raw.glb`)
  await download(t.model_urls.glb, raw)
  optimize(raw, join(ROOT, 'public/assets', `${name}.glb`), a['texture-size'] ?? (tier === 'hero' ? 1024 : 512))
  const used = t.consumed_credits ?? cost
  log({ type: 'model', name, tier, concept: a.concept, task_id: result, credits_used: used, settings: body })
  console.log(`model ${name}: ${used} credits -> public/assets/${name}.glb`)
}

async function generate(a) {
  const name = slug(a.name)
  const max = Number(a['max-credits'])
  if (!a.prompt || !max || max < 30) throw new Error('need --prompt and --max-credits >= 30')
  const start = await balance()
  const preview = await api('/v2/text-to-3d', { mode: 'preview', prompt: a.prompt, ai_model: 'meshy-7.1', geometry_resolution: 'standard', should_remesh: true, topology: 'triangle', target_polycount: Number(a.polycount ?? 30000), target_formats: ['glb'] })
  const p = await wait(`/v2/text-to-3d/${preview.result}`, 'preview')
  if (p.consumed_credits > 20) throw new Error(`preview cost ${p.consumed_credits}; stopping before texture`)
  const refine = await api('/v2/text-to-3d', { mode: 'refine', preview_task_id: preview.result, enable_pbr: true, texture_resolution: '2k', ...(a['texture-prompt'] ? { texture_prompt: a['texture-prompt'] } : {}), target_formats: ['glb'] })
  const r = await wait(`/v2/text-to-3d/${refine.result}`, 'refine')
  const raw = join(ROOT, 'assets-src/meshy', `${name}.raw.glb`)
  await download(r.model_urls.glb, raw)
  optimize(raw, join(ROOT, 'public/assets', `${name}.glb`), a['texture-size'] ?? 1024)
  const used = start - (await balance())
  log({ type: 'text-to-3d', name, preview_task_id: preview.result, refine_task_id: refine.result, credits_used: used, prompt: a.prompt })
  console.log(`done: ${name} (${used} credits)`)
}

async function budget() {
  const stage = entries().filter((e) => e.date >= STAGE2_START)
  const logged = stage.reduce((s, e) => s + (e.credits_used ?? 0), 0)
  const now = await balance()
  console.log(`stage 2: ${STAGE2_START_BALANCE - now} credits used of 900 by balance (${logged} logged over ${stage.length} operations); balance ${now}`)
}

const [cmd, ...rest] = process.argv.slice(2)
const a = args(rest)
try {
  if (cmd === 'balance') console.log(await balance())
  else if (cmd === 'budget') await budget()
  else if (cmd === 'concept') await concept(a)
  else if (cmd === 'image') await image(a)
  else if (cmd === 'model') await model(a)
  else if (cmd === 'generate') await generate(a)
  else console.log('usage: balance | budget | concept | image | model | generate (see header)')
} catch (e) {
  console.error(String(e.message ?? e))
  process.exit(1)
}
