import type { FileKind, FsDataset, FsNode } from '../model/types'
import { isSeedFolder, type SeedFolder, type SeedNode } from './seedTypes'

const EXT_KIND: Record<string, FileKind> = {
  txt: 'text', md: 'text', log: 'text', ini: 'system', cfg: 'system',
  doc: 'document', docx: 'document', rtf: 'document', odt: 'document',
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation', key: 'presentation',
  pdf: 'pdf',
  jpg: 'image', jpeg: 'image', png: 'image', heic: 'image', gif: 'image', webp: 'image', svg: 'image',
  zip: 'archive', '7z': 'archive', rar: 'archive', tar: 'archive', gz: 'archive',
  ts: 'code', tsx: 'code', js: 'code', py: 'code', json: 'code', html: 'code', css: 'code', sql: 'code', sh: 'code', cs: 'code', ipynb: 'code',
  fig: 'design', psd: 'design', ai: 'design', sketch: 'design', blend: 'design', dwg: 'design', skp: 'design',
  exe: 'executable', msi: 'executable', bat: 'executable',
  dll: 'system', sys: 'system', dat: 'system', mui: 'system', ttf: 'system', otf: 'system',
}

// Typical size ranges (bytes) by kind, used when a file has no explicit size.
const SIZE_RANGE: Record<FileKind, [number, number]> = {
  text: [800, 24_000], document: [24_000, 900_000], spreadsheet: [18_000, 2_400_000],
  presentation: [600_000, 18_000_000], pdf: [80_000, 6_000_000], image: [900_000, 7_500_000],
  archive: [2_000_000, 240_000_000], code: [400, 40_000], design: [2_000_000, 90_000_000],
  executable: [1_000_000, 160_000_000], system: [8_000, 4_000_000], other: [1_000, 500_000],
}

export function kindFromName(name: string): FileKind {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  return EXT_KIND[ext] ?? 'other'
}

/** Small deterministic string hash (FNV-1a), so derived values never change between builds. */
export function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Stable id from the canonical path: lowercase, readable, unique. */
export function idFromPath(segments: string[]): string {
  return segments
    .map((s) => s.toLowerCase().replace(/:$/, '').replace(/&/g, 'and').replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, ''))
    .join('/')
}

function derivedSize(kind: FileKind, key: string): number {
  const [lo, hi] = SIZE_RANGE[kind]
  // Log-uniform between lo and hi.
  const t = (hash(key) % 10_000) / 10_000
  return Math.round(Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo))))
}

function shiftDate(iso: string, key: string, maxDays: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + (hash(key) % (maxDays + 1)))
  d.setUTCHours(8 + (hash(key + 'h') % 10), hash(key + 'm') % 60, 0, 0)
  return d.toISOString()
}

export function compile(label: string, root: SeedFolder, rootCreated = '2021-03-14T09:00:00Z'): FsDataset {
  const nodes: FsNode[] = []
  const ids = new Set<string>()

  const visit = (seed: SeedNode, segments: string[], parentId: string | null, inherited: string) => {
    const name = isSeedFolder(seed) ? seed.folder : seed.file
    const path = [...segments, name]
    const id = idFromPath(path)
    if (ids.has(id)) throw new Error(`duplicate id ${id} (${path.join('\\')})`)
    ids.add(id)
    const created = seed.created ?? (parentId ? shiftDate(inherited, id, 60) : inherited)

    if (isSeedFolder(seed)) {
      const children = seed.children ?? []
      nodes.push({ id, name, parentId, type: 'folder', created, modified: seed.modified ?? created })
      for (const child of children) visit(child, path, id, created)
      // A folder's modified date is its newest child's, unless set explicitly.
      if (!seed.modified && children.length) {
        const mine = nodes.find((n) => n.id === id)!
        const newest = nodes.filter((n) => n.parentId === id).reduce((m, n) => (n.modified > m ? n.modified : m), mine.modified)
        mine.modified = newest
      }
    } else {
      const kind = seed.kind ?? kindFromName(name)
      nodes.push({
        id, name, parentId, type: 'file', kind,
        sizeBytes: seed.size ?? derivedSize(kind, id),
        created,
        modified: seed.modified ?? shiftDate(created, id + 'mod', 30),
        ...(seed.preview ? { preview: seed.preview } : {}),
      })
    }
  }

  visit(root, [], null, rootCreated)
  return { label, nodes }
}
