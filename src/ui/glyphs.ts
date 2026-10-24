// File-type glyphs shared by the explorer's icons (SVG) and the world's labels
// (canvas), so both views use the same recognizable conventions.
// Coordinates are in a 20 x 20 box.

import type { FileKind } from '../model/types'

export interface Glyph {
  d?: string
  /** Stroke width, or fill the path when absent. */
  stroke?: number
  /** Short text instead of a drawing (PDF). */
  text?: string
}

export const FILE_SHAPE = 'M4.5 2h7.3L16 6.2V17a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z'
export const FILE_FOLD = 'M11.8 2v3.2a1 1 0 0 0 1 1H16z'
export const FOLDER_BACK = 'M2 5.5A1.5 1.5 0 0 1 3.5 4h4l1.6 1.6H16.5A1.5 1.5 0 0 1 18 7.1V15a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15z'
export const FOLDER_FRONT = 'M2 8h16v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15z'
export const FOLDER_FRONT_OPEN = 'M3.2 8.6h14.6l-1.3 7.9H2z'

export const GLYPHS: Partial<Record<FileKind, Glyph>> = {
  spreadsheet: { d: 'M6.5 9.5h7M6.5 12h7M6.5 14.5h7M10 9v6', stroke: 1.1 },
  document: { d: 'M6.5 9.5h7M6.5 11.8h7M6.5 14.1h4.5', stroke: 1.2 },
  pdf: { text: 'PDF' },
  presentation: { d: 'M6.5 14.5V11m3.5 3.5V9m3.5 5.5v-2.5', stroke: 1.5 },
  image: { d: 'M6 14.8l2.6-3.2 1.9 2.2 1.4-1.6 2.1 2.6z M12.6 9.4a1 1 0 1 0 .01 0' },
  code: { d: 'M8.3 10l-2 2 2 2M11.7 10l2 2-2 2', stroke: 1.3 },
  design: { d: 'M10 9l3 5.5H7z', stroke: 1.3 },
  archive: { d: 'M10 2.6v2m0 1.2v1.6m0 1.2v1.6M8.8 11.5h2.4v3h-2.4z', stroke: 1.1 },
  text: { d: 'M6.5 9.5h7M6.5 11.8h7M6.5 14.1h7', stroke: 1 },
  executable: { d: 'M6.5 9h7v5.5h-7z M6.5 10.5h7', stroke: 1.1 },
}

/** The short type code printed on binder spines and pages, like a file extension. */
export const SHORT: Record<FileKind, string> = {
  spreadsheet: 'XLS',
  document: 'DOC',
  pdf: 'PDF',
  presentation: 'PPT',
  image: 'IMG',
  code: 'CODE',
  design: 'DSGN',
  archive: 'ZIP',
  text: 'TXT',
  executable: 'EXE',
  system: 'SYS',
  other: 'FILE',
}

export const FILE_KINDS: FileKind[] = ['spreadsheet', 'document', 'pdf', 'presentation', 'image', 'code', 'design', 'archive', 'text', 'executable', 'system', 'other']
