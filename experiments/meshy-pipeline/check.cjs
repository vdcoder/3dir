// Loads the viewer in headless Chromium, waits for the GLB, records stats,
// console errors and screenshots. Usage: node check.mjs <url> <outDir>
const { chromium } = require('playwright')
const { mkdirSync } = require('node:fs')

;(async () => {
const [url = 'http://localhost:4173/', out = 'shots', tag = 'view'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))
page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`))
await page.goto(url)
await page.waitForFunction(() => window.__modelStats, null, { timeout: 60000 })
await page.waitForTimeout(2500)
const stats = await page.evaluate(() => window.__modelStats)
await page.screenshot({ path: `${out}/${tag}-front.png` })
// Orbit to a second angle by dragging.
const box = { x: 640, y: 430 }
await page.mouse.move(box.x, box.y)
await page.mouse.down()
await page.mouse.move(box.x - 260, box.y - 40, { steps: 20 })
await page.mouse.up()
await page.waitForTimeout(1200)
await page.screenshot({ path: `${out}/${tag}-orbit.png` })
console.log(JSON.stringify({ stats, errors }, null, 2))
await browser.close()
})()
