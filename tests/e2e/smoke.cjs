// Smoke test: build must already exist (npm run build). Serves dist/ under
// BASE_PATH (default /), opens it in headless Chromium and fails on console
// errors, failed requests, a missing canvas or an app that never gets ready.
const { chromium } = require('playwright')
const { spawn } = require('node:child_process')
const { join } = require('node:path')

const net = require('node:net')

const base = process.env.BASE_PATH ?? '/'
const timer = setTimeout(() => { console.error('smoke test timed out'); process.exit(1) }, 90_000)

// A fresh free port each run, so a leftover server can never answer instead.
const freePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)) })
})

;(async () => {
  const port = await freePort()
  const vite = join(__dirname, '../../node_modules/vite/bin/vite.js')
  const server = spawn(process.execPath, [vite, 'preview', '--port', String(port), '--strictPort', '--base', base], { stdio: 'ignore' })
  let browser
  try {
    await new Promise((r) => setTimeout(r, 2500))
    browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('requestfailed', (r) => errors.push('request failed: ' + r.url()))
    const loaded = { glb: 0, webp: 0 }
    page.on('response', (r) => {
      if (r.status() >= 400) errors.push(r.status() + ' ' + r.url())
      else if (r.url().endsWith('.glb')) loaded.glb++
      else if (r.url().endsWith('.webp')) loaded.webp++
    })
    await page.goto(`http://localhost:${port}${base}`)
    await page.waitForSelector('canvas', { timeout: 20_000 })
    await page.waitForFunction(() => window.__appReady === true, null, { timeout: 45_000 })
    // Every prop model and gallery thumbnail must load from the deploy base path.
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
    if (loaded.glb < 19) errors.push(`only ${loaded.glb} GLB models loaded`)
    if (loaded.webp < 40) errors.push(`only ${loaded.webp} images loaded`)
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT })
    if (errors.length) throw new Error('browser errors:\n' + errors.join('\n'))
    console.log(`smoke ok (${base}): ${loaded.glb} models, ${loaded.webp} images`)
  } finally {
    await browser?.close()
    server.kill()
    clearTimeout(timer)
  }
})().catch((e) => { console.error(e.message); process.exitCode = 1 })
