// End-to-end checks of explorer/world synchronization in a real browser.
// Requires a build (npm run build). Usage: node tests/e2e/interactions.cjs
const { chromium } = require('playwright')
const { spawn } = require('node:child_process')
const { join } = require('node:path')
const net = require('node:net')

const freePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)) })
})
const timer = setTimeout(() => { console.error('interaction tests timed out'); process.exit(1) }, 240_000)

;(async () => {
  const port = await freePort()
  const server = spawn(process.execPath, [join(__dirname, '../../node_modules/vite/bin/vite.js'), 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const failures = []
  const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' ' + detail}`); if (!ok) failures.push(name) }
  try {
    await new Promise((r) => setTimeout(r, 2000))
    const page = await browser.newPage({ viewport: { width: 1500, height: 900 } })
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(`http://localhost:${port}/`)
    await page.waitForFunction(() => window.__appReady === true, null, { timeout: 60_000 })
    const state = () => page.evaluate(() => {
      const s = window.__3dir.useStore.getState()
      const p = (id) => (id ? window.__3dir.fs.path(id) : null)
      return { linked: s.linked, exFolder: p(s.explorer.folderId), exSel: p(s.explorer.selectedId), focus: p(s.world.focusId), wSel: p(s.world.selectedId), nonce: s.world.frameNonce, details: p(s.detailsId) }
    })
    const row = (name) => page.locator('.list-row', { hasText: name }).first()
    const tree = (name) => page.locator('.tree-row', { hasText: name }).first()

    // 1. Opening a folder in the tree moves the world (linked).
    await tree('Users').click()
    let s = await state()
    check('tree open sets explorer folder', s.exFolder === 'C:\\Users', s.exFolder)
    check('linked: world follows explorer open', s.focus === 'C:\\Users', s.focus)

    // 2. Selecting in the list highlights in the world without moving the camera.
    const before = s.nonce
    await row('Amanda').click()
    s = await state()
    check('list select sets world selection', s.wSel === 'C:\\Users\\Amanda', s.wSel)
    check('list select does not move camera', s.nonce === before, `${before} -> ${s.nonce}`)
    check('details card shows selection', await page.locator('[data-testid=details] h2', { hasText: 'Amanda' }).count() === 1)

    // 3. Double-click opens the folder in both views.
    await row('Amanda').dblclick()
    s = await state()
    check('double-click opens folder', s.exFolder === 'C:\\Users\\Amanda' && s.focus === 'C:\\Users\\Amanda', JSON.stringify(s))

    // 4. Linked OFF: views are independent.
    await page.getByRole('switch', { name: /Linked navigation/ }).click()
    s = await state()
    check('linked toggles off', s.linked === false)
    await tree('Windows').click()
    s = await state()
    check('unlinked: world stays put', s.focus === 'C:\\Users\\Amanda', s.focus)
    await row('System32').click()
    s = await state()
    check('unlinked: world selection unchanged', s.wSel !== 'C:\\Windows\\System32', s.wSel)

    // 5. Show in World still works when unlinked.
    await page.getByRole('button', { name: 'Show in World' }).click()
    s = await state()
    check('Show in World moves world', s.focus === 'C:\\Windows\\System32' && s.wSel === 'C:\\Windows\\System32', JSON.stringify(s))

    // 6. Search goes to a deep file in both views.
    await page.getByRole('switch', { name: /Linked navigation/ }).click()
    await page.getByPlaceholder('Search files and folders').fill('Oakridge master services')
    await page.locator('.result').first().click()
    s = await state()
    check('search selects file in explorer', (s.exSel ?? '').endsWith('Master Services Agreement - Oakridge Hotels.pdf'), s.exSel)
    check('search frames file in world', (s.wSel ?? '').endsWith('Master Services Agreement - Oakridge Hotels.pdf'), s.wSel)

    // 7. Clicking the world selects an object and syncs the explorer.
    await page.evaluate(() => window.__3dir.useStore.getState().worldEnter(window.__3dir.fs.resolve('C:\\Users\\Amanda\\OneDrive - Alder & Finch\\Finance\\Budgets').id))
    await page.waitForTimeout(2500)
    const label = page.locator('.wl-fixture', { hasText: 'FY2027' }).first()
    await label.click()
    s = await state()
    check('world click selects folder', (s.wSel ?? '').endsWith('Budgets\\FY2027'), s.wSel)
    check('world select shows it in explorer', (s.exSel ?? '').endsWith('Budgets\\FY2027') && s.exFolder.endsWith('Finance\\Budgets'), JSON.stringify(s))

    // 8. Up and Overview in the world HUD.
    await page.getByRole('button', { name: '↑ Up' }).click()
    s = await state()
    check('world Up goes to parent', s.focus.endsWith('Alder & Finch\\Finance'), s.focus)
    await page.getByRole('button', { name: 'Overview' }).click()
    s = await state()
    check('Overview returns to C:\\', s.focus === 'C:\\', s.focus)

    check('no page errors', errors.length === 0, errors.join('\n'))
  } finally {
    await browser.close()
    server.kill()
    clearTimeout(timer)
  }
  if (failures.length) { console.error(`${failures.length} failed`); process.exitCode = 1 } else console.log('all interaction checks passed')
})()
