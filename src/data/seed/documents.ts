// C:\Users\Amanda\Documents — household paperwork, recipes, travel, home, and
// Business\ (the company Amanda co-owns; see business.ts and amm.ts).
// The Reyes family: Amanda, Victor (husband) and Elena (daughter, first-year
// architecture student at the fictional Westmere University since Aug 2026).

import type { SeedFolder } from '../seedTypes'
import { business } from './business'
import { dir, f, files, table, text } from './helpers'

const personalFinance = dir('Personal Finance', [
  dir('Insurance', [
    f('Auto insurance renewal 2026.pdf', { at: '2026-03-02 19:10' }),
    f('Home insurance policy 2026-27.pdf', { at: '2026-06-15 20:05' }),
    f('Life insurance summary.pdf', { at: '2024-01-22 21:00' }),
    f('Umbrella policy.pdf', { at: '2025-06-18 20:30' }),
  ], '2022-09-20'),
  dir('Mortgage', [
    f('Amortization schedule.xlsx', { at: '2025-04-11 21:15', since: '2022-09-20 20:00' }),
    f('Closing documents 2019 (scan).pdf', { at: '2022-09-20 20:40' }),
    f('Mortgage statement 2026-09.pdf', { at: '2026-09-16 07:30' }),
    f('Mortgage statement 2026-10.pdf', { at: '2026-10-16 07:30' }),
    f('Refinance comparison 2025.xlsx', { at: '2025-03-29 22:10', since: '2025-03-22 20:00' }),
  ], '2022-09-20'),
  dir('Taxes', [
    dir('2024', files(
      'Charitable receipts 2024.pdf',
      'Federal return 2024 - filed.pdf',
      'Property tax 2024.pdf',
      'State return 2024 - filed.pdf',
      'Tax organizer 2024.pdf',
    ), '2025-02-10'),
    dir('2025', [
      ...files('Charitable receipts 2025.pdf', 'Property tax 2025.pdf', 'Tax organizer 2025.pdf'),
      f('Federal return 2025 - filed.pdf', { at: '2026-04-08 21:30' }),
      f('Letter from Hollis & Day CPA.pdf', { at: '2026-03-27 12:15' }),
      f('State return 2025 - filed.pdf', { at: '2026-04-08 21:35' }),
    ], '2026-02-08'),
    f('Estimated payments 2026.xlsx', { at: '2026-09-15 20:20', since: '2026-01-14 20:00' }),
  ], '2023-02-12'),
  f('Charitable giving 2026.xlsx', { at: '2026-10-04 20:45', since: '2026-01-03 19:00' }),
  f('College fund - Elena.xlsx', { at: '2026-08-30 21:00', since: '2022-10-09 20:00' }),
  table('Household budget 2026.xlsx',
    ['Category', 'Monthly budget', 'Avg actual (Jan–Sep)', 'Variance'],
    [
      ['Mortgage', '$2,850', '$2,850', '$0'],
      ['Utilities', '$420', '$446', '($26)'],
      ['Groceries', '$1,100', '$1,184', '($84)'],
      ['Kitchen renovation fund', '$1,500', '$1,500', '$0'],
      ['Elena - university', '$1,800', '$1,750', '$50'],
      ['Insurance', '$390', '$390', '$0'],
      ['Car & transport', '$520', '$488', '$32'],
      ['Dining out', '$350', '$412', '($62)'],
      ['Victor - music gear', '$100', '$143', '($43)'],
      ['Savings & retirement', '$2,000', '$2,000', '$0'],
      ['Travel', '$600', '$910', '($310)'],
      ['Total', '$11,630', '$12,073', '($443)'],
    ],
    { at: '2026-10-11 21:40', since: '2026-01-02 20:00' }),
  f('Net worth tracker.xlsx', { at: '2026-10-01 22:05', since: '2022-11-06 20:00' }),
  f('Savings goals 2026.xlsx', { at: '2026-07-05 20:15', since: '2026-01-02 20:30' }),
], '2022-09-20')

const medical = dir('Medical', [
  f('Annual physical summary 2026.pdf', { at: '2026-03-12 16:20' }),
  f('Dental checkup - March 2026.pdf', { at: '2026-03-24 11:05' }),
  f('Eye exam 2025.pdf', { at: '2025-10-08 15:40' }),
  text('Physio exercises - knee.pdf', [
    'Home exercise plan — right knee (after the spring 10K)',
    'Daily: 3 × 12 straight-leg raises · 3 × 10 wall sits, hold 30 s · calf and hamstring stretches',
    'Ice for 15 minutes after runs; follow-up appointment in 6 weeks if it still clicks on stairs.',
  ], { at: '2026-05-21 17:30' }),
], '2022-10-18')

const recipes = dir('Recipes', [
  text("Grandma Lucia's arroz con pollo.docx", [
    "Grandma Lucia's arroz con pollo (serves 6)",
    'Brown 8 bone-in chicken thighs in olive oil; set aside. Sofrito: onion, green pepper, 4 garlic cloves, 2 tbsp tomato paste.',
    'Add 2 cups medium-grain rice, a pinch of saffron, 1 tsp cumin, 1 bay leaf; toast for 2 minutes.',
    '3 cups hot chicken stock + ½ cup beer (her secret). Nestle the chicken back in, lid on, low heat for 25 minutes.',
    'Finish with peas, roasted red peppers and green olives. Do NOT stir once the lid is on.',
  ], { at: '2024-11-30 18:20', since: '2022-10-01 17:00' }),
  text('Matcha shortbread.docx', [
    "Matcha shortbread (Elena's favourite)",
    '225 g soft butter, 100 g caster sugar, 280 g flour, 2 tbsp matcha, pinch of salt.',
    'Roll into a log, coat in demerara sugar, chill 1 hour, slice 8 mm thick.',
    'Bake at 160°C for 14 minutes — pull them before the edges brown or the green turns dull.',
  ], { at: '2026-05-02 15:10', since: '2026-04-19 14:00' }),
  text('Miso-glazed salmon.docx', [
    'Miso-glazed salmon — weeknight, 20 minutes',
    'Whisk 3 tbsp white miso, 2 tbsp mirin, 1 tbsp soy sauce, 1 tbsp honey, 1 tsp grated ginger.',
    'Brush over 4 salmon fillets; rest 10 minutes.',
    'Broil 6–8 minutes until the edges caramelise. Scatter sesame seeds and sliced scallions.',
    'Serve with rice and the quick cucumber pickle from the Kyoto cooking class.',
  ], { at: '2026-04-22 19:45', since: '2026-04-14 19:00' }),
  text('Pastéis de nata (Lisbon class).pdf', [
    'Pastéis de nata — from our cooking class in Alfama, July 2025',
    'Pastry: roll puff pastry into a tight log, slice 2 cm discs, press into tins with wet thumbs.',
    'Custard: 250 ml milk, 6 yolks, 200 g sugar; lemon peel and a cinnamon stick in the syrup (cook to 105°C).',
    'Bake at the hottest setting (290°C if the oven allows) for 8–9 minutes until blistered.',
    'Dust with cinnamon and powdered sugar. Eat warm, standing up, like a local.',
  ], { at: '2025-07-21 20:30' }),
  text('Sourdough schedule.pdf', [
    'Sourdough schedule (Saturday bake)',
    'Fri 9 pm — feed starter 1:5:5 · Sat 8 am — autolyse 900 g flour + 650 g water',
    'Sat 9 am — add 180 g starter + 20 g salt; 4 sets of stretch-and-folds every 30 minutes',
    'Sat 1 pm — shape, cold proof overnight · Sun 8 am — bake at 250°C, 20 min lid on, 22 min lid off',
  ], { at: '2023-03-05 10:15' }),
  text("Victor's Sunday chili.docx", [
    "Victor's Sunday chili (the big pot)",
    '1 kg ground beef, 2 onions, 1 red pepper, 4 garlic cloves, 2 chipotles in adobo.',
    'Spices: 2 tbsp chili powder, 1 tbsp cumin, 1 tsp smoked paprika, 1 tsp cocoa.',
    '2 cans kidney beans, 2 cans crushed tomatoes, 1 bottle of dark beer. Simmer 2 hours.',
    'Toppings bar: sour cream, sharp cheddar, pickled jalapeños, cornbread on the side.',
  ], { at: '2025-01-19 13:00', since: '2023-10-15 12:00' }),
  table('Thanksgiving plan 2025.xlsx',
    ['Dish', 'Who', 'Prep day', 'Oven time'],
    [
      ['Turkey (dry brined)', 'Victor', 'Tue', '3 h 30 m at 165°C'],
      ['Stuffing', 'Amanda', 'Wed', '45 m'],
      ['Mashed potatoes', 'Elena', 'Thu', '—'],
      ['Green bean casserole', 'Grandma Lucia', 'Thu', '30 m'],
      ['Cranberry sauce', 'Amanda', 'Mon', '—'],
      ['Pumpkin pie', 'Elena', 'Wed', '55 m'],
      ['Pecan pie', 'The Lindqvists (next door)', '—', '—'],
      ['Dinner rolls', 'Store-bought', '—', '10 m'],
    ],
    { at: '2025-11-23 21:30', since: '2025-11-09 20:00' }),
], '2022-10-01')

const letters = dir('Letters', [
  text('Letter to HOA - fence approval.docx', [
    "To the Larkspur Lane Homeowners' Association — Architectural Committee",
    'Re: request to replace the rear fence at No. 18',
    'We would like to replace the existing 5 ft cedar fence with a 6 ft horizontal-slat fence in the same stain (sample attached).',
    'The new fence will stay within our property line as shown on the 2019 survey.',
    'Thank you for considering our request. — Amanda & Victor Reyes',
  ], { at: '2025-04-06 20:10' }),
  f('Reference letter - Sam Ito.docx', { at: '2024-06-12 21:00' }),
  f('Thank-you note - Grandma Lucia.docx', { at: '2026-06-20 19:30' }),
  f('Letter to the library board - Sunday hours.docx', { at: '2025-09-14 16:45' }),
], '2022-11-13')

const travel = dir('Travel Plans', [
  text('Ideas - 2027 trip (Patagonia vs Norway).docx', [
    '2027 trip — Patagonia vs Norway',
    "Patagonia: Torres del Paine W trek (5 days), best Dec–Mar → only works over Elena's winter break.",
    'Norway: fjords by train + Bergen in mid-July; easier logistics, and Victor wants the jazz festival.',
    'Budget guess for three: ~$14K Patagonia vs ~$11K Norway.',
    'Decide by Thanksgiving so we can book flights with points.',
  ], { at: '2026-10-11 21:20', since: '2026-09-27 20:00' }),
  text('Kyoto 2026 itinerary.docx', [
    'Kyoto & Nara · 3–11 April 2026 · Amanda, Victor & Elena',
    'Fri 3 — land at KIX 15:40 → Haruka express → check in at the Gion ryokan (2 nights)',
    'Sat 4 — Fushimi Inari at dawn, Tofuku-ji, lunch at Nishiki Market',
    'Sun 5 — Arashiyama bamboo grove, Okochi Sanso garden, Hozu river boat',
    'Mon 6 — Philosopher’s Path blossoms, Ginkaku-ji, tea ceremony at 15:00 · Tue 7 — Nara: deer park, Todai-ji',
    'Wed 8 — Kyoto Station architecture walk (Elena’s day) · Thu 9 — Kobe: carpentry tools museum (Amanda’s pick!)',
    'Fri 10 — Kiyomizu-dera at sunset, farewell kaiseki dinner',
    'Sat 11 — fly home from KIX 17:55. JR passes and ryokan confirmation are in Downloads.',
  ], { at: '2026-03-28 21:15', since: '2025-12-30 20:00', size: 286_720 }),
  f('Kyoto 2026 budget.xlsx', { at: '2026-04-19 20:00', since: '2025-12-30 20:30' }),
  f('Lisbon 2025 itinerary.docx', { at: '2025-07-08 22:00', since: '2025-03-16 20:00' }),
  f('Packing list template.docx', { at: '2025-07-10 21:00', since: '2024-11-02 20:00' }),
  text('Passport renewal checklist.txt', [
    "Passport renewal — Victor's expires February 2027!",
    '[x] Photo (2 × 2 in, plain white background)',
    '[ ] Form + old passport + fee',
    '[ ] Mail by 15 Nov to be safe for spring travel',
  ], { at: '2026-10-03 10:30', since: '2026-09-26 21:00' }),
], '2024-11-02')

const home = dir('Home', [
  dir('Manuals', files('Espresso machine manual.pdf', 'Garage door opener manual.pdf', 'Lawn mower manual.pdf', 'Thermostat manual.pdf'), '2022-09-24'),
  dir('Warranties', [
    ...files('Dishwasher warranty.pdf', 'Furnace warranty - 2023.pdf', 'Roof warranty 2021.pdf'),
    f('Washer & dryer warranty.pdf', { at: '2025-02-16 14:00' }),
  ], '2022-09-24'),
  f('Contractor contacts.xlsx', { at: '2026-06-10 20:00', since: '2022-10-02 19:00' }),
  f('Home inventory for insurance.xlsx', { at: '2026-06-14 15:30', since: '2023-01-29 14:00' }),
  f('Home maintenance schedule.xlsx', { at: '2026-09-20 10:15', since: '2022-10-02 19:30' }),
  text('Paint colours by room.txt', [
    'Paint by room (all eggshell unless noted)',
    "Living room — 'Harbor Fog' warm grey; trim 'Chalk White' semi-gloss",
    "Kitchen — 'Sage Leaf' (may change to 'Linen' after the renovation)",
    "Elena's room — 'Midnight Ink' accent wall",
    "Front door — 'Persimmon' gloss (repainted May 2026)",
  ], { at: '2026-05-23 17:40', since: '2023-04-08 15:00' }),
], '2022-09-24')

const elenaUni = dir('Elena - University', [
  f('Financial aid award 2026-27.pdf', { at: '2026-04-02 18:30' }),
  f('Housing contract 2026-27.pdf', { at: '2026-05-28 20:10' }),
  f('Meal plan options.pdf', { at: '2026-06-03 19:45' }),
  text('Move-in checklist August 2026.docx', [
    'Move-in day — Sat 22 August 2026, Whitcombe Hall room 314',
    '[x] Bedding (twin XL!), desk lamp, power strip, drafting lamp for studio',
    '[x] Parking pass for the unloading zone, 9:00–9:45 slot',
    '[x] Studio supplies: cutting mat, steel ruler, scalpel set, foam board',
    '[ ] Set up tuition autopay before 1 September',
  ], { at: '2026-08-20 22:05', since: '2026-07-26 20:00' }),
  f('Scholarship renewal - Hollander Foundation.pdf', { at: '2026-07-14 12:20' }),
  f('Tuition - Fall 2026 statement.pdf', { at: '2026-07-01 08:15' }),
  f('Tuition - Spring 2027 statement.pdf', { at: '2026-10-19 08:20' }),
  f('Tuition payment plan 2026-27.xlsx', { at: '2026-08-29 21:30', since: '2026-07-02 20:00' }),
], '2025-10-15')

export const documents: SeedFolder = dir('Documents', [
  business,
  elenaUni,
  home,
  letters,
  medical,
  personalFinance,
  recipes,
  travel,
  f('Amanda Reyes - board bio.docx', { at: '2025-01-27 20:30' }),
  f('Resume - Amanda Reyes (2025).docx', { at: '2025-02-02 21:15', since: '2022-10-23 20:00' }),
], '2022-09-03 10:41')
