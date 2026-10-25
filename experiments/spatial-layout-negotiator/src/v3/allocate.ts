// Shortest-first shelf allocation for one candidate C (target shelves per row).
//
// 1. Split folders into segmented stacks and ordinary shelves.
// 2. Sort ordinary shelves by their required length, ascending (ties: folder order).
// 3. The first row takes the C shortest; every shelf in a row gets the row's
//    longest length. Reject C if that row is wider than MAX_ROOM_WIDTH.
// 4. Later rows take shelves in order, up to C, while the row (at the common
//    length after each proposed addition) fits the room width established so
//    far. A shelf that does not fit starts the next row. A single shelf wider
//    than the room widens the room to fit it alone (never past MAX_ROOM_WIDTH,
//    which an unsegmented shelf always fits by construction).
// 5. Each stack takes one dedicated row per segment, at the rear, consecutively.

import { maxShelfSegment } from '../config.ts'
import type { Config } from '../config.ts'
import { EPS } from '../geometry.ts'

export interface ShelfIn { child: number; length: number }
export interface StackIn { child: number; segments: number }

export interface ShelfRowPlan {
  kind: 'stack' | 'shelves'
  /** Child indices (the room's measured shelf children), west to east. */
  members: number[]
  /** Common physical length of every shelf in this row. */
  length: number
  /** Segment index, for stack rows. */
  segment?: number
}

export interface Allocation {
  C: number
  /** Room width the shelf rows need, side clearances included (0 with no shelves). */
  width: number
  /** Rear to front: stack rows first, then ordinary rows in allocation order. */
  rows: ShelfRowPlan[]
}

export const rowWidth = (cfg: Config, k: number, length: number) => 2 * cfg.room.wall + k * length + Math.max(0, k - 1) * cfg.room.shelfGap

export const sortShortestFirst = (shelves: ShelfIn[]) => [...shelves].sort((a, b) => a.length - b.length || a.child - b.child)

export function allocateShelves(cfg: Config, shelves: ShelfIn[], stacks: StackIn[], C: number): Allocation | null {
  const max = cfg.v3.maxRoomWidth
  const rows: ShelfRowPlan[] = []
  for (const s of stacks) for (let i = 0; i < s.segments; i++) rows.push({ kind: 'stack', members: [s.child], length: maxShelfSegment(cfg), segment: i })
  // A stack's full-length segments fill MAX_ROOM_WIDTH exactly.
  let width = stacks.length ? rowWidth(cfg, 1, maxShelfSegment(cfg)) : 0
  const sorted = sortShortestFirst(shelves)
  if (sorted.length) {
    const first = sorted.slice(0, C)
    const firstW = rowWidth(cfg, first.length, first[first.length - 1].length)
    if (firstW > max + EPS) return null
    width = Math.max(width, firstW)
    rows.push({ kind: 'shelves', members: first.map((s) => s.child), length: first[first.length - 1].length })
    let cur: ShelfIn[] = []
    const close = () => { if (cur.length) rows.push({ kind: 'shelves', members: cur.map((s) => s.child), length: cur[cur.length - 1].length }) }
    for (const s of sorted.slice(C)) {
      if (cur.length && cur.length < C && rowWidth(cfg, cur.length + 1, s.length) <= width + EPS) { cur.push(s); continue }
      close()
      cur = [s]
      const alone = rowWidth(cfg, 1, s.length)
      if (alone > width) {
        if (alone > max + EPS) return null // cannot happen for an unsegmented shelf; kept as a guard
        width = alone
      }
    }
    close()
  }
  return { C, width, rows }
}
