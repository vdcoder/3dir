// Decorative props (Meshy models) and their real-world sizes in the miniature.
// `unit` is the model's bounding box as delivered (normalized to ~1 unit),
// `scale` turns it into world units. Fronts face +Z.

export type PropId =
  | 'fountain' | 'tree-round' | 'tree-cypress' | 'bench' | 'lamp-post' | 'planter'
  | 'desk-office' | 'plant-pot' | 'table-boardroom' | 'vault' | 'van' | 'forklift'
  | 'easel-board' | 'clock-tower'

export interface PropSpec {
  unit: [number, number, number]
  scale: number
}

const spec = (unit: [number, number, number], target: number, axis: 0 | 1 | 2): PropSpec => ({ unit, scale: target / unit[axis] })

export const PROPS: Record<PropId, PropSpec> = {
  fountain: spec([0.949, 0.765, 0.956], 4.2, 0),
  'tree-round': spec([0.634, 0.952, 0.663], 5.6, 1),
  'tree-cypress': spec([0.208, 0.951, 0.212], 6.4, 1),
  bench: spec([0.953, 0.584, 0.399], 1.9, 0),
  'lamp-post': spec([0.117, 0.951, 0.117], 3.4, 1),
  planter: spec([0.958, 0.446, 0.52], 2.0, 0),
  'desk-office': spec([0.951, 0.645, 0.886], 1.6, 0),
  'plant-pot': spec([0.62, 0.952, 0.667], 1.35, 1),
  'table-boardroom': spec([0.95, 0.188, 0.526], 3.8, 0),
  vault: spec([0.948, 0.951, 0.33], 2.2, 1),
  van: spec([0.955, 0.635, 0.546], 4.0, 0),
  forklift: spec([0.955, 0.567, 0.367], 2.8, 0),
  'easel-board': spec([0.614, 0.952, 0.136], 1.9, 1),
  'clock-tower': spec([0.458, 1.903, 0.438], 13, 1),
}

/** World-space footprint (width along X, depth along Z) for rotation 0. */
export function footprint(id: PropId): [number, number] {
  const p = PROPS[id]
  return [p.unit[0] * p.scale, p.unit[2] * p.scale]
}

export const propHeight = (id: PropId) => PROPS[id].unit[1] * PROPS[id].scale
