import { describe, expect, it } from 'vitest'
import { resolvePick, type PickHit } from './pickPolicy'

// Canonical nesting used by the cases below.
const parents: Record<string, string> = {
  binder: 'fy27', box: 'compartment', compartment: 'fy27', fy27: 'budgets-room', 'budgets-room': 'finance', finance: 'area',
  'other-binder': 'other-shelf', 'other-shelf': 'budgets-room',
}
const isWithin = (a: string, b: string) => {
  for (let x: string | undefined = a; x; x = parents[x]) if (x === b) return true
  return false
}
const hit = (nodeId: string, level: PickHit['level'], distance: number): PickHit => ({ nodeId, level, distance })

describe('resolvePick', () => {
  it('prefers a binder just behind its shelf side panel', () => {
    expect(resolvePick([hit('fy27', 'fixture', 10), hit('binder', 'item', 10.2)], isWithin)?.nodeId).toBe('binder')
  })

  it('prefers a box inside a compartment volume', () => {
    expect(resolvePick([hit('compartment', 'compartment', 8), hit('box', 'box', 8.1), hit('fy27', 'fixture', 8.3)], isWithin)?.nodeId).toBe('box')
  })

  it('keeps the compartment when the ray passes between items', () => {
    expect(resolvePick([hit('compartment', 'compartment', 8), hit('fy27', 'fixture', 8.4)], isWithin)?.nodeId).toBe('compartment')
  })

  it('never lets an unrelated object behind win, however specific', () => {
    expect(resolvePick([hit('fy27', 'fixture', 10), hit('other-binder', 'item', 10.1)], isWithin)?.nodeId).toBe('fy27')
  })

  it('ignores nested things that are far behind', () => {
    expect(resolvePick([hit('finance', 'building', 5), hit('binder', 'item', 9)], isWithin)?.nodeId).toBe('finance')
  })

  it('picks the room floor when nothing else is hit', () => {
    expect(resolvePick([hit('budgets-room', 'room', 12)], isWithin)?.nodeId).toBe('budgets-room')
  })

  it('returns null for an empty ray', () => {
    expect(resolvePick([], isWithin)).toBeNull()
  })

  it('is independent of hit order', () => {
    expect(resolvePick([hit('binder', 'item', 10.2), hit('fy27', 'fixture', 10)], isWithin)?.nodeId).toBe('binder')
  })
})
