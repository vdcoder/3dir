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
    /**
     * How a randomized attempt picks each child's offer: 'uniform', or 'balanced', where an
     * offer's weight is (short side / long side) ^ balance — with balance = 1 a 2:1 offer is half
     * as likely as a square one and nothing is ever excluded.
     */
    sampling: 'uniform' | 'balanced'
    balance: number
  }
  /** α.v3 only (fixed geometry, smart rooms, segmented shelving). α.v2 ignores this section. */
  v3: {
    /** MAX_ROOM_WIDTH: outer room width, both side clearances included. Room depth has no limit. */
    maxRoomWidth: number
    /** Extra room width from which a furnished side zone is made (less only widens the side clearances). */
    sideZoneMin: number
    /** Extra room depth from which a furnished front zone is made (less only deepens the entrance clearance). */
    zoneMin: number
    /** Extra room depth from which a middle zone (between the shelves and the table) is made as well. */
    middleZoneMin: number
    /** Clear walkway from the door through a front zone. */
    walkway: number
    /** Clearance between a feature's furniture and the edges of its zone. */
    featureMargin: number
    /** Width of the entrance walk from a centered building's door to the street or plaza in front of its row. */
    campusWalk: number
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
    boundary: 2, signBand: 3.5, sign: { w: 3, d: 1.2 }, attempts: 100, keep: 6, sampling: 'uniform', balance: 1,
  },
  v3: { maxRoomWidth: 10, sideZoneMin: 1.5, zoneMin: 1.5, middleZoneMin: 4, walkway: 1.2, featureMargin: 0.3, campusWalk: 2 },
}

/**
 * MAX_SHELF_SEGMENT_LENGTH: the outer length of one physical shelf fixture, both side panels
 * included. A room's side clearance (cfg.room.wall) is the only space between a full-length
 * segment and the room's side walls, so the frame allowance is already inside the fixture length:
 *   MAX_SHELF_SEGMENT_LENGTH = MAX_ROOM_WIDTH − 2 × side clearance  (= 10 − 2 × 0.5 = 9 m by default)
 */
export const maxShelfSegment = (c: Config) => c.v3.maxRoomWidth - 2 * c.room.wall
/** Book length one segment can hold: the fixture minus its two side panels and the minimum breathing room. */
export const segmentCapacity = (c: Config) => maxShelfSegment(c) - 2 * c.shelf.side - c.shelf.breathing
/** Widest file table a room can hold: MAX_ROOM_WIDTH minus the side clearances and the table's own side clearance. */
export const maxTableWidth = (c: Config) => c.v3.maxRoomWidth - 2 * c.room.wall - 2 * c.room.tableSide

export const MAX_ROOM_WIDTH = DEFAULT_CONFIG.v3.maxRoomWidth
export const MAX_SHELF_SEGMENT_LENGTH = maxShelfSegment(DEFAULT_CONFIG)

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
  if (c.v3) {
    if (maxShelfSegment(c) < c.shelf.minLength) bad.push(`v3.maxRoomWidth = ${c.v3.maxRoomWidth} leaves no room for a minimum shelf`)
    if (c.v3.maxRoomWidth < c.room.minW) bad.push(`v3.maxRoomWidth = ${c.v3.maxRoomWidth} is below room.minW`)
    if (maxTableWidth(c) < c.room.file.w + 2 * c.room.tableMargin) bad.push(`v3.maxRoomWidth = ${c.v3.maxRoomWidth} cannot hold a one-file table`)
  }
  if (bad.length) throw new Error(`Invalid configuration: ${bad.join(', ')}`)
}
