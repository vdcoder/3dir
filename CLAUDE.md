# Notes for agents working on 3dir

- `docs/PROTOTYPE_CHARTER.md` is the only product spec. Don't write competing specs.
- Update `docs/PROGRESS.md` at each checkpoint: completed, tested, broken, next, budget.
- Keep `src/model` (data), `src/mapping` (layout/importance) and rendering separate.
- Check changes in a real browser: `npm run build && npm run test:e2e`; save screenshots of
  visual changes under `docs/progress/`.
- Meshy: run `npm run meshy -- balance` before generating. Every new charge needs owner
  approval; keep per-run `--max-credits` caps and log each asset in `docs/ASSETS.md`.
  Never read, print or pass the API key: the proxy injects it.
- Node's built-in fetch needs `NODE_USE_ENV_PROXY=1` here (the npm script sets it).
- Headless Chromium needs `--use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL.
