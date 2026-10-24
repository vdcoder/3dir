# 3dir progress

Authoritative product spec: [`docs/PROTOTYPE_CHARTER.md`](PROTOTYPE_CHARTER.md). This file only tracks status.

Live demo: <https://vdcoder.github.io/3dir/> (deployed automatically from `main`).

## Current status (2026-10-24)

### Completed
- **Asset pipeline** (Meshy → GLB → optimized → browser). See `docs/ASSETS.md`.
- **GitHub Pages deployment**: every push to `main` is type-checked, tested, built and published to `gh-pages`.
- **Synthetic computer**: 260 folders, 843 files (`src/data/seed/`). Windows, Program Files, four users,
  Amanda's personal folders and the "OneDrive - Alder & Finch" business archive, with consistent numbers and
  previews (77 text, 18 table, 111 image descriptions).
- **2D explorer**: folder tree with Quick access, file list (keyboard: arrows, Enter, Backspace), back/forward/up,
  address bar, search (names + preview content), details card with canonical path, preview and Open.
- **Spatial explorer (first version)**: deterministic layout engine (`src/mapping/layout.ts`):
  land → districts → open-roof buildings → rooms → shelves/tables/display walls → files as colored spines.
  Promoted districts: the OneDrive business archive, Projects + Documents, and Pictures appear on the C:\ map
  with their real paths on their signs, and signposts outside Amanda's house point to them.
  Walls facing the camera drop to a sill (dollhouse cutaway). Labels are ranked by importance, focus and
  selection, with collision avoidance.
- **Synchronization** exactly as approved: linked selection without camera moves, linked open/enter, world
  selection reveals the item in the explorer, Show in World / Show in Explorer always work, Linked toggle.

### Tested
- Unit: filesystem index, navigation rules (linked on/off), layout invariants (every node anchored, no overlaps,
  deterministic, promotion), dataset consistency. `npm test`.
- Browser: `npm run test:e2e` (smoke, also for the `/3dir/` base path) and `npm run test:interactions`
  (17 checks of tree/list/world/search/linked behavior through real clicks).

### Broken / unfinished
- Visual quality is first-pass: plain materials, no generated props placed yet, flat lighting.
  Screenshots: `docs/progress/2026-10-24-first-world/`.
- No off-screen indicator yet for a selection outside the view.
- Studio and gallery use the generic look (no photos, no themed furniture yet).

### Next
1. Flagship art pass: business district materials, building identity, plaza, Meshy props, lighting, AO.
2. Studio and gallery identities; generated photos for the gallery.
3. Off-screen selection indicator, demo polish, docs.

## Repeatable test steps

```
npm install
npm run typecheck
npm test                    # unit tests
npm run build
npm run test:e2e            # smoke test in headless Chromium
npm run test:interactions   # explorer/world synchronization checks
npm run shots -- <outDir> [overview business finance budgets budget-file contracts studio gallery users system]
```

## Budget

| Item | Cost | Approved |
| --- | --- | --- |
| Meshy Premium, first month | $20 | Yes (purchased by owner) |
| Meshy credits, pipeline test | 30 | Yes |
| Meshy credits, stage 2 (cap 900) | 282 used so far (see `docs/ASSETS.md`) | Yes |
