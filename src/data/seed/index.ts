// The synthetic computer: one fictional family Windows PC (charter section 4).
// Everything here is invented — people, companies, numbers and files.

import type { FsDataset } from '../../model/types'
import { compile } from '../compile'
import { buildIndex } from '../../model/fs'
import { PHOTOS } from '../photos'
import type { SeedFolder } from '../seedTypes'
import { amanda } from './amanda'
import { dir } from './helpers'
import { otherUsers } from './otherUsers'
import { programData, programFiles, programFilesX86, windows } from './system'

export { STORY_NOW } from './helpers'

/** The account the demo is "logged in" as. */
export const DEMO_USER = 'Amanda'

const HOME = `C:\\Users\\${DEMO_USER}`
const ONEDRIVE = `${HOME}\\OneDrive - Alder & Finch`
const AMM = `${HOME}\\Documents\\Business\\AmandaMedicalMiami`

/** Canonical paths of the destinations the demo walkthrough leans on (all verified by seed.test.ts). */
export const DEMO_PATHS = {
  onedrive: ONEDRIVE,
  fy2027Budgets: `${ONEDRIVE}\\Finance\\Budgets\\FY2027`,
  budgetDraft: `${ONEDRIVE}\\Finance\\Budgets\\FY2027\\FY2027 Operating Budget - DRAFT v3.xlsx`,
  budgetAssumptions: `${ONEDRIVE}\\Finance\\Budgets\\FY2027\\Budget assumptions.docx`,
  q3Reports: `${ONEDRIVE}\\Finance\\Reports\\Quarterly\\2026 Q3`,
  boardReport: `${ONEDRIVE}\\Finance\\Reports\\Quarterly\\2026 Q3\\Q3 2026 Board Report.pdf`,
  q3PL: `${ONEDRIVE}\\Finance\\Reports\\Quarterly\\2026 Q3\\Q3 2026 P&L.xlsx`,
  cashFlow: `${ONEDRIVE}\\Finance\\Forecasts\\Cash Flow Forecast 2026-2027.xlsx`,
  revenueForecast: `${ONEDRIVE}\\Finance\\Forecasts\\Revenue Forecast by Channel.xlsx`,
  oakridgeMsa: `${ONEDRIVE}\\Contracts\\Clients\\Oakridge Hotels\\Master Services Agreement - Oakridge Hotels.pdf`,
  octoberBoard: `${ONEDRIVE}\\Board\\2026 Meetings\\2026-10 October`,
  octoberDeck: `${ONEDRIVE}\\Board\\2026 Meetings\\2026-10 October\\Board deck - October 2026.pptx`,
  plan2027: `${ONEDRIVE}\\Strategy\\2027 Plan.pptx`,
  todo: `${HOME}\\Desktop\\To do this week.txt`,
  kyotoItinerary: `${HOME}\\Documents\\Travel Plans\\Kyoto 2026 itinerary.docx`,
  kyotoAlbum: `${HOME}\\Pictures\\Travel\\2026 Kyoto`,
  kitchenBudget: `${HOME}\\Projects\\Kitchen Renovation\\Budget.xlsx`,
  gardenApp: `${HOME}\\Projects\\Garden Planner App\\src\\App.tsx`,
  amm: AMM,
  ammDeep: `${AMM}\\Clients\\Biscayne Senior Living\\Orders\\2026\\Q3\\Delivery confirmations`,
  ammBudget: `${AMM}\\Finance\\Budgets\\2027 draft\\AMM Budget 2027 - DRAFT.xlsx`,
} as const

/** The authored tree, before compilation (exported for tests). */
export const seedRoot: SeedFolder = dir('C:', [
  programData,
  programFiles,
  programFilesX86,
  dir('Users', [amanda, ...otherUsers], '2022-09-03 10:00'),
  windows,
], '2022-09-03 10:00')

export const dataset: FsDataset = withPhotos(compile('Fictional demo computer — no real files', seedRoot))

/** Links generated pictures (src/data/photos.ts) to their image files' previews. */
function withPhotos(ds: FsDataset): FsDataset {
  const fs = buildIndex(ds)
  for (const n of ds.nodes) {
    if (n.type !== 'file' || n.preview?.format !== 'image') continue
    const slug = PHOTOS[fs.path(n.id)]
    if (slug) n.preview = { ...n.preview, src: `photos/${slug}.webp` }
  }
  return ds
}
