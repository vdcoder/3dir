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

## How assets are made

1. **Concept image** (`npm run meshy -- concept`, 3 credits): text-to-image with one shared style prompt
   (stylized miniature architectural model, matte materials, warm palette), so every asset matches.
   Concepts are reviewed as a contact sheet before any 3D spend.
2. **3D model** (`npm run meshy -- model`): image-to-3D from the approved concept. Props use the
   smart-topology model (meshy-t2.5, 15 credits, 3k-14k triangles); landmarks use meshy-7.1 (30 credits).
3. **Optimization**: `gltf-transform optimize` with meshopt geometry and WebP textures
   (512 px for props, 1024 px for landmarks). Typical prop: 80-180 KB.

Concept images live in `assets-src/meshy/concepts/`. Raw downloads are kept in `assets-src/meshy/*.raw.glb`.

## Assets

| Asset | Made from | Tier / model | Credits | Used for |
| --- | --- | --- | --- | --- |
| `library-pavilion.glb` | text prompt | text-to-3D / meshy-7.1 | 30 | Pipeline test only |
| `tree-round.glb` | concept `tree-round` (image-to-3D) | prop / meshy-t2.5 | 15 | Trees across the map |
| `bench.glb` | concept `bench` (image-to-3D) | prop / meshy-t2.5 | 15 | Plazas and gallery |
| `fountain.glb` | concept `fountain` (image-to-3D) | prop / meshy-t2.5 | 15 | Business plaza landmark |
| `tree-cypress.glb` | concept `tree-cypress` (image-to-3D) | prop / meshy-t2.5 | 15 | Avenues, variety |
| `van.glb` | concept `van` (image-to-3D) | prop / meshy-t2.5 | 15 | Operations (Logistics) |
| `planter.glb` | concept `planter` (image-to-3D) | prop / meshy-t2.5 | 15 | Plazas, building fronts |
| `lamp-post.glb` | concept `lamp-post` (image-to-3D) | prop / meshy-t2.5 | 15 | Streets and plazas |
| `table-boardroom.glb` | concept `table-boardroom` (image-to-3D) | prop / meshy-t2.5 | 15 | Board room |
| `desk-office.glb` | concept `desk-office` (image-to-3D) | prop / meshy-t2.5 | 15 | Business rooms |
| `easel-board.glb` | concept `easel-board` (image-to-3D) | prop / meshy-t2.5 | 15 | Strategy / Board |
| `plant-pot.glb` | concept `plant-pot` (image-to-3D) | prop / meshy-t2.5 | 15 | Interiors |
| `forklift.glb` | concept `forklift` (image-to-3D) | prop / meshy-t2.5 | 15 | Operations (Inventory) |
| `vault.glb` | concept `vault` (image-to-3D) | prop / meshy-t2.5 | 15 | Contracts archive |
| `clock-tower.glb` | concept `clock-tower` (image-to-3D) | hero / meshy-7.1 | 30 | Business district landmark |

Concepts generated so far (19 × 3 credits): bench, clock-tower, desk-office, drafting-table, easel-board, forklift, fountain, lamp-post, mailbox, plant-pot, planter, sculpture-rings, server-cabinet, table-boardroom, tree-cypress, tree-round, van, vault, workbench.
