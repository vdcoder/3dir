// Hierarchies for drawings, tests and benchmarks. Deterministic for a seed.

import { join } from './model.ts'
import type { AreaNode, Book, BuildingNode, CampusNode, RoomNode, ShelfNode } from './model.ts'
import { hash, rng } from './rng.ts'

const EXT = ['xlsx', 'pdf', 'docx', 'pptx', 'csv']

export function books(count: number, r: () => number): Book[] {
  return Array.from({ length: count }, (_, i) => ({ name: `File ${i + 1}.${EXT[Math.floor(r() * EXT.length)]}`, w: +(0.03 + r() * 0.06).toFixed(3) }))
}

export function shelf(parent: string, name: string, count: number, r: () => number): ShelfNode {
  const path = join(parent, name)
  return { kind: 'shelf', name, path, books: books(count, r) }
}

export function room(parent: string, name: string, shelves: string[], files: number, r: () => number, booksPerShelf = [4, 18]): RoomNode {
  const path = join(parent, name)
  const span = booksPerShelf[1] - booksPerShelf[0]
  return {
    kind: 'room', name, path,
    shelves: shelves.map((s) => shelf(path, s, booksPerShelf[0] + Math.floor(r() * (span + 1)), r)),
    files: Array.from({ length: files }, (_, i) => `${name} note ${i + 1}.docx`),
  }
}

/** A named, hand-made hierarchy modelled on the 3dir demo computer (fictional). */
export function demoHierarchy(seed = 7): AreaNode {
  const r = rng(seed)
  const amanda = 'C:\\Users\\Amanda'
  const docs = join(amanda, 'Documents')
  const business = join(docs, 'Business')
  const amm = join(business, 'AmandaMedicalMiami')
  const b = (parent: string, name: string, rooms: [string, string[], number][], files: string[] = [], importance?: number): BuildingNode => {
    const path = join(parent, name)
    return { kind: 'building', name, path, rooms: rooms.map(([n, s, f]) => room(path, n, s, f, r)), files, ...(importance ? { importance } : {}) }
  }
  const residual = (parent: string, label: string, rooms: [string, string[], number][]): BuildingNode =>
    ({ kind: 'building', name: `${label} · other folders`, path: parent, rooms: rooms.map(([n, s, f]) => room(parent, n, s, f, r)), files: [], synthetic: true })
  const ammCampus: CampusNode = {
    kind: 'campus', name: 'AmandaMedicalMiami', path: amm, importance: 1,
    files: ['AMM key dates 2026-27.xlsx', 'Company overview 2026.pdf', 'Owners meeting notes.docx'],
    buildings: [
      b(amm, 'Finance', [['Bank & Cards', ['2025', '2026'], 3], ['Budgets', ['2026', '2027 draft'], 2], ['Invoices', ['Payable', 'Receivable'], 1], ['Payroll', ['2026'], 2], ['Reports', ['Monthly', 'Quarterly', 'Annual'], 0], ['Tax', ['2025', '2026'], 1]], ['Chart of accounts.xlsx', 'Month-end close checklist.docx']),
      b(amm, 'Clients', [['Bayview Physiotherapy', ['Agreements', 'Correspondence', 'Orders'], 1], ['Biscayne Senior Living', ['Agreements', 'Correspondence', 'Orders'], 1], ['Coral Gables Home Care', ['Agreements', 'Orders'], 1], ['Palmetto Bay Assisted Living', ['Agreements', 'Orders'], 2]], ['Client list 2026.xlsx']),
      b(amm, 'Legal', [['Compliance', ['HIPAA', 'Audits'], 2], ['Contracts', ['Clients', 'Suppliers'], 1], ['Insurance', ['Policies'], 3], ['Licenses & Permits', [], 4]]),
      b(amm, 'Operations', [['Equipment servicing', ['2026'], 2], ['Inventory', ['Counts', 'Reorders'], 1], ['Staff', ['Schedules', 'Training'], 2], ['Suppliers', ['Medline', 'McKesson'], 0]]),
    ],
  }
  const businessArea: AreaNode = {
    kind: 'area', name: 'Business', path: business, importance: 0.9,
    children: [ammCampus, residual(business, 'Business', [['Consulting 2024', ['Proposals'], 2], ['Ideas', [], 5]])],
  }
  const documents: AreaNode = {
    kind: 'area', name: 'Documents', path: docs, importance: 0.9,
    children: [businessArea, residual(docs, 'Documents', [['Personal Finance', ['Taxes', 'Insurance', 'Mortgage'], 2], ['Home', ['Manuals'], 3], ['Recipes', [], 9], ['Letters', [], 4], ['Medical', ['Lab results'], 1]])],
  }
  const od = join(amanda, 'OneDrive - Alder & Finch')
  const oneDrive: CampusNode = {
    kind: 'campus', name: 'OneDrive - Alder & Finch', path: od, files: [],
    buildings: [
      b(od, 'Finance', [['Budgets', ['FY2026', 'FY2027'], 1], ['Reports', ['Monthly Flash', 'Quarterly', 'Annual'], 2], ['Forecasts', ['2027'], 0]]),
      b(od, 'Contracts', [['Clients', ['Oakridge Hotels', 'Harbor Foods'], 1], ['Vendors', ['Logistics'], 2]]),
      b(od, 'Board', [['2026 Meetings', ['Q1', 'Q2', 'Q3'], 2]]),
      b(od, 'Strategy', [['Plans', [], 6]]),
    ],
  }
  const pictures = b(amanda, 'Pictures', [['Travel', ['2026 Kyoto', 'Lisbon'], 0], ['Family', ['Graduation'], 4], ['Garden', [], 8], ['Screenshots', [], 12]])
  return {
    kind: 'area', name: 'Amanda', path: amanda,
    children: [documents, oneDrive, pictures, residual(amanda, 'Amanda', [['Desktop', [], 6], ['Downloads', ['Installers'], 10], ['Music', ['Playlists'], 0], ['Videos', [], 3]])],
  }
}

/**
 * A synthetic hierarchy of roughly `target` containers (areas, campuses,
 * buildings, rooms and shelves). Campuses are generated until the budget is
 * nearly spent, then grouped into nested areas of 2–5 children.
 */
export function syntheticHierarchy(target: number, seed = 1): { root: AreaNode; containers: number } {
  const r = rng(hash(`synthetic|${seed}|${target}`))
  let count = 0
  const campuses: CampusNode[] = []
  let ci = 0
  const reserve = Math.max(1, Math.ceil(target / 40)) // for the areas
  while (count < target - reserve) {
    const left = target - reserve - count
    const cPath = `C:\\Root\\Campus ${++ci}`
    count++
    const buildings: BuildingNode[] = []
    const nb = Math.max(1, Math.min(1 + Math.floor(r() * 4), Math.floor(left / 4) || 1))
    for (let b = 0; b < nb && count < target - reserve; b++) {
      const bPath = join(cPath, `Building ${b + 1}`)
      count++
      const rooms: RoomNode[] = []
      const nr = 1 + Math.floor(r() * 4)
      for (let k = 0; k < nr && count < target - reserve; k++) {
        count++
        const ns = Math.min(Math.floor(r() * 5), Math.max(0, target - reserve - count))
        count += ns
        rooms.push(room(bPath, `Room ${k + 1}`, Array.from({ length: ns }, (_, s) => `Shelf ${s + 1}`), Math.floor(r() * 10), r))
      }
      buildings.push({ kind: 'building', name: `Building ${b + 1}`, path: bPath, rooms, files: r() < 0.3 ? ['readme.txt', 'index.xlsx'] : [] })
    }
    campuses.push({ kind: 'campus', name: `Campus ${ci}`, path: cPath, buildings, files: r() < 0.25 ? ['overview.pdf'] : [] })
  }
  // Group into nested areas (paths are rewritten so containment stays canonical).
  let level: (AreaNode | CampusNode)[] = campuses
  let depth = 0
  while (level.length > 1 || level[0].kind !== 'area') {
    const next: AreaNode[] = []
    for (let i = 0; i < level.length;) {
      const k = Math.min(level.length - i, 2 + Math.floor(r() * 4))
      next.push({ kind: 'area', name: `Area ${depth}.${next.length + 1}`, path: '', children: level.slice(i, i + k) })
      count++
      i += k
    }
    level = next
    depth++
  }
  const root = level[0] as AreaNode
  rebase(root, 'C:\\Root')
  return { root, containers: count }
}

/** Gives every node a canonical path under `path`. */
function rebase(n: AreaNode | CampusNode | BuildingNode | RoomNode | ShelfNode, path: string) {
  n.path = path
  if (n.kind === 'area') n.children.forEach((c) => rebase(c, join(path, c.name)))
  else if (n.kind === 'campus') n.buildings.forEach((c) => rebase(c, join(path, c.name)))
  else if (n.kind === 'building') n.rooms.forEach((c) => rebase(c, join(path, c.name)))
  else if (n.kind === 'room') n.shelves.forEach((c) => rebase(c, join(path, c.name)))
}
