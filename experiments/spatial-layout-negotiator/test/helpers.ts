import { expect } from 'vitest'
import { arrangeAt, createContext } from '../src/engine.ts'
import type { Options } from '../src/engine.ts'
import type { LayoutNode } from '../src/model.ts'
import type { Ctx, Measured, Offer, Placed } from '../src/protocol.ts'
import { validate } from '../src/validate.ts'

/** The layout passes every validator check. */
export function valid(p: Placed, absorb = 0.2) {
  const v = validate(p, absorb)
  expect(v.map((x) => `${x.check} ${x.path} (${x.name}): ${x.detail}`)).toEqual([])
}

export function measureOnly(node: LayoutNode, opts: Options = {}): { ctx: Ctx; m: Measured } {
  const ctx = createContext(opts)
  return { ctx, m: ctx.measure(node) }
}

export const at = (ctx: Ctx, m: Measured, o: Offer, sx = 1, sy = 1): Placed => arrangeAt(m, o, ctx, { w: o.w * sx, d: o.d * sy })

export const byKey = (m: Measured, prefix: string) => {
  const o = m.offers.find((x) => x.key.startsWith(prefix))
  if (!o) throw new Error(`no offer ${prefix} in ${m.offers.map((x) => x.key).join(', ')}`)
  return o
}

/** Several allocations, including unequal and very large growth. */
export const SIZES: [number, number][] = [[1, 1], [1.07, 1], [1, 1.3], [1.6, 1.15], [2.5, 1], [1, 2.5], [4, 3], [10, 8]]

// ---------- α.v3 ----------
import { validateV3 } from '../src/v3/validate.ts'
import type { Config } from '../src/config.ts'

/** The layout passes every α.v2 check and every α.v3 invariant. */
export function validV3(p: Placed, cfg?: Config) {
  const v = validateV3(p, cfg)
  expect(v.map((x) => `${x.check} ${x.path} (${x.name}): ${x.detail}`)).toEqual([])
}

export const measureV3 = (node: LayoutNode, opts: Options = {}) => measureOnly(node, { ...opts, version: 'v3' })
export const exact = (ctx: Ctx, m: Measured, o: Offer): Placed => arrangeAt(m, o, ctx, { w: o.w, d: o.d })
