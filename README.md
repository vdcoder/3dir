# 3dir
Your files. Your world. — A spatial file explorer and organization system.

Early prototype. The product spec is [`docs/PROTOTYPE_CHARTER.md`](docs/PROTOTYPE_CHARTER.md);
status is in [`docs/PROGRESS.md`](docs/PROGRESS.md). All file data is fictional.

## Run it

Requires Node 22+.

```
npm install
npm run dev                 # local dev server
npm test                    # unit tests
npm run build
npm run test:e2e            # headless browser smoke test
npm run test:interactions   # explorer/world synchronization checks
```

Live demo: <https://vdcoder.github.io/3dir/> (every push to `main` deploys automatically).

## Using it

- **Explorer (left):** familiar folder tree, file list, address bar, back/forward/up, search.
- **World (right):** drag to pan, right-drag to rotate, scroll to zoom. Click to select, double-click to enter
  a place or open a file. "↑ Up" and "Overview" are in the top-right corner.
- **Linked navigation** (top bar) keeps both views in step. Turn it off to explore them independently;
  **Show in World** and **Show in Explorer** always work.

## Generating 3D assets (Meshy)

Only in an environment where `api.meshy.ai` is allowed and the proxy injects the API key.

```
npm run meshy -- balance
npm run meshy -- budget
npm run meshy -- concept --name <slug> --prompt "<text>"
npm run meshy -- model --name <slug> --concept <slug> --tier prop --max-credits 15
```

Every paid call is logged in `assets-src/meshy/assets.jsonl`. See `docs/ASSETS.md`.

## Layout

- `src/data` — the fictional computer (authoring format, compiler, seed content)
- `src/model` — canonical filesystem types and index (no 3D)
- `src/mapping` — how nodes are placed in the world (curated plan, importance, layout engine)
- `src/state` — selection / current folder / world focus rules and the store
- `src/ui` — the 2D explorer
- `src/scene` — the 3D world (React Three Fiber)
- `tools/` — asset tooling; `tests/e2e/` — browser tests and screenshot scenarios
- `experiments/` — throwaway proofs, not part of the app
