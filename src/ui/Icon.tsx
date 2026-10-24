import type React from 'react'
import type { FsNode } from '../model/types'
import { styleOf } from './kinds'

// Small, consistent file-type icons drawn in the shared kind colors.
export function NodeIcon({ node, size = 18, open = false }: { node: FsNode; size?: number; open?: boolean }) {
  const c = styleOf(node).color
  if (node.type === 'folder') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden className="icon">
        <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h4l1.6 1.6H16.5A1.5 1.5 0 0 1 18 7.1V15a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15z" fill={c} />
        <path d={open ? 'M3.2 8.6h14.6l-1.3 7.9H2z' : 'M2 8h16v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15z'} fill="#F2C766" />
      </svg>
    )
  }
  const glyph: Record<string, React.ReactElement> = {
    spreadsheet: <path d="M6.5 9.5h7M6.5 12h7M6.5 14.5h7M10 9v6" stroke="#fff" strokeWidth="1.1" />,
    document: <path d="M6.5 9.5h7M6.5 11.8h7M6.5 14.1h4.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />,
    pdf: <text x="10" y="14.6" fontSize="5.2" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="Inter, sans-serif">PDF</text>,
    presentation: <path d="M6.5 14.5V11m3.5 3.5V9m3.5 5.5v-2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />,
    image: <path d="M6 14.8l2.6-3.2 1.9 2.2 1.4-1.6 2.1 2.6z M12.6 9.4a1 1 0 1 0 .01 0" fill="#fff" />,
    code: <path d="M8.3 10l-2 2 2 2M11.7 10l2 2-2 2" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    design: <path d="M10 9l3 5.5H7z" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />,
    archive: <path d="M10 2.6v2m0 1.2v1.6m0 1.2v1.6M8.8 11.5h2.4v3h-2.4z" stroke="#fff" strokeWidth="1.1" fill="none" />,
    text: <path d="M6.5 9.5h7M6.5 11.8h7M6.5 14.1h7" stroke="#fff" strokeWidth="1" strokeLinecap="round" />,
    executable: <path d="M6.5 9h7v5.5h-7z M6.5 10.5h7" stroke="#fff" strokeWidth="1.1" fill="none" />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden className="icon">
      <path d="M4.5 2h7.3L16 6.2V17a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" fill={c} />
      <path d="M11.8 2v3.2a1 1 0 0 0 1 1H16z" fill="#fff" opacity=".45" />
      {glyph[node.kind] ?? null}
    </svg>
  )
}
