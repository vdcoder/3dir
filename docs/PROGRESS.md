# 3dir progress

Authoritative product spec: [`docs/PROTOTYPE_CHARTER.md`](PROTOTYPE_CHARTER.md). This file only tracks status.

## Current status (2026-10-24)

**Milestone 0: asset pipeline proof — done.**
Claude Code → Meshy API → textured GLB → optimized GLB → rendered in React Three Fiber in headless Chromium.

**Foundation groundwork — started.** Root Vite + React + TypeScript + React Three Fiber app,
canonical data model (`src/model`), mapping types (`src/mapping`), unit tests and a browser smoke test.
The app itself is still a placeholder (a grey box), on purpose.

### Waiting on the project owner

These are deliberately not decided yet:

1. Demo audience and flagship district.
2. Deployment (local only vs. GitHub Pages).
3. Git workflow (direct to `main` vs. branch + PR per milestone).
4. Linked navigation behavior when opening a folder in 2D.
5. Remaining budget after subscriptions.

## Asset pipeline proof

- Auth: works through the proxy-injected header; the key never appears in the session.
- Credits: 3,320 → 3,290. **30 used** (preview 20 + 2K texture 10), matching Meshy's published pricing.
- Model: one mesh, ~20k triangles, base color + normal + metallic/roughness maps, 1.9 × 1.2 × 1.6 units.
- Size: raw 9.9 MB → **1.5 MB** after `gltf-transform optimize` (WebP textures, meshopt), no visible loss.
- Browser: no console errors; screenshots in `docs/progress/meshy-pipeline/`.
- Time: ~40 s for the mesh, ~40 s for the texture.

Visual notes: clean, readable shape and convincing book-filled windows. Weaknesses: slight texture
seams on the walls, a noisy roof texture and a small artifact on one roof corner. Prompt-generated
buildings are closed boxes; the charter's cutaway/open-roof interiors will probably need
procedural rooms with generated furniture placed inside, rather than generated cutaway buildings.

## Outstanding defects / concerns

- Asset files are committed to git directly. If we generate many, consider Git LFS.

## Repeatable test steps

```
npm install
npm run typecheck
npm test            # unit tests
npm run build
npm run test:e2e    # headless Chromium smoke test (uses the preinstalled Playwright)
```

Asset pipeline viewer: `cd experiments/meshy-pipeline && npm install && npm run build && npx vite preview --port 4173`,
then `node check.cjs http://localhost:4173/ <screenshot dir>`.

## Budget

| Item | Cost | Approved |
| --- | --- | --- |
| Meshy Premium, first month | $20 | Yes (purchased by owner) |
| Meshy credits used so far | 30 of 3,320 | Yes (≤ 30 cap for the pipeline test) |
