// Every physical constant of the experiment in one place (meters).
// Only minimums: there are deliberately no maximum sizes anywhere.

export interface Config {
  /** Share of each axis' surplus a container keeps for its own spacing (the rest goes to its children). */
  absorb: number
  /** Most offers a container reports to its parent. */
  maxOffers: number
  /** Also report arrangements that are larger in both dimensions than another (default: drop them). */
  keepDominated: boolean
  shelf: {
    depth: number          // fixed (top-down footprint depth)
    height: number         // fixed (not drawn; documented)
    side: number           // each side panel
    spacing: number        // minimum gap between neighbouring books
    breathing: number      // minimum free length at the end of the shelf
    minLength: number
    bookDepth: number
    displayBay: number     // reserved bay in the "display" arrangement
    roomyShare: number     // extra breathing in the "roomy" arrangement, as a share of the books' total width
  }
  room: {
    wall: number           // side wall clearance
    rear: number           // shelves stand against the rear wall
    shelfGap: number       // between shelves in a row
    aisle: number          // access aisle in front of every shelf row (also between shelf rows)
    entrance: number       // front clearance band with the door
    door: number
    minW: number
    minD: number
    file: { w: number; d: number; gap: number }   // a loose file lying on the table
    tableMargin: number    // table edge around the files
    tableSide: number      // clearance on each side of the table
    chair: number          // clearance in front of the table
    desk: { w: number; d: number; clear: number }   // computer / display table added during growth
  }
  building: { wall: number; roomWall: number; corridor: number; entrance: number; rear: number }
  campus: { boundary: number; path: number; street: number; entrance: number; courtyard: number }
  area: {
    /** Separator family by nesting level (index = level, last one repeats). */
    separators: { name: string; width: number }[]
    boundary: number
    signBand: number       // front band for the sign and the entrance
    sign: { w: number; d: number }
    attempts: number
    keep: number           // distinct blueprints retained
  }
}

export const DEFAULT_CONFIG: Config = {
  absorb: 0.2,
  maxOffers: 8,
  keepDominated: false,
  shelf: { depth: 0.35, height: 1.8, side: 0.03, spacing: 0.004, breathing: 0.06, minLength: 0.6, bookDepth: 0.26, displayBay: 0.3, roomyShare: 0.25 },
  room: {
    wall: 0.5, rear: 0.1, shelfGap: 0.4, aisle: 0.9, entrance: 1.2, door: 0.9, minW: 2.4, minD: 2.4,
    file: { w: 0.24, d: 0.31, gap: 0.04 }, tableMargin: 0.08, tableSide: 0.4, chair: 0.7,
    desk: { w: 1.2, d: 0.6, clear: 0.4 },
  },
  building: { wall: 0.3, roomWall: 0.25, corridor: 1.6, entrance: 2.4, rear: 0.3 },
  campus: { boundary: 4, path: 3, street: 6, entrance: 6, courtyard: 10 },
  area: {
    separators: [{ name: 'highway', width: 10 }, { name: 'street', width: 6 }, { name: 'path', width: 3.5 }, { name: 'hedge', width: 2 }],
    boundary: 2, signBand: 3.5, sign: { w: 3, d: 1.2 }, attempts: 100, keep: 6,
  },
}

export function validateConfig(c: Config): void {
  const bad: string[] = []
  const walk = (o: unknown, path: string) => {
    if (typeof o === 'number') { if (!Number.isFinite(o) || o < 0) bad.push(`${path} = ${o}`) }
    else if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`))
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k)
  }
  walk(c, '')
  if (c.absorb > 1) bad.push(`absorb = ${c.absorb} (must be at most 1)`)
  if (c.maxOffers < 1) bad.push(`maxOffers = ${c.maxOffers}`)
  if (bad.length) throw new Error(`Invalid configuration: ${bad.join(', ')}`)
}
