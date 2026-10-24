import type { FileKind, FsNode } from '../model/types'
import { FILE_FOLD, FILE_SHAPE, FOLDER_BACK, FOLDER_FRONT, FOLDER_FRONT_OPEN, GLYPHS } from './glyphs'
import { KIND_STYLE, styleOf } from './kinds'

// Small, consistent file-type icons drawn in the shared kind colors. The same
// glyphs appear on binder spines and pages in the world.
export function NodeIcon({ node, size = 18, open = false }: { node: FsNode; size?: number; open?: boolean }) {
  if (node.type === 'folder') return <FolderIcon size={size} open={open} color={styleOf(node).color} />
  return <KindIcon kind={node.kind} size={size} />
}

export function FolderIcon({ size = 18, open = false, color = KIND_STYLE.folder.color }: { size?: number; open?: boolean; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden className="icon">
      <path d={FOLDER_BACK} fill={color} />
      <path d={open ? FOLDER_FRONT_OPEN : FOLDER_FRONT} fill="#F2C766" />
    </svg>
  )
}

export function KindIcon({ kind, size = 18 }: { kind: FileKind; size?: number }) {
  const g = GLYPHS[kind]
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden className="icon">
      <path d={FILE_SHAPE} fill={KIND_STYLE[kind].color} />
      <path d={FILE_FOLD} fill="#fff" opacity=".45" />
      {g?.text && <text x="10" y="14.6" fontSize="5.2" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="Inter, sans-serif">{g.text}</text>}
      {g?.d && (g.stroke
        ? <path d={g.d} stroke="#fff" strokeWidth={g.stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        : <path d={g.d} fill="#fff" />)}
    </svg>
  )
}
