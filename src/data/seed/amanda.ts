// C:\Users\Amanda — the demo user's home folder. Desktop, Downloads, Music
// and Videos live here; the larger collections have their own modules.

import type { SeedFolder } from '../seedTypes'
import { documents } from './documents'
import { dir, f, kinded, photo, text } from './helpers'
import { onedrive } from './onedrive'
import { pictures } from './pictures'
import { projects } from './projects'

const PROFILE = '2022-09-03 10:41'

const desktop = dir('Desktop', [
  f('Alder & Finch Intranet.url', { at: '2023-01-09 08:45', size: 212 }),
  ...kinded('system', 'desktop.ini'),
  text('Halloween party - shopping list.txt', [
    'Halloween party — Sat 31 Oct',
    'Pumpkins × 4 (carving night Thu 29, Elena on video call for the design)',
    'Apple cider, cinnamon sticks, cider doughnuts from the orchard',
    'Fairy lights for the porch, fog machine fluid (Victor)',
    "Candy for trick-or-treaters — full-size bars, we're 'that house' now",
  ], { at: '2026-10-21 21:35', since: '2026-10-18 20:10' }),
  f('Kestrel Bank Online.url', { at: '2022-09-04 19:00', size: 198 }),
  f('Kitchen tile options.pdf', { at: '2026-10-12 14:12' }),
  f('Q4 cash plan - scratch.xlsx', { at: '2026-10-22 19:48', since: '2026-10-19 07:50' }),
  text('To do this week.txt', [
    'Week of 19 Oct',
    '[x] Send FY2027 budget DRAFT v3 to Thomas & department heads (Wed)',
    '[x] Board meeting Thu 22 — Q3 report + budget framework',
    '[ ] Finalise the board minutes draft with Priya',
    '[ ] Oakridge SOW 03 pricing — call Marcus Okafor',
    '[ ] Harbor Street heads of terms: Brightwater comments back by Fri',
    "[ ] Kitchen: pick backsplash tile; countertops booked Tue 3 Nov · pay Elena's spring housing deposit",
    "[ ] Victor's gig Sat at the Rusty Anchor — bring the folding chairs",
  ], { at: '2026-10-23 07:58', since: '2026-10-19 07:30', size: 612 }),
], PROFILE)

const downloads = dir('Downloads', [
  f('7z2409-x64.exe', { at: '2024-12-01 15:20' }),
  f('Board pack - 22 Oct 2026 (combined).pdf', { at: '2026-10-16 12:02' }),
  f('ChromeSetup.exe', { at: '2022-09-03 11:45' }),
  f('Elena_Spring_2027_tuition_statement.pdf', { at: '2026-10-19 08:18' }),
  f('Firefox Installer.exe', { at: '2023-05-14 20:30' }),
  f('FY2027 Operating Budget - DRAFT v2 (Thomas comments).xlsx', { at: '2026-10-05 21:14' }),
  f('garden-planner-mockups.zip', { at: '2026-03-08 16:30' }),
  photo('Halloween party invite.png', 'A playful party invitation with a cartoon jack-o’-lantern, falling autumn leaves and hand-lettered orange text on a deep purple background.', ['#3b1f4f', '#f28c28', '#f2d36b', '#ffffff'], { at: '2026-10-08 20:44' }),
  f('invoice (1).pdf', { at: '2026-09-28 19:02' }),
  f('invoice (2).pdf', { at: '2026-10-14 08:37' }),
  f('invoice.pdf', { at: '2026-09-02 12:15' }),
  f('JR_Pass_exchange_orders.pdf', { at: '2026-03-20 21:05' }),
  f('Kitchen_floorplan_rev3 (1).pdf', { at: '2026-08-27 16:52' }),
  f('Lantern Keeper - beta reader notes.zip', { at: '2026-07-02 22:10' }),
  f('Lisbon_apartment_booking.pdf', { at: '2025-05-02 21:40' }),
  f('node-v22.11.0-x64.msi', { at: '2026-02-15 20:05' }),
  f('pumpkin-stencils-geometric.pdf', { at: '2026-10-17 21:20' }),
  f('Quote_Stonecraft_Countertops_rev2.pdf', { at: '2026-07-08 13:25' }),
  f('Receipt - Corner Hardware (bench clamps).pdf', { at: '2026-08-30 16:10' }),
  f('Receipt_Order_88214.pdf', { at: '2026-09-11 22:03' }),
  f('Ryokan_confirmation_Gion.pdf', { at: '2026-01-15 21:30' }),
  f('SketchUpPro-2026-en.exe', { at: '2026-08-24 20:45' }),
  f('statement_2026-09.pdf', { at: '2026-10-03 09:10' }),
  photo('Team photo - offsite 2026.jpg', 'About twenty smiling colleagues in casual clothes posing in front of a big timber-framed workshop door, some holding coffee cups.', ['#8a5a3a', '#e9dcc4', '#3a5a6a', '#c8a97e'], { at: '2026-09-19 10:22' }),
  f('Walnut bench plans - shaker style.pdf', { at: '2026-08-23 15:30' }),
  f('Westmere_parent_portal_guide.pdf', { at: '2026-07-30 19:15' }),
  f('Windows11InstallationAssistant.exe', { at: '2024-10-03 20:00' }),
  f('zellige-tile-spec-sheet.pdf', { at: '2026-10-12 14:05' }),
], PROFILE)

const music = dir('Music', [
  dir('Playlists', [
    f('Budget season focus.m3u', { at: '2026-09-07 07:40', size: 2_310 }),
    f('Kitchen dance party.m3u', { at: '2025-12-20 18:00', size: 3_904 }),
    f('Kyoto evenings.m3u', { at: '2026-04-15 21:00', size: 1_722 }),
  ], '2023-01-15'),
  f('Fado night in Alfama (phone recording).m4a', { at: '2025-07-16 23:40', size: 6_104_332 }),
  f('Graduation slideshow song.mp3', { at: '2026-06-10 22:15', size: 8_420_118 }),
  f('Harbor Lights (mix v2) - from Victor.mp3', { at: '2026-10-18 11:02', size: 8_406_552 }),
], PROFILE)

const videos = dir('Videos', [
  f('Biscuit learns to swim.mp4', { at: '2025-07-04 17:12', size: 212_440_118 }),
  f('Elena graduation - full ceremony.mp4', { at: '2026-06-14 10:30', size: 3_204_118_441 }),
  f('Kitchen demo day timelapse.mp4', { at: '2026-09-09 21:05', size: 641_220_903 }),
  f('Kyoto 2026 - highlights.mp4', { at: '2026-04-26 22:40', size: 1_912_005_730 }),
  f('Lisbon 2025 - tram ride.mp4', { at: '2025-07-14 11:20', size: 381_774_092 }),
], PROFILE)

export const amanda: SeedFolder = dir('Amanda', [
  desktop,
  documents,
  downloads,
  music,
  onedrive,
  pictures,
  projects,
  videos,
], '2022-09-03 10:40')
