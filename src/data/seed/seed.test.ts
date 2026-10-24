import { describe, expect, it } from 'vitest'
import { buildIndex } from '../../model/fs'
import type { FileNode, FsNode } from '../../model/types'
import { compile } from '../compile'
import { DEMO_PATHS, DEMO_USER, STORY_NOW, dataset, seedRoot } from './index'

const fs = buildIndex(dataset)
const HOME = 'C:\\Users\\Amanda'
const ONEDRIVE = `${HOME}\\OneDrive - Alder & Finch`
const BUSINESS = `${HOME}\\Documents\\Business`
const AMM = DEMO_PATHS.amm

const files = dataset.nodes.filter((n): n is FileNode => n.type === 'file')
const folders = dataset.nodes.filter((n) => n.type === 'folder')
const pathOf = (n: FsNode) => fs.path(n.id)
/** Strict descendants of a folder path. */
const under = (prefix: string) => {
  const p = `${prefix.toLowerCase()}\\`
  return dataset.nodes.filter((n) => pathOf(n).toLowerCase().startsWith(p))
}
const filesUnder = (prefix: string) => under(prefix).filter((n): n is FileNode => n.type === 'file')
const fileAt = (path: string): FileNode => {
  const n = fs.resolve(path)
  if (!n || n.type !== 'file') throw new Error(`no file at ${path}`)
  return n
}

const KEY_FILES = DEMO_PATHS
const KYOTO_ALBUM = DEMO_PATHS.kyotoAlbum

describe('synthetic computer', () => {
  it('is clearly labelled fictional and has a single C: root', () => {
    expect(dataset.label).toMatch(/fictional/i)
    expect(fs.roots().map((r) => r.name)).toEqual(['C:'])
    expect(fs.path(fs.roots()[0].id)).toBe('C:\\')
    expect(fs.resolve(`C:\\Users\\${DEMO_USER}`)?.type).toBe('folder')
  })

  it('compiles deterministically', () => {
    // Generated photos are linked after compiling; compare without them.
    const strip = (d: typeof dataset) => JSON.parse(JSON.stringify(d).replace(/,"src":"photos\/[^"]+"/g, ''))
    expect(strip(compile(dataset.label, seedRoot))).toEqual(strip(dataset))
    expect(compile(dataset.label, seedRoot)).toEqual(compile(dataset.label, seedRoot))
  })

  it('resolves the required structure', () => {
    const required = [
      'C:\\Windows\\System32\\drivers\\etc\\hosts',
      'C:\\Windows\\System32\\config',
      'C:\\Windows\\Fonts',
      'C:\\Windows\\Web\\Wallpaper',
      'C:\\Windows\\Temp',
      'C:\\Windows\\Logs',
      'C:\\Windows\\Boot',
      'C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Mozilla Firefox',
      'C:\\Program Files\\7-Zip',
      'C:\\Program Files\\Adobe\\Acrobat DC',
      'C:\\Program Files\\Windows Defender',
      'C:\\Program Files\\Common Files',
      'C:\\Program Files (x86)',
      'C:\\ProgramData',
      ...['Desktop', 'Documents', 'Downloads', 'Music', 'Videos', 'Pictures', 'Projects', 'OneDrive - Alder & Finch'].map((d) => `${HOME}\\${d}`),
      ...['Victor', 'Elena', 'Guest', 'Public'].map((u) => `C:\\Users\\${u}`),
      ...['FY2025', 'FY2026', 'FY2027'].map((y) => `${ONEDRIVE}\\Finance\\Budgets\\${y}`),
      `${ONEDRIVE}\\Finance\\Budgets\\FY2027\\FY2027 Operating Budget - DRAFT v1.xlsx`,
      `${ONEDRIVE}\\Finance\\Budgets\\FY2027\\FY2027 Operating Budget - DRAFT v2.xlsx`,
      `${ONEDRIVE}\\Finance\\Budgets\\FY2027\\Capex requests.xlsx`,
      ...['Base case.xlsx', 'Upside case.xlsx', 'Downside case.xlsx'].map((s) => `${ONEDRIVE}\\Finance\\Forecasts\\Scenarios\\${s}`),
      ...['2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4', '2026 Q1', '2026 Q2', '2026 Q3'].map((q) => `${ONEDRIVE}\\Finance\\Reports\\Quarterly\\${q}`),
      `${ONEDRIVE}\\Finance\\Reports\\Annual\\2024`,
      `${ONEDRIVE}\\Finance\\Reports\\Annual\\2025`,
      ...['Audits', 'Tax', 'Payroll', 'Invoices\\Receivable', 'Invoices\\Payable'].map((d) => `${ONEDRIVE}\\Finance\\${d}`),
      ...['Clients', 'Vendors', 'Leases', 'NDAs', 'Templates'].map((d) => `${ONEDRIVE}\\Contracts\\${d}`),
      ...['Logistics', 'Facilities', 'Inventory', 'Suppliers', 'Team'].map((d) => `${ONEDRIVE}\\Operations\\${d}`),
      ...['2026-01 January', '2026-04 April', '2026-07 July', '2026-10 October'].map((m) => `${ONEDRIVE}\\Board\\2026 Meetings\\${m}`),
      `${ONEDRIVE}\\Strategy\\Market Research`,
      `${ONEDRIVE}\\Strategy\\Competitor notes.docx`,
      `${ONEDRIVE}\\Strategy\\Expansion - Second Showroom.docx`,
      ...['Personal Finance\\Taxes\\2024', 'Personal Finance\\Taxes\\2025', 'Personal Finance\\Mortgage', 'Personal Finance\\Insurance',
        'Medical', 'Recipes', 'Letters', 'Travel Plans', 'Home', 'Elena - University'].map((d) => `${HOME}\\Documents\\${d}`),
      ...['Garden Planner App\\src\\components', 'Garden Planner App\\public', 'Garden Planner App\\design', 'Garden Planner App\\package.json',
        'Kitchen Renovation\\Quotes', 'Kitchen Renovation\\Plans', 'Kitchen Renovation\\Inspiration', 'Kitchen Renovation\\Progress Photos',
        'Novel - The Lantern Keeper\\Chapters', 'Novel - The Lantern Keeper\\Notes', 'Novel - The Lantern Keeper\\Drafts',
        'Walnut Bench (woodworking)\\Cut list.xlsx', 'Archive'].map((d) => `${HOME}\\Projects\\${d}`),
      ...['Camera Roll', 'Screenshots', 'Travel\\2025 Lisbon', 'Travel\\2026 Kyoto', 'Family\\Elena Graduation 2026', 'Family\\Holidays 2025',
        'Garden', 'Home'].map((d) => `${HOME}\\Pictures\\${d}`),
      ...['Public Documents', 'Public Pictures', 'Public Downloads'].map((d) => `C:\\Users\\Public\\${d}`),
      ...Object.values(KEY_FILES),
    ]
    expect(required.filter((p) => !fs.resolve(p))).toEqual([])
  })

  it('has exactly the six top-level OneDrive folders', () => {
    const top = fs.children(fs.resolve(ONEDRIVE)!.id).map((n) => `${n.type}:${n.name}`)
    expect(top).toEqual(['Board', 'Contracts', 'Finance', 'Operations', 'Shared with me', 'Strategy'].map((n) => `folder:${n}`))
  })

  it('is broad and deep enough, with the bulk in the flagship district', () => {
    const count = (p: string) => filesUnder(p).length
    const report = {
      folders: folders.length,
      files: files.length,
      windows: count('C:\\Windows'),
      programFiles: count('C:\\Program Files'),
      onedrive: count(ONEDRIVE),
      // Household paperwork; the Business folder is counted on its own.
      documents: count(`${HOME}\\Documents`) - count(BUSINESS),
      business: count(BUSINESS),
      projects: count(`${HOME}\\Projects`),
      pictures: filesUnder(`${HOME}\\Pictures`).filter((f) => f.kind === 'image').length,
      otherUsers: ['Victor', 'Elena', 'Guest', 'Public'].reduce((s, u) => s + count(`C:\\Users\\${u}`), 0),
    }
    const ranges: Record<keyof typeof report, [number, number]> = {
      folders: [300, 420], files: [950, 1250], windows: [50, 90], programFiles: [40, 70], onedrive: [250, 350],
      documents: [50, 80], business: [170, 260], projects: [60, 100], pictures: [60, 90], otherUsers: [40, 70],
    }
    const outOfRange = Object.entries(report).filter(([k, v]) => {
      const [lo, hi] = ranges[k as keyof typeof report]
      return v < lo || v > hi
    })
    expect(outOfRange, JSON.stringify(report)).toEqual([])
    // Deep enough to make promoting nested destinations meaningful.
    expect(Math.max(...dataset.nodes.map((n) => fs.ancestry(n.id).length))).toBeGreaterThanOrEqual(9)
  })

  it('gives the demo files the right previews', () => {
    const format = (p: string) => fileAt(p).preview?.format
    expect(format(KEY_FILES.budgetDraft)).toBe('table')
    expect(format(KEY_FILES.q3PL)).toBe('table')
    expect(format(KEY_FILES.cashFlow)).toBe('table')
    expect(format(KEY_FILES.revenueForecast)).toBe('table')
    expect(format(KEY_FILES.kitchenBudget)).toBe('table')
    for (const p of [KEY_FILES.boardReport, KEY_FILES.oakridgeMsa, KEY_FILES.kyotoItinerary, KEY_FILES.todo, KEY_FILES.octoberDeck,
      KEY_FILES.plan2027, KEY_FILES.budgetAssumptions, KEY_FILES.gardenApp]) {
      expect(format(p), p).toBe('text')
    }
    const budget = fileAt(KEY_FILES.budgetDraft)
    expect(budget.modified.slice(0, 10)).toBe('2026-10-21')
    expect(budget.preview?.format === 'table' && budget.preview.columns).toEqual(['Line / Department', 'FY2026 Forecast', 'FY2027 Budget', 'Change', 'Change %'])
  })

  it('has a Kyoto album of 12-16 photos dated during the trip', () => {
    const photos = fs.children(fs.resolve(KYOTO_ALBUM)!.id)
    expect(photos.length).toBeGreaterThanOrEqual(12)
    expect(photos.length).toBeLessThanOrEqual(16)
    for (const p of photos) {
      expect(p.type === 'file' && p.kind).toBe('image')
      expect(p.modified >= '2026-04-03' && p.modified < '2026-04-12', p.name).toBe(true)
    }
  })

  it('gives every personal image a vivid description and palette', () => {
    const images = filesUnder('C:\\Users').filter((f) => f.kind === 'image')
    const bad = images.filter((f) => {
      const p = f.preview
      return !p || p.format !== 'image' || p.description.length < 40 || !/[.!]$/.test(p.description)
        || !p.palette || p.palette.length < 3 || p.palette.length > 5 || !p.palette.every((c) => /^#[0-9a-f]{6}$/i.test(c))
    })
    expect(bad.map(pathOf)).toEqual([])
  })

  it('keeps previews lightweight and well-formed', () => {
    const bad: string[] = []
    for (const f of files) {
      const p = f.preview
      if (!p) continue
      const where = pathOf(f)
      if (/lorem|ipsum/i.test(JSON.stringify(p))) bad.push(`${where}: placeholder text`)
      if (p.format === 'text') {
        const lines = p.text.split('\n').length
        if (lines < 2 || lines > 8) bad.push(`${where}: ${lines} lines`)
      } else if (p.format === 'table') {
        if (p.columns.length < 3 || p.columns.length > 6) bad.push(`${where}: ${p.columns.length} columns`)
        if (p.rows.length < 1 || p.rows.length > 12) bad.push(`${where}: ${p.rows.length} rows`)
        if (p.rows.some((r) => r.length !== p.columns.length)) bad.push(`${where}: ragged rows`)
      }
    }
    expect(bad).toEqual([])
  })

  it('has coherent dates: nothing after the story’s now, created ≤ modified, children after parents', () => {
    // compile() derives a missing date by adding whole days and then picking a
    // working hour, so a derived date can land a few hours before its anchor on
    // the same day. Tolerate that; anything larger is an authoring mistake.
    const SLACK = 24 * 3_600_000
    const t = (s: string) => Date.parse(s)
    const byId = new Map(dataset.nodes.map((n) => [n.id, n]))
    const bad: string[] = []
    for (const n of dataset.nodes) {
      const where = pathOf(n)
      if (Number.isNaN(t(n.created)) || Number.isNaN(t(n.modified))) bad.push(`${where}: unparseable date`)
      if (n.modified > STORY_NOW || n.created > STORY_NOW) bad.push(`${where}: after now (${n.created} / ${n.modified})`)
      if (t(n.created) - t(n.modified) > SLACK) bad.push(`${where}: created ${n.created} after modified ${n.modified}`)
      const parent = n.parentId ? byId.get(n.parentId) : undefined
      if (parent && t(parent.created) - t(n.created) > SLACK) bad.push(`${where}: created ${n.created} before its folder (${parent.created})`)
    }
    expect(bad).toEqual([])
  })

  it('keeps everything from July 2026 on strictly in date order (no slack needed)', () => {
    // Everything from Q3 2026 onward is authored with explicit dates.
    const recent = dataset.nodes.filter((n) => n.modified >= '2026-07-01')
    const bad = recent.filter((n) => n.created > n.modified).map(pathOf)
    expect(bad).toEqual([])
  })

  it('uses names that are valid on Windows', () => {
    const bad = dataset.nodes.filter((n) => n.parentId !== null && (/[<>:"/\\|?*]/.test(n.name) || /[. ]$/.test(n.name) || n.name.trim() !== n.name))
    expect(bad.map(pathOf)).toEqual([])
  })
})

describe('Amanda Medical Miami (Documents\\Business\\AmandaMedicalMiami)', () => {
  const at = (rel: string) => `${AMM}\\${rel}`
  const KEY = {
    budget: DEMO_PATHS.ammBudget,
    budgetVsActual: at('Finance\\Budgets\\2026\\Budget vs actual - Sep 2026.xlsx'),
    q3PL: at('Finance\\Reports\\Q3 2026 P&L.xlsx'),
    trend: at('Finance\\Reports\\Quarterly trend 2025-2026.xlsx'),
    cash: at('Finance\\Bank & Cards\\Cash position Oct 2026.xlsx'),
    arAging: at('Finance\\Invoices\\Receivable\\AR aging - 23 Oct 2026.xlsx'),
    payroll: at('Finance\\Payroll\\2026\\Payroll summary 2026-09.xlsx'),
    stockCount: at('Operations\\Inventory\\Stock counts\\2026\\Stock count - 2026-09-30.xlsx'),
    vanLog: at('Operations\\Fleet & Deliveries\\Van maintenance log 2026.xlsx'),
    operatingAgreement: at('Legal\\LLC & Ownership\\Operating agreement - summary.xlsx'),
    clientList: at('Clients\\Client list 2026.xlsx'),
    bslOrders: at('Clients\\Biscayne Senior Living\\Orders\\2026\\BSL order summary 2026.xlsx'),
  }
  const DOCS = [
    at('Company overview 2026.pdf'),
    at('Owners meeting notes - Oct 2026.docx'),
    at('Finance\\Budgets\\2027 draft\\Budget 2027 assumptions.docx'),
    at('Finance\\Reports\\Q3 2026 owners report.pdf'),
    at('Legal\\Licenses & Permits\\HME license renewal 2027 - checklist.docx'),
    at('Legal\\Contracts\\Client agreements\\Master rental agreement - template v4.docx'),
    at('Operations\\Fleet & Deliveries\\Driver handbook 2026.docx'),
    `${DEMO_PATHS.ammDeep}\\DC-2026-0915 Morningside - 8 wheelchairs, 12 rollators.pdf`,
  ]

  /** A table preview as row label -> column -> cell. */
  const grid = (path: string) => {
    const p = fileAt(path).preview
    if (p?.format !== 'table') throw new Error(`${path} has no table preview`)
    return (row: string, col: string) => {
      const r = p.rows.find((x) => x[0] === row)
      const c = p.columns.indexOf(col)
      if (!r || c < 0) throw new Error(`${path}: no cell [${row}] [${col}]`)
      return r[c]
    }
  }
  /** "$12,400" -> 12400, "($12,400)" -> -12400, "1,166" -> 1166. */
  const num = (s: string) => {
    const v = Number(s.replace(/[$,()]/g, ''))
    if (s.trim() === '' || Number.isNaN(v)) throw new Error(`not a number: "${s}"`)
    return /^\(.*\)$/.test(s.trim()) ? -v : v
  }

  it('sits in Documents\\Business next to two smaller folders', () => {
    const kids = fs.children(fs.resolve(BUSINESS)!.id)
    expect(kids.map((n) => `${n.type}:${n.name}`)).toEqual(['AmandaMedicalMiami', 'Courses & Certificates', 'Side projects'].map((n) => `folder:${n}`))
    for (const k of kids.slice(1)) {
      const n = fs.children(k.id).length
      expect(n >= 3 && n <= 6, k.name).toBe(true)
    }
  })

  it('has exactly four top-level folders and at most three loose files', () => {
    const top = fs.children(fs.resolve(AMM)!.id)
    expect(top.filter((n) => n.type === 'folder').map((n) => n.name)).toEqual(['Clients', 'Finance', 'Legal', 'Operations'])
    expect(top.filter((n) => n.type === 'file').length).toBeLessThanOrEqual(3)
  })

  it('resolves its required structure', () => {
    const required = [
      ...['Budgets\\2026', 'Budgets\\2027 draft', 'Bank & Cards', 'Tax\\2025', 'Tax\\2026 estimates', 'Payroll\\2026',
        ...['Q1', 'Q2', 'Q3', 'Q4'].map((q) => `Invoices\\Receivable\\2026\\${q}`)].map((d) => `Finance\\${d}`),
      ...['Inventory\\Stock counts\\2026', 'Warehouse - Doral', 'Staff\\Schedules', 'Staff\\Training', 'Equipment servicing',
        ...['Van 1 - Flamingo', 'Van 2 - Manatee', 'Van 3 - Pelican'].map((v) => `Fleet & Deliveries\\Vans\\${v}\\Maintenance`)].map((d) => `Operations\\${d}`),
      ...['LLC & Ownership', 'Contracts\\Supplier agreements', 'Contracts\\Client agreements', 'Licenses & Permits', 'Insurance', 'Compliance'].map((d) => `Legal\\${d}`),
      ...Object.values(KEY).map((p) => p.slice(AMM.length + 1)),
    ].map(at)
    expect(required.filter((p) => !fs.resolve(p))).toEqual([])
    const suppliers = fs.children(fs.resolve(at('Operations\\Suppliers'))!.id).filter((n) => n.type === 'folder')
    expect(suppliers.length).toBeGreaterThanOrEqual(4)
    // 6-8 client organizations, each with agreements, orders and correspondence.
    const clients = fs.children(fs.resolve(at('Clients'))!.id).filter((n) => n.type === 'folder')
    expect(clients.length >= 6 && clients.length <= 8).toBe(true)
    for (const c of clients) {
      expect(fs.children(c.id).filter((n) => n.type === 'folder').map((n) => n.name), c.name).toEqual(['Agreements', 'Correspondence', 'Orders'])
    }
  })

  it('is deep, rich and well populated', () => {
    const deep = fs.resolve(DEMO_PATHS.ammDeep)
    expect(deep?.type).toBe('folder')
    expect(DEMO_PATHS.ammDeep.split('\\').length).toBeGreaterThanOrEqual(10)
    expect(fs.children(deep!.id).filter((n) => n.type === 'file').length).toBeGreaterThanOrEqual(5)
    const inside = under(AMM)
    const n = { files: inside.filter((x) => x.type === 'file').length, folders: inside.filter((x) => x.type === 'folder').length }
    expect(n.files >= 150 && n.files <= 240, JSON.stringify(n)).toBe(true)
    expect(n.folders >= 45 && n.folders <= 90, JSON.stringify(n)).toBe(true)
    // Folders go at most 11 levels below C: (their files one more).
    expect(Math.max(...inside.filter((x) => x.type === 'folder').map((x) => pathOf(x).split('\\').length - 1))).toBeLessThanOrEqual(11)
  })

  it('gives the key documents and spreadsheets previews', () => {
    for (const p of Object.values(KEY)) expect(fileAt(p).preview?.format, p).toBe('table')
    for (const p of DOCS) expect(fileAt(p).preview?.format, p).toBe('text')
    const previews = filesUnder(AMM).filter((f) => f.preview)
    expect(previews.filter((f) => f.preview!.format === 'text').length).toBeGreaterThanOrEqual(20)
    expect(previews.filter((f) => f.preview!.format === 'table').length).toBeGreaterThanOrEqual(10)
    const budget = fileAt(KEY.budget)
    expect(budget.modified.slice(0, 10)).toBe('2026-10-18')
    expect(budget.preview?.format === 'table' && budget.preview.columns).toEqual(['Line', '2026 Forecast', '2027 Budget', 'Change', 'Change %'])
  })

  it('adds up within each statement', () => {
    const plChecks = (path: string, cols: string[], labels: { payroll: string }) => {
      const g = grid(path)
      for (const c of cols) {
        const v = (r: string) => num(g(r, c))
        expect(v('Rental revenue') + v('Product sales') + v('Delivery & service fees'), `${path} ${c}`).toBe(v('Net revenue'))
        expect(v('Net revenue') + v('Cost of sales'), `${path} ${c}`).toBe(v('Gross profit'))
        expect(v(labels.payroll) + v('Warehouse & fleet') + v('Insurance, licenses & admin'), `${path} ${c}`).toBe(v('Total operating expenses'))
        expect(v('Gross profit') + v('Total operating expenses'), `${path} ${c}`).toBe(v('EBITDA'))
      }
    }
    plChecks(KEY.q3PL, ['Q3 2026', 'Q3 2025', 'YTD 2026'], { payroll: 'Payroll & benefits' })
    plChecks(KEY.budget, ['2026 Forecast', '2027 Budget', 'Change'], { payroll: 'Payroll & benefits (14 → 16 staff)' })

    const cash = grid(KEY.cash)
    for (const c of ['30 Sep 2026', '23 Oct 2026', 'Change']) {
      const parts = ['Operating checking', 'Payroll account', 'Tax reserve (savings)', 'Equipment reserve (savings)', 'Business Visa (balance due)', 'Line of credit ($250,000)']
      expect(parts.reduce((s, r) => s + num(cash(r, c)), 0), c).toBe(num(cash('Net cash', c)))
    }

    const stock = fileAt(KEY.stockCount).preview
    if (stock?.format !== 'table') throw new Error('stock count')
    const items = stock.rows.slice(0, -1)
    for (const r of items) expect(num(r[3]) + num(r[4]) + num(r[5]), r[0]).toBe(num(r[2]))
    for (const c of [2, 3, 4, 5]) expect(items.reduce((s, r) => s + num(r[c]), 0)).toBe(num(stock.rows.at(-1)![c]))

    const ar = fileAt(KEY.arAging).preview
    if (ar?.format !== 'table') throw new Error('AR aging')
    for (const r of ar.rows) expect(r.slice(1, 5).reduce((s, x) => s + num(x), 0), r[0]).toBe(num(r[5]))
    for (const c of [1, 2, 3, 4, 5]) expect(ar.rows.slice(0, -1).reduce((s, r) => s + num(r[c]), 0)).toBe(num(ar.rows.at(-1)![c]))

    const vans = fileAt(KEY.vanLog).preview
    if (vans?.format !== 'table') throw new Error('van log')
    expect(vans.rows.slice(0, -1).reduce((s, r) => s + num(r[4]), 0)).toBe(num(vans.rows.at(-1)![4]))

    const trend = grid(KEY.trend)
    for (const [year, total] of [['2025', 'FY2025'], ['2026', 'FY2026 (forecast)']]) {
      for (const c of ['Net revenue', 'EBITDA']) {
        const qs = ['Q1', 'Q2', 'Q3', year === '2026' ? 'Q4 2026 (forecast)' : 'Q4'].map((q) => (q.includes(' ') ? q : `${q} ${year}`))
        expect(qs.reduce((s, q) => s + num(trend(q, c)), 0), `${total} ${c}`).toBe(num(trend(total, c)))
      }
    }
  })

  it('keeps its numbers consistent across files', () => {
    const budget = grid(KEY.budget)
    const bva = grid(KEY.budgetVsActual)
    const pl = grid(KEY.q3PL)
    const trend = grid(KEY.trend)
    const cash = grid(KEY.cash)
    const ar = grid(KEY.arAging)
    const clients = grid(KEY.clientList)
    const bsl = grid(KEY.bslOrders)
    const payroll = grid(KEY.payroll)

    // 2026 full-year forecast
    expect(new Set([budget('Net revenue', '2026 Forecast'), bva('Net revenue', 'Full-year forecast'), trend('FY2026 (forecast)', 'Net revenue')])).toEqual(new Set(['$3,080,000']))
    expect(new Set([budget('EBITDA', '2026 Forecast'), bva('EBITDA', 'Full-year forecast'), trend('FY2026 (forecast)', 'EBITDA')])).toEqual(new Set(['$494,000']))
    // Year to date (September)
    expect(new Set([pl('Net revenue', 'YTD 2026'), bva('Net revenue', 'YTD actual (Sep)'), clients('Total (45 accounts)', '2026 YTD revenue (Sep)')])).toEqual(new Set(['$2,272,000']))
    expect(pl('EBITDA', 'YTD 2026')).toBe(bva('EBITDA', 'YTD actual (Sep)'))
    expect(pl('Total operating expenses', 'YTD 2026')).toBe(`(${bva('Total operating expenses', 'YTD actual (Sep)')})`)
    // Q3 quarters
    expect(pl('Net revenue', 'Q3 2026')).toBe(trend('Q3 2026', 'Net revenue'))
    expect(pl('Net revenue', 'Q3 2025')).toBe(trend('Q3 2025', 'Net revenue'))
    expect(pl('EBITDA', 'Q3 2026')).toBe(trend('Q3 2026', 'EBITDA'))
    // Receivables, the biggest client and headcount
    expect(cash('Accounts receivable', '23 Oct 2026')).toBe(ar('Total', 'Total'))
    expect(['Q1 2026', 'Q2 2026', 'Q3 2026'].reduce((s, q) => s + num(bsl(q, 'Total')), 0)).toBe(num(clients('Biscayne Senior Living', '2026 YTD revenue (Sep)')))
    expect(bsl('Q4 2026 (to 23 Oct)', 'Total')).toBe(ar('Biscayne Senior Living', 'Current'))
    expect(payroll('Total', 'Headcount')).toBe(bva('Staff', 'YTD actual (Sep)'))
  })

  it('holds no records about individuals', () => {
    const bad: string[] = []
    for (const n of under(BUSINESS)) {
      const blob = `${n.name} ${n.type === 'file' && n.preview ? JSON.stringify(n.preview) : ''}`
      if (/patient/i.test(blob)) bad.push(`${pathOf(n)}: mentions patients`)
      if (/\b\d{3}-\d{2}-\d{4}\b/.test(blob)) bad.push(`${pathOf(n)}: SSN-like number`)
    }
    expect(bad).toEqual([])
  })
})
