// Authoring format for the synthetic computer. Content files under
// src/data/seed/ describe a nested tree; compile.ts turns it into the flat,
// canonical FsDataset with stable ids, dates and sizes.

import type { FileKind, FilePreview } from '../model/types'

export interface SeedFolder {
  folder: string
  /** ISO date. Inherited from the parent when omitted. */
  created?: string
  modified?: string
  children?: SeedNode[]
}

export interface SeedFile {
  file: string
  /** Inferred from the extension when omitted. */
  kind?: FileKind
  /** Bytes. A plausible size is derived from kind + path when omitted. */
  size?: number
  created?: string
  modified?: string
  preview?: FilePreview
}

export type SeedNode = SeedFolder | SeedFile

export const isSeedFolder = (n: SeedNode): n is SeedFolder => 'folder' in n
