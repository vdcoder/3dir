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

const AMM = 'C:\\Users\\Amanda\\Documents\\Business\\AmandaMedicalMiami'
const settle = (page, ms = 2500) => page.waitForTimeout(ms)
// Select a file, by path, the way a person would: clicking it in the world.
const clickInWorld = (path) => async (page) => {
  const p = await page.evaluate((x) => window.__3dir.screenOf(window.__3dir.fs.resolve(x).id), path)
  if (p && p.onScreen) await page.mouse.click(p.x, p.y)
  await settle(page)
}
const SCENARIOS = {
  // Milestone C states.
  'c-selected': async (page) => {
    await go(`${AMM}\\Finance\\Budgets`)(page)
    await settle(page)
    const file = await page.evaluate((x) => { const { fs } = window.__3dir; const f = fs.children(fs.resolve(x).id).find((c) => c.type === 'file'); return fs.path(f.id) }, `${AMM}\\Finance\\Budgets\\2027 draft`)
    await clickInWorld(file)(page)
  },
  'c-reveal': async (page) => {
    await go(`${AMM}\\Finance\\Budgets`)(page)
    await settle(page)
    await page.keyboard.down('Alt')
    await settle(page, 4000)
  },
  'c-hover-box': async (page) => {
    await go(`${AMM}\\Clients\\Biscayne Senior Living\\Orders\\2026\\Q3`, 'goTo')(page)
    await settle(page, 4000)
    const p = await page.evaluate((x) => window.__3dir.screenOf(window.__3dir.fs.resolve(x).id), `${AMM}\\Clients\\Biscayne Senior Living\\Orders\\2026\\Q3`)
    if (p && p.onScreen) await page.mouse.move(p.x, p.y)
    await settle(page)
  },
  'c-in-box': async (page) => {
    await go(`${AMM}\\Clients\\Biscayne Senior Living\\Orders\\2026\\Q3`)(page)
    await settle(page)
  },
  'c-unlinked': async (page) => {
    await go(`${AMM}\\Legal`)(page)
    await page.getByRole('switch', { name: /Linked navigation/ }).click()
    await page.evaluate(() => { const { fs, useStore } = window.__3dir; useStore.getState().explorerOpen(fs.resolve('C:\\Users\\Amanda\\Pictures').id) })
    await settle(page)
  },
  'first-visit': async () => {},
  overview: async () => {},
  amanda: go('C:\\Users\\Amanda'),
  documents: go('C:\\Users\\Amanda\\Documents'),
  'amm-campus': go(AMM),
  'amm-finance': go(`${AMM}\\Finance`),
  'amm-clients': go(`${AMM}\\Clients`),
  'amm-box': go(`${AMM}\\Clients\\Biscayne Senior Living\\Orders\\2026\\Q3`),
  'amm-deep': go(`${AMM}\\Clients\\Biscayne Senior Living\\Orders\\2026\\Q3\\Delivery confirmations`),
  'chrome-box': go('C:\\Program Files\\Google\\Chrome\\Application\\155.0.7610.88'),
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
      if (name !== 'first-visit') await page.getByRole('button', { name: 'Got it' }).click().catch(() => {})
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
