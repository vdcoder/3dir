import type { FsDataset, FsNode, NodeId } from './types'

/** Read-only index over a dataset: lookups by id and path, children, ancestry. */
export interface FsIndex {
  get(id: NodeId): FsNode | undefined
  children(id: NodeId): FsNode[]
  roots(): FsNode[]
  /** Root first, node last. */
  ancestry(id: NodeId): FsNode[]
  /** Canonical Windows-style path, e.g. C:\Users\Amanda\Documents. */
  path(id: NodeId): string
  /** Case-insensitive lookup; accepts / or \ separators and a trailing slash. */
  resolve(path: string): FsNode | undefined
}

const key = (name: string) => name.toLowerCase()

export function buildIndex(dataset: FsDataset): FsIndex {
  const byId = new Map<NodeId, FsNode>()
  const kids = new Map<NodeId, FsNode[]>()
  const roots: FsNode[] = []

  for (const n of dataset.nodes) {
    if (byId.has(n.id)) throw new Error(`duplicate node id ${n.id}`)
    byId.set(n.id, n)
  }
  for (const n of dataset.nodes) {
    if (n.parentId === null) {
      roots.push(n)
      continue
    }
    const parent = byId.get(n.parentId)
    if (!parent) throw new Error(`node ${n.id} has missing parent ${n.parentId}`)
    if (parent.type !== 'folder') throw new Error(`node ${n.id} has a file as parent`)
    const list = kids.get(n.parentId) ?? []
    if (list.some((s) => key(s.name) === key(n.name))) {
      throw new Error(`duplicate name "${n.name}" in ${n.parentId}`)
    }
    list.push(n)
    kids.set(n.parentId, list)
  }

  // Folders first, then case-insensitive name: the familiar Explorer order.
  for (const list of kids.values()) {
    list.sort((a, b) =>
      a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }),
    )
  }

  const ancestry = (id: NodeId): FsNode[] => {
    const chain: FsNode[] = []
    const seen = new Set<NodeId>()
    let cur = byId.get(id)
    while (cur) {
      if (seen.has(cur.id)) throw new Error(`cycle at ${cur.id}`)
      seen.add(cur.id)
      chain.push(cur)
      cur = cur.parentId === null ? undefined : byId.get(cur.parentId)
    }
    return chain.reverse()
  }

  const path = (id: NodeId): string => {
    const chain = ancestry(id)
    if (chain.length === 0) throw new Error(`unknown node ${id}`)
    const [root, ...rest] = chain
    const drive = root.name.replace(/\\$/, '') // "C:" or "C:\" -> "C:"
    return rest.length === 0 ? `${drive}\\` : `${drive}\\${rest.map((n) => n.name).join('\\')}`
  }

  const resolve = (input: string): FsNode | undefined => {
    const parts = input.replace(/\//g, '\\').split('\\').filter(Boolean)
    if (parts.length === 0) return undefined
    let cur = roots.find((r) => key(r.name.replace(/\\$/, '')) === key(parts[0]))
    for (const part of parts.slice(1)) {
      if (!cur) return undefined
      cur = (kids.get(cur.id) ?? []).find((c) => key(c.name) === key(part))
    }
    return cur
  }

  return {
    get: (id) => byId.get(id),
    children: (id) => kids.get(id) ?? [],
    roots: () => roots,
    ancestry,
    path,
    resolve,
  }
}
