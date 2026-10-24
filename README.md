# 3dir
Your files. Your world. — A spatial file explorer and organization system.

Early prototype. The product spec is [`docs/PROTOTYPE_CHARTER.md`](docs/PROTOTYPE_CHARTER.md);
status is in [`docs/PROGRESS.md`](docs/PROGRESS.md). All file data is fictional.

## Run it

Requires Node 22+.

```
npm install
npm run dev         # local dev server
npm test            # unit tests
npm run build && npm run test:e2e
```

## Generating 3D assets (Meshy)

Only in an environment where `api.meshy.ai` is allowed and the proxy injects the API key.

```
npm run meshy -- balance
npm run meshy -- generate --name <slug> --prompt "<text>" --max-credits 30
```

Each generation costs 30 credits (mesh + 2K texture). The script refuses to run if that exceeds
`--max-credits`, and logs every asset in `assets-src/meshy/assets.jsonl`. See `docs/ASSETS.md`.

## Layout

- `src/model` — canonical filesystem data (no 3D)
- `src/mapping` — how nodes are placed in the world (views, importance)
- `src/App.tsx` — rendering and interaction (placeholder for now)
- `tools/` — asset tooling
- `experiments/` — throwaway proofs, not part of the app
