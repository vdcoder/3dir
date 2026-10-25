# Spatial Layout Negotiator — standalone experiment

Five specialized container designers (Bookshelf, Room, Building, Campus, Area) cooperating through one
two-pass protocol. **Not part of the 3dir app:** nothing here is imported by `src/`, the 3D renderer, the
existing spatial compiler or the deployment. No paid assets were generated.

Three stages live side by side, all reproducible:

- **α.v2** (engine default): every container absorbs 20% of its surplus and passes the rest down.
- **Sensitivity study** of α.v2: absorption 20 / 10 / 5% × uniform / balanced child-offer sampling.
- **α.v3** (`{ version: 'v3' }`): *pack exact, center naturally, grow intelligently only inside rooms.*

## Run it

Node 22.18+ runs the TypeScript directly (no build step, no new dependencies; Vitest and TypeScript come from
the repository root).

```
cd experiments/spatial-layout-negotiator
npm test            # 98 tests: α.v2 edge cases and invariants, the sensitivity checks, and α.v3
npm run typecheck
npm run gallery     # α.v2 drawings: gallery/*.svg and gallery/index.html (validates every drawn layout)
npm run bench       # α.v2 benchmarks: results/benchmarks.{json,md}
npm run study       # sensitivity study: results/sensitivity.{json,md} and gallery/sensitivity/
npm run gallery:v3  # α.v3 sheets A–J: gallery/v3/ (validates every drawn layout with the α.v3 validator)
npm run compare     # α.v2 vs α.v3 on the same datasets and seeds: results/v3-comparison.{json,md}
```

Open `gallery/index.html` to browse the drawings (it links the sensitivity sheets and the α.v3 gallery);
`results/` has the measurements.

## α.v3 — fixed geometry, smart rooms, segmented shelving

> Areas pack exact offered sizes. Campuses center buildings without resizing them. Buildings align rooms.
> Rooms adapt their interiors to the dimensions required by their buildings. Shelves remain physically
> fixed after their row geometry is established.

α.v3 is a second designer set in `src/v3/`, selected per run with `{ version: 'v3' }`. It keeps the two-pass
protocol (measure bottom-up, arrange top-down, no search while arranging) and reuses α.v2's measurement for
Area, Campus and Building, its row negotiation, offer bounding, file tables and validator. There is no
absorption rate: the root takes one of its measured offers and is placed at exactly that size (a scale or
viewport size is refused).

**Constants** (`src/config.ts`): `MAX_ROOM_WIDTH` = 10 m (configurable, `cfg.v3.maxRoomWidth`) is a room's
outer width, side clearances included. `MAX_SHELF_SEGMENT_LENGTH` = `MAX_ROOM_WIDTH` − 2 × side clearance
= 9 m is a shelf fixture's outer length, side panels included, so the frame allowance is already inside it and
nothing is counted twice; a segment holds 8.88 m of books (9 m minus two 3 cm panels and 6 cm of breathing).

| Designer | Measure | Arrange |
|---|---|---|
| A · Bookshelf | One fixed length: books + 2 panels + minimum spacing + breathing. Longer than 9 m: split in book order into full 9 m segments (never splitting a book); the last keeps its spare length as a display bay. All segments share the folder's path and a group id. | Books at their own widths. An ordinary shelf may be lengthened to its row's common length (display space); nothing else changes. |
| B · Room | For each C: shortest-first rows (`src/v3/allocate.ts`), each row normalized to its own longest shelf; segment stacks in dedicated consecutive rows at the rear; one file table in front, as wide as the shelves allow or about square, never wider than the width limit allows (it grows in depth). The C = 1 offer is always kept. | Shelves, stacks and table keep their geometry. Extra width ≥ 1.5 m → a side zone; less → wider side clearances. Extra depth ≥ 1.5 m → a front zone with a walkway to the door, plus a middle zone between shelves and table from 4 m; less → a deeper entrance clearance. Zones are furnished from a fixed library. |
| C · Building | α.v2's row family (k rooms per row, k = 1 … R), one common depth per row. | Exact footprint. Rooms take their row's depth; a row narrower than the building widens its rooms (equal shares, each up to 10 m); width no room can take becomes a lobby. Walls, partitions, corridors and hall keep their sizes. |
| D · Campus | α.v2's row family of buildings. | Exact footprints. Each row is as deep as its deepest building; a narrower row gives each cell an equal share of the spare width; each building is centered in its cell, the rest is grounds, and an entrance walk joins its door to the street, courtyard or plaza in front. Paths, streets, courtyard, plaza and boundary keep their widths. |
| E · Area | α.v2's seeded packing of exact child rectangles with separation P, balanced child-offer sampling by default. | The saved blueprint exactly; every child gets its selected offer's size. |

**Room features** (`src/v3/features.ts`): workstations, a classroom, a waiting area, a lounge, a reading and
study area, plants; leftover space is interior circulation. Each feature declares its minimum zone, the most
it takes, preferred zones and optional keywords; a room whose name or path matches (for example *Clients*,
*Training*, *Home*, *Finance*) tries that feature first. Furniture has fixed sizes and never rotates.
Deterministic: no randomness, no external assets.

**Validator** (`src/v3/validate.ts`): every α.v2 check (geometry, containment, canonical ancestry, overlap,
exact accounting of every square metre, fixed-size objects, clearances, row alignment, ledgers) plus the α.v3
invariants: exact area children, exact campus footprints, centering with entrance walks, common row depths,
fixed separator widths, room growth kept inside the room, room width ≤ 10 m, equal shelves per row,
shortest-first allocation (re-derived from the shelves' own lengths), segment size, consecutive dedicated
segment rows, one canonical identity with complete contents and its rails, file-table completeness, the C = 1
fallback, and furniture only inside feature zones with a walkway in line with the door. No search during
arrangement is enforced by the engine and tested. Every check has a test that corrupts a valid layout on
purpose and expects it to fire.

### Evidence

- **Tests:** 44 new (98 in total), including 200 random rooms (0–8 folders of 0.1–69 m, up to 400 files)
  that all get a valid, bounded C = 1 offer, and the extreme room (≈1,000 m of one folder, 40 others, 600
  files).
- **Gallery** (`gallery/v3/`, 10 sheets, 38 validated layouts, 0 violations): A shortest-first with C = 1–4,
  B per-row normalization, C a segmented shelf with its rails, D the extreme room, E smart growth, F building
  alignment, G campus centering, H exact packing from Area to Bookshelf, I α.v2 vs α.v3 on one tree,
  J a known weakness (below).
- **Comparison** (`results/v3-comparison.md`): α.v2 at its minimum size (its most compact state) against
  α.v3, same datasets and seeds: the demo, synthetic ~100, ~1,000 (5 seeds each) and ~5,000 (seed 1), plus
  three extreme-shelf cases. 54 layouts, 0 validator failures in either version.

### Findings

On ordinary trees α.v3 is about as compact as α.v2, with better rooms and shelves but no new compactness;
its clear advantage is bounded geometry when folders are huge.

1. **World size: no gain on ordinary trees.** α.v3's root is 1.5% smaller on the demo and 1.8%, 2.8% and
   3.6% larger at ~100, ~1,000 and ~5,000 containers. Balanced sampling alone costs 2–5% (sensitivity study),
   so the exact-size rules themselves are roughly neutral.
2. **Better rooms and shelves.** Unused room floor falls from 13.4–16.2% to 12.4–14.1% of room floor (lower in
   3 of 4 datasets), buildings have no unused floor at all (α.v2: up to 395 m²), room proportions improve
   (mean |ln w/d| 0.32–0.39 vs 0.37–0.43), and shelf fill rises from 62–66% to 69–73% because only shelves in
   one row share a length. Rows are emptier (occupancy 71–78% vs 80–91%): shortest-first rows do not span the
   room.
3. **Campus grounds grow at scale.** Buildings are no longer stretched to their row's depth, so centering
   leaves grounds: unused campus floor is 53% higher at ~1,000 containers and 41% higher at ~5,000, and total
   unused floor is 3.5% of the root vs 2.7–2.9%.
4. **Smart growth rarely triggers on ordinary trees.** Building-imposed growth is usually small: 0.8
   features per demo layout and 12 among 1,574 rooms at ~5,000, mostly plants and workstations. Most rooms
   that grow get too little extra space for a feature and only widen their clearances or deepen their
   entrance. Features appear readily when a room is given real space (sheet E).
5. **Extreme folders: bounded and much smaller.** With one ≈1,000 m folder, α.v2 makes a 1,068 m-wide room
   and a 190,217 m² world; α.v3 keeps every room ≤ 10 m wide (that one 155 m deep) in a 29,107 m² world
   (6.5× smaller), with unused floor at 6.8% of the root instead of 17.7% and shelf fill 91% instead of 32%.
   With 3% of folders at 10–400 m: 4× smaller (139,566 vs 555,242 m²), 0 vs 15 rooms per layout wider than
   10 m. The extreme room alone: 10 × 177 m vs 1,068 × 54 m (32× smaller).
6. **Known weakness: one very deep room sets its whole row's depth** (sheet J). In the demo with the
   ≈1,000 m folder, Invoices (2.4 × 5.0 m) shares a row with that 155 m room and becomes 2.4 × 155 m of mostly
   open floor. The fix belongs in the Building's row generation (group rooms of similar depth, or give a very
   deep room its own row or wing), which this brief asked to keep unchanged: an owner decision.
7. **Cost: unchanged within noise.** Measuring and arranging take the same time (three runs at ~5,000
   containers: measure 254–439 ms for α.v2 and 294–348 ms for α.v3, arrange 59–116 vs 66–77 ms; this VM
   varies by ±20% or more). α.v3 keeps 33–35% fewer offers (mostly rooms) and 11–15% smaller saved plans;
   placed trees are about the same size (−1% to +6%). The extreme room arranges 3.5× faster (17 vs 61 ms).

### Interpretations to confirm

- *"Rows can also be stretched horizontally, by making the front area taller"*: read as rooms in a row
  narrower than their building widening (equal shares, each up to `MAX_ROOM_WIDTH`) and absorbing the width
  inside, mostly in their front part; width no room can take becomes a building lobby (sheet F, test).
- `MAX_ROOM_WIDTH` = 10 m is my choice of default; everything derives from it.
- Segment stacks sit at the rear, ordinary rows follow rear to front in allocation order (shortest first).
- Rooms do not use rear zones (shelves stand against the rear wall). When a centered walkway would leave both
  halves of a front zone too narrow for a feature, the door and a 0.9 m walkway move to the west side,
  alongside the 0.5 m side clearance.
- A campus row's spare width is shared equally among its cells; buildings are centered in both directions.
- Above rooms, α.v3 containers refuse any envelope other than their measured size, so a viewport can never
  change world geometry.
- A book wider than one segment can hold (8.88 m) is reported as infeasible rather than split.


## How α.v2 works

**Protocol** (`src/protocol.ts`, `src/engine.ts`)
- *Measure* (bottom-up): a designer receives its children's offers and returns a bounded list of its own.
  An offer is `{ key, w, d, plan, quality }`: a real arrangement, its minimum size, and the plan that
  reproduces it (row grouping, positions, the child offers it chose, separators, entrance geometry).
- *Arrange* (top-down): the parent passes the chosen offer and an envelope at least that large; the child
  grows the saved plan into it. A phase guard makes any search during arrange throw, and the engine refuses
  envelopes smaller than the offer.
- *Ledger*: every container records, per axis, `surplus = absorbed + passed`; its own space (padding,
  separators, corridors, courtyards…) is emitted as labelled regions that, with the children, tile its
  envelope exactly.

**Growth rule.** On each axis the container keeps `absorb × surplus` (default 0.2, configurable) for its own
spacing and hands the rest to its children. Designers decide how their share is spread: walls vs corridors,
plaza vs streets, boundary vs paths. Fixed-size objects (books, tables, desks, signs) never change size; the
space around them grows instead. There are no maximum sizes anywhere.

| Designer | Measure (the search) | Arrange (growth) |
|---|---|---|
| **A Bookshelf** `designers/bookshelf.ts` | Arithmetic: books + body + spacing + breathing. Offers: packed, with a display bay, evenly spaced. | 80% widens the book slots, 20% the breathing room. Depth fixed; extra depth is front clearance. |
| **B Room** `designers/room.ts` | Identical shelves (widest shelf's minimum) in rear rows of k = 1…M; a file table in front sized per layout; near-square table when there are no / few shelves. | Rows kept; shelves grow identically; 20% to aisles, side clearance and entrance; computer / display desks appear beside the table when they fit. |
| **C Building** `designers/building.ts` | Rooms in rows of k = 1…R; each row negotiates one shared depth (`rows.ts → negotiateRow`); a files room first for loose files. | 20% to walls, partitions, corridors, hall; 80% to rooms; rooms in a row receive one common depth. |
| **D Campus** `designers/campus.ts` | Same row family on buildings; file building first; boundary, paths, streets, entrance plaza; central courtyard with two or more rows. | 20% to boundary, paths, streets, courtyard (double weight) and plaza; buildings in short rows spread out. |
| **E Area** `designers/area.ts` | Seeded attempts: order, one offer per child, first-fit on an X/Y marking grid with a separator P around each child, enlarging toward balanced proportions. Best distinct attempts saved as blueprints (narrow, square and wide kept). | No new search: a monotone stretch of each axis; the stretches under children share 80% (each child grows in proportion), the uncovered stretches (boundary, separators) 20%. Order, adjacency and clearances are kept. |

Building and Campus share `designers/rowContainer.ts`; Room uses the same `rows.ts` utility with its own
rules (identical shelves, table row). Separator families by area level: highway 10 m, street 6 m, path 3.5 m,
hedge 2 m (`config.ts`).

**Validator** (`src/validate.ts`) checks every node: minimum size, geometric and canonical containment (real
descendants only; synthetic files rooms keep their folder's path), sibling overlap, exact space accounting,
fixed object sizes, padding and separator clearances, row alignment, identical shelves, and the ledger
(`absorbed + passed = surplus`, `absorbed ≥ 20%`). The test suite also corrupts layouts on purpose to show each
check fires.

## α.v2 evidence

- **Tests** (`test/`, 48): empty, single-child and many-identical containers at every level; mixed small and
  large children; narrow vs wide offers; identical shelves; near-square tables; **three rooms of different
  minimum depths at one shared depth without re-measuring** (acceptance test); campus row alignment; five
  nested areas with canonical containment and one separator family per level; impossible geometry (zero or
  negative book widths, allocations below minimum, invalid configuration); eight children with ten offers
  each; large, unequal and very large (10 × 8) growth across all five levels; same-seed determinism; blueprint
  growth with no new search; 10 / 100 / 1,000 attempt budgets.
- **Gallery** (`gallery/`, 10 drawings, all validated): bookshelf offers and growth; room offer family, room
  growth, square tables; three rooms at a shared depth; campus grid configurations; six area blueprints from
  seeded attempts; a blueprint before and after growth; the full Area → Campus → Building → Room → Bookshelf
  chain; and a 3× / 2.5× growth with per-level ledgers.
- **Benchmarks** (`results/benchmarks.md`, measured, Intel Xeon 2.1 GHz 4-core VM, Node 22.22):

| containers | measure | arrange (1×) | total | measured tree | placed tree | explored | retained |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 1.3 ms | 0.3 ms | 1.6 ms | 0.01 MB | 0.1 MB | 124 | 22 |
| 105 | 8.5 ms | 2.0 ms | 10.5 ms | 0.19 MB | 1.2 MB | 817 | 296 |
| 1,055 | 78 ms | 23 ms | 100 ms | 1.8 MB | 10.9 MB | 7,413 | 2,939 |
| 5,223 | 375 ms | 66 ms | 441 ms | 9.1 MB | 55 MB | 35,992 | 14,635 |

(Area budget 100 attempts; medians; timings on this shared VM vary by about ±20% between runs.)

## α.v2 findings

1. **The architecture holds.** Every layout at every tested size passed every check; growth only ever
   reused saved plans (zero searches during arrange, enforced). The three-rooms-at-one-depth acceptance case
   works with no special handling: the room simply grows its saved plan into the deeper envelope.
2. **The cost is small and predictable.** The controlled families explore about 7 candidates per container
   and keep about 3 offers each. Measuring 5,000 containers takes about 0.4 s; arranging takes under 0.1 s
   (mostly creating 30,000 book nodes). Saved plans for 1,000 containers serialize to about 0.9 MB.
3. **The Area search dominates, and 100 attempts is the sweet spot.** The randomized packing takes 80–95% of
   measuring time and scales linearly with attempts. Going from 10 to 100 attempts shrinks the root's minimum
   area by 23% (1,000 containers) and 7% (5,000). Going to 1,000 attempts costs about 6× more time for at
   most 10% gain, and is not always smaller, because blueprints are scored on proportion and prominence as well
   as area.
4. **Fixed separator minimums dominate small content.** At minimum size, rooms cover only about 4–5% of the
   root: large areas give about 80% of their space to children, but campuses give only about 22% (6 m streets,
   10 m courtyard, 6 m plaza, 4 m boundary around buildings of a few rooms), buildings about 56%, and rooms
   about 31% to furniture envelopes. The same Area packing fills 22–25% with 10 m highways between small
   buildings and about 50% with 3.5 m paths. Separator sizes should probably scale with what they separate,
   or the campus vocabulary should be reserved for large building groups. This needs an owner decision.
5. **The 20% rule is exact, but its effect needs care.** *Linearly*, relative growth reaches the leaves
   almost undiminished, because children grow in proportion: at 3× / 2.5× the root, rooms are about 3× wider
   and one shelf is 4.6× longer with its books spread thin. *By floor area*, most new space stays high up:
   80% of each axis is only 64% of the area per level, and gaps between packed children belong to the area.
   For that 3× / 2.5× growth the area level keeps 72% of the new floor area (92% with absorb = 0.5); rooms
   and shelves get about 10%. Containers of fixed-size objects may want to keep more than 20% (the protocol
   allows it) or turn surplus into new features (more desks, reading corners) rather than empty floor.
6. **Offer choice needs a taste rule.** Pure smallest-area rows favoured very long, thin buildings. A mild
   15% proportion preference fixed most cases, but in the demo Finance still picks one row of 7 rooms
   (24.5 × 6.4 m), and the Area packing picked a residual building as one column of 5 rooms (3.4 × 29 m),
   because both only minimize their own area and score. A shared notion of "good proportions" across
   designers is the obvious next step.
7. **Offer bounding matters.** Dropping dominated offers keeps lists short; for example, ten identical rooms
   yield 6 useful row layouts out of 10. A `keepDominated` option exists for experiments that want every
   alternative (used for the eight-children-with-ten-offers test).
8. **The validator earns its keep.** It caught a real mistake in my own demo data: three buildings had their
   parent's path, which the canonical-containment check rejected.

## Sensitivity study: absorption rate × child-offer sampling

`npm run study` → `results/sensitivity.md` (all tables), `results/sensitivity.json` (every run),
`gallery/sensitivity/` (side-by-side drawings).

**Design.** Absorption 20%, 10% and 5%, crossed with two ways for the Area designer to sample child offers in
its randomized attempts: *uniform*, and *balanced* (mild): an offer's weight is its short side / long side,
so a 2 : 1 offer is half as likely as a square one, a 4 : 1 offer a quarter as likely, and nothing is
excluded (`cfg.area.sampling`, `cfg.area.balance` = 1). Both modes draw exactly one random number per child,
so the same seed gives paired runs; attempt 0 (most compact offers) is identical in both. Held constant: every
hard constraint, minimum size and separator minimum, 100 Area attempts, three datasets (the demo, ~100 and
~1,000 synthetic containers), seeds 1–5, and three allocations (minimum, 2×, 3× wide / 2.5× deep). 360
layouts, **0 violations**, each validated against its own absorption rate. Measurement is identical at every
absorption rate (absorption only acts during growth). An exploratory arm (35% and 50%, uniform only) shows
which way the trend continues; it is not part of the requested comparison.

**Sampling (at minimum size; mean of 5 seeds).**

| dataset | children placed by areas beyond 2.5 : 1 | mean imbalance | buildings beyond 3 : 1 | root minimum area |
|---|---:|---:|---:|---:|
| demo | 28% → 15% | 0.68 → 0.52 (better in 5 of 5 seeds) | 32% → 25% | +1.7% |
| ~100 | 37% → 31% | 0.66 → 0.55 (4 of 5) | 0% → 0% | +2.1% |
| ~1,000 | 17% → 14% | 0.51 → 0.47 (4 of 5) | 3% → 3% | +5.3% |

(uniform → balanced; imbalance is |ln(w/d)|.) In no dataset did balanced sampling make proportions worse on
average, and it cost 2–5% of compactness (balanced was smaller in 2 of 15 seed pairs). Its effect on growth and
utilization is small next to absorption's (at most 2 percentage points on any share in the results, against up
to 25 points between absorption rates), and it has none on runtime.

**Absorption (growth to 2× on both axes, so the root's area grows 4×; demo, mean of 5 seeds).**

| absorb | rooms grow | shelves grow (length) | shelf fill (66% at minimum) | furniture density (7.4%) | composition drift | rooms % of root (5.1%) |
|---:|---:|---:|---:|---:|---:|---:|
| 20% | 7.3× | 3.5× | 20% | 3.0% | 8.4 pp | 8.1% |
| 10% | 13.0× | 5.4× | 13% | 2.5% | 17.4 pp | 15.7% |
| 5% | 17.5× | 6.7× | 10% | 2.1% | 23.4 pp | 22.4% |
| 35% *(expl.)* | 3.3× | 2.0× | 38% | 4.0% | 7.7 pp | 3.6% |
| 50% *(expl.)* | 1.9× | 1.4× | 55% | 5.3% | 9.9 pp | 2.0% |

The synthetic datasets and the 3× / 2.5× allocation show the same ordering (for example, at 3× / 2.5× in the
demo rooms grow 14.5×, 28.7× and 40.2× while the root grows 7.5×).

**What the numbers say.**

1. **Lower absorption amplifies growth down the hierarchy.** Children cover only part of their parent's width
   and depth, so a parent that passes 80–95% of its surplus to them makes them grow *faster* than itself, and
   this compounds per level. Even at 20% rooms grow 1.3–2.5× as fast as the root, depending on the dataset; at
   5%, 4.4–6.7× as fast.
2. **Utilization does not improve; emptiness moves.** Growth adds no content, so every content measure falls
   as the layout grows. Lower absorption only moves the new empty floor from roads, courtyards and plazas into
   rooms and shelves: room floor rises from 8% to 22% of the root, but furniture density and shelf fill fall
   (rooms at 5% are 2% furnished; shelves are 10% full). The look also drifts most from the minimum design.
3. **Of the three tested rates, 20% is best on every quality measure** (shelf fill, furniture density,
   composition drift, amplification). Runtime is the same in all six configurations (at ~5,000 containers:
   measure 250–280 ms and arrange 35–62 ms in every configuration over repeated runs, with the same 35,992
   candidates; differences between configurations are within run-to-run noise).
4. **The trend continues above 20%** (exploratory): at 35% rooms grow at or below the root's rate, shelves
   stay 37–49% full and rooms stay better furnished, with drift about the same as at 20%. At 50% rooms barely
   grow and the areas keep 91% of the new floor. The best uniform rate is therefore likely between 20% and 35%.

**Recommended defaults.**

- **Sampling: balanced, strength 1** (weight = short side / long side). Consistently better proportions for a
  small, bounded compactness cost, and no other effect.
- **Absorption: keep 20%** among the tested rates; do not lower it. Before integration, test 25% and 30%, or
  replace the single rate with a per-designer rate (for example, tied to each designer's share of own space)
  so that containers of fixed-size objects (rooms, shelves) are not fed more than their share. Changing the
  20% rule itself is an owner decision.
- `DEFAULT_CONFIG` is unchanged (uniform, 20%), so the α.v2 gallery and benchmarks above still reproduce
  exactly; switching the sampling default is a one-line change.

**Drawings** (`gallery/sensitivity/`, same dataset, seed and scale in every panel of a sheet): S1 the demo at
3× / 2.5× in all six configurations; S2 the Budgets room and S3 the Finance building from those layouts; S4
uniform vs balanced sampling at minimum size; S5 ~100 synthetic containers at 2×; S2b the Budgets room at
20% / 35% / 50% (exploratory).

## Limitations (α.v2)

- Area growth is a proportional stretch of the blueprint: corners that were empty at minimum stay empty, and
  a very large child receives most of the growth.
- Access to every child is guaranteed only geometrically: every child keeps at least the separator width
  from its siblings and the boundary, so the free space around it connects to the entrance. Paths are not
  traced explicitly.
- Rooms add one computer desk and one display table at most; no other growth features exist yet.
- No rotation (by design) and no maximum sizes (by design).
- Synthetic benchmark hierarchies have small buildings (1–4 rooms), which exaggerates finding 4.

## Files

```
src/protocol.ts     offers, placed nodes, ledger, context (phase guard)
src/engine.ts       measure / arrange drivers, offer selection, per-designer statistics
src/rows.ts         shared row layout: measure rows, grow rows, negotiate a shared row depth
src/offers.ts       de-duplication, Pareto front, bounding
src/designers/      bookshelf, room, rowContainer (+ building, campus), area
src/validate.ts     all invariant checks; utilization helpers
src/synth.ts        the named demo hierarchy and seeded synthetic hierarchies
src/svg.ts          labelled SVG panels;  src/gallery.ts  the gallery;  src/bench.ts  benchmarks
src/metrics.ts      quality and utilization metrics;  src/study.ts  the sensitivity study
src/v3/             α.v3: bookshelf (segments), allocate (shortest-first), room, features, rowsV3
                    (building, campus), area, validate, metrics, gallery, compare
test/               98 tests (test/v3-*.test.ts for α.v3)
gallery/  results/  generated outputs (committed): gallery/v3/ and results/v3-comparison.* for α.v3
```
