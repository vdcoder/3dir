// End-to-end checks of navigation, picking and explorer/world sync in a real browser.
// Requires a build (npm run build). Usage: node tests/e2e/interactions.cjs
const { chromium } = require('playwright')
const { spawn } = require('node:child_process')
const { join } = require('node:path')
const net = require('node:net')

const freePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)) })
})
const timer = setTimeout(() => { console.error('interaction tests timed out'); process.exit(1) }, 600_000)
const ONEDRIVE = 'C:\\Users\\Amanda\\OneDrive - Alder & Finch'
const CHROME_DEEP = 'C:\\Program Files\\Google\\Chrome\\Application'

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
    await page.waitForFunction(() => window.__appReady === true, null, { timeout: 120_000 })
    const state = () => page.evaluate(() => {
      const { useStore, fs } = window.__3dir
      const s = useStore.getState()
      const p = (id) => (id ? fs.path(id) : null)
      return {
        linked: s.linked, ex: p(s.explorer.location), exSel: p(s.explorer.selectedId), loc: p(s.world.location), wSel: p(s.world.selectedId),
        nonce: s.world.frameNonce, back: s.world.back.length, hud: document.querySelector('.world-crumbs .where')?.textContent,
      }
    })
    const act = (fn, ...args) => page.evaluate(([f, a]) => {
      const { useStore, fs } = window.__3dir
      const id = (p) => fs.resolve(p).id
      return new Function('s', 'id', 'a', f)(useStore.getState(), id, a)
    }, [fn, args])
    const settle = (ms = 2500) => page.waitForTimeout(ms)
    const exact = (name) => new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')
    const row = (name) => page.locator('.list-row').filter({ has: page.locator('.name span', { hasText: exact(name) }) }).first()
    const tree = (name) => page.locator('.tree-row').filter({ has: page.locator('.label', { hasText: exact(name) }) }).first()
    const hud = (name) => page.locator('.world-buttons').getByRole('button', { name })

    // 0. First-visit guide; a pin goes straight to its destination.
    check('guide shows on first visit', await page.getByRole('region', { name: 'How to use 3dir' }).isVisible())
    await page.getByRole('button', { name: 'Got it' }).click()
    await page.locator('.wl-pin', { hasText: 'FY2027 Budget' }).click()
    let s = await state()
    check('pin click goes to the pinned folder', s.loc.endsWith('Budgets\\FY2027') && s.ex.endsWith('Budgets\\FY2027'), JSON.stringify(s))
    await hud('Overview').click()

    // 1. Tree / list (linked).
    await tree('Users').click()
    s = await state()
    check('tree open moves both views', s.ex === 'C:\\Users' && s.loc === 'C:\\Users', JSON.stringify(s))
    const before = s.nonce
    await row('Amanda').click()
    s = await state()
    check('list select highlights in world, camera stays', s.wSel === 'C:\\Users\\Amanda' && s.nonce === before, JSON.stringify(s))
    await row('Amanda').dblclick()
    s = await state()
    check('double-click opens folder in both views', s.ex === 'C:\\Users\\Amanda' && s.loc === 'C:\\Users\\Amanda', JSON.stringify(s))

    // 2. Selecting in the world never navigates.
    await act("s.worldEnter(id(a[0] + '\\\\Finance\\\\Budgets'))", ONEDRIVE)
    await settle()
    const backBefore = (await state()).back
    await page.locator('.wl-fixture', { hasText: 'FY2027' }).first().click()
    s = await state()
    check('world click selects the folder in both views', (s.wSel ?? '').endsWith('Budgets\\FY2027') && (s.exSel ?? '').endsWith('Budgets\\FY2027'), JSON.stringify(s))
    check('world click does not move either view or history', s.loc.endsWith('Finance\\Budgets') && s.ex.endsWith('Finance\\Budgets') && s.back === backBefore, JSON.stringify(s))

    // 3. Picking: a binder inside its shelf, not the shelf.
    const binderPick = await page.evaluate(() => {
      const { useStore, fs, screenOf, pickAt } = window.__3dir
      const fy = fs.resolve('C:\\Users\\Amanda\\OneDrive - Alder & Finch\\Finance\\Budgets\\FY2027')
      const file = fs.children(fy.id).find((c) => c.type === 'file')
      const p = screenOf(file.id)
      void useStore
      return { want: file.id, got: p && p.onScreen ? pickAt(p.x, p.y)?.nodeId : 'off-screen' }
    })
    check('clicking a binder picks the binder, not its shelf', binderPick.got === binderPick.want, JSON.stringify(binderPick))

    // 4. Up is canonical; Back/Forward are history.
    await hud('↑ Up').click()
    s = await state()
    check('Up goes to the canonical parent', s.loc === `${ONEDRIVE}\\Finance` && s.wSel === `${ONEDRIVE}\\Finance\\Budgets`, JSON.stringify(s))
    await hud('↑ Up').click()
    await page.getByRole('button', { name: 'World back' }).click()
    s = await state()
    check('Back returns to the previous place', s.loc === `${ONEDRIVE}\\Finance`, s.loc)
    await page.getByRole('button', { name: 'World forward' }).click()
    s = await state()
    check('Forward goes forward again', s.loc === ONEDRIVE, s.loc)

    // 5. Box-worlds: the deep Chrome folder is reachable; double-click a box opens it.
    await act("s.goTo(id(a[0]))", CHROME_DEEP)
    await settle(3500)
    s = await state()
    check('deep folder found by search', s.wSel === CHROME_DEEP, JSON.stringify(s))
    // The version folder sits as a closed box on the Application compartment: find it on screen.
    const boxShot = await page.evaluate(() => {
      const { screenOf, pickAt, fs, useStore } = window.__3dir
      const loc = useStore.getState().world.location
      const walk = (id, out) => { for (const c of fs.children(id)) { if (c.type === 'folder') { out.push(c.id); walk(c.id, out) } } return out }
      for (const id of walk(loc, [])) {
        const p = screenOf(id)
        if (!p || !p.onScreen) continue
        const hit = pickAt(p.x, p.y)
        if (hit && hit.level === 'box' && hit.nodeId === id) return { id, x: p.x, y: p.y, path: fs.path(id) }
      }
      return null
    })
    check('a closed box is visible and pickable', !!boxShot, 'no box found')
    if (boxShot) {
      await page.mouse.dblclick(boxShot.x, boxShot.y)
      await settle(3000)
      s = await state()
      check('double-click on a box opens a box-world rooted at it', s.loc === boxShot.path && /Inside a box/.test(s.hud ?? ''), JSON.stringify(s))
      await hud('↑ Up').click()
      await settle(3000)
      s = await state()
      check('Up leaves the box-world to its canonical parent', s.loc === boxShot.path.split('\\').slice(0, -1).join('\\') && s.wSel === boxShot.path, JSON.stringify(s))
      await page.getByRole('button', { name: 'World back' }).click()
      await settle(3000)
      s = await state()
      check('Back re-enters the box-world', s.loc === boxShot.path && /Inside a box/.test(s.hud ?? ''), JSON.stringify(s))
    }

    // 6. Linked OFF: independent views; Show in World still works.
    await hud('Overview').click()
    await page.getByRole('switch', { name: /Linked navigation/ }).click()
    await tree('Windows').click()
    s = await state()
    check('unlinked: world stays put', s.loc === 'C:\\' && s.ex === 'C:\\Windows', JSON.stringify(s))
    await row('System32').click()
    await page.getByRole('button', { name: 'Show in World' }).click()
    s = await state()
    check('Show in World reveals the folder inside its parent', s.loc === 'C:\\Windows' && s.wSel === 'C:\\Windows\\System32', JSON.stringify(s))
    await page.getByRole('switch', { name: /Linked navigation/ }).click()

    // 7. Search goes to a deep file.
    await page.getByPlaceholder('Search files and folders').fill('Oakridge master services')
    await page.locator('.result').first().click()
    s = await state()
    check('search reveals the file in both views', (s.exSel ?? '').endsWith('Master Services Agreement - Oakridge Hotels.pdf') && (s.wSel ?? '').endsWith('Master Services Agreement - Oakridge Hotels.pdf'), JSON.stringify(s))

    // 8. Out-of-view selection: no camera move, an edge indicator instead.
    await settle()
    const nonceBefore = (await state()).nonce
    await act("const al = id(a[0]); s.explorerSelect(window.__3dir.fs.children(al)[0].id)", 'C:\\Users\\Amanda\\Pictures\\Travel\\2026 Kyoto')
    const visible = (want) => page.waitForFunction((w) => (getComputedStyle(document.querySelector('.offscreen')).display !== 'none') === w, want, { timeout: 30_000 }).then(() => true, () => false)
    s = await state()
    check('out-of-view selection keeps the camera', s.nonce === nonceBefore, JSON.stringify(s))
    check('off-screen indicator appears', await visible(true))
    await page.locator('.offscreen').click()
    s = await state()
    check('indicator shows the item in the world', s.loc.endsWith('Travel\\2026 Kyoto'), s.loc)
    check('indicator hides once the item is in view', await visible(false))

    await hud('Overview').click()
    s = await state()
    check('Overview returns to C:\\', s.loc === 'C:\\', s.loc)
    check('no page errors', errors.length === 0, errors.join('\n'))
  } finally {
    await browser.close()
    server.kill()
    clearTimeout(timer)
  }
  if (failures.length) { console.error(`${failures.length} failed`); process.exitCode = 1 } else console.log('all interaction checks passed')
})()
