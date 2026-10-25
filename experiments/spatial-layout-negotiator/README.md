# Spatial Layout Negotiator α.v2 — standalone experiment

Five specialized container designers (Bookshelf, Room, Building, Campus, Area) cooperating through one
two-pass protocol and one growth rule. **Not part of the 3dir app:** nothing here is imported by `src/`, the
3D renderer, the existing spatial compiler or the deployment. No paid assets were generated.

> Children measure and propose. Parents select and allocate. Every container absorbs 20% of its surplus
> through its own spatial vocabulary and passes the remainder downward.

## Run it

Node 22.18+ runs the TypeScript directly (no build step, no new dependencies; Vitest and TypeScript come from
the repository root).

```
cd experiments/spatial-layout-negotiator
npm test            # 48 tests: every required edge case and invariant
npm run typecheck
npm run gallery     # writes gallery/*.svg and gallery/index.html (validates every drawn layout)
npm run bench       # writes results/benchmarks.{json,md}
```

Open `gallery/index.html` to browse the drawings; `results/benchmarks.md` has the measurements.

## How it works

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

## Evidence

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

## Findings

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

## Limitations

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
test/               48 tests
gallery/  results/  generated outputs (committed)
```
