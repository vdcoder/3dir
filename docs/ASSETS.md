# Assets: sources, licenses and cost

Machine-readable log: `assets-src/meshy/assets.jsonl` (one line per generated asset).
Raw downloads: `assets-src/meshy/*.raw.glb`. Optimized, app-ready copies: `public/assets/*.glb`.

## Providers

| Provider | Plan | Cost to project | License status |
| --- | --- | --- | --- |
| Meshy (api.meshy.ai) | Premium, first month $20 (bought by the project owner) | Paid from the $300 experiment budget | **Verified by the project owner (2026-10-24).** Paid subscribers own their generated output to the extent permitted by applicable law, provided the source material does not infringe third-party rights. |

Meshy terms: <https://www.meshy.ai/terms-of-use> and
<https://help.meshy.ai/en/articles/9992001-can-i-use-meshy-assets-commercially-license-copyright-explained>.

Rules we follow: generations stay private in Meshy; prompts are text only, with no external reference
images (so there's no third-party source material); every asset is logged below with its credits.

## Credit budget

| Allocation | Credits | Approved |
| --- | --- | --- |
| Pipeline test | 30 | Yes |
| Prototype development (stage 2) | up to 900 more (no new purchases) | Yes, 2026-10-24 |

Stage 2 so far: **477 of 900 credits** (balance 3,290 → 2,813): 19 concepts (57), 19 props/landmarks
(300), 40 gallery photographs (120). Remaining: 423.

## How assets are made

1. **Concept image** (`npm run meshy -- concept`, 3 credits): text-to-image with one shared style prompt
   (stylized miniature architectural model, matte materials, warm palette), so every asset matches.
   Concepts are reviewed as a contact sheet before any 3D spend.
2. **3D model** (`npm run meshy -- model`): image-to-3D from the approved concept. Props use the
   smart-topology model (meshy-t2.5, 15 credits, 3k-14k triangles); landmarks use meshy-7.1 (30 credits).
3. **Optimization**: `gltf-transform optimize` with meshopt geometry and WebP textures
   (512 px for props, 1024 px for landmarks). Typical prop: 80-180 KB; all 19 props together ≈ 2.2 MB.
4. **Placement**: `src/mapping/props.ts` (real-world sizes) and `src/mapping/decor.ts` (deterministic,
   collision-free placement). Props are decoration only; they never stand for files.

Concept images live in `assets-src/meshy/concepts/`. Raw downloads are kept in `assets-src/meshy/*.raw.glb`.

## Assets

### 3D models (20, 330 credits)

| Asset | Made from | Tier / model | Credits | Used for |
| --- | --- | --- | --- | --- |
| `library-pavilion.glb` | text prompt | text-to-3D / meshy-7.1 | 30 | Pipeline test only (not in the app) |
| `tree-round.glb` | concept `tree-round` | prop / meshy-t2.5 | 15 | Trees across the map |
| `bench.glb` | concept `bench` | prop / meshy-t2.5 | 15 | Plazas, gallery |
| `fountain.glb` | concept `fountain` | prop / meshy-t2.5 | 15 | Business plaza landmark |
| `tree-cypress.glb` | concept `tree-cypress` | prop / meshy-t2.5 | 15 | Avenues and parkland |
| `van.glb` | concept `van` | prop / meshy-t2.5 | 15 | Operations yard |
| `planter.glb` | concept `planter` | prop / meshy-t2.5 | 15 | Business entrances |
| `lamp-post.glb` | concept `lamp-post` | prop / meshy-t2.5 | 15 | Streets and plaza |
| `table-boardroom.glb` | concept `table-boardroom` | prop / meshy-t2.5 | 15 | Board room |
| `desk-office.glb` | concept `desk-office` | prop / meshy-t2.5 | 15 | Business rooms |
| `easel-board.glb` | concept `easel-board` | prop / meshy-t2.5 | 15 | Board and Strategy rooms |
| `plant-pot.glb` | concept `plant-pot` | prop / meshy-t2.5 | 15 | Interiors |
| `forklift.glb` | concept `forklift` | prop / meshy-t2.5 | 15 | Operations yard |
| `vault.glb` | concept `vault` | prop / meshy-t2.5 | 15 | Contracts archive |
| `clock-tower.glb` | concept `clock-tower` | hero / meshy-7.1 | 30 | Business district landmark |
| `mailbox.glb` | concept `mailbox` | prop / meshy-t2.5 | 15 | Home district front doors |
| `drafting-table.glb` | concept `drafting-table` | prop / meshy-t2.5 | 15 | Studio project rooms |
| `sculpture-rings.glb` | concept `sculpture-rings` | prop / meshy-t2.5 | 15 | Gallery landmark |
| `server-cabinet.glb` | concept `server-cabinet` | prop / meshy-t2.5 | 15 | Windows & Programs rooms |
| `workbench.glb` | concept `workbench` | prop / meshy-t2.5 | 15 | Studio project rooms |

### Concept images (19, 57 credits)

tree-round, fountain, bench, lamp-post, van, desk-office, plant-pot, tree-cypress, table-boardroom, vault, planter, server-cabinet, forklift, clock-tower, mailbox, workbench, easel-board, drafting-table, sculpture-rings. Stored in `assets-src/meshy/concepts/`.

### Gallery photographs (40, 120 credits)

Generated with text-to-image (nano-banana) from each picture's own description in the fictional dataset,
for the four albums the demo uses most: Travel\2026 Kyoto, Travel\2025 Lisbon, Family\Elena Graduation 2026
and Garden. Full size (1024 px WebP) in `public/photos/`, wall thumbnails (320 px) in `public/photos/thumbs/`.
Other albums show a soft gradient made from the picture's palette. No people are real; prompts describe
generic people only.

### Totals

All logged operations: 507 credits (79 operations). Run `npm run meshy -- budget` for the
stage-2 total measured from the real account balance.
