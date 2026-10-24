// C:\Users\Amanda\OneDrive - Alder & Finch — the flagship business district.
//
// Alder & Finch Co. is a fictional maker of furniture and home goods: a
// workshop at 14 Mill Road, a showroom at 220 Canal Street, e-commerce,
// contract & hospitality clients and trade (designer) accounts. Fiscal year =
// calendar year. "Now" is late October 2026: Q3 2026 has just closed, the
// board met on Thu 22 Oct 2026 and the FY2027 budget is in draft.
//
// The numbers reconcile across files:
//   Revenue  FY2024 $17.9M · FY2025 $19.6M · FY2026 forecast $21.8M · FY2027 budget $24.1M
//   Quarters 2025: 4.40 / 4.75 / 4.90 / 5.55 · 2026: 4.85 / 5.30 / 5.45 / (6.20 forecast)
//   Q3 2026: gross margin 45.3%, EBITDA $475K; cash $2.9M and AR $2.64M at 30 Sep;
//   inventory $1,926,250 at 30 Sep; 118 people.
//
// People (all fictional): Thomas Finch (CEO, co-founder), Ruth Alder (Chair,
// co-founder), Amanda Reyes (Finance & Operations Director), Priya Natarajan
// (Controller), Sam Ito (FP&A), Ben Kowalski (Workshop Manager), Ines Laurent
// (Head of Design), Marisol Duarte (Head of Contract & Trade), Jonah Wells
// (Head of Retail & E-commerce), Kate Morrow (People & Culture), Dev Sharma
// (Logistics Lead). Board: Gordon Achebe, Helen Marchetti, Leo Brandt.

import type { SeedFolder, SeedNode } from '../seedTypes'
import { addDays, between, dir, f, files, photo, table, text } from './helpers'

const DEPARTMENTS = [
  'Retail Showrooms',
  'E-commerce & Marketing',
  'Contract & Trade Sales',
  'Design & Product Development',
  'Operations & Logistics',
  'Finance, HR & Admin',
  'Technology & Facilities',
]

// ───────────────────────────── Finance ─────────────────────────────

const fy2025 = dir('FY2025', [
  f('FY2025 Operating Budget - FINAL.xlsx', { at: '2025-01-13 17:20', since: '2024-09-02 09:00' }),
  f('FY2025 Operating Budget - Board approved.pdf', { at: '2025-01-24 11:05' }),
  f('Budget assumptions.docx', { at: '2024-11-28 15:40', since: '2024-08-20 10:00' }),
  f('Capex requests.xlsx', { at: '2024-11-19 10:15', since: '2024-09-09 09:30' }),
  f('Headcount plan FY2025.xlsx', { at: '2024-11-22 14:00', since: '2024-09-16 09:00' }),
], '2024-08-12')

const fy2026 = dir('FY2026', [
  dir('Department budgets', DEPARTMENTS.map((d) => f(`${d} - FY2026.xlsx`)), '2025-09-01'),
  f('FY2026 Operating Budget - FINAL.xlsx', { at: '2026-01-12 18:05', since: '2025-09-01 09:00' }),
  f('FY2026 Budget - Board presentation.pptx', { at: '2026-01-20 09:30', since: '2026-01-14 10:00' }),
  f('Budget assumptions.docx', { at: '2025-11-26 16:10', since: '2025-08-25 10:00' }),
  f('Capex requests.xlsx', { at: '2025-11-14 11:45', since: '2025-09-08 09:00' }),
  f('Headcount plan FY2026.xlsx', { at: '2025-11-21 13:30', since: '2025-09-15 09:00' }),
  f('Mid-year budget review - July 2026.xlsx', { at: '2026-07-16 17:45', since: '2026-07-06 09:00' }),
  table('FY2026 Budget vs Actual - Sep 2026.xlsx',
    ['Line', 'FY2026 Budget', 'YTD Actual (Sep)', 'Full-year Forecast', 'Forecast vs Budget'],
    [
      ['Net revenue', '$21,400,000', '$15,600,000', '$21,800,000', '+1.9%'],
      ['Gross margin', '$9,544,400', '$7,035,000', '$9,810,000', '+2.8%'],
      ['Total operating expenses', '$7,880,000', '$5,890,000', '$7,960,000', '+1.0%'],
      ['EBITDA', '$1,664,400', '$1,145,000', '$1,850,000', '+11.2%'],
      ['EBITDA margin', '7.8%', '7.3%', '8.5%', '+0.7 pts'],
      ['Headcount (FTE)', '120', '118', '118', '-2'],
    ],
    { at: '2026-10-13 16:20', since: '2026-10-05 09:10' }),
], '2025-08-18')

const fy2027 = dir('FY2027', [
  dir('Department budgets', between('2026-09-01', '2026-09-11 17:00', DEPARTMENTS.map((d) => f(`${d} - FY2027.xlsx`))), '2026-08-31'),
  text('Budget calendar FY2027.pdf', [
    'FY2027 budget calendar',
    '17 Aug — kick-off; templates to department heads',
    '11 Sep — department submissions due; DRAFT v1 consolidated',
    '2 Oct — DRAFT v2 to CEO review · 21 Oct — DRAFT v3 for the board framework (22 Oct)',
    '3 Dec — final budget circulated · 10 Dec — board approval (FY2026 was approved in January)',
  ], { at: '2026-08-19 10:30', since: '2026-08-18 15:00' }),
  f('FY2027 Operating Budget - DRAFT v1.xlsx', { at: '2026-09-11 18:40', since: '2026-08-24 09:10' }),
  f('FY2027 Operating Budget - DRAFT v2.xlsx', { at: '2026-10-02 19:15', since: '2026-09-14 08:30' }),
  table('FY2027 Operating Budget - DRAFT v3.xlsx',
    ['Line / Department', 'FY2026 Forecast', 'FY2027 Budget', 'Change', 'Change %'],
    [
      ['Net revenue', '$21,800,000', '$24,100,000', '$2,300,000', '10.6%'],
      ['Gross margin', '$9,810,000', '$11,086,000', '$1,276,000', '13.0%'],
      ['Retail Showrooms', '$1,640,000', '$2,180,000', '$540,000', '32.9%'],
      ['E-commerce & Marketing', '$1,420,000', '$1,585,000', '$165,000', '11.6%'],
      ['Contract & Trade Sales', '$980,000', '$1,075,000', '$95,000', '9.7%'],
      ['Design & Product Development', '$760,000', '$840,000', '$80,000', '10.5%'],
      ['Operations & Logistics', '$1,310,000', '$1,402,000', '$92,000', '7.0%'],
      ['Finance, HR & Admin', '$1,050,000', '$1,104,000', '$54,000', '5.1%'],
      ['Technology & Facilities', '$800,000', '$890,000', '$90,000', '11.3%'],
      ['Total operating expenses', '$7,960,000', '$9,076,000', '$1,116,000', '14.0%'],
      ['EBITDA', '$1,850,000', '$2,010,000', '$160,000', '8.6%'],
      ['EBITDA margin', '8.5%', '8.3%', '-0.2 pts', '—'],
    ],
    { at: '2026-10-21 16:42', since: '2026-10-07 08:55', size: 1_486_212 }),
  text('Budget assumptions.docx', [
    'FY2027 budget assumptions — working draft for DRAFT v3 (20 Oct 2026)',
    'Revenue +10.6% to $24.1M: Contract & Hospitality +14%, e-commerce +12%, showrooms +8.9% incl. Harbor Street from August 2027 ($0.45M).',
    'Gross margin 46.0% (FY2026: 45.0%): walnut and white oak flat; freight at Northgate contract rates (fixed to March 2028).',
    'Headcount 118 → 127 FTE: 6 for Harbor Street, 2 workshop finishers, 1 FP&A analyst.',
    'Wage inflation 3.5%; benefits renewal +6% (see Payroll\\Benefits renewal 2027).',
    'Capex $1.42M (Capex requests.xlsx), of which $780K Harbor Street fit-out.',
    'Open: lease start date with Brightwater Properties; Oakridge phase 3 timing.',
  ], { at: '2026-10-20 18:05', since: '2026-08-24 11:00' }),
  table('Capex requests.xlsx',
    ['Request', 'Department', 'Amount', 'Priority', 'Status'],
    [
      ['Harbor Street showroom fit-out', 'Retail', '$780,000', '1', 'In budget'],
      ['Second CNC router', 'Workshop', '$265,000', '1', 'In budget'],
      ['ERP upgrade (phase 1)', 'Technology', '$145,000', '2', 'In budget'],
      ['Electric delivery van', 'Logistics', '$82,000', '2', 'In budget'],
      ['Spray booth filtration upgrade', 'Workshop', '$68,000', '1', 'In budget (safety)'],
      ['Dust extraction expansion', 'Workshop', '$56,000', '2', 'In budget'],
      ['Canal Street lighting refresh', 'Retail', '$38,000', '3', 'Deferred to H2'],
      ['Photo studio equipment', 'Marketing', '$24,000', '3', 'In budget'],
      ['Total requested', '', '$1,458,000', '', ''],
      ['Total in budget', '', '$1,420,000', '', ''],
    ],
    { at: '2026-10-16 12:20', since: '2026-08-31 09:00' }),
  f('Headcount plan FY2027.xlsx', { at: '2026-10-19 15:35', since: '2026-09-07 10:00' }),
  text('Budget review notes - Thomas.docx', [
    'Comments on DRAFT v2 — T. Finch, 5 Oct',
    '• Revenue: comfortable with contract +14% if Oakridge phase 3 signs by February.',
    '• Marketing: hold e-commerce spend to +12%, not +18%.',
    '• Harbor Street: move opening to August; keep pre-opening costs under $220K.',
    '• Headcount: approve the FP&A analyst; defer the second designer to H2.',
    'Amanda — can we get v3 into the board pre-read by the 16th?',
  ], { at: '2026-10-05 21:10', since: '2026-10-05 19:30' }),
], '2026-08-17')

const budgets = dir('Budgets', [
  fy2025,
  fy2026,
  fy2027,
  f('Budget process guide.docx', { at: '2025-08-11 14:20', since: '2023-08-14 10:00' }),
  f('Budget template v5.xlsx', { at: '2026-08-14 16:00', since: '2023-08-14 10:30' }),
  f('FY2024 budget (archive).zip', { at: '2024-02-05 09:40' }),
], '2023-08-14')

const forecasts = dir('Forecasts', [
  dir('Archive', files('Cash Flow Forecast 2025-2026.xlsx', 'Revenue Forecast by Channel - FY2026 v2.xlsx'), '2025-10-06'),
  dir('Scenarios', between('2026-09-22', '2026-10-14', [
    f('Base case.xlsx'),
    f('Downside case.xlsx'),
    f('Upside case.xlsx'),
    f('Sensitivity - timber prices.xlsx'),
    text('Scenario summary.docx', [
      'FY2027 scenarios — October 2026',
      'Base: revenue $24.1M, EBITDA $2.01M; minimum cash $2.05M in May 2027.',
      'Upside: Oakridge phase 3 plus two new hotel groups → revenue $25.6M, EBITDA $2.62M.',
      'Downside: contract orders -20%, timber +8% → revenue $21.9M, EBITDA $0.94M; minimum cash $1.12M, revolver drawn from April 2027.',
      'Trigger to pause Harbor Street: Q1 2027 contract order book below $2.0M.',
    ], { at: '2026-10-14 17:30', since: '2026-09-28 10:00' }),
  ]), '2026-09-21'),
  table('Cash Flow Forecast 2026-2027.xlsx',
    ['Month', 'Opening cash', 'Receipts', 'Payments', 'Net flow', 'Closing cash'],
    [
      ['Oct 2026', '$2,900,000', '$1,980,000', '$2,040,000', '($60,000)', '$2,840,000'],
      ['Nov 2026', '$2,840,000', '$2,150,000', '$1,960,000', '$190,000', '$3,030,000'],
      ['Dec 2026', '$3,030,000', '$2,320,000', '$2,210,000', '$110,000', '$3,140,000'],
      ['Jan 2027', '$3,140,000', '$1,720,000', '$1,890,000', '($170,000)', '$2,970,000'],
      ['Feb 2027', '$2,970,000', '$1,610,000', '$1,780,000', '($170,000)', '$2,800,000'],
      ['Mar 2027', '$2,800,000', '$1,840,000', '$2,260,000', '($420,000)', '$2,380,000'],
      ['Apr 2027', '$2,380,000', '$1,890,000', '$2,180,000', '($290,000)', '$2,090,000'],
      ['May 2027', '$2,090,000', '$2,010,000', '$2,050,000', '($40,000)', '$2,050,000'],
      ['Jun 2027', '$2,050,000', '$2,080,000', '$1,930,000', '$150,000', '$2,200,000'],
      ['Jul 2027', '$2,200,000', '$2,040,000', '$1,900,000', '$140,000', '$2,340,000'],
      ['Aug 2027', '$2,340,000', '$2,110,000', '$1,950,000', '$160,000', '$2,500,000'],
      ['Sep 2027', '$2,500,000', '$2,170,000', '$1,980,000', '$190,000', '$2,690,000'],
    ],
    { at: '2026-10-19 17:55', since: '2026-09-28 09:20', size: 912_448 }),
  table('Revenue Forecast by Channel.xlsx',
    ['Channel', 'FY2025 Actual', 'FY2026 Forecast', 'FY2027 Budget', 'FY2027 Growth'],
    [
      ['Showroom retail', '$5,200,000', '$5,600,000', '$6,100,000', '8.9%'],
      ['E-commerce', '$4,100,000', '$4,600,000', '$5,150,000', '12.0%'],
      ['Contract & Hospitality', '$7,300,000', '$8,200,000', '$9,350,000', '14.0%'],
      ['Trade & Wholesale', '$3,000,000', '$3,400,000', '$3,500,000', '2.9%'],
      ['Total', '$19,600,000', '$21,800,000', '$24,100,000', '10.6%'],
    ],
    { at: '2026-10-15 14:10', since: '2026-02-03 10:00' }),
  f('FY2026 Full-year outlook (9+3).xlsx', { at: '2026-10-12 16:30', since: '2026-10-05 09:00' }),
  f('Forecast methodology.docx', { at: '2025-03-18 11:00', since: '2023-02-06 14:00' }),
  f('Rolling 13-week cash.xlsx', { at: '2026-10-23 08:50', since: '2026-01-05 09:00' }),
], '2023-02-06')

interface QuarterSpec {
  year: number
  q: number
  created: string
  commentary: string[]
}

/** A closed quarter's reporting pack (dates derived from when the close started). */
function quarterPack({ year, q, created, commentary }: QuarterSpec): SeedFolder {
  const tag = `Q${q} ${year}`
  return dir(`${year} Q${q}`, [
    f(`${tag} Balance Sheet.xlsx`),
    f(`${tag} Board Report.pdf`),
    text(`${tag} Management Commentary.docx`, commentary),
    f(`${tag} P&L.xlsx`),
  ], created)
}

const closedQuarters: QuarterSpec[] = [
  { year: 2025, q: 1, created: '2025-04-01', commentary: [
    'Q1 2025 management commentary — A. Reyes',
    'Net revenue $4.40M, +8.6% YoY; gross margin 44.1%.',
    'Showroom traffic soft in January; contract orders strong after the Oakridge Hotels MSA took effect on 1 March.',
    'Walnut and white oak up 6% since December — dining range price increase from April.',
  ] },
  { year: 2025, q: 2, created: '2025-07-01', commentary: [
    'Q2 2025 management commentary — A. Reyes',
    'Net revenue $4.75M, +10.5% YoY; gross margin 44.6%.',
    'Oakridge SOW 01 (Lakeside Inn, 52 rooms) delivered on time and on budget.',
    'E-commerce +14% YoY after the summer outdoor collection launch.',
  ] },
  { year: 2025, q: 3, created: '2025-10-01', commentary: [
    'Q3 2025 management commentary — A. Reyes',
    'Net revenue $4.90M, +10.1% YoY; gross margin 44.5%; EBITDA $365K (7.4%).',
    'Juniper & Vale Restaurants MSA signed 1 September: banquette seating for three sites.',
    'Freight costs remain elevated; carrier tender planned for Q1 2026.',
  ] },
  { year: 2025, q: 4, created: '2026-01-02', commentary: [
    'Q4 2025 management commentary — A. Reyes',
    'Net revenue $5.55M, +8.8% YoY; gross margin 43.9% (holiday discounting, freight).',
    'Record holiday quarter at Canal Street: $1.62M showroom sales.',
    'Full year 2025: revenue $19.6M (+9.5%), EBITDA $1.52M (7.8%).',
  ] },
  { year: 2026, q: 1, created: '2026-04-01', commentary: [
    'Q1 2026 management commentary — A. Reyes',
    'Net revenue $4.85M, +10.2% YoY; gross margin 44.9%.',
    'Crescent Bay Resorts MSA signed 15 February — villa furniture package, first deliveries in Q3.',
    'New Northgate Freight agreement from 1 April cuts the cost per delivery by about 7%.',
  ] },
  { year: 2026, q: 2, created: '2026-07-01', commentary: [
    'Q2 2026 management commentary — A. Reyes',
    'Net revenue $5.30M, +11.6% YoY; gross margin 45.1%.',
    'Pinecrest Senior Living MSA signed 1 May; e-commerce replatform went live 9 June with no downtime.',
    'Full-year outlook raised from the $21.4M budget to $21.8M.',
  ] },
]

const q3_2026 = dir('2026 Q3', [
  table('Q3 2026 Balance Sheet.xlsx',
    ['Line', '30 Sep 2026', '30 Jun 2026', '31 Dec 2025'],
    [
      ['Cash', '$2,900,000', '$2,610,000', '$2,450,000'],
      ['Accounts receivable', '$2,640,000', '$2,380,000', '$2,210,000'],
      ['Inventory', '$1,926,250', '$1,868,400', '$1,742,000'],
      ['Property & equipment (net)', '$3,480,000', '$3,415,000', '$3,360,000'],
      ['Other assets', '$410,000', '$395,000', '$380,000'],
      ['Total assets', '$11,356,250', '$10,668,400', '$10,142,000'],
      ['Accounts payable', '$1,720,000', '$1,610,000', '$1,540,000'],
      ['Customer deposits', '$1,180,000', '$1,050,000', '$890,000'],
      ['Accrued expenses', '$707,250', '$439,400', '$310,000'],
      ['Equipment loan', '$620,000', '$680,000', '$790,000'],
      ['Total liabilities', '$4,227,250', '$3,779,400', '$3,530,000'],
      ["Shareholders' equity", '$7,129,000', '$6,889,000', '$6,612,000'],
    ],
    { at: '2026-10-14 17:55', since: '2026-10-05 08:45' }),
  text('Q3 2026 Board Report.pdf', [
    'Alder & Finch Co. — Q3 2026 Board Report · prepared for the 22 October 2026 meeting',
    'Net revenue $5.45M, +11.2% YoY; year to date $15.6M, on track for the $21.8M full-year forecast.',
    'Gross margin 45.3% (+0.8 pts) as walnut costs eased and workshop scrap fell to 6.1%.',
    'EBITDA $475K (8.7% margin), up from $365K in Q3 2025.',
    'Contract & Hospitality led growth: Oakridge Hotels Riverside phase 2 (84 guest rooms) delivered in August.',
    'Cash $2.9M at 30 September; $1.5M Kestrel Bank revolver undrawn.',
    'For decision: FY2027 budget framework (draft v3) and the Harbor Street lease negotiation mandate.',
  ], { at: '2026-10-16 11:30', since: '2026-10-16 11:28', size: 3_412_906 }),
  f('Q3 2026 Cash Flow Statement.xlsx', { at: '2026-10-14 18:10', since: '2026-10-06 09:00' }),
  f('Q3 2026 KPI Dashboard.pdf', { at: '2026-10-15 10:05' }),
  text('Q3 2026 Management Commentary.docx', [
    'Q3 2026 management commentary — A. Reyes · final, 14 Oct 2026',
    'Net revenue $5.45M, +11.2% YoY; YTD $15.6M against a $21.8M full-year forecast.',
    'Gross margin 45.3% (+0.8 pts): walnut prices eased and workshop scrap fell to 6.1%.',
    'EBITDA $475K (8.7%); operating income $335K.',
    'Contract & Hospitality +19%: Oakridge Riverside phase 2 (84 rooms) delivered in August.',
    'Watch: Halden Workspace MSA expires 31 October — renewal at revised pricing in negotiation.',
  ], { at: '2026-10-14 19:20', since: '2026-10-08 10:00' }),
  table('Q3 2026 P&L.xlsx',
    ['Line item', 'Q3 2026', 'Q3 2025', 'YoY', 'YTD 2026'],
    [
      ['Net revenue', '$5,450,000', '$4,900,000', '+11.2%', '$15,600,000'],
      ['Cost of goods sold', '($2,980,000)', '($2,720,000)', '+9.6%', '($8,565,000)'],
      ['Gross profit', '$2,470,000', '$2,180,000', '+13.3%', '$7,035,000'],
      ['Gross margin', '45.3%', '44.5%', '+0.8 pts', '45.1%'],
      ['Selling & marketing', '($1,010,000)', '($915,000)', '+10.4%', '($2,980,000)'],
      ['Operations & logistics', '($420,000)', '($395,000)', '+6.3%', '($1,250,000)'],
      ['General & administrative', '($565,000)', '($505,000)', '+11.9%', '($1,660,000)'],
      ['Total operating expenses', '($1,995,000)', '($1,815,000)', '+9.9%', '($5,890,000)'],
      ['EBITDA', '$475,000', '$365,000', '+30.1%', '$1,145,000'],
      ['EBITDA margin', '8.7%', '7.4%', '+1.3 pts', '7.3%'],
      ['Depreciation & amortization', '($140,000)', '($128,000)', '+9.4%', '($415,000)'],
      ['Operating income', '$335,000', '$237,000', '+41.4%', '$730,000'],
    ],
    { at: '2026-10-14 17:40', since: '2026-10-05 08:30', size: 684_310 }),
  f('Q3 2026 Variance analysis.xlsx', { at: '2026-10-13 16:45', since: '2026-10-07 09:30' }),
], '2026-10-01')

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September']
const mm = (i: number) => String(i + 1).padStart(2, '0')

const reports = dir('Reports', [
  dir('Annual', [
    dir('2024', [
      text('Annual Report 2024.pdf', [
        'Alder & Finch Co. — Annual Report 2024',
        'Revenue $17.9M (+8.1%); 104 colleagues; 2,900 pieces built at Mill Road.',
        'Highlights: first hotel contract over $1M, the Linden dining range, and our 10th year on Canal Street.',
      ], { at: '2025-05-08 15:00', since: '2025-04-28 10:00' }),
      f('Annual Report 2024 - CEO letter.docx', { at: '2025-03-05 17:30', since: '2025-02-20 10:00' }),
      f('Audited Financial Statements 2024.pdf', { at: '2025-04-25 12:00' }),
    ], '2025-02-17'),
    dir('2025', [
      text('Annual Report 2025.pdf', [
        'Alder & Finch Co. — Annual Report 2025',
        'Revenue grew 9.5% to $19.6M; EBITDA $1.52M (7.8% margin).',
        'Contract & Hospitality became our largest channel at $7.3M, led by the Oakridge Hotels partnership.',
        'We opened the finishing room at Mill Road and cut workshop scrap from 8.4% to 6.9%.',
        '112 colleagues at year end, 41 of them in the workshop.',
      ], { at: '2026-05-06 15:00', since: '2026-04-27 10:00', size: 8_904_220 }),
      f('Annual Report 2025 - CEO letter.docx', { at: '2026-03-04 16:50', since: '2026-02-19 10:00' }),
      f('Annual Report 2025 - design proofs.pdf', { at: '2026-04-30 18:20' }),
      f('Annual Report 2025 - photography brief.docx', { at: '2026-03-02 11:15', since: '2026-02-24 09:00' }),
      f('Audited Financial Statements 2025.pdf', { at: '2026-04-24 12:00' }),
    ], '2026-02-16'),
  ], '2025-02-17'),
  dir('Monthly Flash', MONTHS.map((m, i) => f(`Monthly flash - 2026-${mm(i)} ${m}.pdf`, { at: `2026-${mm(i + 1)}-09 09:30` })), '2026-02-09 08:00'),
  dir('Quarterly', [
    ...closedQuarters.map(quarterPack),
    q3_2026,
    f('2023-2024 quarterly packs.zip', { at: '2025-01-20 10:10' }),
  ], '2023-04-03'),
  f('Reporting calendar 2026.xlsx', { at: '2026-01-07 10:00', since: '2025-12-15 09:00' }),
], '2023-04-03')

const audits = dir('Audits', [
  dir('FY2024 Audit', files(
    'Audit adjustments.xlsx',
    'Engagement letter - Hartwell & Pryce LLP.pdf',
    'Management letter.pdf',
    'PBC request list.xlsx',
  ), '2025-01-13'),
  dir('FY2025 Audit', [
    ...files('Audit adjustments.xlsx', 'Engagement letter - Hartwell & Pryce LLP.pdf', 'PBC request list.xlsx'),
    text('Management letter.pdf', [
      'Hartwell & Pryce LLP — Management letter, FY2025 audit (16 April 2026)',
      '1. Inventory: Mill Road cycle counts were not signed off for two months in Q3 — recommend monthly sign-off. (Medium)',
      '2. Access: three former employees kept ERP access after leaving. (High — resolved March 2026)',
      '3. Revenue cut-off: contract deliveries spanning year end need a delivery-note check. (Low)',
      'Prior-year points: 4 of 5 closed.',
    ], { at: '2026-04-16 15:20' }),
    f('Representation letter - signed.pdf', { at: '2026-04-23 17:05' }),
  ], '2026-01-12'),
  dir('FY2026 Audit Planning', between('2026-09-14', '2026-10-15', [
    text('Audit timeline.docx', [
      'FY2026 audit timeline (agreed with Hartwell & Pryce, Sep 2026)',
      'Interim fieldwork: 16–20 November · year-end stock count: 31 December, Mill Road + Canal Street',
      'Final fieldwork: 8–19 February 2027 · audit committee: 1 April · board approval: 22 April 2027',
    ]),
    f('Engagement letter FY2026 - draft.pdf'),
    f('Interim fieldwork schedule.xlsx'),
  ]), '2026-09-14'),
  f('Internal controls matrix.xlsx', { at: '2026-03-27 14:30', since: '2024-01-15 10:00' }),
], '2024-01-15')

const tax = dir('Tax', [
  dir('Sales Tax', [
    f('Nexus review 2026.xlsx', { at: '2026-06-08 15:10' }),
    f('Sales tax return 2025 Q4.pdf', { at: '2026-01-19 11:00' }),
    f('Sales tax return 2026 Q1.pdf', { at: '2026-04-17 11:00' }),
    f('Sales tax return 2026 Q2.pdf', { at: '2026-07-17 11:00' }),
    f('Sales tax return 2026 Q3.pdf', { at: '2026-10-16 10:40' }),
  ], '2025-01-06'),
  f('2024 Corporate Tax Return.pdf', { at: '2025-09-12 16:00' }),
  f('2025 Corporate Tax Return.pdf', { at: '2026-09-11 16:00' }),
  f('Estimated tax payments 2026.xlsx', { at: '2026-09-14 10:20', since: '2026-01-08 09:00' }),
  f('Property tax - Mill Road 2026.pdf', { at: '2026-04-02 09:15' }),
  f('R&D credit study 2025.pdf', { at: '2026-08-20 13:40' }),
  f('Tax provision FY2026 (draft).xlsx', { at: '2026-10-20 17:15', since: '2026-10-12 09:00' }),
], '2023-03-06')

const payroll = dir('Payroll', [
  dir('2026', MONTHS.map((_, i) => {
    const name = `Payroll summary 2026-${mm(i)}.xlsx`
    const at = `2026-${mm(i)}-27 16:00`
    if (i < 8) return f(name, { at })
    return table(name,
      ['Department', 'Headcount', 'Gross pay', 'Benefits & taxes', 'Total cost'],
      [
        ['Workshop & Production', '46', '$198,000', '$49,500', '$247,500'],
        ['Retail Showrooms', '18', '$64,800', '$16,200', '$81,000'],
        ['E-commerce & Marketing', '11', '$55,000', '$13,750', '$68,750'],
        ['Contract & Trade Sales', '9', '$52,500', '$13,125', '$65,625'],
        ['Design & Product Development', '7', '$40,800', '$10,200', '$51,000'],
        ['Operations & Logistics', '16', '$62,400', '$15,600', '$78,000'],
        ['Finance, HR & Admin', '8', '$46,000', '$11,500', '$57,500'],
        ['Technology & Facilities', '3', '$16,500', '$4,125', '$20,625'],
        ['Total', '118', '$536,000', '$134,000', '$670,000'],
      ],
      { at })
  }), '2026-01-26'),
  f('2025 payroll summaries.zip', { at: '2026-01-09 10:30' }),
  f('Benefits renewal 2027 - summary.pdf', { at: '2026-10-01 14:00' }),
  f('Bonus pool FY2026 (draft).xlsx', { at: '2026-10-19 18:30', since: '2026-10-12 09:00' }),
  f('Payroll calendar 2027.pdf', { at: '2026-10-08 09:45' }),
], '2023-01-23')

const receivable = dir('Receivable', [
  dir('2026-08', between('2026-08-03', '2026-08-31', files(
    'INV-2026-0841 Oakridge Hotels.pdf',
    'INV-2026-0842 Marlow Interiors.pdf',
    'INV-2026-0857 Crescent Bay Resorts.pdf',
    'INV-2026-0863 Halden Workspace.pdf',
  )), '2026-08-03'),
  dir('2026-09', between('2026-09-01', '2026-09-30', files(
    'INV-2026-0911 Oakridge Hotels.pdf',
    'INV-2026-0918 Juniper & Vale.pdf',
    'INV-2026-0926 Pinecrest Senior Living.pdf',
    'INV-2026-0934 Studio Brannock.pdf',
  )), '2026-09-01'),
  dir('2026-10', between('2026-10-01', '2026-10-23', files(
    'Credit note CN-2026-014 Juniper & Vale.pdf',
    'INV-2026-1004 Crescent Bay Resorts.pdf',
    'INV-2026-1012 Marlow Interiors.pdf',
    'INV-2026-1019 Oakridge Hotels.pdf',
  )), '2026-10-01'),
  table('AR aging 2026-09-30.xlsx',
    ['Customer', 'Current', '31-60 days', '61-90 days', 'Over 90', 'Total'],
    [
      ['Oakridge Hotels', '$612,000', '$184,000', '$0', '$0', '$796,000'],
      ['Crescent Bay Resorts', '$428,500', '$0', '$0', '$0', '$428,500'],
      ['Marlow Interiors', '$216,300', '$58,900', '$12,400', '$0', '$287,600'],
      ['Pinecrest Senior Living', '$188,000', '$0', '$0', '$0', '$188,000'],
      ['Halden Workspace', '$142,000', '$0', '$0', '$0', '$142,000'],
      ['Juniper & Vale', '$96,800', '$31,200', '$0', '$8,600', '$136,600'],
      ['Studio Brannock', '$44,700', '$9,800', '$0', '$0', '$54,500'],
      ['Other customers', '$512,000', '$71,000', '$18,400', '$5,400', '$606,800'],
      ['Total', '$2,240,300', '$354,900', '$30,800', '$14,000', '$2,640,000'],
    ],
    { at: '2026-10-02 15:40', since: '2026-10-01 09:00' }),
], '2023-01-09')

const payable = dir('Payable', [
  dir('2026-08', between('2026-08-03', '2026-08-31', files(
    'Blackwood Timber - Bill 44821.pdf',
    'Cobalt IT - Aug 2026.pdf',
    'Loomhouse Textiles - INV 7731.pdf',
    'Northgate Freight - Statement Jul 2026.pdf',
  )), '2026-08-03'),
  dir('2026-09', between('2026-09-01', '2026-09-30', files(
    'Blackwood Timber - Bill 45210.pdf',
    'Brightline Finishes - INV 2216.pdf',
    'Ferrand Hardware - INV 30988.pdf',
    'Mill Road Estates - Rent Q4 2026.pdf',
  )), '2026-09-01'),
  dir('2026-10', between('2026-10-01', '2026-10-23', files(
    'Blackwood Timber - Bill 45677.pdf',
    'Canal Street Holdings - Rent Oct 2026.pdf',
    'Hartwell & Pryce - Interim audit fee.pdf',
    'Northgate Freight - Statement Sep 2026.pdf',
  )), '2026-10-01'),
  f('AP aging 2026-09-30.xlsx', { at: '2026-10-02 15:55', since: '2026-10-01 09:00' }),
  f('Payment run schedule Q4 2026.xlsx', { at: '2026-10-05 10:30', since: '2026-09-29 09:00' }),
], '2023-01-09')

const closeMonth = (month: string, from: string, to: string) =>
  dir(month, between(from, to, files('Accruals & prepaids.xlsx', 'Bank reconciliation.xlsx', 'Close checklist.xlsx')), from)

const finance = dir('Finance', [
  audits,
  dir('Banking', [
    f('Bank signatories 2026.pdf', { at: '2026-02-03 11:00' }),
    f('Covenant compliance Q3 2026.xlsx', { at: '2026-10-15 16:25', since: '2026-10-09 09:00' }),
    f('Equipment loan schedule.xlsx', { at: '2026-09-30 17:00', since: '2024-04-02 10:00' }),
    f('Revolving credit facility - Kestrel Bank.pdf', { at: '2025-06-30 14:00' }),
  ], '2023-03-01'),
  budgets,
  forecasts,
  dir('Invoices', [payable, receivable], '2023-01-09'),
  dir('Month-End Close', [
    closeMonth('2026-07', '2026-08-03', '2026-08-12'),
    closeMonth('2026-08', '2026-09-01', '2026-09-10'),
    closeMonth('2026-09', '2026-10-01', '2026-10-09'),
    f('Close calendar 2026.xlsx', { at: '2026-01-06 10:00', since: '2025-12-18 09:00' }),
  ], '2023-02-01'),
  payroll,
  reports,
  tax,
  f('Chart of accounts 2026.xlsx', { at: '2026-01-05 15:00', since: '2023-01-16 10:00' }),
  f('Delegation of authority matrix.pdf', { at: '2025-06-12 12:30' }),
  f('Finance team calendar Q4 2026.xlsx', { at: '2026-10-01 08:40', since: '2026-09-28 09:00' }),
], '2023-01-09')

// ───────────────────────────── Contracts ─────────────────────────────

const clients = dir('Clients', [
  dir('Crescent Bay Resorts', [
    f('Change order 01 - teak finish.pdf', { at: '2026-06-18 15:00' }),
    f('Master Services Agreement - Crescent Bay Resorts.pdf', { at: '2026-02-13 16:30', since: '2026-01-20 10:00' }),
    f('NDA (superseded by MSA).pdf', { at: '2025-11-12 10:00' }),
    f('SOW 01 - Villa furniture package.pdf', { at: '2026-03-04 12:00' }),
    f('SOW 02 - Poolside daybeds.pdf', { at: '2026-07-22 14:40' }),
  ], '2025-11-10'),
  dir('Halden Workspace', [
    f('Master Services Agreement - Halden Workspace.pdf', { at: '2024-10-30 17:00', since: '2024-09-30 10:00' }),
    text('Renewal - draft MSA 2026.docx', [
      'Halden Workspace — MSA renewal, draft 2 (A. Reyes / M. Duarte), 22 Oct 2026',
      'Term: 1 Nov 2026 – 31 Oct 2028. Volume commitment $900K/yr (current spend ~$910K).',
      'Pricing: +4.5% list on meeting-room tables; phone booths held at 2025 prices for 12 months.',
      'Halden asks: 60-day payment terms (we offer 45) and a 3-year warranty on acoustic panels.',
    ], { at: '2026-10-22 18:10', since: '2026-10-06 09:30' }),
    f('Renewal pricing proposal.xlsx', { at: '2026-10-09 16:00', since: '2026-10-06 10:00' }),
    f('SOW 01 - Meeting room tables.pdf', { at: '2024-11-14 11:00' }),
    f('SOW 02 - Phone booths.pdf', { at: '2025-05-07 15:20' }),
  ], '2024-09-23'),
  dir('Juniper & Vale Restaurants', [
    f('Amendment 1 - Extension to Aug 2027.pdf', { at: '2026-05-19 10:45' }),
    f('Master Services Agreement - Juniper & Vale.pdf', { at: '2025-08-28 17:10', since: '2025-07-21 10:00' }),
    f('SOW 01 - Banquette seating, 3 sites.pdf', { at: '2025-09-10 12:30' }),
    f('Warranty claim - Oct 2026.docx', { at: '2026-10-13 11:20', since: '2026-10-12 15:00' }),
  ], '2025-07-14'),
  dir('Marlow Interiors', [
    f('Amendment 1 - Volume rebate.pdf', { at: '2025-06-03 14:00' }),
    f('Credit application - Marlow Interiors.pdf', { at: '2024-05-08 10:00' }),
    f('Trade Agreement - Marlow Interiors.pdf', { at: '2024-05-30 16:30', since: '2024-05-10 10:00' }),
    f('Trade price list 2026.xlsx', { at: '2026-01-09 09:30' }),
  ], '2024-05-06'),
  dir('Oakridge Hotels', [
    f('Amendment 1 - Payment terms.pdf', { at: '2025-09-04 15:30' }),
    f('Certificate of insurance 2026.pdf', { at: '2026-01-06 10:10' }),
    text('Master Services Agreement - Oakridge Hotels.pdf', [
      'MASTER SERVICES AGREEMENT',
      'between Alder & Finch Co. ("Supplier") and Oakridge Hotels Group, LLC ("Client")',
      'Effective 1 March 2025 · initial term 3 years, then renewing annually',
      'Scope: design, manufacture and installation of guest-room and public-area furniture under individual Statements of Work.',
      'Payment: 40% deposit on SOW signature, 50% on delivery, 10% after punch-list sign-off; net 30 (see Amendment 1).',
      'Warranty: 5 years on case goods and frames; 2 years on upholstery and finishes.',
      'Signed: Amanda Reyes, Finance & Operations Director · Marcus Okafor, VP Procurement, Oakridge Hotels',
    ], { at: '2025-02-27 16:10', since: '2025-02-03 09:40', size: 1_284_551 }),
    f('Pricing schedule 2026.xlsx', { at: '2026-01-14 13:00' }),
    f('SOW 01 - Lakeside Inn guest rooms.pdf', { at: '2025-03-12 11:30' }),
    f('SOW 02 - Riverside phase 2 (84 rooms).pdf', { at: '2026-03-18 16:45' }),
    text('SOW 03 - Lobby & lounge refresh (DRAFT).docx', [
      'SOW 03 — Riverside lobby & lounge refresh · DRAFT 3, 20 Oct 2026',
      'Scope: 2 reception desks, 46 lounge chairs, 12 communal tables, bar front in fluted white oak.',
      'Indicative value $612,000; deposit 40% on signature; install window 8–26 March 2027.',
      'Open items: fire rating for the bar front, freight to site, Marcus wants a 2% early-sign discount.',
    ], { at: '2026-10-20 17:35', since: '2026-09-24 10:00' }),
  ], '2025-01-20'),
  dir('Pinecrest Senior Living', files(
    'Accessibility specification.pdf',
    'Fabric approvals.xlsx',
    'Master Services Agreement - Pinecrest Senior Living.pdf',
    'SOW 01 - Common room seating.pdf',
  ), '2026-03-02'),
  dir('Studio Brannock', [
    f('Commission schedule.xlsx', { at: '2026-01-12 10:00' }),
    f('Designer program terms 2026.pdf', { at: '2026-01-05 14:00' }),
    f('Trade Agreement - Studio Brannock.pdf', { at: '2025-01-15 15:00', since: '2024-12-09 10:00' }),
  ], '2024-12-02'),
], '2023-01-09')

const vendors = dir('Vendors', [
  dir('Blackwood Timber Supply', [
    f('FSC chain of custody certificate.pdf', { at: '2026-02-10 09:00' }),
    f('Price list - Q4 2026.xlsx', { at: '2026-09-30 15:20' }),
    f('Supply Agreement 2025-2027.pdf', { at: '2024-12-18 16:00', since: '2024-11-25 10:00' }),
    f('Volume rebate terms.pdf', { at: '2024-12-18 16:05' }),
  ], '2023-02-13'),
  dir('Cobalt IT Services', [
    f('ERP upgrade proposal 2027.pdf', { at: '2026-09-22 11:30' }),
    f('Managed Services Agreement.pdf', { at: '2024-06-28 14:00' }),
    f('SLA schedule.pdf', { at: '2024-06-28 14:05' }),
  ], '2023-05-08'),
  dir('Ferrand Hardware Co', files('Price list 2026.xlsx', 'Quality spec - drawer slides.pdf', 'Supply Agreement.pdf'), '2023-03-20'),
  dir('Loomhouse Textiles', files('Fabric library 2026.pdf', 'Minimum order terms.pdf', 'Supply Agreement.pdf'), '2023-04-10'),
  dir('Northgate Freight', [
    f('Claims procedure.pdf', { at: '2026-03-27 10:00' }),
    f('Logistics Services Agreement.pdf', { at: '2026-03-25 17:30', since: '2026-02-16 10:00' }),
    f('Rate card 2026.xlsx', { at: '2026-03-25 17:35' }),
  ], '2026-02-16'),
], '2023-01-09')

const contracts = dir('Contracts', [
  clients,
  dir('Leases', [
    text('Harbor Street - Heads of terms (DRAFT v2).docx', [
      'Heads of terms — 41 Harbor Street (DRAFT v2, subject to contract)',
      'Landlord: Brightwater Properties · Tenant: Alder & Finch Co.',
      'Premises: ground-floor retail, 6,800 sq ft · term 10 years, break at year 5',
      'Rent: $238,000 per year headline ($35.00/sq ft), 6 months rent-free, landlord contribution $120K to shopfront',
      'Target access for fit-out: 1 March 2027 · opening August 2027',
    ], { at: '2026-10-20 15:50', since: '2026-09-29 10:00' }),
    f('Lease schedule.xlsx', { at: '2026-07-02 11:00', since: '2023-01-16 10:00' }),
    f('Showroom lease - 220 Canal Street.pdf', { at: '2023-01-16 10:30' }),
    f('Showroom lease - Amendment 2.pdf', { at: '2024-02-29 16:00' }),
    f('Workshop lease - 14 Mill Road.pdf', { at: '2023-01-16 10:20' }),
    f('Workshop lease - Rent review 2026.pdf', { at: '2026-07-01 12:00' }),
  ], '2023-01-09'),
  dir('NDAs', [
    f('NDA - Brightwater Properties.pdf', { at: '2026-06-10 14:30' }),
    f('NDA - Larchmont Hospitality Group.pdf', { at: '2025-10-02 11:00' }),
    f('NDA - Ostrander Design Studio.pdf', { at: '2026-05-21 10:15' }),
    f('NDA - Quill & Harrow Retail.pdf', { at: '2024-08-14 15:00' }),
    f('NDA - Sable Ridge Capital.pdf', { at: '2023-06-06 09:30' }),
    f('NDA register.xlsx', { at: '2026-06-10 14:40', since: '2023-06-06 09:40' }),
  ], '2023-01-09'),
  dir('Templates', files('Change order form.docx', 'MSA template v4.docx', 'Mutual NDA template.docx', 'Purchase order terms.docx', 'SOW template v3.docx'), '2023-01-09'),
  vendors,
  table('Contract register.xlsx',
    ['Counterparty', 'Type', 'Start', 'End', 'Annual value'],
    [
      ['Oakridge Hotels', 'Client MSA', '2025-03-01', '2028-02-29', '$2,600,000'],
      ['Crescent Bay Resorts', 'Client MSA', '2026-02-15', '2029-02-14', '$1,800,000'],
      ['Marlow Interiors', 'Trade agreement', '2024-06-01', '2027-05-31', '$1,150,000'],
      ['Halden Workspace', 'Client MSA', '2024-11-01', '2026-10-31', '$910,000'],
      ['Pinecrest Senior Living', 'Client MSA', '2026-05-01', '2028-04-30', '$720,000'],
      ['Juniper & Vale Restaurants', 'Client MSA', '2025-09-01', '2027-08-31', '$640,000'],
      ['Studio Brannock', 'Trade agreement', '2025-01-15', '2027-01-14', '$380,000'],
      ['Blackwood Timber Supply', 'Supply agreement', '2025-01-01', '2027-12-31', '($1,900,000)'],
      ['Northgate Freight', 'Logistics agreement', '2026-04-01', '2028-03-31', '($610,000)'],
      ['14 Mill Road (workshop)', 'Lease', '2021-07-01', '2031-06-30', '($336,000)'],
      ['220 Canal Street (showroom)', 'Lease', '2019-03-01', '2029-02-28', '($412,000)'],
    ],
    { at: '2026-10-20 12:05', since: '2023-01-16 11:00' }),
], '2023-01-09')

// ───────────────────────────── Operations ─────────────────────────────

const operations = dir('Operations', [
  dir('Facilities', [
    dir('Showroom - 220 Canal Street', [
      f('Lighting upgrade quote.pdf', { at: '2026-08-12 14:00' }),
      f('Showroom maintenance log.xlsx', { at: '2026-10-19 17:00', since: '2023-02-06 10:00' }),
      f('Window display calendar 2026.xlsx', { at: '2026-09-28 10:30', since: '2025-12-01 10:00' }),
    ], '2023-02-06'),
    dir('Workshop - 14 Mill Road', [
      f('Dust extraction service report - Sep 2026.pdf', { at: '2026-09-24 16:10' }),
      f('Fire safety inspection 2026.pdf', { at: '2026-05-14 12:00' }),
      f('Maintenance log 2026.xlsx', { at: '2026-10-22 16:45', since: '2026-01-05 08:00' }),
      f('Workshop floor plan.pdf', { at: '2025-11-03 09:00' }),
    ], '2023-02-06'),
    f('Facilities budget FY2027.xlsx', { at: '2026-09-30 15:00', since: '2026-09-08 09:00' }),
    f('Key holders list.pdf', { at: '2026-04-07 10:00' }),
  ], '2023-02-06'),
  dir('Inventory', [
    f('Cycle count procedure.docx', { at: '2026-05-04 11:00', since: '2023-03-13 10:00' }),
    f('Reorder points.xlsx', { at: '2026-10-07 14:30', since: '2023-03-13 10:00' }),
    f('Slow-moving SKUs - Q3 2026.xlsx', { at: '2026-10-06 15:45', since: '2026-10-05 10:00' }),
    f('Stock count 2025-12-31.xlsx', { at: '2026-01-02 17:00', since: '2025-12-31 08:00' }),
    f('Stock count 2026-03-31.xlsx', { at: '2026-04-02 16:30', since: '2026-03-31 08:00' }),
    f('Stock count 2026-06-30.xlsx', { at: '2026-07-02 16:40', since: '2026-06-30 08:00' }),
    table('Stock count 2026-09-30.xlsx',
      ['Category', 'Quantity', 'Unit', 'Value', 'vs 30 Jun'],
      [
        ['Walnut lumber', '18,400', 'bd ft', '$211,600', '-6.1%'],
        ['White oak lumber', '22,900', 'bd ft', '$183,200', '+3.4%'],
        ['Ash & maple lumber', '9,700', 'bd ft', '$53,350', '-2.0%'],
        ['Upholstery fabric', '3,120', 'm', '$96,700', '+8.8%'],
        ['Foam & webbing', '1,460', 'units', '$38,900', '+1.2%'],
        ['Hardware kits', '5,850', 'kits', '$71,400', '-4.5%'],
        ['Finishes & adhesives', '640', 'gal', '$29,800', '+0.6%'],
        ['Work in progress', '312', 'pieces', '$486,000', '+12.7%'],
        ['Finished goods - Dining', '146', 'pieces', '$318,000', '-3.9%'],
        ['Finished goods - Seating', '238', 'pieces', '$274,500', '+6.0%'],
        ['Finished goods - Storage', '97', 'pieces', '$162,800', '-1.8%'],
        ['Total', '', '', '$1,926,250', '+3.1%'],
      ],
      { at: '2026-10-02 16:20', since: '2026-09-30 08:00' }),
    f('Timber yard layout.pdf', { at: '2025-08-19 10:00' }),
  ], '2023-03-13'),
  dir('Logistics', [
    f('Carrier rate comparison 2026.xlsx', { at: '2026-02-12 15:30', since: '2026-01-19 10:00' }),
    f('Delivery schedule - October 2026.xlsx', { at: '2026-10-23 16:15', since: '2026-09-25 09:00' }),
    f('Delivery zones map.pdf', { at: '2026-04-01 09:00' }),
    f('Freight claims log 2026.xlsx', { at: '2026-10-16 11:50', since: '2026-01-05 09:00' }),
    f('Northgate QBR - Q3 2026.pptx', { at: '2026-10-07 14:20', since: '2026-10-05 10:00' }),
    f('Returns process.docx', { at: '2025-09-15 10:00', since: '2023-02-06 10:00' }),
    text('White-glove delivery SOP.docx', [
      'White-glove delivery SOP (rev. 4, April 2026)',
      '1. Call the customer 48 hours ahead; confirm access, stairs, parking and lift dimensions.',
      '2. Two-person crew; blankets, corner guards, shoe covers on entry.',
      '3. Unwrap in the room, assemble, level, and photograph the installed piece twice.',
      '4. Take all packaging away; customer signs on the tablet. Damage? Photograph it and log it in the freight claims log.',
    ], { at: '2026-04-09 15:00', since: '2023-02-06 10:00' }),
  ], '2023-02-06'),
  dir('Safety', [
    f('Incident log 2026.xlsx', { at: '2026-10-16 09:30', since: '2026-01-05 08:00' }),
    f('Safety committee minutes - Sep 2026.docx', { at: '2026-09-29 16:00', since: '2026-09-29 13:00' }),
  ], '2023-02-06'),
  dir('Suppliers', [
    dir('Certificates', [
      f('FSC certificate - Blackwood Timber.pdf', { at: '2026-02-10 09:05' }),
      f('Low-VOC declaration - Brightline Finishes.pdf', { at: '2025-11-20 10:00' }),
      f('OEKO-TEX certificate - Loomhouse.pdf', { at: '2026-03-02 11:00' }),
    ], '2023-03-20'),
    f('Approved supplier list.xlsx', { at: '2026-09-18 10:00', since: '2023-03-20 10:00' }),
    f('Supplier code of conduct.pdf', { at: '2025-01-10 10:00' }),
    f('Supplier onboarding checklist.docx', { at: '2025-06-02 14:00', since: '2023-03-20 10:00' }),
    f('Supplier scorecards - Q3 2026.xlsx', { at: '2026-10-09 15:10', since: '2026-10-05 09:00' }),
  ], '2023-03-20'),
  dir('Team', [
    dir('Training', [
      f('First aid training 2026.xlsx', { at: '2026-06-24 10:00', since: '2026-01-12 09:00' }),
      f('Forklift certification log.xlsx', { at: '2026-09-10 14:00', since: '2023-04-03 10:00' }),
    ], '2023-04-03'),
    text('Employee Handbook 2026.pdf', [
      'Alder & Finch Co. — Employee Handbook, 2026 edition',
      'Our values: make it well, make it right, make it last.',
      'Contents: working hours & overtime · workshop safety · time off & holidays · staff furniture programme (30% off) · expenses · speaking up.',
    ], { at: '2026-01-15 12:00' }),
    f('Holiday calendar 2027.pdf', { at: '2026-10-08 10:00' }),
    f('Job description - FP&A Analyst.docx', { at: '2026-10-14 13:20', since: '2026-10-13 10:00' }),
    f('Onboarding checklist.docx', { at: '2026-03-09 11:00', since: '2023-04-03 10:00' }),
    text('Org chart - October 2026.pdf', [
      'Alder & Finch Co. — organisation, October 2026 (118 people)',
      'Thomas Finch, CEO → Amanda Reyes (Finance & Operations), Ines Laurent (Design), Marisol Duarte (Contract & Trade), Jonah Wells (Retail & E-commerce)',
      'Amanda Reyes → Priya Natarajan (Controller), Ben Kowalski (Workshop), Dev Sharma (Logistics), Kate Morrow (People & Culture)',
      'Workshop 46 · Retail 18 · E-commerce & Marketing 11 · Contract & Trade 9 · Design 7 · Operations & Logistics 16 · Finance, HR & Admin 8 · Technology & Facilities 3',
    ], { at: '2026-10-05 12:10' }),
    f('Org chart - October 2026.pptx', { at: '2026-10-05 12:00', since: '2026-10-02 09:00' }),
    f('Team offsite - September 2026.docx', { at: '2026-09-18 17:30', since: '2026-08-31 10:00' }),
  ], '2023-04-03'),
  f('Operations dashboard - Q3 2026.pdf', { at: '2026-10-08 10:30' }),
  f('Workshop production schedule - Q4 2026.xlsx', { at: '2026-10-22 17:10', since: '2026-09-21 08:00' }),
], '2023-01-09')

// ───────────────────────────── Board ─────────────────────────────

interface MeetingSpec {
  folder: string
  /** Meeting start, e.g. '2026-01-22 10:00'. */
  day: string
  short: string // '22 Jan 2026'
  month: string // 'January 2026'
  deck: string[]
  papers: SeedNode[]
  minutes?: SeedNode
}

function boardMeeting({ folder, day, short, month, deck, papers, minutes }: MeetingSpec): SeedFolder {
  return dir(folder, [
    f(`Board agenda - ${short}.pdf`, { at: addDays(day, -8) }),
    text(`Board deck - ${month}.pptx`, deck, { at: addDays(day, -2), since: addDays(day, -18), size: 14_820_000 }),
    minutes ?? f(`Board minutes - ${short}.docx`, { at: addDays(day, 6), since: addDays(day, 1) }),
    ...papers,
  ], addDays(day, -21))
}

const meetings2026 = dir('2026 Meetings', [
  boardMeeting({
    folder: '2026-01 January', day: '2026-01-22 10:00', short: '22 Jan 2026', month: 'January 2026',
    deck: [
      'Board deck — 22 January 2026',
      '1. FY2025 preliminary results: $19.6M revenue (+9.5%)',
      '2. Q4 2025 trading and the record holiday quarter',
      '3. FY2026 budget — final, for approval ($21.4M revenue)',
      '4. Workshop safety and scrap-rate update',
      '5. FY2025 audit timetable (Hartwell & Pryce)',
    ],
    papers: [
      f('Pre-read - FY2025 preliminary results.pdf', { at: '2026-01-16 12:00' }),
      f('Resolution - FY2026 budget approval.pdf', { at: '2026-01-23 10:00' }),
    ],
  }),
  boardMeeting({
    folder: '2026-04 April', day: '2026-04-23 10:00', short: '23 Apr 2026', month: 'April 2026',
    deck: [
      'Board deck — 23 April 2026',
      '1. Q1 2026 results: $4.85M revenue (+10.2% YoY)',
      '2. FY2025 audited accounts — for approval',
      '3. Contract pipeline: Crescent Bay signed, Oakridge phase 2 on track',
      '4. E-commerce replatform — go-live in June',
      '5. Risk register review',
    ],
    papers: [
      f('Pre-read - Q1 2026 results.pdf', { at: '2026-04-17 12:00' }),
      f('Resolution - FY2025 accounts approval.pdf', { at: '2026-04-24 10:00' }),
    ],
  }),
  boardMeeting({
    folder: '2026-07 July', day: '2026-07-23 10:00', short: '23 Jul 2026', month: 'July 2026',
    deck: [
      'Board deck — 23 July 2026',
      '1. Q2 2026 results: $5.30M revenue (+11.6% YoY)',
      '2. Mid-year budget review: full-year outlook raised to $21.8M',
      '3. Second showroom: three sites shortlisted',
      '4. Sustainability roadmap 2026–2028',
      '5. Remuneration committee report',
    ],
    papers: [
      f('Mid-year budget review.pdf', { at: '2026-07-17 12:00' }),
      f('Pre-read - Second showroom options.pdf', { at: '2026-07-17 12:05' }),
    ],
  }),
  boardMeeting({
    folder: '2026-10 October', day: '2026-10-22 10:00', short: '22 Oct 2026', month: 'October 2026',
    deck: [
      'Board deck — 22 October 2026',
      '1. Q3 2026 results: $5.45M revenue, EBITDA $475K',
      '2. FY2026 outlook (9+3): $21.8M revenue, $1.85M EBITDA',
      '3. FY2027 budget framework — draft v3: $24.1M revenue, $2.01M EBITDA',
      '4. Harbor Street showroom — lease negotiation mandate',
      '5. FY2027 capex: $1.42M',
      '6. 2027 board calendar',
    ],
    minutes: text('Board minutes - 22 Oct 2026 (DRAFT).docx', [
      'MINUTES (DRAFT) — Board of Directors, Alder & Finch Co. — 22 October 2026, Mill Road',
      'Present: R. Alder (Chair), T. Finch (CEO), G. Achebe, H. Marchetti, L. Brandt. In attendance: A. Reyes, P. Natarajan (minutes).',
      '1. Q3 2026 results noted; the board commended the gross-margin improvement to 45.3%.',
      '2. FY2027 budget framework (draft v3) discussed; final budget to the 10 December meeting.',
      '3. Harbor Street: management authorised to negotiate heads of terms within the pre-read parameters.',
      'Actions: AR to circulate the final budget by 3 Dec; TF to report on Oakridge phase 3 by 30 Nov.',
    ], { at: '2026-10-23 17:20', since: '2026-10-22 16:30' }),
    papers: [
      f('Pre-read - FY2027 budget framework.pdf', { at: '2026-10-16 11:40' }),
      f('Pre-read - Harbor Street lease mandate.pdf', { at: '2026-10-16 11:45' }),
    ],
  }),
], '2026-01-01')

const board = dir('Board', [
  meetings2026,
  dir('Archive', [
    f('Board papers 2024.zip', { at: '2025-01-08 10:00' }),
    f('Board papers 2025.zip', { at: '2026-01-07 10:00' }),
  ], '2025-01-08'),
  dir('Committees', [
    dir('Audit & Risk Committee', [
      f('Charter.pdf', { at: '2023-03-02 10:00' }),
      f('Minutes - 8 Oct 2026.docx', { at: '2026-10-09 15:30', since: '2026-10-08 16:00' }),
    ], '2023-03-01'),
    dir('Remuneration Committee', [
      f('Charter.pdf', { at: '2023-03-02 10:05' }),
      f('Minutes - 9 Jul 2026.docx', { at: '2026-07-10 14:00', since: '2026-07-09 16:00' }),
    ], '2023-03-01'),
  ], '2023-03-01'),
  f('Board calendar 2026.pdf', { at: '2025-11-20 10:00' }),
  f('Board calendar 2027 (proposed).pdf', { at: '2026-10-14 10:20' }),
  f('Board members.xlsx', { at: '2026-01-12 09:00', since: '2023-01-10 10:00' }),
  f('Resolutions register.xlsx', { at: '2026-10-23 17:30', since: '2023-01-10 10:00' }),
], '2023-01-09')

// ───────────────────────────── Strategy ─────────────────────────────

const strategy = dir('Strategy', [
  dir('Market Research', [
    f('Customer survey - Spring 2026 results.xlsx', { at: '2026-05-12 16:00', since: '2026-04-20 10:00' }),
    f('Hospitality furniture market outlook 2026.pdf', { at: '2026-01-20 09:30' }),
    f('Interior designer interviews.docx', { at: '2026-03-30 17:20', since: '2026-02-23 10:00' }),
    f('Online price scan - Sep 2026.xlsx', { at: '2026-09-25 15:00', since: '2026-09-21 09:00' }),
    f('Showroom footfall study - Canal Street.pdf', { at: '2025-11-04 10:00' }),
  ], '2024-02-05'),
  dir('Second Showroom', [
    f('Floor plan - 41 Harbor Street.pdf', { at: '2026-06-05 12:00' }),
    f('Footfall counts - Harbor Street.xlsx', { at: '2026-06-22 18:00', since: '2026-06-01 09:00' }),
    f('Harbor Street financial model v6.xlsx', { at: '2026-10-14 19:05', since: '2026-05-25 10:00' }),
    photo('Harbor Street - street view.jpg',
      'A sunlit corner storefront with tall arched windows and a brick facade on a tree-lined harbour street, an empty "To Let" sign in the window.',
      ['#b5523b', '#e8d8c3', '#4f6b5a', '#8fb3c9'],
      { at: '2026-05-28 14:12' }),
    table('Site comparison.xlsx',
      ['Criterion', '41 Harbor Street', '9 Foundry Lane', 'Westgate Retail Park'],
      [
        ['Size', '6,800 sq ft', '5,200 sq ft', '9,500 sq ft'],
        ['Headline rent / yr', '$238,000', '$171,600', '$209,000'],
        ['Rent per sq ft', '$35.00', '$33.00', '$22.00'],
        ['Weekday footfall', '4,100', '2,600', '1,900'],
        ['Parking', 'Street + garage', 'Street only', '300 spaces'],
        ['Fit-out estimate', '$780,000', '$640,000', '$910,000'],
        ['Distance from workshop', '6 mi', '3 mi', '14 mi'],
        ['Recommendation', 'Preferred', 'Backup', 'Not pursued'],
      ],
      { at: '2026-07-14 16:30', since: '2026-06-08 10:00' }),
  ], '2026-05-11'),
  text('2027 Plan.pptx', [
    '1. Alder & Finch 2027: crafted to last, built to scale',
    '2. Where we are: $21.8M revenue, 45% gross margin, 118 people',
    '3. Three bets: contract hospitality, a second showroom, direct online',
    '4. Harbor Street showroom — opening August 2027',
    '5. Workshop capacity: second CNC line and a bigger finishing room',
    '6. FY2027 targets: $24.1M revenue, $2.0M EBITDA',
    '7. Risks: timber prices, hotel capex cycles, lease timing',
    '8. What we need from the board',
  ], { at: '2026-10-19 20:40', since: '2026-09-08 10:00', size: 17_204_330 }),
  text('Competitor notes.docx', [
    'Competitor notes — updated October 2026',
    'Hearthline Furniture: aggressive on hotel case goods, ~15% below us, 14-week lead times (ours: 9).',
    'Northfold Home: online-first, heavy paid social; new white-oak dining table at $1,890 vs our Linden at $2,150.',
    'Copperwick Studio: boutique, strong with designers; rumoured to be looking near Harbor Street — check.',
    'Our edge: 9-week lead time, 5-year warranty, in-house upholstery, the local workshop story.',
  ], { at: '2026-10-09 13:15', since: '2024-03-11 10:00' }),
  text('Expansion - Second Showroom.docx', [
    'Expansion — second showroom (Harbor Street) · discussion paper v4, October 2026',
    'Proposal: 6,800 sq ft at 41 Harbor Street (Brightwater Properties); 10-year lease, 6 months rent-free.',
    'Capex $780K fit-out + $140K opening inventory; pre-opening costs $210K in FY2027.',
    'Opening August 2027: $0.45M sales in FY2027, $1.4M in the first 12 months; breakeven in month 14.',
    'Benchmark: Canal Street achieved $812 per sq ft in FY2025; Harbor Street modelled at 70% in year one.',
    'Decision needed: board mandate to sign heads of terms by 30 November 2026.',
  ], { at: '2026-10-15 18:25', since: '2026-05-18 10:00' }),
  f('Pricing strategy review - Aug 2026.pptx', { at: '2026-08-27 15:00', since: '2026-08-10 10:00' }),
  f('Strategy offsite - Sep 2026 notes.docx', { at: '2026-09-12 19:00', since: '2026-09-11 09:00' }),
  f('Sustainability roadmap 2026-2028.docx', { at: '2026-06-30 16:00', since: '2026-04-06 10:00' }),
  f('SWOT 2026.docx', { at: '2026-02-20 11:00', since: '2026-02-09 10:00' }),
], '2023-01-09')

// ───────────────────────────── Shared with me ─────────────────────────────

const shared = dir('Shared with me', [
  f('Brand guidelines 2026.pdf', { at: '2026-01-26 12:00' }),
  f('Harbor Street showroom concepts - Ostrander Design.pdf', { at: '2026-10-02 17:40' }),
  f('Linden Collection launch plan.pptx', { at: '2026-08-31 10:00', since: '2026-08-03 10:00' }),
  f('Marketing calendar 2027 (Jonah).xlsx', { at: '2026-10-13 15:30', since: '2026-09-21 10:00' }),
  f('Photo shoot shot list - Fall 2026.docx', { at: '2026-09-03 09:20', since: '2026-08-27 10:00' }),
], '2023-02-14')

export const onedrive: SeedFolder = dir('OneDrive - Alder & Finch', [
  board,
  contracts,
  finance,
  operations,
  shared,
  strategy,
], '2023-01-09')
