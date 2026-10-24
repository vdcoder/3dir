// Authoring helpers for the synthetic computer. Everything here is pure and
// deterministic: the same seed always produces the same tree, ids and dates.

import type { FileKind, FilePreview } from '../../model/types'
import { hash, kindFromName } from '../compile'
import { isSeedFolder, type SeedFile, type SeedFolder, type SeedNode } from '../seedTypes'

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** The story's "now": late October 2026. Nothing in the dataset is dated after this. */
export const STORY_NOW = '2026-10-24T18:00:00.000Z'

/** '2026-10-21', '2026-10-21 16:42' or a full ISO string -> canonical ISO (UTC). */
export function iso(s: string): string {
  let t = s.trim().replace(' ', 'T')
  if (!t.includes('T')) t += 'T09:00'
  if (!/(Z|[+-]\d\d:\d\d)$/.test(t)) t += 'Z'
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) throw new Error(`bad date "${s}"`)
  return d.toISOString()
}

/** Shift a date by whole days (negative goes back). Returns ISO. */
export function addDays(s: string, days: number): string {
  return new Date(Date.parse(iso(s)) + days * DAY).toISOString()
}

export interface Meta {
  /** Last modified. Created defaults to an hour earlier unless `since` is given. */
  at?: string
  /** Created. Inherited (with a small deterministic offset) from the folder when omitted. */
  since?: string
  size?: number
  kind?: FileKind
}

export function f(name: string, meta: Meta = {}, preview?: FilePreview): SeedFile {
  const node: SeedFile = { file: name }
  if (meta.kind) node.kind = meta.kind
  if (meta.size !== undefined) node.size = meta.size
  if (meta.at) {
    node.modified = iso(meta.at)
    // A photo is created when it is taken; other files were usually started a little earlier.
    const lead = (meta.kind ?? kindFromName(name)) === 'image' ? 0 : HOUR
    node.created = meta.since ? iso(meta.since) : new Date(Date.parse(node.modified) - lead).toISOString()
  } else if (meta.since) {
    node.created = iso(meta.since)
  }
  if (preview) node.preview = preview
  return node
}

/** Plain files with derived metadata. */
export const files = (...names: string[]): SeedFile[] => names.map((n) => ({ file: n }))

/** Files of an explicit kind (for extensionless or unusual system files). */
export const kinded = (kind: FileKind, ...names: string[]): SeedFile[] => names.map((n) => ({ file: n, kind }))

export const text = (name: string, lines: string | string[], meta?: Meta): SeedFile =>
  f(name, meta, { format: 'text', text: typeof lines === 'string' ? lines : lines.join('\n') })

export const table = (name: string, columns: string[], rows: string[][], meta?: Meta): SeedFile =>
  f(name, meta, { format: 'table', columns, rows })

export const photo = (name: string, description: string, palette: string[], meta?: Meta): SeedFile =>
  f(name, meta, { format: 'image', description, palette })

export type PhotoSpec = [name: string, description: string, palette: string[]]

/** A set of photos taken between two dates (spread deterministically). */
export const album = (from: string, to: string, specs: PhotoSpec[]): SeedNode[] =>
  between(from, to, specs.map(([n, d, p]) => photo(n, d, p)))

export function dir(folder: string, children: SeedNode[] = [], created?: string): SeedFolder {
  return created ? { folder, created: iso(created), children } : { folder, children }
}

/**
 * Give every undated file in a subtree explicit dates between `from` and `to`,
 * deterministically by name. Used for recent folders, whose derived dates
 * (folder created + up to 90 days) would otherwise land after STORY_NOW.
 * Explicit dates always win; undated subfolders start at `from`.
 */
export function between(from: string, to: string, nodes: SeedNode[]): SeedNode[] {
  const a = Date.parse(iso(from))
  const b = Date.parse(iso(to))
  if (b < a) throw new Error(`between(${from}, ${to}): range is reversed`)
  return nodes.map((n) => spread(n, a, b))
}

function spread(n: SeedNode, a: number, b: number): SeedNode {
  if (isSeedFolder(n)) {
    const created = n.created ?? new Date(a).toISOString()
    const start = Math.max(a, Date.parse(created))
    return { ...n, created, children: (n.children ?? []).map((c) => spread(c, start, Math.max(start, b))) }
  }
  if (n.modified && n.created) return n
  const h = hash(`${n.file}@${a}`)
  const lo = n.created ? Math.max(a, Date.parse(n.created)) : a
  let modified: number
  if (n.modified) {
    modified = Date.parse(n.modified)
  } else {
    const day = new Date(lo + ((h % 1000) / 1000) * (b - lo))
    day.setUTCHours(8 + ((h >>> 10) % 11), (h >>> 4) % 60, 0, 0)
    modified = Math.min(b, Math.max(lo, day.getTime()))
  }
  let created: number
  if (n.created) created = Date.parse(n.created)
  else if (kindFromName(n.file) === 'image') created = modified // a photo is created when it is taken
  else created = Math.max(a, modified - ((h >>> 16) % 4) * DAY - HOUR)
  return { ...n, created: new Date(Math.min(created, modified)).toISOString(), modified: new Date(modified).toISOString() }
}
