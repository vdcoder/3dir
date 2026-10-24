// C:\Users\Victor, Elena, Guest and Public — the rest of the family PC.
// Victor: Amanda's husband, amateur musician in "The Late Tides", some gaming.
// Elena: their daughter, first-year architecture student at Westmere University.

import type { SeedFolder } from '../seedTypes'
import { between, dir, f, files, kinded, photo, table, text } from './helpers'

const victor = dir('Victor', [
  dir('Desktop', [
    text('Gig checklist.txt', [
      'Gig checklist (Rusty Anchor, Sat)',
      'Guitars: acoustic + the electric, spare strings, capo, tuner',
      'Pedalboard + 2 spare 9V batteries, 3 XLR, 4 instrument cables',
      'Setlists printed × 4 (big font!), folding chairs from Amanda',
      'Merch: 30 CDs, card reader charged',
    ], { at: '2026-10-22 22:30', since: '2025-08-10 20:00' }),
    ...kinded('system', 'desktop.ini'),
    f('Steam.url', { at: '2022-09-05 21:00', size: 184 }),
  ], '2022-09-04 19:00'),
  dir('Documents', [
    dir('Band - The Late Tides', [
      dir('Chord Sheets', [
        f('Covers - chord book.pdf', { at: '2025-03-02 15:00' }),
        text('Harbor Lights - chords.txt', [
          'Harbor Lights — V. Reyes — capo 2, key of E (shapes in D)',
          'Verse:  D          G/D        D          A',
          '        Down by the breakwater, the night boats come in',
          'Chorus: G          D/F#       Em7        A',
          '        Harbor lights, carry me home again',
          'Bridge: Bm  G  D  A  (×2), then stop on A',
        ], { at: '2026-09-13 22:10', since: '2025-02-16 21:00' }),
        f('Last Ferry Home - chords.txt', { at: '2026-04-26 20:00', since: '2025-11-02 20:00' }),
        text('Salt and Cedar - chords.txt', [
          'Salt and Cedar — standard tuning, key of G',
          'Intro: G  Cadd9  G  D (×2)',
          'Verse: G  Em  C  D — "Cedar on the porch boards, salt on the screen door"',
          'Chorus: C  G  D  Em  C  G  D  — hold the last D for two bars',
        ], { at: '2025-10-19 21:30', since: '2024-06-09 20:00' }),
      ], '2024-06-09'),
      dir('Setlists', [
        text('Setlist - Rusty Anchor 2026-10-24.txt', [
          'THE LATE TIDES · The Rusty Anchor · Sat 24 Oct 2026 · load-in 7:30, on at 9',
          'Set 1 — Salt and Cedar (G) · Last Ferry Home (D) · Copper Kettle (A) · Harbor Lights (E) · Lantern Weather (NEW, Am)',
          'Set 2 — Northbound (C) · Slow Tide Waltz (G) · Driftwood Radio (D) · two crowd-pick covers',
          'Encore — Harbor Lights (acoustic, everyone sings)',
        ], { at: '2026-10-22 21:50', since: '2026-10-11 20:00' }),
        f('Setlist - Harvest Fair 2026-09-19.txt', { at: '2026-09-17 22:00' }),
        f('Setlist - Summer Block Party 2026-07-11.txt', { at: '2026-07-09 21:30' }),
      ], '2024-06-09'),
      f('Band contacts.xlsx', { at: '2026-05-03 18:00', since: '2024-06-09 20:30' }),
      table('Gig earnings 2026.xlsx',
        ['Date', 'Venue', 'Fee', 'Split (4 ways)'],
        [
          ['11 Jul', 'Summer Block Party', '$400', '$100.00'],
          ['15 Aug', 'The Rusty Anchor', '$350', '$87.50'],
          ['19 Sep', 'Harvest Fair', '$600', '$150.00'],
          ['24 Oct', 'The Rusty Anchor', '$350 + tips', 'TBD'],
          ['Total', '', '$1,700', '$337.50 so far'],
        ],
        { at: '2026-09-20 11:15', since: '2026-07-12 10:00' }),
      text('Song ideas.txt', [
        'Song ideas',
        '- "Lantern Weather" — steal the title from Amanda\'s chapter 8 (she said yes!)',
        '- Something in 6/8 about the ferry that stopped running',
        '- Riff in drop D from the 17 Oct rehearsal — 0:42 in the take',
      ], { at: '2026-10-17 23:05', since: '2025-01-05 21:00' }),
    ], '2024-06-09'),
    dir('My Games', [
      dir('Starfall Tactics', [f('settings.ini', { at: '2026-10-10 23:40' }), f('profile_01.sav', { at: '2026-10-10 23:41', size: 2_184_320 })], '2024-12-26'),
    ], '2024-12-26'),
    f('Car - service history.pdf', { at: '2026-05-16 12:00' }),
    text('Guitar setup notes.txt', [
      'Acoustic: 12-53 light strings, action 2.4 mm at 12th fret (bass), 2.0 mm (treble)',
      'Electric: 10-46, neck relief a hair under 0.25 mm, re-intonate after string-gauge changes',
    ], { at: '2026-03-14 16:20', since: '2023-02-11 15:00' }),
  ], '2022-09-04 19:00'),
  dir('Downloads', [
    f('Amp manual - Tonehouse 40.pdf', { at: '2025-08-02 14:30' }),
    f('audacity-win-3.7.1-64bit.exe', { at: '2025-01-04 20:15' }),
    photo('Pedalboard wiring diagram.png', 'A simple flat diagram of a guitar pedalboard with coloured boxes for tuner, overdrive, delay and reverb connected by numbered cables.', ['#ffffff', '#e05a47', '#2a62b8', '#3a3a3a'], { at: '2026-02-21 22:00' }),
    f('Rusty Anchor gig poster.pdf', { at: '2026-10-05 19:40' }),
    f('SteamSetup.exe', { at: '2022-09-05 20:50' }),
  ], '2022-09-04 19:00'),
  dir('Music', [
    dir('Mixdowns', [
      f('Harbor Lights (mix v2).mp3', { at: '2026-10-18 10:55', size: 8_406_552 }),
      f('Salt and Cedar (rough mix).mp3', { at: '2026-06-07 22:40', size: 7_118_904 }),
      f('The Late Tides - Live at the Rusty Anchor 2025.mp3', { at: '2025-08-17 12:30', size: 96_440_210 }),
    ], '2024-07-14'),
    dir('Recordings', [
      f('Harbor Lights - take 3.wav', { at: '2026-10-03 21:15', size: 61_204_552 }),
      f('Harbor Lights - take 4.wav', { at: '2026-10-03 21:40', size: 58_772_004 }),
      f('Last Ferry Home - demo.wav', { at: '2026-04-25 22:05', size: 49_330_118 }),
      f('Salt and Cedar - rehearsal 2026-10-17.wav', { at: '2026-10-17 22:48', size: 212_884_610 }),
    ], '2024-07-14'),
    f('Harbor Lights.aup3', { at: '2026-10-18 10:50', since: '2026-10-03 21:50', size: 184_220_416 }),
  ], '2022-09-04 19:00'),
  dir('Pictures', [
    photo('Band photo - The Late Tides.jpg', 'Four musicians — two men and two women — standing against a weathered blue boathouse wall holding guitars, a bass and drumsticks.', ['#3a6a8a', '#d9c7a7', '#2b2b2b', '#c4532d'], { at: '2025-05-11 18:20' }),
    photo('Gig - Rusty Anchor 2025.jpg', 'A packed little pub with a band playing under red and amber stage lights, the crowd raising glasses.', ['#b8282a', '#f2a65a', '#1f1a16', '#6e4b33'], { at: '2025-08-15 22:47' }),
    photo('New guitar day.jpg', 'A sunburst acoustic guitar lying in an open case lined with plush green fabric on a wooden floor.', ['#c8692f', '#2a1c14', '#2f6a4a', '#e9c98a'], { at: '2026-03-07 13:05' }),
    photo('Pedalboard.jpg', 'A neat pedalboard of five colourful effects pedals with tidy patch cables, lit by a desk lamp.', ['#e05a47', '#2a62b8', '#e8c33c', '#1e1e1e'], { at: '2026-02-21 21:40' }),
  ], '2022-09-04 19:00'),
], '2022-09-04 19:00')

const fall2026 = dir('Fall 2026', between('2026-08-24', '2026-10-21 22:00', [
  dir('Drawing & Representation', [
    f('Axonometric exercise.pdf'),
    photo('Perspective study 03.jpg', 'A two-point perspective pencil drawing of a narrow street with timber houses, construction lines still visible on cream paper.', ['#f2ead8', '#4a4a4a', '#9a8a74']),
  ]),
  dir('History of Architecture', [
    text('Essay 1 - The Pantheon dome.docx', [
      "Essay 1 — The Pantheon's dome: weight, light and the oculus",
      'E. Reyes · History of Architecture I · Prof. Adeyemi · 2 October 2026',
      'The Pantheon has stood for nineteen centuries without steel, and its secret is not one idea but a gradient: the concrete grows lighter as it rises, from travertine aggregate at the base to pumice near the top.',
      'This essay argues that the oculus is less a window than a structural decision — removing the heaviest point of the dome while turning the sun into a clock.',
    ], { at: '2026-10-02 08:40', since: '2026-09-20 15:00' }),
    f('Essay 2 - outline.docx', { at: '2026-10-21 21:30', since: '2026-10-18 14:00' }),
    f('Reading notes - week 6.docx', { at: '2026-10-04 17:20', since: '2026-09-28 16:00' }),
  ]),
  dir('Studio 1 - Lakeside Pavilion', [
    f('Brief - Lakeside Pavilion.pdf', { at: '2026-08-26 10:00' }),
    f('Concept sketches.pdf', { at: '2026-09-21 23:10' }),
    photo('Model photo - massing.jpg', 'A white foam-board massing model of a long, low pavilion with a floating roof on a cork base beside a pencil and scalpel.', ['#f4f4f0', '#b08e62', '#3a3a3a', '#d9d2c5'], { at: '2026-10-09 01:15' }),
    f('Pavilion model v3.3dm', { at: '2026-10-19 23:55', since: '2026-09-28 20:00', size: 38_402_118 }),
    f('Pavilion plans.dwg', { at: '2026-10-20 22:40', since: '2026-10-01 20:00' }),
    text('Precedent study.pptx', [
      'Precedent study — Lakeside Pavilion',
      '1. Brief and site: a shelter for 40 people on the east shore',
      '2. Precedent A: timber lattice pavilions and light through slats',
      '3. Precedent B: the Kyoto engawa — the veranda as threshold',
      '4. Lessons: lift the floor, frame the view, let the roof float',
      '5. Next: massing models at 1:200',
    ], { at: '2026-09-14 09:20', since: '2026-09-08 19:00' }),
    f('Site analysis.pdf', { at: '2026-09-06 18:00' }),
  ]),
  f('Fall 2026 timetable.pdf', { at: '2026-08-24 12:00' }),
]), '2026-08-24 08:00')

const elena = dir('Elena', [
  dir('Desktop', [
    text('Studio deadlines.txt', [
      'Studio 1 — Lakeside Pavilion',
      'Wed 28 Oct — mid-review pin-up (3 boards + massing model)',
      'Fri 13 Nov — History essay 2 (2,500 words): Gothic vaults vs Kyoto timber joinery?',
      'Mon 7 Dec — final review: 1:50 model, plans, section, 2 renders',
      'Book the laser cutter for 26 Oct!!',
    ], { at: '2026-10-21 22:10', since: '2026-08-27 19:00' }),
  ], '2022-09-10 16:00'),
  dir('Documents', [
    dir('University', [
      dir('Application Portfolio 2025', [
        f('Portfolio - Elena Reyes.pdf', { at: '2025-12-28 23:10', since: '2025-09-14 15:00', size: 46_220_118 }),
        text('Personal statement.docx', [
          'Personal statement — draft 5',
          'I grew up in a house where furniture had a story: my mom could tell you which tree a table came from, and which joint would outlast us all.',
          "That's where architecture started for me — not with skyscrapers, but with how things are made to hold weight, and to hold people.",
          'Last summer I measured and redrew our town library by hand and realised I want to design rooms like its reading room.',
        ], { at: '2025-12-20 22:45', since: '2025-09-14 15:30' }),
      ], '2025-09-14'),
      fall2026,
    ], '2025-09-14'),
    text('Reading list.txt', [
      'Reading list — fall 2026',
      '[ ] The book on Japanese joinery Prof. Adeyemi mentioned (find the title!)',
      '[x] Studio 1 reader, weeks 1–6',
      "[ ] Library: lighthouses and tidal architecture (for Mom's novel research too)",
      '[ ] Re-read my Kyoto sketchbook notes before essay 2',
    ], { at: '2026-10-04 18:00', since: '2026-08-28 20:00' }),
    f('Summer cafe shifts 2026.xlsx', { at: '2026-08-15 09:00', since: '2026-06-01 18:00' }),
  ], '2022-09-10 16:00'),
  dir('Downloads', [
    f('Housing - room assignment.pdf', { at: '2026-07-22 19:30' }),
    f('Laser cutter booking guide.pdf', { at: '2026-09-02 10:15' }),
    f('Laser cutting template.dxf', { at: '2026-10-19 22:05' }),
    f('Lecture 05 - Gothic structure.pptx', { at: '2026-10-07 13:40' }),
    f('Studio 1 brief (1).pdf', { at: '2026-08-26 10:02' }),
  ], '2022-09-10 16:00'),
  dir('Pictures', [
    photo('Campus studio at night.jpg', 'A long architecture studio at night, rows of cluttered desks under fluorescent light, cardboard models everywhere and big windows black outside.', ['#e9e5dc', '#2a3440', '#c9b08a', '#f2f2f2'], { at: '2026-10-08 23:52' }),
    photo('Dorm room - Whitcombe Hall.jpg', 'A small dorm room with a twin bed, fairy lights, a drafting lamp clamped to the desk and pinned-up sketches on a corkboard.', ['#f2d36b', '#e9e4da', '#3a5a6a', '#c8a97e'], { at: '2026-08-22 18:40' }),
    photo('Model making desk.jpg', 'A messy desk covered in balsa sticks, a cutting mat, steel ruler, glue and a half-built pavilion model.', ['#d9c7a7', '#3f7d5c', '#8c8c8c', '#f4efe4'], { at: '2026-09-30 21:15' }),
    photo('Sketchbook - bridges.jpg', 'An open sketchbook with ink drawings of arched stone bridges and timber footbridges, a fountain pen resting in the fold.', ['#f2ead8', '#1f2f5a', '#7a6a5a', '#3a3a3a'], { at: '2026-06-28 16:05' }),
  ], '2022-09-10 16:00'),
], '2022-09-10 16:00')

const guest = dir('Guest', [
  dir('Desktop', [], '2023-12-20 15:00'),
  dir('Documents', [], '2023-12-20 15:00'),
  dir('Downloads', [f('boarding-pass-mobile.pdf', { at: '2023-12-27 06:40' })], '2023-12-20 15:00'),
], '2023-12-20 15:00')

const publicUser = dir('Public', [
  dir('Public Documents', [
    f('Family calendar 2026.xlsx', { at: '2026-10-18 20:30', since: '2025-12-28 19:00' }),
    text('Printer setup - upstairs.txt', [
      'Upstairs printer (hallway)',
      "Connect to the home Wi-Fi first, then add 'Hallway-Printer' from Settings > Bluetooth & devices > Printers.",
      'If it shows offline: switch it off and on and wait 2 minutes (it is slow to wake).',
      'Spare toner is in the hall closet, top shelf.',
    ], { at: '2024-01-06 14:00', since: '2022-09-17 13:00' }),
  ], '2022-09-03 10:00'),
  dir('Public Downloads', files('PrinterDriver_x64_v5.2.exe'), '2022-09-03 10:00'),
  dir('Public Pictures', [
    photo('Family portrait 2025.jpg', 'A relaxed family portrait on a front porch: a woman, a bearded man, a teenage girl and a golden retriever, all laughing in autumn light.', ['#c4532d', '#d9a441', '#e9dcc4', '#3a5a40'], { at: '2025-10-12 16:20' }),
  ], '2022-09-03 10:00'),
], '2022-09-03 10:00')

export const otherUsers: SeedFolder[] = [elena, guest, publicUser, victor]
