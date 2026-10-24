// C:\Users\Amanda\Documents\Business — Amanda's own business papers: the
// company she co-owns (AmandaMedicalMiami, see amm.ts), plus a couple of
// smaller folders so it isn't alone on its shelf.

import type { SeedFolder } from '../seedTypes'
import { amandaMedicalMiami } from './amm'
import { dir, f, table, text } from './helpers'

const sideProjects = dir('Side projects', [
  text('Booking portal for AMM clients - notes.docx', [
    'Side project: an online ordering portal for AMM clients (weekend coding, like the garden planner app)',
    'Facility contacts log in, see what is on rent at each location, request a pickup or a swap, reorder PPE.',
    'No health data anywhere — orders carry location and equipment only.',
    'Start small: a read-only "what\'s on rent" view fed from the asset register export; React + a hosted database.',
    'Ask Marisol which two clients would pilot it — probably Biscayne Senior Living and Coral Gables Home Care.',
  ], { at: '2026-09-13 21:10', since: '2026-08-30 20:00' }),
  table('Fort Lauderdale branch - napkin math.xlsx',
    ['Item', 'Year 1', 'Year 2', 'Notes'],
    [
      ['Revenue', '$420,000', '$780,000', '8–10 Broward accounts'],
      ['Gross profit (68%)', '$285,600', '$530,400', 'Slightly below Miami (smaller fleet)'],
      ['Staff (4 → 6)', '($310,000)', '($430,000)', '2 drivers, a technician, an account manager'],
      ['Small warehouse + 1 leased van', '($150,000)', '($160,000)', 'About 4,000 sq ft'],
      ['EBITDA', '($174,400)', '($59,600)', 'Breakeven in year 3 at best'],
      ['Fleet investment', '($260,000)', '($180,000)', 'Not before 2028 — park it'],
    ],
    { at: '2026-06-21 22:00', since: '2026-06-20 21:00' }),
  f('Small-business finance workshop - outline.pptx', { at: '2025-03-09 17:40', since: '2025-03-01 15:00' }),
  text('Walnut cutting boards - weekend shop idea.txt', [
    'Idea: sell end-grain walnut cutting boards made from the bench offcuts',
    'Material about $22 a board from the Mill Road offcut bin (ask Ben first!), 3 hours each with the router sled.',
    'Price $95–140. Test at the library holiday craft fair in December with 15 boards.',
    'Probably stays a hobby. Kitchen renovation first.',
  ], { at: '2025-11-30 20:15', since: '2025-11-29 19:00', size: 1_184 }),
], '2024-03-02')

const courses = dir('Courses & Certificates', [
  f('Certificate - Financial Modeling in Excel (2023).pdf', { at: '2023-05-20 11:10' }),
  f('Certificate - Leading Remote Teams (2026).pdf', { at: '2026-03-28 16:00' }),
  f('Certificate - Medical Equipment Business Essentials (2021).pdf', { at: '2022-09-10 14:20' }),
  f('Certificate - OSHA 10-Hour General Industry (2024).pdf', { at: '2024-06-08 15:30' }),
  f('Certificate - Privacy & HIPAA Basics for Suppliers (2025).pdf', { at: '2025-01-25 12:00' }),
  table('Course log.xlsx',
    ['Course', 'Provider', 'Completed', 'Hours'],
    [
      ['Medical Equipment Business Essentials', 'Coastal Business Institute', 'Jun 2021', '12'],
      ['Financial Modeling in Excel', 'LedgerLab Online', 'May 2023', '16'],
      ['OSHA 10-Hour General Industry', 'Authorized online trainer', 'Jun 2024', '10'],
      ['Privacy & HIPAA Basics for Suppliers', 'Coastal Business Institute', 'Jan 2025', '4'],
      ['Leading Remote Teams', 'LedgerLab Online', 'Mar 2026', '6'],
      ['Florida HME licensing workshop', 'Industry association', 'Booked for Nov 2026', '3'],
    ],
    { at: '2026-04-11 20:30', since: '2022-09-10 14:30' }),
], '2022-09-10 14:00')

export const business: SeedFolder = dir('Business', [
  amandaMedicalMiami,
  courses,
  sideProjects,
], '2022-09-10 14:00')
