// Captures screenshots of key app states from a production build.
// Usage: node tests/e2e/shots.cjs <outDir> [scenario ...]
// Scenarios drive the app through window.__3dir (store + filesystem index).
const { chromium } = require('playwright')
const { spawn } = require('node:child_process')
const { join } = require('node:path')
const { mkdirSync } = require('node:fs')
const net = require('node:net')

const out = process.argv[2] ?? 'docs/progress/latest'
const only = process.argv.slice(3)
mkdirSync(out, { recursive: true })

const ONEDRIVE = 'C:\\Users\\Amanda\\OneDrive - Alder & Finch'
const go = (path, how = 'worldEnter') => async (page) => {
  await page.evaluate(([p, h]) => {
    const { fs, useStore } = window.__3dir
    const n = fs.resolve(p)
    if (!n) throw new Error('missing ' + p)
    useStore.getState()[h](n.id)
  }, [path, how])
  await page.waitForTimeout(2200)
}

const SCENARIOS = {
  overview: async () => {},
  business: go(ONEDRIVE),
  finance: go(`${ONEDRIVE}\\Finance`),
  budgets: go(`${ONEDRIVE}\\Finance\\Budgets`),
  'budget-file': go(`${ONEDRIVE}\\Finance\\Budgets\\FY2027\\FY2027 Operating Budget - DRAFT v3.xlsx`, 'goTo'),
  contracts: go(`${ONEDRIVE}\\Contracts`),
  board: go(`${ONEDRIVE}\\Board`),
  operations: go(`${ONEDRIVE}\\Operations`),
  'q3-report': go(`${ONEDRIVE}\\Finance\\Reports\\Quarterly\\2026 Q3\\Q3 2026 Board Report.pdf`, 'goTo'),
  studio: go('C:\\Users\\Amanda\\Projects'),
  'kyoto-photo': go('C:\\Users\\Amanda\\Pictures\\Travel\\2026 Kyoto\\Fushimi Inari gates at dawn.jpg', 'goTo'),
  gallery: go('C:\\Users\\Amanda\\Pictures'),
  users: go('C:\\Users'),
  system: go('C:\\Windows'),
}

const freePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)) })
})

;(async () => {
  const port = await freePort()
  const server = spawn(process.execPath, [join(__dirname, '../../node_modules/vite/bin/vite.js'), 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  try {
    await new Promise((r) => setTimeout(r, 2000))
    const errors = []
    for (const [name, run] of Object.entries(SCENARIOS)) {
      if (only.length && !only.includes(name)) continue
      // A fresh browser per scenario: software WebGL doesn't release contexts reliably.
      const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
      const page = await browser.newPage({ viewport: { width: 1600, height: 960 } })
      page.on('pageerror', (e) => errors.push(`${name}: ${e}`))
      page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`))
      await page.goto(`http://localhost:${port}/`)
      await page.waitForFunction(() => window.__appReady === true, null, { timeout: 150_000 })
      await page.waitForTimeout(1500)
      try { await run(page) } catch (e) { errors.push(`${name}: ${e.message}`) }
      await page.screenshot({ path: join(out, `${name}.png`), timeout: 120_000 })
      await browser.close()
      console.log('shot', name)
    }
    if (errors.length) console.log('ERRORS\n' + errors.join('\n'))
  } finally {
    server.kill()
  }
})()
