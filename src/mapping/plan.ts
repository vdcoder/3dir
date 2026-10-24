// Curated spatial plan for the default view. Paths are canonical Windows
// paths; anything not mentioned is laid out by the generic rules in layout.ts.

export type ThemeId = 'business' | 'studio' | 'gallery' | 'home' | 'system'

export interface DistrictPlan {
  key: string
  /** Big label on the map. */
  title: string
  /** Real folders shown as buildings in this district. Promoted when deeper than C:\X. */
  paths: string[]
  theme: ThemeId
  /** Placement on the land: grid column/row in a 3 x 2 arrangement (row 0 = front, nearest the camera). */
  slot: { col: 0 | 1 | 2; row: 0 | 1 }
  /** Arrange buildings around a central plaza (flagship) or in simple rows. */
  arrangement: 'courtyard' | 'rows'
  /** For courtyard layouts: which side each building takes. */
  sides?: Record<string, 'north' | 'south' | 'west' | 'east'>
  /** Show the folder's children as the buildings (true) or the folder itself as one building. */
  expand?: boolean
}

const AMANDA = 'C:\\Users\\Amanda'
export const ONEDRIVE = `${AMANDA}\\OneDrive - Alder & Finch`

export const DISTRICTS: DistrictPlan[] = [
  {
    key: 'business',
    title: 'Alder & Finch — Business',
    paths: [ONEDRIVE],
    expand: true,
    theme: 'business',
    slot: { col: 1, row: 0 },
    arrangement: 'courtyard',
    sides: {
      Finance: 'north',
      Contracts: 'west',
      Operations: 'east',
      Board: 'south',
      Strategy: 'south',
      'Shared with me': 'south',
    },
  },
  {
    key: 'studio',
    title: 'Projects & Documents Studio',
    paths: [`${AMANDA}\\Projects`, `${AMANDA}\\Documents`],
    theme: 'studio',
    slot: { col: 0, row: 0 },
    arrangement: 'rows',
  },
  {
    key: 'gallery',
    title: 'Photo Gallery',
    paths: [`${AMANDA}\\Pictures`],
    theme: 'gallery',
    slot: { col: 2, row: 0 },
    arrangement: 'rows',
  },
  {
    key: 'users',
    title: 'Users',
    paths: ['C:\\Users'],
    expand: true,
    theme: 'home',
    slot: { col: 1, row: 1 },
    arrangement: 'rows',
  },
  {
    key: 'system',
    title: 'Windows & Programs',
    paths: ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)', 'C:\\ProgramData'],
    theme: 'system',
    slot: { col: 0, row: 1 },
    arrangement: 'rows',
  },
]

/**
 * Curated importance (0..1). Drives prominence, label priority and promotion
 * badges. Everything else gets a rule-based default (see layout.ts).
 */
export const IMPORTANCE: Record<string, number> = {
  [ONEDRIVE]: 1,
  [`${ONEDRIVE}\\Finance`]: 1,
  [`${ONEDRIVE}\\Finance\\Budgets`]: 0.95,
  [`${ONEDRIVE}\\Finance\\Budgets\\FY2027`]: 1,
  [`${ONEDRIVE}\\Finance\\Forecasts`]: 0.9,
  [`${ONEDRIVE}\\Finance\\Reports`]: 0.9,
  [`${ONEDRIVE}\\Finance\\Reports\\Quarterly`]: 0.85,
  [`${ONEDRIVE}\\Finance\\Reports\\Quarterly\\2026 Q3`]: 0.95,
  [`${ONEDRIVE}\\Contracts`]: 0.85,
  [`${ONEDRIVE}\\Contracts\\Clients`]: 0.85,
  [`${ONEDRIVE}\\Operations`]: 0.75,
  [`${ONEDRIVE}\\Board`]: 0.8,
  [`${ONEDRIVE}\\Board\\2026 Meetings`]: 0.8,
  [`${ONEDRIVE}\\Strategy`]: 0.7,
  [`${AMANDA}\\Projects`]: 0.8,
  [`${AMANDA}\\Documents`]: 0.7,
  [`${AMANDA}\\Pictures`]: 0.8,
  [`${AMANDA}\\Pictures\\Travel\\2026 Kyoto`]: 0.9,
  'C:\\Windows': 0.15,
  'C:\\Program Files': 0.15,
  'C:\\Program Files (x86)': 0.1,
  'C:\\ProgramData': 0.1,
}

/**
 * Extra floor area (width, depth) reserved at the front of a room for furniture.
 * `*:<theme>` applies to every room of that theme; paths override it.
 */
export const ROOM_RESERVE: Record<string, [number, number]> = {
  '*:business': [2.4, 2.0],
  '*:studio': [2.2, 1.6],
  [`${ONEDRIVE}\\Board\\2026 Meetings`]: [5.2, 3.4],
}

/**
 * Important destinations pinned on the map at every zoom level, wherever they
 * are nested. Each pin rises from the exact shelf or wall that holds them.
 */
export const PINS: { path: string; title: string }[] = [
  { path: `${ONEDRIVE}\\Finance\\Budgets\\FY2027`, title: 'FY2027 Budget' },
  { path: `${ONEDRIVE}\\Finance\\Reports\\Quarterly\\2026 Q3`, title: 'Q3 2026 Reports' },
  { path: `${ONEDRIVE}\\Contracts\\Clients\\Oakridge Hotels`, title: 'Oakridge Hotels' },
  { path: `${AMANDA}\\Pictures\\Travel\\2026 Kyoto`, title: 'Kyoto 2026' },
  { path: `${AMANDA}\\Projects\\Garden Planner App`, title: 'Garden Planner App' },
]
