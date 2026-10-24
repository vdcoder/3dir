import { describe, expect, it } from 'vitest'
import { buildIndex } from '../../model/fs'
import type { FileNode, FsNode } from '../../model/types'
import { compile } from '../compile'
import { DEMO_PATHS, DEMO_USER, STORY_NOW, dataset, seedRoot } from './index'

const fs = buildIndex(dataset)
const HOME = 'C:\\Users\\Amanda'
const ONEDRIVE = `${HOME}\\OneDrive - Alder & Finch`

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
    expect(compile(dataset.label, seedRoot)).toEqual(dataset)
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
      documents: count(`${HOME}\\Documents`),
      projects: count(`${HOME}\\Projects`),
      pictures: filesUnder(`${HOME}\\Pictures`).filter((f) => f.kind === 'image').length,
      otherUsers: ['Victor', 'Elena', 'Guest', 'Public'].reduce((s, u) => s + count(`C:\\Users\\${u}`), 0),
    }
    const ranges: Record<keyof typeof report, [number, number]> = {
      folders: [180, 300], files: [700, 1100], windows: [50, 90], programFiles: [40, 70], onedrive: [250, 350],
      documents: [50, 80], projects: [60, 100], pictures: [60, 90], otherUsers: [40, 70],
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
