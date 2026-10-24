# 3dir progress

Authoritative product spec: [`docs/PROTOTYPE_CHARTER.md`](PROTOTYPE_CHARTER.md). This file only tracks status.

Live demo: <https://vdcoder.github.io/3dir/> (deployed automatically from `main`).

## Current status (2026-10-24, flagship checkpoint)

### Completed
- **Asset pipeline** and **GitHub Pages deployment** (every push to `main` is checked, built and published).
- **Synthetic computer**: 260 folders, 843 files, consistent business figures, text/table/image previews.
- **2D explorer**: tree with Quick access, file list with keyboard control, back/forward/up, address bar,
  search (names and preview content), details card with canonical path, preview and Open.
- **Spatial explorer**:
  - Deterministic layout engine: land → districts → open-roof buildings → rooms → shelves / tables /
    photo walls → files. Same layout every visit.
  - **Promotion**: the OneDrive business archive, Projects + Documents and Pictures appear as districts on
    the C:\ map, with their real paths on their signs and signposts at Amanda's house pointing to them.
  - **Landmark pins** expose important deep destinations from the overview: FY2027 Budget, Q3 2026 Reports,
    Oakridge Hotels, Kyoto 2026, Garden Planner App.
  - **Flagship district (Alder & Finch)**: signature-color buildings (Finance green, Contracts oxblood,
    Operations slate, Board brass, Strategy teal), cornices, pilasters, windows, lettered entrance signs,
    plaza with fountain, benches, trees, lamps and a clock tower; desks, boardroom table, vault, easels,
    delivery van and forklift.
  - **Gallery**: albums hang as photo walls with 40 generated photographs (Kyoto, Lisbon, graduation, garden);
    the same photos appear in the 2D preview. Ring sculpture outside.
  - **Studio**: project rooms with workbenches and drafting tables.
  - Dollhouse cutaway (walls facing the camera drop to a sill), ambient occlusion, soft shadows rendered on
    demand, textured floors and paving, ranked labels with collision avoidance.
- **Demo polish**: first-visit guide with a file-color legend (reopen with "?"), loading screen, one-click
  pins, Esc closes previews, narrower layout on smaller screens, favicon, README tour with screenshots.
- **Synchronization** as approved, plus an **off-screen indicator**: selecting something out of view never moves
  the camera; an edge pointer names it and shows it on click. Files inside closed archive boxes are tagged.

### Tested
- Unit (32): filesystem index, navigation rules, layout invariants, dataset consistency.
- Browser: `npm run test:e2e` (also under `/3dir/`: all 19 prop models and 40 photos load) and
  `npm run test:interactions` (23 checks: guide, pins, tree, list, double-click, linked on/off, Show in World,
  search, world click, off-screen indicator, Up, Overview).
- Screenshots: `docs/progress/2026-10-24-flagship/`.

### Broken / unfinished / known limitations
- Users' homes and the Windows & Programs district use the generic look (by design: quieter), but the
  homes could be cozier.
- Labels can still crowd at some angles in dense areas; lower-priority labels hide rather than overlap.
- Some albums (Camera Roll, Screenshots, Holidays, Home) show palette gradients instead of photos.
- Performance verified only in headless software rendering (slow but correct); a real GPU should be smooth.
- No alternate visual configuration (the charter's optional second view) and no first-person camera (optional).

### Next
1. Owner review of the live demo on a real GPU; tune lighting, label density and camera speeds from feedback.
2. Optional: cozier homes, more gallery photos, an alternate visual configuration (423 credits remain).

## Repeatable test steps

```
npm install
npm run typecheck
npm test                    # unit tests
npm run build
npm run test:e2e            # smoke test (BASE_PATH=/3dir/ to test the Pages build)
npm run test:interactions   # explorer/world synchronization checks
npm run shots -- <outDir> [overview business finance budgets budget-file contracts board operations
                           q3-report studio kyoto-photo gallery users system]
```

## Budget

| Item | Cost | Approved |
| --- | --- | --- |
| Meshy Premium, first month | $20 | Yes (purchased by owner) |
| Meshy credits, pipeline test | 30 | Yes |
| Meshy credits, stage 2 (cap 900) | **477 used** (19 concepts 57, 19 props 300, 40 photos 120); 423 left | Yes |

No other spending.
