// Canonical filesystem data. This layer knows nothing about 3D, layout or
// importance: those live in src/mapping and src/scene (charter section 7).

/** Stable, opaque node identifier. Never derived from layout or render order. */
export type NodeId = string

export type FileKind =
  | 'text'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'image'
  | 'archive'
  | 'code'
  | 'design'
  | 'executable'
  | 'system'
  | 'other'

interface NodeBase {
  id: NodeId
  /** Display name, e.g. "Q3 Budget.xlsx". Unique among siblings (case-insensitive). */
  name: string
  /** Parent folder id; null only for drive roots such as C:\. */
  parentId: NodeId | null
  created: string // ISO 8601
  modified: string // ISO 8601
}

export interface FolderNode extends NodeBase {
  type: 'folder'
}

export interface FileNode extends NodeBase {
  type: 'file'
  kind: FileKind
  sizeBytes: number
  /** Lightweight preview content (plain text, CSV-like rows, or a short summary). */
  preview?: FilePreview
}

export type FilePreview =
  | { format: 'text'; text: string }
  | { format: 'table'; columns: string[]; rows: string[][] }
  | { format: 'image'; description: string; palette?: string[] }

export type FsNode = FolderNode | FileNode

/** A complete synthetic computer. */
export interface FsDataset {
  /** Shown in the UI so nobody mistakes the data for real files. */
  label: string
  nodes: FsNode[]
}
