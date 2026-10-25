import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { balanceWeight, sample } from '../src/designers/area.ts'
import type { Blueprint } from '../src/designers/area.ts'
import { createContext, layout } from '../src/engine.ts'
import type { Offer } from '../src/protocol.ts'
import { demoHierarchy } from '../src/synth.ts'
import { SIZES, valid } from './helpers.ts'

const offer = (key: string, w: number, d: number): Offer => ({ key, w, d, plan: null, quality: { score: 0 } })
const area = (sampling: 'uniform' | 'balanced') => ({ ...DEFAULT_CONFIG.area, sampling })

describe('Child-offer sampling', () => {
  it('weights an offer by its short side over its long side', () => {
    expect(balanceWeight({ w: 10, d: 10 }, 1)).toBe(1)
    expect(balanceWeight({ w: 20, d: 10 }, 1)).toBe(0.5)
    expect(balanceWeight({ w: 5, d: 20 }, 1)).toBe(0.25)
    expect(balanceWeight({ w: 5, d: 20 }, 0)).toBe(1) // strength 0 is uniform
  })

  it('maps one random number to one offer in both modes, favouring balanced shapes only when asked', () => {
    const offers = [offer('square', 10, 10), offer('long', 40, 10)]
    // Uniform: half each. Balanced: square 1 / (1 + 0.25) = 80%.
    expect(sample(offers, 0.49, 'uniform', 1).key).toBe('square')
    expect(sample(offers, 0.51, 'uniform', 1).key).toBe('long')
    expect(sample(offers, 0.79, 'balanced', 1).key).toBe('square')
    expect(sample(offers, 0.81, 'balanced', 1).key).toBe('long')
    const us = Array.from({ length: 1000 }, (_, i) => i / 1000)
    const imbalance = (mode: 'uniform' | 'balanced') => us.reduce((s, u) => { const o = sample(offers, u, mode, 1); return s + Math.abs(Math.log(o.w / o.d)) }, 0)
    expect(imbalance('balanced')).toBeLessThan(imbalance('uniform'))
  })

  it('keeps runs paired: the same attempt places children in the same order in both modes', () => {
    const plans = (sampling: 'uniform' | 'balanced') =>
      new Map(createContext({ seed: 3, cfg: { area: area(sampling) } }).measure(demoHierarchy()).offers.map((o) => o.plan as Blueprint).map((b) => [b.attempt, b]))
    const u = plans('uniform'), b = plans('balanced')
    const common = [...b.keys()].filter((k) => u.has(k))
    expect(common.length).toBeGreaterThan(0)
    for (const k of common) {
      expect(b.get(k)!.seed).toBe(u.get(k)!.seed)
      expect(b.get(k)!.order).toEqual(u.get(k)!.order)
    }
  })
})

describe('Absorption rate', () => {
  it('does not change measurement, only growth', () => {
    const sig = (absorb: number) => JSON.stringify(createContext({ seed: 2, cfg: { absorb } }).measure(demoHierarchy()).offers.map((o) => [o.key, o.w, o.d]))
    expect(sig(0.1)).toBe(sig(0.2))
    expect(sig(0.05)).toBe(sig(0.2))
  })

  it('stays valid at 10% and 5%, for every allocation size and both sampling modes', () => {
    for (const absorb of [0.1, 0.05]) for (const sampling of ['uniform', 'balanced'] as const) for (const [sx, sy] of SIZES) {
      valid(layout(demoHierarchy(), { seed: 4, cfg: { absorb, area: area(sampling) }, scale: { x: sx, y: sy } }).placed, absorb)
    }
  })

  it('lower absorption makes rooms grow faster than the root', () => {
    const roomArea = (absorb: number) => {
      const r = layout(demoHierarchy(), { seed: 1, cfg: { absorb }, scale: { x: 2, y: 2 } })
      const find = (p: typeof r.placed): number => (p.kind === 'room' && p.name === 'Budgets' ? p.rect.w * p.rect.d : p.children.reduce((s, c) => s + find(c), 0))
      return find(r.placed)
    }
    expect(roomArea(0.05)).toBeGreaterThan(roomArea(0.1))
    expect(roomArea(0.1)).toBeGreaterThan(roomArea(0.2))
  })
})
