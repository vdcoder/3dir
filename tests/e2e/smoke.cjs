// Smoke test: build must already exist (npm run build). Serves dist/, opens it
// in headless Chromium, fails on console/page errors or a missing canvas.
const { chromium } = require('playwright')
const { spawn } = require('node:child_process')

;(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { stdio: 'ignore' })
  try {
    await new Promise((r) => setTimeout(r, 2500))
    const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
    const page = await browser.newPage()
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto('http://localhost:4174/')
    await page.waitForSelector('canvas', { timeout: 20000 })
    await page.waitForTimeout(1000)
    await browser.close()
    if (errors.length) throw new Error('browser errors:\n' + errors.join('\n'))
    console.log('smoke ok')
  } finally {
    server.kill()
  }
})().catch((e) => { console.error(e.message); process.exitCode = 1 })
