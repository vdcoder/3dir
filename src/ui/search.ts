import type { FsIndex } from '../model/fs'
import type { FsNode } from '../model/types'

export interface SearchHit {
  node: FsNode
  path: string
  score: number
}

const previewText = (n: FsNode): string => {
  if (n.type !== 'file' || !n.preview) return ''
  const p = n.preview
  if (p.format === 'text') return p.text
  if (p.format === 'table') return [...p.columns, ...p.rows.flat()].join(' ')
  return p.description
}

/** Name matches rank above content matches; shorter paths break ties. */
export function search(fs: FsIndex, nodes: FsNode[], query: string, limit = 40): SearchHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  const hits: SearchHit[] = []
  for (const node of nodes) {
    const name = node.name.toLowerCase()
    let score = 0
    let ok = true
    for (const t of terms) {
      if (name.startsWith(t)) score += 6
      else if (name.includes(' ' + t) || name.includes('-' + t) || name.includes('_' + t)) score += 4
      else if (name.includes(t)) score += 3
      else if (previewText(node).toLowerCase().includes(t)) score += 1
      else { ok = false; break }
    }
    if (!ok) continue
    if (node.type === 'folder') score += 0.5
    const path = fs.path(node.id)
    hits.push({ node, path, score: score - path.split('\\').length * 0.05 })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
