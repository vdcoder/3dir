#!/usr/bin/env node
// Meshy text-to-3D helper with a hard credit cap.
//
// The API key is never handled here: the cloud environment's network proxy
// injects the Authorization header for api.meshy.ai.
//
//   node tools/meshy.mjs balance
//   node tools/meshy.mjs generate --name <slug> --prompt "<text>" \
//        [--texture-prompt "<text>"] [--polycount 30000] --max-credits 30
//
// generate = preview (mesh, 20 credits on meshy-7.1) + refine (2K texture,
// 10 credits). It refuses to start if the planned cost exceeds --max-credits,
// stops before texturing if the preview cost more than expected, then
// downloads the GLB to assets-src/meshy/<slug>.raw.glb, writes an optimized
// copy to public/assets/<slug>.glb and appends an entry to the asset log.

import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://api.meshy.ai/openapi'
const COST = { preview: 20, refine: 10 } // meshy-7.1, standard geometry, 2K texture
const AI_MODEL = 'meshy-7.1'

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

async function waitForTask(id, label) {
  for (;;) {
    const t = await api(`/v2/text-to-3d/${id}`)
    process.stdout.write(`\r${label}: ${t.status} ${t.progress ?? 0}%   `)
    if (['SUCCEEDED', 'FAILED', 'CANCELED'].includes(t.status)) {
      process.stdout.write('\n')
      if (t.status !== 'SUCCEEDED') throw new Error(`${label} ${t.status}: ${t.task_error?.message}`)
      return t
    }
    await new Promise((r) => setTimeout(r, 10_000))
  }
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1], i++
  }
  return out
}

async function generate(a) {
  const max = Number(a['max-credits'])
  if (!a.name || !a.prompt || !max) throw new Error('need --name, --prompt and --max-credits')
  if (!/^[a-z0-9-]+$/.test(a.name)) throw new Error('--name must be a lowercase slug')
  const planned = COST.preview + COST.refine
  if (planned > max) throw new Error(`planned cost ${planned} exceeds --max-credits ${max}`)

  const start = await balance()
  console.log(`balance ${start}, planned ${planned} credits`)
  if (start < planned) throw new Error('not enough credits')

  const preview = await api('/v2/text-to-3d', {
    mode: 'preview',
    prompt: a.prompt,
    ai_model: AI_MODEL,
    geometry_resolution: 'standard',
    should_remesh: true,
    topology: 'triangle',
    target_polycount: Number(a.polycount ?? 30000),
    target_formats: ['glb'],
  })
  const p = await waitForTask(preview.result, 'preview')
  if (p.consumed_credits > COST.preview) {
    throw new Error(`preview cost ${p.consumed_credits}, expected ${COST.preview}; stopping before texture`)
  }

  const refine = await api('/v2/text-to-3d', {
    mode: 'refine',
    preview_task_id: preview.result,
    enable_pbr: true,
    texture_resolution: '2k',
    ...(a['texture-prompt'] ? { texture_prompt: a['texture-prompt'] } : {}),
    target_formats: ['glb'],
  })
  const r = await waitForTask(refine.result, 'refine')

  const rawPath = join(ROOT, 'assets-src/meshy', `${a.name}.raw.glb`)
  const outPath = join(ROOT, 'public/assets', `${a.name}.glb`)
  mkdirSync(dirname(rawPath), { recursive: true })
  mkdirSync(dirname(outPath), { recursive: true })
  const glb = await fetch(r.model_urls.glb)
  if (!glb.ok) throw new Error(`GLB download failed: ${glb.status}`)
  writeFileSync(rawPath, Buffer.from(await glb.arrayBuffer()))
  execFileSync('npx', ['-y', '@gltf-transform/cli@4', 'optimize', rawPath, outPath,
    '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '2048'], { stdio: 'inherit' })

  const end = await balance()
  const used = start - end
  const entry = {
    name: a.name,
    date: new Date().toISOString(),
    provider: 'Meshy',
    ai_model: AI_MODEL,
    preview_task_id: preview.result,
    refine_task_id: refine.result,
    credits_used: used,
    prompt: a.prompt,
    texture_prompt: a['texture-prompt'] ?? null,
  }
  const logPath = join(ROOT, 'assets-src/meshy/assets.jsonl')
  if (!existsSync(logPath)) writeFileSync(logPath, '')
  appendFileSync(logPath, JSON.stringify(entry) + '\n')
  console.log(`done: ${outPath} (${used} credits used, balance ${end})`)
}

const [cmd, ...rest] = process.argv.slice(2)
try {
  if (cmd === 'balance') console.log(await balance())
  else if (cmd === 'generate') await generate(parseArgs(rest))
  else console.log('usage: node tools/meshy.mjs balance | generate --name --prompt --max-credits [...]')
} catch (e) {
  console.error(String(e.message ?? e))
  process.exit(1)
}
