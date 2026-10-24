// C:\Users\Amanda\Documents\Business\AmandaMedicalMiami — the heart of the
// computer: the small company Amanda co-owns with her cousin Marisol Vega.
//
// Amanda Medical Miami LLC ("AMM") is a fictional medical-equipment rental and
// supply company in Miami, Florida: a Florida LLC formed in March 2021, two
// 50/50 members, taxed as a partnership. Marisol is Managing Member and runs
// the business day to day; Amanda keeps the books, budget, banking and tax
// filings remotely, mostly on evenings and weekends. Clients are organizations
// only — assisted-living communities, home-care and home-health agencies,
// clinics and physiotherapy practices. There are no records about individuals
// anywhere: orders and delivery confirmations show facility, location and
// equipment only.
//
// The numbers reconcile across files:
//   Revenue  2024 $2.38M · 2025 $2.71M · 2026 budget $2.98M, forecast $3.08M · 2027 DRAFT $3.42M
//   Quarters 2025: 640 / 668 / 701 / 701K · 2026: 712 / 758 / 802 / (808 forecast)
//   EBITDA   2025 $440K · 2026: 92 / 109 / 144 / (149) = $494K forecast · 2027 DRAFT $536K
//   Q3 2026: rentals $468K, products $286K, delivery & service $48K; gross margin 70.0%; EBITDA $144K (18.0%)
//   YTD Sep 2026: revenue $2,272K, gross profit $1,583K, opex $1,238K, EBITDA $345K
//   Fleet at 30 Sep 2026: 1,450 units, 1,166 on rent (80.4%), 246 in the warehouse, 38 waiting for service
//   Cash $426,150 at 30 Sep, $409,880 at 23 Oct (two-month reserve test $431K); AR $367,000 at 23 Oct
//   14 staff (payroll ≈ $86K a month), 45 client accounts, 3 vans, 9,200 sq ft warehouse in Doral
//
// People (all fictional): Marisol Vega (Managing Member), Luis Ortega (operations
// manager), Dayana Cruz (warehouse lead), Kevin Pham and Rosa Jiménez (warehouse),
// Andre Baptiste, Miguel Santos and Javier Morales (drivers), Tomás Ferreira and
// Nadia Williams (equipment technicians), Carla Méndez and Jason Reid (account
// managers), Yesenia Flores (dispatch & customer service), Priscilla Ruiz
// (billing), Gloria Hernandez (bookkeeper, part-time). Outside CPA: Dana Lopez
// of Lopez & Hart CPA. Bank: Palmetto Coast Bank.

import type { SeedFile, SeedFolder, SeedNode } from '../seedTypes'
import { dir, f, table, text } from './helpers'

/** The business folder came over when this PC was set up; older papers are scans copied in then. */
const SETUP = '2022-09-10 14:00'

// ───────────────────────────── Finance ─────────────────────────────

const budgets = dir('Budgets', [
  dir('2026', [
    f('AMM Budget 2026 - FINAL.xlsx', { at: '2025-12-13 11:20', since: '2025-10-04 10:00' }),
    f('Budget 2026 assumptions.docx', { at: '2025-12-06 16:40', since: '2025-10-11 10:00' }),
    f('Mid-year review - Jul 2026.xlsx', { at: '2026-07-18 15:10', since: '2026-07-11 10:00' }),
    table('Budget vs actual - Sep 2026.xlsx',
      ['Line', '2026 Budget', 'YTD actual (Sep)', 'Full-year forecast', 'Forecast vs budget'],
      [
        ['Net revenue', '$2,980,000', '$2,272,000', '$3,080,000', '+3.4%'],
        ['Gross profit', '$2,070,000', '$1,583,000', '$2,152,000', '+4.0%'],
        ['Payroll & benefits', '$1,030,000', '$783,000', '$1,045,000', '+1.5%'],
        ['Warehouse & fleet', '$330,000', '$252,000', '$338,000', '+2.4%'],
        ['Insurance, licenses & admin', '$250,000', '$203,000', '$275,000', '+10.0%'],
        ['Total operating expenses', '$1,610,000', '$1,238,000', '$1,658,000', '+3.0%'],
        ['EBITDA', '$460,000', '$345,000', '$494,000', '+7.4%'],
        ['EBITDA margin', '15.4%', '15.2%', '16.0%', '+0.6 pts'],
        ['Staff', '14', '14', '14', '—'],
      ],
      { at: '2026-10-10 16:05', since: '2026-10-10 13:00' }),
  ], '2025-10-04'),
  dir('2027 draft', [
    table('AMM Budget 2027 - DRAFT.xlsx',
      ['Line', '2026 Forecast', '2027 Budget', 'Change', 'Change %'],
      [
        ['Rental revenue', '$1,800,000', '$2,010,000', '$210,000', '11.7%'],
        ['Product sales', '$1,095,000', '$1,205,000', '$110,000', '10.0%'],
        ['Delivery & service fees', '$185,000', '$205,000', '$20,000', '10.8%'],
        ['Net revenue', '$3,080,000', '$3,420,000', '$340,000', '11.0%'],
        ['Cost of sales', '($928,000)', '($1,016,000)', '($88,000)', '9.5%'],
        ['Gross profit', '$2,152,000', '$2,404,000', '$252,000', '11.7%'],
        ['Payroll & benefits (14 → 16 staff)', '($1,045,000)', '($1,182,000)', '($137,000)', '13.1%'],
        ['Warehouse & fleet', '($338,000)', '($390,000)', '($52,000)', '15.4%'],
        ['Insurance, licenses & admin', '($275,000)', '($296,000)', '($21,000)', '7.6%'],
        ['Total operating expenses', '($1,658,000)', '($1,868,000)', '($210,000)', '12.7%'],
        ['EBITDA', '$494,000', '$536,000', '$42,000', '8.5%'],
        ['EBITDA margin', '16.0%', '15.7%', '-0.3 pts', '—'],
      ],
      { at: '2026-10-18 16:20', since: '2026-09-27 10:00', size: 412_906 }),
    text('Budget 2027 assumptions.docx', [
      'AMM 2027 budget — assumptions behind the DRAFT (18 Oct 2026) · A. Reyes',
      'Revenue +11.0% to $3.42M: rentals +11.7% (fleet from 1,450 to about 1,600 units, utilization held near 80%), product sales +10.0%, delivery & service fees +10.8%.',
      'Rental list rates +3% from 1 February (Rental rate review 2027.xlsx); Biscayne Senior Living renews for 2 years at about +2% net.',
      'Gross margin 70.3% (2026 forecast 69.9%): PPE costs +2.5% at the Gulf Coast PPE renewal (gloves +4%), passed through.',
      'Staff 14 → 16: a third equipment technician from March and a fourth driver from May, with a fourth van leased at about $1,150 a month.',
      'Doral warehouse renewal at $21.50/sq ft from June 2027 (now $18.75) — about +$25K a year at the full rate.',
      'Open: Kendall Home Health renewal (decision by 30 Nov) and the Coral Gables Home Care Westchester loan closet (+$3,400 a month from February).',
    ], { at: '2026-10-18 15:05', since: '2026-09-27 11:00' }),
    table('Headcount plan 2027.xlsx',
      ['Role', 'Today', '2027 plan', 'New hire starts', '2027 cost (loaded)'],
      [
        ['Operations manager', '1', '1', '—', '$96,000'],
        ['Office, billing & bookkeeping', '2', '2', '—', '$118,000'],
        ['Warehouse', '3', '3', '—', '$186,000'],
        ['Delivery drivers', '3', '4', 'May 2027', '$252,000'],
        ['Equipment technicians', '2', '3', 'Mar 2027', '$236,000'],
        ['Account managers', '2', '2', '—', '$224,000'],
        ['Dispatch & customer service', '1', '1', '—', '$70,000'],
        ['Total staff', '14', '16', '', '$1,182,000'],
      ],
      { at: '2026-10-11 14:30', since: '2026-10-03 10:00' }),
    table('Fourth van - lease vs buy.xlsx',
      ['Option', 'Upfront', 'Monthly', '3-year cost', 'Notes'],
      [
        ['Lease, new Ford Transit 250 (36 months)', '$3,500', '$1,150', '$44,900', '15,000 mi/year cap · in the DRAFT'],
        ['Buy new, financed (60 months)', '$9,800', '$905', '$42,380', 'Owned; about $24K left in it after 3 years'],
        ['Buy used 2023, about 30K mi (cash)', '$41,500', '$0', '$41,500', 'No warranty; uses the equipment reserve'],
        ['Lift gate + shelving upfit (any option)', '$6,800', '—', '$6,800', 'Needed for bed deliveries'],
      ],
      { at: '2026-10-10 21:35', since: '2026-10-04 19:30' }),
    table('Rental rate review 2027.xlsx',
      ['Item', '2026 monthly rate', '2027 proposed', 'Change', 'Market range'],
      [
        ['Standard wheelchair', '$65', '$67', '+3.1%', '$60–75'],
        ['Transport chair', '$55', '$57', '+3.6%', '$50–65'],
        ['Bariatric wheelchair', '$140', '$145', '+3.6%', '$130–175'],
        ['Rollator walker', '$35', '$36', '+2.9%', '$30–45'],
        ['Semi-electric hospital bed', '$195', '$200', '+2.6%', '$180–240'],
        ['Full-electric hospital bed', '$260', '$268', '+3.1%', '$240–310'],
        ['Low-air-loss mattress', '$310', '$320', '+3.2%', '$280–380'],
        ['Oxygen concentrator 5 L', '$175', '$180', '+2.9%', '$160–220'],
        ['Portable oxygen concentrator', '$295', '$305', '+3.4%', '$270–350'],
        ['Hydraulic transfer lift', '$150', '$155', '+3.3%', '$140–190'],
        ['Knee scooter', '$85', '$85', '0.0%', '$75–95'],
      ],
      { at: '2026-10-04 15:20', since: '2026-09-27 14:00' }),
    f('Warehouse lease renewal scenarios.xlsx', { at: '2026-10-17 18:10', since: '2026-10-08 20:00' }),
  ], '2026-09-26 10:00'),
  f('AMM budget template.xlsx', { at: '2025-09-27 10:30', since: '2022-11-05 10:00' }),
  f('Budgets 2022-2025 (archive).zip', { at: '2025-12-20 11:00' }),
], '2022-11-05')

const receivable2026 = dir('2026', [
  dir('Q1', [
    f('Invoice register - Q1 2026.xlsx', { at: '2026-04-03 19:20', since: '2026-01-02 09:30' }),
    f('Q1 2026 invoices (PDF batch).zip', { at: '2026-04-03 19:35' }),
  ], '2026-01-02'),
  dir('Q2', [
    f('Invoice register - Q2 2026.xlsx', { at: '2026-07-03 20:05', since: '2026-04-01 09:30' }),
    f('Q2 2026 invoices (PDF batch).zip', { at: '2026-07-03 20:15' }),
  ], '2026-04-01'),
  dir('Q3', [
    f('AMM-26-0901 Biscayne Senior Living.pdf', { at: '2026-09-01 08:40' }),
    f('Invoice register - Q3 2026.xlsx', { at: '2026-10-02 20:10', since: '2026-07-01 09:30' }),
    f('Q3 2026 invoices (PDF batch).zip', { at: '2026-10-02 20:25' }),
  ], '2026-07-01'),
  dir('Q4', [
    f('AMM-26-1001 Biscayne Senior Living.pdf', { at: '2026-10-01 08:35' }),
    f('AMM-26-1002 Coral Gables Home Care.pdf', { at: '2026-10-01 08:37' }),
    f('AMM-26-1003 Kendall Home Health Partners.pdf', { at: '2026-10-01 08:39' }),
    f('AMM-26-1052 Biscayne Senior Living.pdf', { at: '2026-10-09 15:20' }),
    f('AMM-26-1081 Biscayne Senior Living.pdf', { at: '2026-10-20 14:05' }),
    table('Invoice register - Oct 2026 (to date).xlsx',
      ['Invoice', 'Client', 'Date', 'Amount', 'Status'],
      [
        ['AMM-26-1001', 'Biscayne Senior Living', '1 Oct', '$35,400', 'Open'],
        ['AMM-26-1002', 'Coral Gables Home Care', '1 Oct', '$24,300', 'Open'],
        ['AMM-26-1003', 'Kendall Home Health Partners', '1 Oct', '$19,800', 'Open'],
        ['AMM-26-1004', 'Palmetto Bay Assisted Living', '1 Oct', '$14,600', 'Open'],
        ['AMM-26-1005', 'Little River Family Clinic', '1 Oct', '$6,900', 'Open'],
        ['AMM-26-1006', 'Bayview Physiotherapy', '1 Oct', '$5,850', 'Open'],
        ['AMM-26-1007 to 1044', 'Other rental accounts (38)', '1 Oct', '$52,150', 'Part paid'],
        ['AMM-26-1052', 'Biscayne Senior Living (supplies)', '9 Oct', '$9,850', 'Open'],
        ['AMM-26-1081', 'Biscayne Senior Living (supplies)', '20 Oct', '$9,550', 'Open'],
        ['AMM-26-1045 to 1098', 'Supplies & delivery invoices (52)', '2–23 Oct', '$57,600', 'Part paid'],
        ['Total', 'October to date (98 invoices)', '', '$236,000', ''],
      ],
      { at: '2026-10-23 19:55', since: '2026-10-01 08:30' }),
  ], '2026-10-01'),
], '2026-01-02')

const invoices = dir('Invoices', [
  dir('Payable', [
    f('AP aging - 23 Oct 2026.xlsx', { at: '2026-10-23 20:40', since: '2026-10-23 20:10' }),
    f('Gulf Coast PPE invoice GC-77812.pdf', { at: '2026-09-30 10:05' }),
    f('Vendor bills 2026 Q1-Q3.zip', { at: '2026-10-05 19:30' }),
  ], SETUP),
  dir('Receivable', [
    receivable2026,
    f('2025 invoices (archive).zip', { at: '2026-01-09 20:00' }),
    table('AR aging - 23 Oct 2026.xlsx',
      ['Client', 'Current', '31–60 days', '61–90 days', 'Over 90', 'Total'],
      [
        ['Biscayne Senior Living', '$54,800', '$55,100', '$53,700', '$0', '$163,600'],
        ['Coral Gables Home Care', '$38,900', '$4,200', '$0', '$0', '$43,100'],
        ['Kendall Home Health Partners', '$29,600', '$27,400', '$0', '$0', '$57,000'],
        ['Palmetto Bay Assisted Living', '$21,300', '$0', '$0', '$0', '$21,300'],
        ['Little River Family Clinic', '$11,200', '$1,850', '$0', '$0', '$13,050'],
        ['Bayview Physiotherapy', '$9,600', '$0', '$0', '$640', '$10,240'],
        ['Other accounts (39)', '$41,400', '$12,350', '$3,900', '$1,060', '$58,710'],
        ['Total', '$206,800', '$100,900', '$57,600', '$1,700', '$367,000'],
      ],
      { at: '2026-10-23 20:30', since: '2026-10-23 19:50' }),
    f('Collections log 2026.xlsx', { at: '2026-10-22 18:45', since: '2026-01-12 19:00' }),
  ], SETUP),
], SETUP)

const bankAndCards = dir('Bank & Cards', [
  text('Banking access & signatories.docx', [
    'Banking access — Amanda Medical Miami LLC at Palmetto Coast Bank · updated February 2026',
    'Signers: Marisol Vega and Amanda Reyes (both members). Online banking administrator: Amanda.',
    'Any payment over $10,000 needs approval from both members; payroll is pre-approved each month.',
    'Priscilla Ruiz (billing) can view accounts and upload deposits only. Gloria Hernandez prepares payments but cannot release them.',
    'Business Visa limits: Marisol $15,000 · Amanda $10,000 · Luis Ortega $5,000 (fuel and parts).',
    'Line of credit: $250,000, secured by receivables, renews every March — currently undrawn.',
  ], { at: '2026-02-08 20:15', since: '2022-09-11 19:00' }),
  f('Bank reconciliation - Sep 2026.xlsx', { at: '2026-10-04 20:50', since: '2026-10-04 19:40' }),
  f('Business Visa statement 2026-09.pdf', { at: '2026-10-03 08:20' }),
  table('Cash position Oct 2026.xlsx',
    ['Account', '30 Sep 2026', '23 Oct 2026', 'Change', 'Note'],
    [
      ['Operating checking', '$214,600', '$188,300', '($26,300)', 'Biscayne $108,800 past 30 days'],
      ['Payroll account', '$42,000', '$45,500', '$3,500', 'Funded for the 30 Oct payroll'],
      ['Tax reserve (savings)', '$68,000', '$68,000', '$0', 'Sales tax + Q4 tax distribution'],
      ['Equipment reserve (savings)', '$120,000', '$120,000', '$0', 'Van and fleet replacement'],
      ['Business Visa (balance due)', '($18,450)', '($11,920)', '$6,530', 'Autopay on the 5th'],
      ['Line of credit ($250,000)', '$0', '$0', '$0', 'Undrawn'],
      ['Net cash', '$426,150', '$409,880', '($16,270)', 'Reserve test: $431,000'],
      ['Accounts receivable', '$356,000', '$367,000', '$11,000', 'See AR aging'],
      ['Accounts payable', '($142,300)', '($128,900)', '$13,400', 'Gulf Coast PPE due 30 Oct'],
    ],
    { at: '2026-10-23 21:15', since: '2026-10-01 20:00', size: 96_512 }),
  f('Line of credit agreement - Palmetto Coast Bank (2024).pdf', { at: '2024-03-12 17:30' }),
  f('Operating account statement 2026-09.pdf', { at: '2026-10-02 07:45' }),
  f('Statements Jan-Aug 2026.zip', { at: '2026-09-06 18:00' }),
], SETUP)

const tax = dir('Tax', [
  dir('2025', [
    f('Form 1065 - 2025 return (filed).pdf', { at: '2026-03-12 16:30' }),
    f('Schedule K-1 2025 - Amanda Reyes.pdf', { at: '2026-03-12 16:35' }),
    f('Schedule K-1 2025 - Marisol Vega.pdf', { at: '2026-03-12 16:36' }),
    text('Tax summary 2025.docx', [
      'Amanda Medical Miami LLC — 2025 tax summary (prepared with Lopez & Hart CPA)',
      'Taxed as a partnership: Form 1065 filed 12 March 2026; K-1s issued to both members, 50/50.',
      'Ordinary business income $238,400 after $201,000 of depreciation (rental fleet and vans).',
      'Florida sales & use tax: $41,850 remitted on taxable supply sales (DR-15, monthly).',
      'Tangible personal property tax (Miami-Dade): $6,120, paid November 2025.',
      'The LLC pays no Florida income tax as a partnership; each member pays federal tax on their share.',
    ], { at: '2026-03-14 11:00', since: '2026-03-13 20:00' }),
  ], '2026-01-12'),
  dir('2026 estimates', [
    f('Estimated tax worksheet 2026 - Lopez & Hart.xlsx', { at: '2026-09-08 18:10', since: '2026-01-14 19:00' }),
    table('Owner tax distributions 2026.xlsx',
      ['Quarter', 'IRS due date', 'Amanda Reyes', 'Marisol Vega', 'Total', 'Paid'],
      [
        ['Q1 2026', '15 Apr', '$10,500', '$10,500', '$21,000', '10 Apr'],
        ['Q2 2026', '15 Jun', '$11,500', '$11,500', '$23,000', '9 Jun'],
        ['Q3 2026', '15 Sep', '$12,500', '$12,500', '$25,000', '10 Sep'],
        ['Q4 2026', '15 Jan 2027', '$13,500', '$13,500', '$27,000', 'Planned mid-December'],
        ['Total 2026', '', '$48,000', '$48,000', '$96,000', ''],
      ],
      { at: '2026-10-08 21:00', since: '2026-01-14 19:30' }),
    text('Year-end tax planning 2026 - notes.docx', [
      'Year-end tax planning 2026 — call with Dana Lopez (Lopez & Hart CPA), Thu 8 Oct',
      'Projected 2026 taxable income about $268K: EBITDA $494K less about $226K of depreciation.',
      'Buy the early-2027 replacement beds and concentrators in December? Expensing about $60K would bring 2026 down to about $208K.',
      'Q4 tax distribution: $13,500 to each member in mid-December (tax distributions come before the reserve test).',
      'Amanda: ask Hollis & Day (our personal CPA) about home-state tax on the K-1 share.',
    ], { at: '2026-10-08 20:30', since: '2026-10-08 18:00' }),
  ], '2026-01-10'),
  f('Sales tax exemption certificates - clients.xlsx', { at: '2026-05-16 11:00', since: '2022-10-01 10:00' }),
  f('Sales tax return 2026-09 (DR-15).pdf', { at: '2026-10-18 19:05' }),
  f('Sales tax returns Jan-Aug 2026 (DR-15).zip', { at: '2026-09-19 18:40' }),
  f('Tangible personal property return 2026 (DR-405).pdf', { at: '2026-03-28 10:20' }),
], SETUP)

const payroll = dir('Payroll', [
  dir('2026', [
    f('Payroll summaries Jan-Jun 2026.zip', { at: '2026-07-03 19:00' }),
    f('Payroll summary 2026-07.xlsx', { at: '2026-07-31 17:30' }),
    f('Payroll summary 2026-08.xlsx', { at: '2026-08-31 17:20' }),
    table('Payroll summary 2026-09.xlsx',
      ['Team', 'Headcount', 'Gross pay', 'Taxes & benefits', 'Total cost'],
      [
        ['Management & admin', '3', '$14,100', '$3,170', '$17,270'],
        ['Warehouse', '3', '$12,200', '$2,750', '$14,950'],
        ['Delivery drivers', '3', '$13,600', '$3,060', '$16,660'],
        ['Equipment technicians', '2', '$10,900', '$2,450', '$13,350'],
        ['Account managers', '2', '$14,800', '$3,330', '$18,130'],
        ['Dispatch & customer service', '1', '$4,600', '$1,035', '$5,635'],
        ['Total', '14', '$70,200', '$15,795', '$85,995'],
      ],
      { at: '2026-09-30 17:40' }),
    f('Payroll register - 15 Oct 2026.pdf', { at: '2026-10-15 16:10' }),
  ], '2026-01-05'),
  f('Commission plan 2026 - account managers.xlsx', { at: '2026-01-20 19:30', since: '2026-01-10 18:00' }),
  f('Payroll summaries 2025.zip', { at: '2026-01-08 19:10' }),
  f('TideLine Payroll - service agreement.pdf', { at: '2023-01-16 15:00' }),
], SETUP)

const reports = dir('Reports', [
  f('Annual financials 2025.pdf', { at: '2026-02-21 17:00' }),
  f('Q1 2026 P&L.xlsx', { at: '2026-04-11 16:30', since: '2026-04-09 19:00' }),
  f('Q2 2026 P&L.xlsx', { at: '2026-07-12 15:45', since: '2026-07-09 19:00' }),
  f('Q3 2026 Balance sheet.xlsx', { at: '2026-10-11 16:10', since: '2026-10-10 19:30' }),
  table('Q3 2026 P&L.xlsx',
    ['Line item', 'Q3 2026', 'Q3 2025', 'YoY', 'YTD 2026'],
    [
      ['Rental revenue', '$468,000', '$412,000', '+13.6%', '$1,322,000'],
      ['Product sales', '$286,000', '$249,000', '+14.9%', '$810,000'],
      ['Delivery & service fees', '$48,000', '$40,000', '+20.0%', '$140,000'],
      ['Net revenue', '$802,000', '$701,000', '+14.4%', '$2,272,000'],
      ['Cost of sales', '($241,000)', '($214,000)', '+12.6%', '($689,000)'],
      ['Gross profit', '$561,000', '$487,000', '+15.2%', '$1,583,000'],
      ['Payroll & benefits', '($262,000)', '($231,000)', '+13.4%', '($783,000)'],
      ['Warehouse & fleet', '($84,700)', '($75,400)', '+12.3%', '($252,000)'],
      ['Insurance, licenses & admin', '($70,300)', '($62,600)', '+12.3%', '($203,000)'],
      ['Total operating expenses', '($417,000)', '($369,000)', '+13.0%', '($1,238,000)'],
      ['EBITDA', '$144,000', '$118,000', '+22.0%', '$345,000'],
      ['EBITDA margin', '18.0%', '16.8%', '+1.2 pts', '15.2%'],
    ],
    { at: '2026-10-11 15:40', since: '2026-10-10 19:00', size: 188_416 }),
  text('Q3 2026 owners report.pdf', [
    'Amanda Medical Miami LLC — Q3 2026 owners report (A. Reyes, 12 Oct 2026)',
    'Net revenue $802K, +14.4% YoY; year to date $2.27M against the $2.98M budget, and the full-year forecast is raised to $3.08M.',
    'Gross margin 70.0%; EBITDA $144K (18.0%) — our best quarter so far.',
    'Rentals +13.6%: 1,166 of 1,450 units on rent at 30 September (80.4% utilization).',
    "Cash $426K at 30 September, just under the two-month reserve ($431K): Biscayne's August and September statements are late.",
    'Watch: Kendall Home Health renewal (December), HME license renewal (January), Doral lease (May 2027).',
  ], { at: '2026-10-12 21:20', since: '2026-10-11 19:00' }),
  table('Quarterly trend 2025-2026.xlsx',
    ['Quarter', 'Net revenue', 'YoY', 'EBITDA', 'EBITDA margin'],
    [
      ['Q1 2025', '$640,000', '+12.3%', '$98,000', '15.3%'],
      ['Q2 2025', '$668,000', '+12.8%', '$104,000', '15.6%'],
      ['Q3 2025', '$701,000', '+14.5%', '$118,000', '16.8%'],
      ['Q4 2025', '$701,000', '+15.7%', '$120,000', '17.1%'],
      ['FY2025', '$2,710,000', '+13.9%', '$440,000', '16.2%'],
      ['Q1 2026', '$712,000', '+11.3%', '$92,000', '12.9%'],
      ['Q2 2026', '$758,000', '+13.5%', '$109,000', '14.4%'],
      ['Q3 2026', '$802,000', '+14.4%', '$144,000', '18.0%'],
      ['Q4 2026 (forecast)', '$808,000', '+15.3%', '$149,000', '18.4%'],
      ['FY2026 (forecast)', '$3,080,000', '+13.7%', '$494,000', '16.0%'],
    ],
    { at: '2026-10-11 17:05', since: '2026-01-10 19:00' }),
], '2023-01-15')

const finance = dir('Finance', [
  bankAndCards,
  budgets,
  invoices,
  payroll,
  reports,
  tax,
  f('Chart of accounts.xlsx', { at: '2025-01-11 10:30', since: SETUP }),
  text('Month-end close checklist.docx', [
    'Month-end close — AMM (Amanda remote, Gloria on site)',
    'Day 1–2: Gloria posts rental billing, supply invoices and vendor bills; Priscilla sends client statements.',
    'Day 3: bank and Visa reconciliations; Amanda reviews and signs off.',
    'Day 4: fleet depreciation, sales tax and payroll accruals; Marisol and Amanda review every balance over 45 days.',
    'Day 5: P&L and cash position to both owners; roll the budget forecast forward.',
  ], { at: '2026-01-31 10:40', since: '2022-10-02 19:00' }),
], SETUP)

// ───────────────────────────── Operations ─────────────────────────────

const inventory = dir('Inventory', [
  dir('Stock counts', [
    dir('2026', [
      f('Stock count - 2026-03-31.xlsx', { at: '2026-04-01 17:10', since: '2026-03-31 07:30' }),
      f('Stock count - 2026-06-30.xlsx', { at: '2026-07-01 16:50', since: '2026-06-30 07:30' }),
      table('Stock count - 2026-09-30.xlsx',
        ['Item', 'Category', 'Owned', 'On rent', 'In warehouse', 'Needs service'],
        [
          ['Standard wheelchair', 'Mobility', '310', '248', '54', '8'],
          ['Transport chair', 'Mobility', '120', '92', '25', '3'],
          ['Bariatric wheelchair', 'Mobility', '46', '39', '6', '1'],
          ['Rollator walker', 'Mobility', '260', '204', '52', '4'],
          ['Knee scooter', 'Mobility', '64', '38', '26', '0'],
          ['Semi-electric hospital bed', 'Beds', '168', '141', '22', '5'],
          ['Full-electric hospital bed', 'Beds', '84', '72', '9', '3'],
          ['Low-air-loss mattress', 'Beds', '96', '81', '13', '2'],
          ['Hydraulic transfer lift', 'Lifts', '40', '33', '6', '1'],
          ['Oxygen concentrator 5 L', 'Respiratory', '190', '158', '24', '8'],
          ['Portable oxygen concentrator', 'Respiratory', '72', '60', '9', '3'],
          ['Total rental fleet', '', '1,450', '1,166', '246', '38'],
        ],
        { at: '2026-10-01 17:25', since: '2026-09-30 07:30', size: 264_220 }),
      table('PPE & supplies count - 2026-09-30.xlsx',
        ['Item', 'Unit', 'On hand', 'Reorder point', 'Monthly use', 'Supplier'],
        [
          ['Nitrile exam gloves (M)', 'Case of 1,000', '86', '60', '52', 'Gulf Coast PPE'],
          ['Nitrile exam gloves (L)', 'Case of 1,000', '64', '50', '41', 'Gulf Coast PPE'],
          ['Procedure masks', 'Case of 2,000', '22', '15', '12', 'Gulf Coast PPE'],
          ['N95 respirators', 'Case of 240', '18', '12', '6', 'Gulf Coast PPE'],
          ['Isolation gowns', 'Case of 100', '40', '30', '24', 'Gulf Coast PPE'],
          ['Disposable underpads', 'Case of 150', '58', '45', '38', 'Gulf Coast PPE'],
          ['Hand sanitizer 1 L', 'Case of 12', '35', '20', '15', 'Gulf Coast PPE'],
          ['Nasal cannulas 7 ft', 'Case of 50', '31', '20', '14', 'BreatheWell Oxygen'],
          ['Oxygen tubing 25 ft', 'Case of 50', '12', '15', '9', 'BreatheWell Oxygen'],
          ['Concentrator filters', 'Pack of 10', '26', '20', '11', 'BreatheWell Oxygen'],
          ['Fluid-proof mattress covers', 'Each', '140', '80', '55', 'CareRest Beds'],
        ],
        { at: '2026-10-01 15:40', since: '2026-09-30 13:00' }),
      text('Count variance notes - Q3 2026.docx', [
        'Q3 2026 stock count — variance notes (count 30 Sep, signed off by Luis Ortega and Dayana Cruz)',
        'Rental fleet: 1,450 units counted, 1,452 in the asset register — two transport chairs with cracked frames written off; register corrected 2 Oct.',
        'Utilization 80.4% (1,166 on rent), up from 78.9% at 30 June.',
        '38 units waiting for service against a target of under 30: Tomás and Nadia are splitting the PM backlog until mid-November.',
        'Oxygen tubing below its reorder point (12 cases vs 15) — BreatheWell order placed 1 Oct.',
        'PPE and supplies matched the system within 2% on every line.',
      ], { at: '2026-10-02 11:20', since: '2026-10-01 18:00' }),
    ], '2026-03-30'),
    f('Stock counts 2023-2025.zip', { at: '2026-01-06 10:00' }),
  ], '2023-03-31'),
  f('Rental fleet asset register.xlsx', { at: '2026-10-21 16:30', since: '2022-09-10 14:30', size: 1_204_880 }),
], SETUP)

function van(name: string, created: string, papers: SeedFile[], maintenance: SeedFile[]): SeedFolder {
  return dir(name, [dir('Maintenance', maintenance, created), ...papers], created)
}

const fleet = dir('Fleet & Deliveries', [
  dir('Vans', [
    van('Van 1 - Flamingo', SETUP, [
      f('Purchase documents (2021).pdf', { at: '2022-09-10 15:00' }),
      f('Registration & insurance card 2026-27.pdf', { at: '2026-03-03 10:15' }),
    ], [
      f('2026-01-14 Oil change & tire rotation.pdf', { at: '2026-01-14 15:20' }),
      f('2026-04-22 Lift gate hydraulic seal.pdf', { at: '2026-04-22 16:05' }),
      f('2026-07-08 AC compressor replaced.pdf', { at: '2026-07-08 17:30' }),
      f('2026-10-06 Annual inspection & rear brakes.pdf', { at: '2026-10-06 15:45' }),
    ]),
    van('Van 2 - Manatee', '2022-11-18', [
      f('Purchase documents (2022).pdf', { at: '2022-11-18 16:00' }),
      f('Registration & insurance card 2026-27.pdf', { at: '2026-03-03 10:20' }),
    ], [
      f('2026-02-03 Front brake pads.pdf', { at: '2026-02-03 14:10' }),
      f('2026-05-12 Oil change & AC recharge.pdf', { at: '2026-05-12 15:35' }),
      f('2026-08-17 Tires & alignment.pdf', { at: '2026-08-17 16:20' }),
      f('2026-10-20 Check-engine light - O2 sensor.pdf', { at: '2026-10-20 15:55' }),
    ]),
    van('Van 3 - Pelican', '2024-05-06', [
      f('Registration & insurance card 2026-27.pdf', { at: '2026-03-03 10:25' }),
      f('Vehicle lease (May 2024 - Apr 2028).pdf', { at: '2024-05-06 11:00' }),
    ], [
      f('2026-03-19 Oil change.pdf', { at: '2026-03-19 13:40' }),
      f('2026-06-09 25K-mile service.pdf', { at: '2026-06-09 16:15' }),
      f('2026-09-02 Oil change.pdf', { at: '2026-09-02 14:30' }),
    ]),
  ], SETUP),
  text('Delivery zones & same-day cutoffs.pdf', [
    'Delivery zones & same-day cutoffs (from 1 June 2026)',
    'Zone A — Doral, Miami Springs, Westchester, Sweetwater: same day for orders placed by 1:00 pm.',
    'Zone B — Coral Gables, Little Havana, Brickell, Downtown, Little River: same day for orders placed by 11:00 am.',
    'Zone C — Kendall, Palmetto Bay, Cutler Bay, North Miami, Miami Beach: next morning; oxygen swaps same day.',
    'Failed oxygen equipment: replacement on site within 4 hours, 24/7 (on-call driver + technician).',
  ], { at: '2026-05-28 16:10', since: '2026-05-20 10:00' }),
  text('Driver handbook 2026.docx', [
    'Driver handbook 2026 — Amanda Medical Miami',
    'Pre-trip check every morning: tires, lift gate, straps, fire extinguisher, oxygen cylinder rack secured.',
    'Clean and dirty equipment never ride together: returns go in bagged, tagged and behind the bulkhead.',
    'Every delivery gets a signed delivery confirmation from the facility contact: equipment, asset tags and location only.',
    'Set-up standard: beds levelled and tested; concentrators run for 10 minutes with the flow checked before you leave.',
    'Phone in the cradle, no texting while driving. After any accident call Luis first, then the insurer line on the card.',
  ], { at: '2026-01-09 11:30', since: '2025-12-29 10:00' }),
  text('Hurricane plan - fleet & deliveries.docx', [
    'Hurricane plan — fleet & deliveries (reviewed May 2026)',
    'Watch issued: fill all three vans and the spare fuel cans; park the vans inside the Doral warehouse bay.',
    'Pre-stage backup oxygen concentrators at the three Biscayne Senior Living communities and Palmetto Bay Assisted Living.',
    "Warning issued: last deliveries 6 hours before tropical-storm winds; the dispatch line forwards to Marisol's phone.",
    'After the storm: Luis checks roads and the warehouse; deliveries restart zone by zone, oxygen first.',
  ], { at: '2026-05-21 15:00', since: '2023-05-18 10:00' }),
  table('Van maintenance log 2026.xlsx',
    ['Date', 'Van', 'Work done', 'Odometer', 'Cost', 'Shop'],
    [
      ['14 Jan', 'Flamingo', 'Oil change & tire rotation', '61,240 mi', '$148', 'Doral Fleet Service'],
      ['3 Feb', 'Manatee', 'Front brake pads', '48,910 mi', '$412', 'Doral Fleet Service'],
      ['19 Mar', 'Pelican', 'Oil change', '22,450 mi', '$96', 'Dealer (lease plan)'],
      ['22 Apr', 'Flamingo', 'Lift gate hydraulic seal', '64,880 mi', '$685', 'Gulf Lift Gate Repair'],
      ['12 May', 'Manatee', 'Oil change & AC recharge', '51,300 mi', '$286', 'Doral Fleet Service'],
      ['9 Jun', 'Pelican', '25K-mile service', '25,120 mi', '$340', 'Dealer (lease plan)'],
      ['8 Jul', 'Flamingo', 'AC compressor replaced', '68,020 mi', '$1,940', 'Doral Fleet Service'],
      ['17 Aug', 'Manatee', 'Four tires + alignment', '54,760 mi', '$1,120', 'Doral Fleet Service'],
      ['2 Sep', 'Pelican', 'Oil change', '28,300 mi', '$98', 'Dealer (lease plan)'],
      ['6 Oct', 'Flamingo', 'Annual inspection & rear brakes', '71,450 mi', '$620', 'Doral Fleet Service'],
      ['20 Oct', 'Manatee', 'Check-engine light — O2 sensor', '57,180 mi', '$315', 'Doral Fleet Service'],
      ['2026 to date', '3 vans', '11 visits', '', '$6,060', ''],
    ],
    { at: '2026-10-20 18:05', since: '2026-01-14 16:00' }),
], SETUP)

const suppliers = dir('Suppliers', [
  dir('Atlantic Mobility Supply', [
    f('Price list 2026.xlsx', { at: '2026-01-08 14:00' }),
    f('Purchase orders 2026.xlsx', { at: '2026-10-14 10:30', since: '2026-01-06 09:00' }),
  ], SETUP),
  dir('BreatheWell Oxygen Systems', [
    f('Price list 2026.pdf', { at: '2026-01-12 09:30' }),
    f('Purchase orders 2026.xlsx', { at: '2026-10-01 11:05', since: '2026-01-07 09:00' }),
    f('Service bulletin - sieve bed replacement (Aug 2026).pdf', { at: '2026-08-19 13:40' }),
  ], SETUP),
  dir('CareRest Beds', [
    f('Catalog 2026.pdf', { at: '2026-01-20 10:00' }),
    f('Purchase orders 2026.xlsx', { at: '2026-09-18 14:20', since: '2026-01-09 09:00' }),
    f('Quote - 24 semi-electric beds (Oct 2026).pdf', { at: '2026-10-13 16:45' }),
  ], SETUP),
  dir('Gulf Coast PPE Distributors', [
    f('Backorder notices 2026.pdf', { at: '2026-09-24 10:20' }),
    f('Price list 2026 (Schedule A).pdf', { at: '2025-12-19 15:00' }),
    f('Purchase orders 2026.xlsx', { at: '2026-10-21 09:50', since: '2026-01-05 09:00' }),
  ], SETUP),
  table('Supplier scorecard Q3 2026.xlsx',
    ['Supplier', 'Supplies', 'Q3 spend', 'On time', 'Fill rate', 'Notes'],
    [
      ['Atlantic Mobility Supply', 'Wheelchairs, walkers, scooters', '$38,400', '96%', '98%', '—'],
      ['BreatheWell Oxygen Systems', 'Concentrators, cannulas, filters', '$61,200', '91%', '94%', 'Tubing backorder in September'],
      ['CareRest Beds', 'Beds, mattresses, covers', '$44,900', '88%', '97%', 'Freight delays from Georgia'],
      ['Gulf Coast PPE Distributors', 'Gloves, masks, gowns, underpads', '$96,300', '98%', '99%', '2026 prices fixed'],
      ['Other (9 suppliers)', 'Parts, batteries, cleaning', '$22,700', '—', '—', '—'],
      ['Total', '', '$263,500', '', '', ''],
    ],
    { at: '2026-10-09 14:20', since: '2026-10-07 10:00' }),
], SETUP)

const warehouse = dir('Warehouse - Doral', [
  text('Clean & dirty equipment flow.pdf', [
    'Clean / dirty equipment flow — Doral warehouse',
    'Returns come in through dock door 2 only, straight into the dirty bay (red floor tape).',
    'Every unit is cleaned and disinfected in the wash bay, then tagged with the date and initials.',
    'A technician inspects, tests and logs the unit before it moves to clean racking (green tape).',
    'Clean stock leaves through dock door 1 — bagged and sealed units only on the vans.',
  ], { at: '2025-03-14 10:30', since: '2022-09-10 14:40' }),
  f('Cleaning & disinfection log - Oct 2026.xlsx', { at: '2026-10-23 16:30', since: '2026-10-01 07:30' }),
  f('Fire inspection report 2026.pdf', { at: '2026-04-15 13:00' }),
  f('Floor plan & racking layout.pdf', { at: '2025-02-10 11:00' }),
  text('Lease renewal offer - Oct 2026.pdf', [
    'Palm Logistics Center LLC — lease renewal offer, Bay 4 (9,200 sq ft warehouse + 1,100 sq ft office)',
    'Current lease ends 31 May 2027 at $18.75 per sq ft a year.',
    'Offer: 5-year renewal from 1 June 2027 at $21.50 per sq ft, with 3% annual increases.',
    'Landlord replaces dock door 2 and the warehouse lighting with LED; tenant gets a right of first offer on Bay 5.',
    'Response requested by 15 December 2026.',
  ], { at: '2026-10-06 12:15' }),
  text('Safety walkthrough - Sep 2026.docx', [
    'Warehouse safety walkthrough — Thu 24 Sep 2026 (Luis Ortega, Marisol Vega)',
    'Good: aisles clear, eyewash station tested, oxygen cylinders chained upright in the caged area.',
    'Fix: dented racking upright in aisle C — load reduced, replacement ordered ($640).',
    'Fix: two fire extinguishers missed their monthly check — checked and re-tagged the same day.',
    'Reminder: concentrator batteries are only charged inside the charging cabinet, never overnight on the bench.',
  ], { at: '2026-09-24 16:40', since: '2026-09-24 14:00' }),
], SETUP)

const staff = dir('Staff', [
  dir('Schedules', [
    f('On-call rota Q4 2026.xlsx', { at: '2026-09-28 15:00', since: '2026-09-21 10:00' }),
    table('Schedule - week of 2026-10-19.xlsx',
      ['Person', 'Role', 'Mon–Fri', 'Saturday', 'On call'],
      [
        ['Luis Ortega', 'Operations manager', '7:30–4:00', '—', 'Backup all week'],
        ['Dayana Cruz', 'Warehouse lead', '7:00–3:30', '8:00–12:00', '—'],
        ['Kevin Pham', 'Warehouse', '9:00–5:30', '—', '—'],
        ['Rosa Jiménez', 'Warehouse', '7:00–3:30', '—', '—'],
        ['Andre Baptiste', 'Driver (Flamingo)', '7:00–3:30', '8:00–1:00', '—'],
        ['Miguel Santos', 'Driver (Manatee)', '8:00–4:30', '—', 'Mon–Wed nights'],
        ['Javier Morales', 'Driver (Pelican)', '9:30–6:00', '—', 'Thu–Sun nights'],
        ['Tomás Ferreira', 'Equipment technician', '7:30–4:00', '—', 'Mon–Wed nights'],
        ['Nadia Williams', 'Equipment technician', '9:00–5:30', '8:00–12:00', 'Thu–Sun nights'],
        ['Yesenia Flores', 'Dispatch & customer service', '7:00–3:30', '8:00–1:00', '—'],
        ['Office team', 'Account managers, billing, bookkeeping', '8:30–5:00', '—', '—'],
      ],
      { at: '2026-10-16 14:30', since: '2026-10-14 10:00' }),
    f('Schedule - week of 2026-10-26.xlsx', { at: '2026-10-23 15:10', since: '2026-10-21 10:00' }),
  ], '2023-01-05'),
  dir('Training', [
    f('Infection control & equipment cleaning 2026.pdf', { at: '2026-04-08 16:00' }),
    text('New hire onboarding checklist.docx', [
      'New hire onboarding — the first two weeks',
      'Day 1: I-9 and payroll set-up with Gloria; uniform shirts, badge and phone; walk the clean / dirty flow.',
      'Week 1: infection control, privacy & confidentiality, oxygen safety and safe lifting (see Training matrix 2026).',
      'Drivers: five days riding along with Andre; defensive-driving course booked within 60 days.',
      'Technicians: shadow Tomás on bed and concentrator PMs; BreatheWell service certification within 90 days.',
      '30-day check-in with Luis; 90-day review with Marisol.',
    ], { at: '2026-02-14 11:00', since: '2023-06-03 10:00' }),
    f('Oxygen equipment safety - training slides.pptx', { at: '2026-03-10 18:20', since: '2024-03-02 10:00' }),
    f('Training matrix 2026.xlsx', { at: '2026-09-29 10:40', since: '2026-01-06 10:00' }),
  ], '2022-11-01'),
  f('Employee handbook 2026.pdf', { at: '2026-01-15 10:00' }),
  f('Job description - Equipment technician.docx', { at: '2026-10-12 19:10', since: '2026-10-11 18:00' }),
  text('Org chart - Oct 2026.pdf', [
    'Amanda Medical Miami — org chart, October 2026 · 14 staff and 2 owners',
    'Owners: Marisol Vega (Managing Member, day to day) · Amanda Reyes (finance, banking and budgets, remote)',
    'Operations — Luis Ortega: warehouse (Dayana Cruz, Kevin Pham, Rosa Jiménez), drivers (Andre Baptiste, Miguel Santos, Javier Morales), technicians (Tomás Ferreira, Nadia Williams)',
    'Sales — Carla Méndez and Jason Reid, account managers, reporting to Marisol',
    'Office — Yesenia Flores (dispatch & customer service), Priscilla Ruiz (billing), Gloria Hernandez (bookkeeper, part-time)',
    '2027 plan: a third technician in March and a fourth driver with the fourth van in May',
  ], { at: '2026-10-05 09:30', since: '2026-10-05 09:00' }),
  f('Staff directory.xlsx', { at: '2026-08-03 09:20', since: '2022-09-10 14:30' }),
], SETUP)

const servicing = dir('Equipment servicing', [
  text('Cleaning & disinfection SOP.docx', [
    'SOP — cleaning & disinfection of returned equipment (rev. 4, March 2026)',
    'PPE in the dirty bay: nitrile gloves and a gown; eye protection when spraying.',
    'Remove single-use items (cannulas, tubing, mattress covers) into the marked bins.',
    'Clean off visible soil first, then apply an EPA-registered hospital disinfectant for the full wet contact time on the label.',
    'Mattresses and cushions: inspect every cover; any tear means a new cover before reuse.',
    'Bag, tag (date + initials) and move to clean racking only after the technician check.',
  ], { at: '2026-03-06 14:20', since: '2022-10-15 10:00' }),
  text('Oxygen concentrator PM checklist.pdf', [
    'Oxygen concentrator — preventive maintenance checklist (every 6 months and on every return)',
    '1. Record the hours meter · 2. Clean or replace the cabinet and intake filters',
    '3. Oxygen purity at 2 and 5 L/min must read 87% or higher; below 85% the unit comes out of service',
    '4. Flow meter accuracy and alarm tests (power failure, low purity) · 5. Cord, plug and humidifier bottle',
    '6. Clean and disinfect, bag and tag with the date and initials; log it in the service log',
  ], { at: '2025-08-29 10:00', since: '2023-02-10 10:00' }),
  f('Preventive maintenance schedule 2026.xlsx', { at: '2026-10-19 08:10', since: '2026-01-05 08:00' }),
  f('Recall & safety notices log 2026.xlsx', { at: '2026-10-19 08:40', since: '2026-01-05 08:30' }),
  table('Service log - Oct 2026.xlsx',
    ['Date', 'Unit', 'Asset tag', 'Work done', 'Tech', 'Result'],
    [
      ['19 Oct', 'Oxygen concentrator 5 L', 'AMM-OC-0412', '6-month PM, filters, purity 94%', 'Tomás', 'Clean stock'],
      ['19 Oct', 'Semi-electric bed', 'AMM-HB-0233', 'Hand pendant replaced', 'Nadia', 'Clean stock'],
      ['20 Oct', 'Portable concentrator', 'AMM-PC-0057', 'Battery failed the capacity test', 'Tomás', 'Battery ordered'],
      ['20 Oct', 'Low-air-loss mattress', 'AMM-LM-0081', 'Pump alarm — hose replaced', 'Nadia', 'Clean stock'],
      ['21 Oct', 'Oxygen concentrator 5 L', 'AMM-OC-0388', 'Purity 82% — sieve beds (BreatheWell bulletin)', 'Tomás', 'Warranty return'],
      ['21 Oct', 'Standard wheelchair', 'AMM-WC-0517', 'Brakes adjusted, new armrest pads', 'Nadia', 'Clean stock'],
      ['22 Oct', 'Full-electric bed', 'AMM-HB-0071', 'Annual inspection + motor test', 'Tomás', 'Clean stock'],
      ['22 Oct', 'Hydraulic transfer lift', 'AMM-TL-0019', 'Annual load test (400 lb)', 'Nadia', 'Passed, tagged'],
      ['23 Oct', 'Rollator walker', 'AMM-RW-0644', 'Cracked frame', 'Nadia', 'Retired'],
      ['23 Oct', 'Oxygen concentrator 5 L', 'AMM-OC-0450', 'Swap return — hours check, cleaning', 'Tomás', 'Clean stock'],
    ],
    { at: '2026-10-23 17:20', since: '2026-10-01 08:00' }),
], SETUP)

const operations = dir('Operations', [
  servicing,
  fleet,
  inventory,
  staff,
  suppliers,
  warehouse,
  text('Service level report Q3 2026.pdf', [
    'Service levels — Q3 2026',
    '2,184 deliveries, pickups and swaps (Q2: 2,031); same-day orders delivered on time 96.4%.',
    'Oxygen swaps within 4 hours: 61 of 62 — one late during the 9 August storm road closures.',
    'Fleet utilization 80.4% at 30 September (30 June: 78.9%); 38 units waiting for service.',
    'Damage and loss write-offs $3,850 (0.5% of revenue).',
  ], { at: '2026-10-07 10:15', since: '2026-10-05 09:00' }),
], SETUP)

// ───────────────────────────── Legal ─────────────────────────────

const legal = dir('Legal', [
  dir('Compliance', [
    text('Equipment safety & recall procedure.docx', [
      'Equipment safety & recall procedure (rev. 3, 2026)',
      'Every Monday, check manufacturer and FDA recall notices and log each one in Operations\\Equipment servicing\\Recall & safety notices log 2026.xlsx.',
      'Affected asset tags come out of clean stock the same day, tagged DO NOT RENT.',
      'Units on rent: tell the client contact within 24 hours and swap within 72 hours (oxygen and beds first).',
      'Any equipment incident goes to the manufacturer and the incident log; Marisol decides on further reporting.',
    ], { at: '2026-02-19 15:30', since: '2023-01-20 10:00' }),
    f('Equipment incident log 2026.xlsx', { at: '2026-09-14 11:20', since: '2026-01-05 09:00' }),
    text('HIPAA privacy & security policy (template).docx', [
      'Privacy & security policy — generic template adapted for AMM (reviewed January 2026)',
      'AMM supplies equipment to facilities and agencies; we do not need, request or keep health information about individuals.',
      'If a client sends personal health details by mistake (on an order or in an email): delete them, tell the client and log it with Marisol.',
      'Orders and delivery tickets show facility, location and equipment only. Laptops are encrypted; MFA on email and banking; no shared passwords.',
      'Annual privacy & confidentiality training for all staff (Operations\\Staff\\Training).',
    ], { at: '2026-01-17 12:40', since: '2022-11-20 10:00' }),
    f('OSHA bloodborne pathogens exposure control plan 2026.docx', { at: '2026-03-02 14:00', since: '2023-01-09 10:00' }),
  ], SETUP),
  dir('Contracts', [
    dir('Client agreements', [
      text('Master rental agreement - template v4.docx', [
        'Master Equipment Rental & Supply Agreement — template v4 (January 2026)',
        'Parties: Amanda Medical Miami LLC and the client organization (a licensed facility, agency or practice). Not for individual consumers.',
        'Rentals are billed monthly in advance on the 1st; supplies are billed on delivery; payment net 30.',
        'AMM delivers, sets up, maintains and swaps equipment; the client controls its use and returns it free of personal items.',
        'Damage beyond normal wear is billed at repair cost, or at the replacement value in Schedule B.',
        'No health information is shared with AMM: delivery tickets show location and equipment only.',
        "Term 1–3 years; after the first year either party may end it with 60 days' notice.",
      ], { at: '2026-01-10 17:30', since: '2022-09-12 10:00' }),
      table('Signed agreements index.xlsx',
        ['Client', 'Agreement', 'Signed', 'Ends', 'Notes'],
        [
          ['Biscayne Senior Living', 'Master rental agreement', '1 Apr 2024', '31 Mar 2027', 'Renewal terms drafted'],
          ['Coral Gables Home Care', 'Rental & supply agreement', '1 Jul 2025', '30 Jun 2027', '—'],
          ['Kendall Home Health Partners', 'Rental agreement', '1 Jan 2024', '31 Dec 2026', 'Proposal sent 16 Oct'],
          ['Palmetto Bay Assisted Living', 'Master rental agreement', '1 Sep 2024', '31 Aug 2027', '—'],
          ['Little River Family Clinic', 'Supply agreement', '15 Mar 2022', 'Month to month', "30 days' notice"],
          ['Bayview Physiotherapy', 'Rental agreement', '1 May 2025', '30 Apr 2027', 'Fee dispute open ($640)'],
          ['Other accounts (39)', 'Standard terms v3–v4', '—', '—', 'Tracked in the billing system'],
        ],
        { at: '2026-10-16 18:20', since: '2023-02-04 10:00' }),
      f('Standard terms & conditions 2026.pdf', { at: '2026-01-10 17:45' }),
    ], '2022-09-12'),
    dir('Supplier agreements', [
      f('Atlantic Mobility Supply - dealer agreement 2025-2027.pdf', { at: '2025-01-22 15:30' }),
      f('BreatheWell Oxygen Systems - dealer & service agreement.pdf', { at: '2023-07-11 11:00' }),
      f('CareRest Beds - fleet purchase terms 2026.pdf', { at: '2026-01-19 16:10' }),
      text('Gulf Coast PPE Distributors - pricing agreement 2026.pdf', [
        'Gulf Coast PPE Distributors — pricing agreement, 1 January to 31 December 2026',
        'Prices fixed for 12 months on gloves, masks, gowns, underpads and sanitizer (Schedule A).',
        'Minimum purchases $80,000 a quarter; Q3 2026 actual $96,300.',
        'Delivery to Doral within 2 business days; on backorders over 10 days AMM may buy elsewhere and charge the difference.',
        'Renewal talks start 1 November — they have signalled +4% on nitrile gloves for 2027.',
      ], { at: '2025-12-19 15:20' }),
    ], '2022-09-12'),
    f('Lease - Doral warehouse (Jun 2022 - May 2027).pdf', { at: '2022-09-10 15:20' }),
  ], SETUP),
  dir('Insurance', [
    f('Certificates of insurance issued 2026.pdf', { at: '2026-09-02 10:30' }),
    f('Commercial auto policy 2026-27.pdf', { at: '2026-02-26 15:00' }),
    f('General & professional liability policy 2026-27.pdf', { at: '2026-02-26 15:10' }),
    table('Insurance schedule 2026-27.xlsx',
      ['Policy', 'Carrier', 'Limits', 'Annual premium', 'Renews'],
      [
        ['General & products liability', 'Coastline Mutual', '$1M / $3M aggregate', '$14,800', '1 Mar 2027'],
        ['Professional liability (set-up & service)', 'Coastline Mutual', '$1M / $2M aggregate', '$6,200', '1 Mar 2027'],
        ['Commercial auto (3 vans)', 'Harbor & Keys Insurance', '$1M combined single limit', '$13,900', '1 Mar 2027'],
        ["Workers' compensation", 'Sunbelt Casualty', 'Florida statutory', '$15,600', '1 Jan 2027'],
        ['Property & inventory (Doral)', 'Coastline Mutual', '$1.4M incl. fleet in transit', '$9,700', '1 Mar 2027'],
        ['Umbrella', 'Harbor & Keys Insurance', '$2M', '$4,300', '1 Mar 2027'],
        ['Cyber & privacy', 'Coastline Mutual', '$500K', '$1,900', '1 Mar 2027'],
        ['Buy-sell term life (2 policies)', 'Tidewater Life', '$1M per member', '$3,100', '15 Apr 2027'],
        ['Total', '', '', '$69,500', ''],
      ],
      { at: '2026-03-01 19:30', since: '2023-02-25 10:00' }),
    f("Workers' compensation policy 2026.pdf", { at: '2026-01-02 10:00' }),
  ], SETUP),
  dir('Licenses & Permits', [
    f('City of Doral business tax receipt 2026-27.pdf', { at: '2026-09-24 11:05' }),
    f('HME license - AHCA (Feb 2025 - Jan 2027).pdf', { at: '2025-02-03 12:30' }),
    f('HME license renewal application - draft.pdf', { at: '2026-10-21 20:50', since: '2026-10-14 19:30' }),
    text('HME license renewal 2027 - checklist.docx', [
      'Home medical equipment (HME) license renewal — Florida AHCA · the current license expires 31 Jan 2027',
      'Renewal application and fee due at least 60 days before expiry → by Wed 2 December 2026.',
      '[x] Updated list of equipment categories: beds, mobility aids, transfer lifts, oxygen concentrators',
      '[x] Proof of liability insurance and the 2026-27 local business tax receipts (county and Doral)',
      '[ ] Background screening confirmations for the two newest staff (Gloria to pull them)',
      '[ ] Policy binder refreshed: cleaning, recalls, complaints, emergency plan',
      '[ ] Survey-readiness walk-through of the warehouse with Luis, week of 16 November',
    ], { at: '2026-10-16 20:10', since: '2026-10-03 18:00' }),
    f('Miami-Dade County local business tax receipt 2026-27.pdf', { at: '2026-09-24 11:00' }),
  ], SETUP),
  dir('LLC & Ownership', [
    f('Articles of Organization - filed Mar 2021.pdf', { at: '2022-09-10 14:05' }),
    text('Buy-sell valuation note 2026.docx', [
      'Buy-sell valuation — annual update under §9.2 of the operating agreement (March 2026)',
      'Formula: 4.5 × trailing-12-month EBITDA, less net debt; either member can ask for an appraisal instead.',
      '2025 EBITDA $440,000 → $1.98M; no debt and the line of credit undrawn → $990,000 per 50% interest.',
      'The buy-out is funded by a $1M term life policy on each member, owned by the LLC (Insurance schedule 2026-27).',
      'Next update March 2027 on 2026 EBITDA (forecast $494K → about $2.22M).',
    ], { at: '2026-03-14 18:30', since: '2026-03-14 16:00' }),
    f('Florida annual report 2026 - filed.pdf', { at: '2026-02-11 20:15' }),
    f('Operating Agreement - Amendment 1 (Feb 2024).pdf', { at: '2024-02-20 19:00' }),
    f('Operating Agreement - signed Mar 2021.pdf', { at: '2022-09-10 14:10' }),
    table('Operating agreement - summary.xlsx',
      ['Provision', 'Terms', 'Section'],
      [
        ['Members & ownership', 'Amanda Reyes 50% · Marisol Vega 50%', '§3.1'],
        ['Capital contributed (2021)', '$90,000 each — $180,000 in total', '§4.1'],
        ['Management', 'Member-managed; Marisol Vega is Managing Member for day-to-day operations', '§6.1'],
        ['Finance role', 'Amanda Reyes keeps the books, budget, banking and tax filings', '§6.3'],
        ['Both members must approve', 'Spending over $25,000, new debt, leases, a new location, hiring managers', '§6.4'],
        ['Management fee', '$5,000 a month to Marisol Vega for full-time management', '§5.3'],
        ['Distributions', 'Quarterly: tax distributions first, then 50/50', '§5.1'],
        ['Cash reserve', 'At least two months of operating costs before any other distribution', '§5.4'],
        ['Transfers & buy-sell', 'Right of first refusal; price 4.5 × trailing EBITDA or an appraisal', '§9.2'],
        ['Deadlock', 'Mediation in Miami-Dade County, then the outside CPA decides financial questions', '§10.1'],
        ['Amendment 1 (Feb 2024)', "Line of credit up to $250,000 with both members' signatures", 'Amdt 1'],
      ],
      { at: '2026-02-07 17:40', since: '2022-09-11 18:00' }),
  ], SETUP),
], SETUP)

// ───────────────────────────── Clients ─────────────────────────────

/** A client's quarterly order books for 2026; Q4 is still in progress. */
function orders2026(seed: number, q3?: SeedFile): SeedFile[] {
  const at = (day: string, i: number) => `${day} ${15 + ((seed + i) % 3)}:${String((seed * 11 + i * 17) % 60).padStart(2, '0')}`
  return [
    f('2026 Q1 orders.xlsx', { at: at('2026-03-31', 1), since: '2026-01-02 09:00' }),
    f('2026 Q2 orders.xlsx', { at: at('2026-06-30', 2), since: '2026-04-01 09:00' }),
    q3 ?? f('2026 Q3 orders.xlsx', { at: at('2026-09-30', 3), since: '2026-07-01 09:00' }),
    f('2026 Q4 orders (to date).xlsx', { at: at('2026-10-23', 4), since: '2026-10-01 09:00' }),
  ]
}

function client(name: string, created: string, agreements: SeedNode[], orders: SeedNode[], correspondence: SeedNode[]): SeedFolder {
  return dir(name, [
    dir('Agreements', agreements, created),
    dir('Correspondence', correspondence, created),
    dir('Orders', orders, created),
  ], created)
}

const biscayne = client('Biscayne Senior Living', '2022-10-03', [
  f('Master rental agreement - signed Apr 2024.pdf', { at: '2024-04-02 18:30' }),
  f('Pricing schedule 2026.xlsx', { at: '2026-01-06 10:20', since: '2025-12-15 19:00' }),
  text('Renewal terms 2027 - draft.docx', [
    'Biscayne Senior Living — renewal terms (DRAFT for the Wed 4 Nov meeting)',
    'Term: 2 years from 1 April 2027 (the current agreement ends 31 March 2027).',
    'Pricing: 2027 list rates (+3%) with the volume discount going from 8% to 9% — about +2% on today’s invoices.',
    'Service: 4-hour oxygen swaps and same-day bed delivery at Bayfront, Morningside and Shorecrest; a quarterly equipment review with each executive director.',
    'Payment stays net 30 — and their new AP system has to work: the August and September statements ($108,800) are past due.',
    'Add: hurricane-season pre-staging of 12 backup concentrators per community, June to November, at half rate.',
  ], { at: '2026-10-22 20:30', since: '2026-10-18 19:00' }),
], [
  dir('2026', [
    dir('Q1', [
      f('Delivery confirmations Q1 2026 (scans).pdf', { at: '2026-04-02 10:30' }),
      f('Orders Q1 2026.xlsx', { at: '2026-03-31 17:00', since: '2026-01-02 09:15' }),
    ], '2026-01-02'),
    dir('Q2', [
      f('Delivery confirmations Q2 2026 (scans).pdf', { at: '2026-07-02 10:20' }),
      f('Orders Q2 2026.xlsx', { at: '2026-06-30 17:10', since: '2026-04-01 09:15' }),
    ], '2026-04-01'),
    dir('Q3', [
      dir('Delivery confirmations', [
        f('DC-2026-0703 Bayfront - 6 semi-electric beds.pdf', { at: '2026-07-03 13:20' }),
        f('DC-2026-0716 Morningside - 10 oxygen concentrators.pdf', { at: '2026-07-16 11:05' }),
        f('DC-2026-0729 Shorecrest - monthly PPE & supplies.pdf', { at: '2026-07-29 10:40' }),
        f('DC-2026-0806 All three communities - 36 backup concentrators.pdf', { at: '2026-08-06 17:30' }),
        f('DC-2026-0824 Bayfront - 4 low-air-loss mattresses.pdf', { at: '2026-08-24 14:15' }),
        text('DC-2026-0915 Morningside - 8 wheelchairs, 12 rollators.pdf', [
          'Delivery confirmation DC-2026-0915 · Amanda Medical Miami LLC → Biscayne Senior Living, Morningside community',
          'Delivered Tue 15 Sep 2026 at 10:42 · Van 2 (Manatee) · driver Miguel Santos',
          'Equipment: 8 standard wheelchairs (AMM-WC-0488 to 0495) and 12 rollator walkers (AMM-RW-0601 to 0612)',
          'Placed in the ground-floor equipment room; every unit cleaned, inspected and tagged',
          'Received and signed for by the community maintenance supervisor · PO BSL-2026-PO-274',
        ], { at: '2026-09-15 11:02', since: '2026-09-15 10:50' }),
        f('DC-2026-0928 Shorecrest - 2 transfer lifts.pdf', { at: '2026-09-28 15:50' }),
      ], '2026-07-01'),
      f('Hurricane pre-staging - Aug 2026.pdf', { at: '2026-08-05 16:40' }),
      f('Orders Q3 2026.xlsx', { at: '2026-09-30 17:05', since: '2026-07-01 09:10' }),
    ], '2026-07-01'),
    dir('Q4', [
      f('Orders Oct 2026 (to date).xlsx', { at: '2026-10-22 16:15', since: '2026-10-01 08:30' }),
      f('Purchase order BSL-2026-PO-311.pdf', { at: '2026-10-13 11:20' }),
      f('Quote - 10 low-air-loss mattresses (Shorecrest).pdf', { at: '2026-10-22 15:40' }),
    ], '2026-10-01'),
    table('BSL order summary 2026.xlsx',
      ['Quarter', 'Rentals billed', 'Supplies & PPE', 'Delivery & service', 'Total'],
      [
        ['Q1 2026', '$96,200', '$46,300', '$5,500', '$148,000'],
        ['Q2 2026', '$98,900', '$47,400', '$5,700', '$152,000'],
        ['Q3 2026', '$104,600', '$51,200', '$6,200', '$162,000'],
        ['Q4 2026 (to 23 Oct)', '$35,400', '$17,300', '$2,100', '$54,800'],
        ['2026 to date', '$335,100', '$162,200', '$19,500', '$516,800'],
      ],
      { at: '2026-10-23 19:40', since: '2026-04-02 19:00' }),
  ], '2026-01-02'),
  f('2022-2025 orders (archive).zip', { at: '2026-01-04 11:00' }),
], [
  f('2026-08-04 Hurricane season pre-staging plan.pdf', { at: '2026-08-04 15:30' }),
  text('2026-10-14 Past-due statements - email to BSL accounts payable.pdf', [
    'To: Accounts Payable, Biscayne Senior Living · From: Priscilla Ruiz, Amanda Medical Miami · Wed 14 Oct 2026',
    'Re: August and September statements — $53,700 and $55,100, now 75 and 44 days old',
    'Thanks for confirming the move to your new AP platform. Our vendor record still has the old remittance details, so both payments were returned.',
    'Updated W-9 and remittance form attached. Could you confirm a payment date? Marisol will also raise it at the 4 November renewal meeting.',
  ], { at: '2026-10-14 10:25', since: '2026-10-14 10:05' }),
  f('Quarterly review Q3 2026 - slides.pptx', { at: '2026-10-07 17:45', since: '2026-10-05 10:00' }),
])

const coralGables = client('Coral Gables Home Care', '2022-09-10 15:00', [
  f('Pricing schedule 2026.xlsx', { at: '2026-01-06 10:40', since: '2025-12-15 19:20' }),
  f('Rental & supply agreement - renewed Jul 2025.pdf', { at: '2025-06-27 17:00' }),
], orders2026(1, table('2026 Q3 orders.xlsx',
  ['Month', 'Rentals', 'Supplies & PPE', 'Delivery', 'Total'],
  [
    ['July 2026', '$24,000', '$11,500', '$1,400', '$36,900'],
    ['August 2026', '$24,100', '$11,700', '$1,400', '$37,200'],
    ['September 2026', '$24,300', '$12,100', '$1,500', '$37,900'],
    ['Q3 2026', '$72,400', '$35,300', '$4,300', '$112,000'],
  ],
  { at: '2026-09-30 16:45', since: '2026-07-01 09:00' })), [
  f('2025-06-27 Renewal confirmation.pdf', { at: '2025-06-27 17:20' }),
  text('2026-09-22 Call notes - Westchester loan closet.docx', [
    'Call with the Coral Gables Home Care operations director — Tue 22 Sep 2026 (Carla Méndez)',
    'They open a second branch office in Westchester in January and want an equipment loan closet there as well.',
    'Starting stock: 20 standard wheelchairs, 30 rollators, 10 transport chairs, 6 knee scooters; weekly top-up delivery on Thursdays.',
    'About +$3,400 a month in rentals from February 2027 — included in the 2027 budget draft.',
    'Next: site visit with Luis on Thu 5 November; quote by 12 November.',
  ], { at: '2026-09-22 16:30', since: '2026-09-22 15:10' }),
])

const kendall = client('Kendall Home Health Partners', '2023-01-16', [
  f('Rental agreement 2024-2026.pdf', { at: '2023-12-18 16:00' }),
  text('Renewal proposal 2027-2028.docx', [
    'Renewal proposal — Kendall Home Health Partners, 2027–2028 (sent Fri 16 Oct 2026)',
    'The current agreement ends 31 December 2026; 2026 billing is on track for about $330K ($246K to September).',
    'Proposed: a 2-year term at 2027 list rates (+3%), with a 5% volume discount on oxygen concentrators.',
    'They asked for net 45 payment terms; we offered net 30 with a 1% early-payment discount instead.',
    'Decision expected by 30 November. Account manager: Jason Reid.',
  ], { at: '2026-10-16 15:30', since: '2026-10-09 10:00' }),
], orders2026(2), [
  f('2026-10-09 Request - net 45 payment terms.pdf', { at: '2026-10-09 10:15' }),
])

const palmettoBay = client('Palmetto Bay Assisted Living', '2024-08-26', [
  f('Master rental agreement - signed Sep 2024.pdf', { at: '2024-08-29 15:00' }),
], orders2026(3), [
  f('2026-03-18 Welcome pack - new executive director.pdf', { at: '2026-03-18 14:00' }),
  f('2026-08-06 Hurricane backup concentrators - confirmation.pdf', { at: '2026-08-06 18:10' }),
])

const littleRiver = client('Little River Family Clinic', '2022-09-10 15:00', [
  f('Credit application 2022.pdf', { at: '2022-09-10 15:10' }),
  f('Supply agreement - month to month (2022).pdf', { at: '2022-09-10 15:12' }),
], orders2026(4), [
  f('2026-10-19 Flu season PPE order change.pdf', { at: '2026-10-19 09:40' }),
])

const bayview = client('Bayview Physiotherapy', '2022-09-10 15:00', [
  f('Rental agreement - renewed May 2025.pdf', { at: '2025-04-28 16:30' }),
], orders2026(5), [
  f('2026-01-12 2026 price letter.pdf', { at: '2026-01-12 10:00' }),
  text('2026-09-30 Damaged walker fee dispute.docx', [
    'Bayview Physiotherapy — damaged equipment fee, invoice AMM-26-0614 ($640)',
    'Two rollator walkers came back from the Brickell site on 12 June with bent frames; not economical to repair.',
    'Bayview says the frames were bent on arrival; our delivery confirmation shows both units inspected and tagged.',
    'Offer sent 30 Sep: split the fee 50/50 and credit $320 on the November invoice. Waiting for their reply.',
  ], { at: '2026-09-30 17:20', since: '2026-09-30 16:30' }),
])

const clients = dir('Clients', [
  bayview,
  biscayne,
  coralGables,
  kendall,
  littleRiver,
  palmettoBay,
  table('Client list 2026.xlsx',
    ['Client', 'Type', 'Client since', 'Agreement ends', '2026 YTD revenue (Sep)'],
    [
      ['Biscayne Senior Living', 'Assisted living (3 communities)', '2022', '31 Mar 2027', '$462,000'],
      ['Coral Gables Home Care', 'Home-care agency', '2021', '30 Jun 2027', '$318,000'],
      ['Kendall Home Health Partners', 'Home-health agency', '2023', '31 Dec 2026', '$246,000'],
      ['Palmetto Bay Assisted Living', 'Assisted living', '2024', '31 Aug 2027', '$188,000'],
      ['Little River Family Clinic', 'Primary-care clinic', '2022', 'Month to month', '$97,000'],
      ['Bayview Physiotherapy', 'Physiotherapy practice (2 sites)', '2021', '30 Apr 2027', '$84,000'],
      ['Other accounts (39)', 'Clinics, agencies, practices', '—', '—', '$877,000'],
      ['Total (45 accounts)', '', '', '', '$2,272,000'],
    ],
    { at: '2026-10-10 17:15', since: '2023-01-08 19:00' }),
], SETUP)

// ───────────────────────────── The company folder ─────────────────────────────

export const amandaMedicalMiami: SeedFolder = dir('AmandaMedicalMiami', [
  clients,
  finance,
  legal,
  operations,
  table('AMM key dates 2026-27.xlsx',
    ['Date', 'Deadline', 'Owner', 'Status'],
    [
      ['20 Nov 2026', 'Florida sales & use tax (DR-15) for October', 'Priscilla Ruiz', 'Monthly'],
      ['2 Dec 2026', 'HME license renewal application to AHCA', 'Marisol Vega', 'Draft ready'],
      ['15 Dec 2026', '2027 budget — owners sign off', 'Amanda Reyes', 'DRAFT out 18 Oct'],
      ['31 Dec 2026', 'Year-end stock count, Doral', 'Luis Ortega', 'Scheduled'],
      ['15 Jan 2027', "Members' Q4 federal estimated tax", 'Both owners', 'Tax distribution mid-December'],
      ['31 Jan 2027', '1099-NEC forms to contractors', 'Gloria Hernandez', '—'],
      ['15 Mar 2027', 'Form 1065 and K-1s (or extension)', 'Lopez & Hart CPA', 'Engaged'],
      ['31 Mar 2027', 'Biscayne Senior Living agreement ends', 'Marisol Vega', 'Renewal terms drafted'],
      ['1 Apr 2027', 'Tangible personal property return (DR-405)', 'Gloria Hernandez', '—'],
      ['1 May 2027', 'Florida LLC annual report', 'Amanda Reyes', '—'],
      ['31 May 2027', 'Doral warehouse lease ends', 'Both owners', 'Renewal offer in hand'],
      ['30 Sep 2027', 'Local business tax receipts (county + Doral)', 'Priscilla Ruiz', 'Renewed Sep 2026'],
    ],
    { at: '2026-10-18 17:30', since: '2026-01-04 19:00' }),
  text('Company overview 2026.pdf', [
    'Amanda Medical Miami LLC — company overview 2026',
    'Medical equipment rental and supply for care providers across Miami-Dade, from a 9,200 sq ft warehouse in Doral. Founded in March 2021 by cousins Marisol Vega and Amanda Reyes (50/50).',
    'We rent hospital beds, wheelchairs, mobility aids, transfer lifts and oxygen concentrators, sell PPE and care supplies, and deliver, set up and service everything we rent.',
    'Our clients are organizations only — assisted-living communities, home-care and home-health agencies, clinics and physiotherapy practices (45 accounts). We do not bill insurers or individuals.',
    '2025 revenue $2.71M (+13.9%) · 2026 budget $2.98M · 14 staff · about 1,400 rental units · 3 delivery vans.',
    'Our promise: same-day delivery in the core zones, 4-hour oxygen swaps around the clock, every unit cleaned, inspected and tagged.',
  ], { at: '2026-02-14 16:20', since: '2026-02-07 18:00', size: 1_840_332 }),
  text('Owners meeting notes - Oct 2026.docx', [
    'Owners meeting — Sat 17 Oct 2026 (video call) · Marisol Vega, Amanda Reyes',
    'Q3: revenue $802K (+14.4%), EBITDA $144K (18.0%); YTD $2.27M — on track for the $3.08M forecast.',
    '2027 budget DRAFT: revenue $3.42M (+11%), EBITDA $536K; staff 14 → 16; a fourth van leased from May.',
    'Cash about $415K vs the $431K two-month reserve: the Q3 distribution ($60K, 50/50) waits until Biscayne pays August and September ($108,800).',
    'Doral lease: landlord offers 5 years at $21.50/sq ft from June 2027 (now $18.75). Marisol tours a 12,000 sq ft unit nearby as a fallback.',
    'HME license renewal to AHCA by 2 Dec — checklist in Legal\\Licenses & Permits. Kendall Home Health decides on renewal by 30 Nov.',
    'Actions: Amanda — budget v2 by 6 Nov · Marisol — Biscayne renewal meeting 4 Nov, van quotes · Luis — year-end count plan.',
  ], { at: '2026-10-17 13:40', since: '2026-10-17 10:00' }),
], SETUP)
