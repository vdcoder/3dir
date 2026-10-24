// Curated configuration for the default view (Spatial Compiler α.v1).
// Paths are canonical Windows paths. Nothing here creates folders: it only
// says how important real folders are and how they should look.

export type ThemeId = 'business' | 'medical' | 'studio' | 'gallery' | 'home' | 'system'

const AMANDA = 'C:\\Users\\Amanda'
export const ONEDRIVE = `${AMANDA}\\OneDrive - Alder & Finch`
export const AMM = `${AMANDA}\\Documents\\Business\\AmandaMedicalMiami`

/**
 * Curated importance (0..1). The area planner (Stage 1) promotes folders at or
 * above PROMOTE_AT into their own prominent areas, keeping them inside their
 * real ancestors; everything else follows simple rules (importance.ts).
 */
export const IMPORTANCE: Record<string, number> = {
  // The heart of this computer.
  [AMM]: 1,
  [`${AMM}\\Finance`]: 0.9,
  [`${AMM}\\Clients`]: 0.88,
  [`${AMM}\\Operations`]: 0.85,
  [`${AMM}\\Legal`]: 0.8,
  // Amanda's employer, synced through OneDrive.
  [ONEDRIVE]: 0.85,
  [`${ONEDRIVE}\\Finance`]: 0.9,
  [`${ONEDRIVE}\\Finance\\Budgets`]: 0.9,
  [`${ONEDRIVE}\\Finance\\Budgets\\FY2027`]: 0.95,
  [`${ONEDRIVE}\\Finance\\Reports\\Quarterly\\2026 Q3`]: 0.92,
  [`${ONEDRIVE}\\Contracts`]: 0.8,
  [`${ONEDRIVE}\\Board`]: 0.78,
  // Personal places.
  [`${AMANDA}\\Pictures`]: 0.8,
  [`${AMANDA}\\Pictures\\Travel\\2026 Kyoto`]: 0.9,
  [`${AMANDA}\\Projects`]: 0.78,
  // System content stays quiet.
  'C:\\Windows': 0.12,
  'C:\\Program Files': 0.12,
  'C:\\Program Files (x86)': 0.08,
  'C:\\ProgramData': 0.08,
}

/** Folders with curated importance at or above this become their own areas. */
export const PROMOTE_AT = 0.75
/** Areas at or above this are campuses: courtyard, plaza, landmarks, premium paving. */
export const CAMPUS_AT = 0.95

/** Look of each part of the drive; descendants inherit the nearest entry. */
export const THEMES: Record<string, ThemeId> = {
  'C:\\Windows': 'system',
  'C:\\Program Files': 'system',
  'C:\\Program Files (x86)': 'system',
  'C:\\ProgramData': 'system',
  'C:\\Users': 'home',
  [`${AMANDA}\\Documents`]: 'studio',
  [`${AMANDA}\\Projects`]: 'studio',
  [`${AMANDA}\\Pictures`]: 'gallery',
  [ONEDRIVE]: 'business',
  [AMM]: 'medical',
}

/**
 * Extra floor area (width, depth) reserved at the front of a room for furniture.
 * `*:<theme>` applies to every room of that theme; paths override it.
 */
export const ROOM_RESERVE: Record<string, [number, number]> = {
  '*:business': [2.4, 2.0],
  '*:medical': [2.4, 2.0],
  '*:studio': [3.6, 2.0],
  '*:gallery': [2.4, 1.8],
  [`${ONEDRIVE}\\Board\\2026 Meetings`]: [5.2, 3.4],
}

/**
 * Landmarks: deliberately chosen, stable markers for important places. They
 * are curated here, never derived from how often something is used.
 * - `tower`: a clock tower in the plaza of a campus, visible from anywhere.
 * - `pin`: a shortcut to a place smaller than an area, rising from the exact
 *   shelf or wall that holds the folder; the folder keeps its real path.
 */
export const LANDMARKS: { path: string; kind: 'pin' | 'tower'; title: string }[] = [
  { path: AMM, kind: 'tower', title: 'AmandaMedicalMiami' },
  { path: `${ONEDRIVE}\\Finance\\Budgets\\FY2027`, kind: 'pin', title: 'FY2027 Budget' },
  { path: `${ONEDRIVE}\\Finance\\Reports\\Quarterly\\2026 Q3`, kind: 'pin', title: 'Q3 2026 Reports' },
  { path: `${AMANDA}\\Pictures\\Travel\\2026 Kyoto`, kind: 'pin', title: 'Kyoto 2026' },
  { path: `${AMANDA}\\Projects\\Garden Planner App`, kind: 'pin', title: 'Garden Planner App' },
]
