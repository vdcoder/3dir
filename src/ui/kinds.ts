import type { FileKind, FsNode } from '../model/types'

// One color per kind of information, shared by 2D icons and 3D objects so a
// green ledger in the world reads as the same thing as a green icon in the list.
export const KIND_STYLE: Record<FileKind | 'folder', { color: string; label: string }> = {
  folder: { color: '#D4A23F', label: 'File folder' },
  document: { color: '#3E6DB5', label: 'Document' },
  spreadsheet: { color: '#2E8B57', label: 'Spreadsheet' },
  presentation: { color: '#D9732B', label: 'Presentation' },
  pdf: { color: '#C0392B', label: 'PDF document' },
  image: { color: '#8559C4', label: 'Image' },
  code: { color: '#23898C', label: 'Source code' },
  design: { color: '#C24E8B', label: 'Design file' },
  archive: { color: '#8B6A45', label: 'Compressed archive' },
  text: { color: '#667085', label: 'Text document' },
  executable: { color: '#5B6B82', label: 'Application' },
  system: { color: '#7D8796', label: 'System file' },
  other: { color: '#8A919C', label: 'File' },
}

export const styleOf = (n: FsNode) => KIND_STYLE[n.type === 'folder' ? 'folder' : n.kind]

export function typeLabel(n: FsNode): string {
  if (n.type === 'folder') return KIND_STYLE.folder.label
  const ext = n.name.includes('.') ? n.name.split('.').pop()!.toUpperCase() : ''
  return ext ? `${KIND_STYLE[n.kind].label} (.${ext.toLowerCase()})` : KIND_STYLE[n.kind].label
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  const units = ['KB', 'MB', 'GB']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) v /= 1024, i++
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
  })
}
