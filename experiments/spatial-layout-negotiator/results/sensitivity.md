# Sensitivity study — absorption rate × child-offer sampling

Measured 2026-10-25T01:44:06.262Z on Intel(R) Xeon(R) Processor @ 2.10GHz (4 cores, 15.7 GB), Linux 6.18.44-fc-v153 x64, Node v22.22.0.

**Factors.** Local absorption (each container keeps this share of each axis' surplus): 20%, 10%, 5%. Child-offer sampling in the Area designer's randomized attempts: *uniform*, or *balanced*, where an offer's weight is its short side / long side (a 2 : 1 offer is half as likely as a square one; nothing is excluded). Both modes consume one random number per child, so the same seed gives paired runs. Attempt 0 (most compact offers) is identical in both.

**Held constant.** All hard constraints, minimum sizes and separator minimums; 100 Area attempts; the same three datasets; seeds 1, 2, 3, 4, 5; allocations: minimum, 2× on both axes, and 3× wide by 2.5× deep. The root takes its most compact offer.

**Exploratory arm.** Beyond the requested grid, absorption 35% and 50% were also run (uniform sampling only, since sampling does not affect growth) to see which way the trend continues. They are marked *exploratory* and are not candidates in the requested comparison.

**Validity.** 360 layouts, 0 violations (each validated against its own absorption rate). Measurement is independent of the absorption rate: confirmed (identical offers for every dataset, seed and sampling mode).

## 1. Sampling: compactness and proportions at minimum size

Absorption has no effect here (it only changes growth), so each row is one sampling mode. Mean over 5 seeds (range).

| dataset | sampling | root min area m² | root aspect | rooms % of root | area → children | children placed by areas, mean imbalance | …beyond 2.5 : 1 | buildings beyond 3 : 1 | measure ms |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Demo hierarchy (C:\Users\Amanda) | uniform | 11,002 (10,850–11,200) | 0.81 (0.80–0.83) | 5.1% (4.8%–5.2%) | 63% (63%–63%) | 0.68 (0.48–0.79) | 28% (13%–38%) | 32% (23%–38%) | 10.5 |
| Demo hierarchy (C:\Users\Amanda) | balanced | 11,186 (10,850–11,406) | 0.83 (0.81–0.85) | 5.1% (5.0%–5.1%) | 63% (62%–63%) | 0.52 (0.46–0.65) | 15% (13%–25%) | 25% (23%–31%) | 10.4 |
| Synthetic, ~100 containers | uniform | 10,909 (10,749–11,208) | 1.08 (0.70–1.27) | 4.1% (4.0%–4.3%) | 60% (59%–60%) | 0.66 (0.57–0.72) | 37% (29%–43%) | 0% (0%–0%) | 5.7 |
| Synthetic, ~100 containers | balanced | 11,133 (10,844–11,443) | 1.20 (0.86–1.35) | 4.1% (3.9%–4.2%) | 59% (58%–60%) | 0.55 (0.46–0.70) | 31% (29%–43%) | 0% (0%–0%) | 6.4 |
| Synthetic, ~1,000 containers | uniform | 103,172 (99,082–105,464) | 1.22 (0.54–2.27) | 4.5% (4.4%–4.7%) | 79% (78%–80%) | 0.51 (0.49–0.55) | 17% (12%–24%) | 3% (2%–5%) | 52.7 |
| Synthetic, ~1,000 containers | balanced | 108,573 (107,091–110,265) | 1.69 (0.88–2.02) | 4.3% (4.2%–4.3%) | 79% (78%–79%) | 0.47 (0.43–0.51) | 14% (9%–19%) | 3% (2%–5%) | 59.5 |

"Imbalance" is |ln(width / depth)|: 0 for a square, 0.69 for 2 : 1, 1.10 for 3 : 1.

Paired by seed (balanced − uniform), root minimum area:

| dataset | mean change | seeds where balanced is smaller |
|---|---:|---:|
| Demo hierarchy (C:\Users\Amanda) | +1.7% | 1 of 5 (equal in 0) |
| Synthetic, ~100 containers | +2.1% | 1 of 5 (equal in 0) |
| Synthetic, ~1,000 containers | +5.3% | 0 of 5 (equal in 0) |

Paired by seed (balanced vs uniform): in how many of the 5 seeds balanced sampling did better, and worse.

| dataset | lower mean imbalance of children placed by areas | fewer children beyond 2.5 : 1 | fewer buildings beyond 3 : 1 | building imbalance, uniform → balanced |
|---|---:|---:|---:|---:|
| Demo hierarchy (C:\Users\Amanda) | 5 better, 0 worse | 3 better, 0 worse | 3 better, 0 worse | 0.88 → 0.77 |
| Synthetic, ~100 containers | 4 better, 1 worse | 2 better, 0 worse | 0 better, 0 worse | 0.30 → 0.29 |
| Synthetic, ~1,000 containers | 4 better, 1 worse | 3 better, 1 worse | 1 better, 2 worse | 0.53 → 0.53 |

## 2. Absorption: how fast each level grows compared with the root

Geometric-mean area factor of each kind of container (shelves: length factor) against the root's area factor; uniform sampling, mean over 5 seeds. A level growing faster than the root is being fed more than its share: its children cover only part of its width and depth, so passing them most of the surplus makes them grow faster than it does, and the effect compounds down the levels.

| dataset | allocation | root × | absorb | areas × | campuses × | buildings × | rooms × | shelves (length) × |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Demo hierarchy (C:\Users\Amanda) | 2× | 4.0 | 20% | 3.9 | 3.8 | 6.1 | 7.3 | 3.5 |
| Demo hierarchy (C:\Users\Amanda) | 2× | 4.0 | 10% | 4.4 | 4.9 | 9.0 | 13.0 | 5.4 |
| Demo hierarchy (C:\Users\Amanda) | 2× | 4.0 | 5% | 4.7 | 5.5 | 10.9 | 17.5 | 6.7 |
| Demo hierarchy (C:\Users\Amanda) | 2× | 4.0 | 35% *(exploratory)* | 3.3 | 2.7 | 3.5 | 3.3 | 2.0 |
| Demo hierarchy (C:\Users\Amanda) | 2× | 4.0 | 50% *(exploratory)* | 2.7 | 2.0 | 2.2 | 1.9 | 1.4 |
| Demo hierarchy (C:\Users\Amanda) | 3× / 2.5× | 7.5 | 20% | 7.3 | 7.0 | 12.1 | 14.5 | 5.7 |
| Demo hierarchy (C:\Users\Amanda) | 3× / 2.5× | 7.5 | 10% | 8.5 | 9.5 | 19.2 | 28.7 | 9.4 |
| Demo hierarchy (C:\Users\Amanda) | 3× / 2.5× | 7.5 | 5% | 9.1 | 11.1 | 24.0 | 40.2 | 12.0 |
| Demo hierarchy (C:\Users\Amanda) | 3× / 2.5× | 7.5 | 35% *(exploratory)* | 5.7 | 4.4 | 6.0 | 5.4 | 2.8 |
| Demo hierarchy (C:\Users\Amanda) | 3× / 2.5× | 7.5 | 50% *(exploratory)* | 4.4 | 2.9 | 3.2 | 2.5 | 1.7 |
| Synthetic, ~100 containers | 2× | 4.0 | 20% | 4.0 | 4.0 | 8.2 | 10.0 | 3.9 |
| Synthetic, ~100 containers | 2× | 4.0 | 10% | 4.3 | 5.1 | 13.2 | 19.3 | 5.9 |
| Synthetic, ~100 containers | 2× | 4.0 | 5% | 4.5 | 5.8 | 16.7 | 26.8 | 7.4 |
| Synthetic, ~100 containers | 2× | 4.0 | 35% *(exploratory)* | 3.5 | 2.8 | 4.0 | 4.0 | 2.2 |
| Synthetic, ~100 containers | 2× | 4.0 | 50% *(exploratory)* | 3.0 | 1.9 | 2.2 | 2.0 | 1.5 |
| Synthetic, ~100 containers | 3× / 2.5× | 7.5 | 20% | 7.4 | 7.5 | 17.6 | 21.6 | 6.4 |
| Synthetic, ~100 containers | 3× / 2.5× | 7.5 | 10% | 8.2 | 10.2 | 30.6 | 45.7 | 10.6 |
| Synthetic, ~100 containers | 3× / 2.5× | 7.5 | 5% | 8.6 | 11.9 | 39.9 | 65.9 | 13.5 |
| Synthetic, ~100 containers | 3× / 2.5× | 7.5 | 35% *(exploratory)* | 6.3 | 4.6 | 7.5 | 7.1 | 3.1 |
| Synthetic, ~100 containers | 3× / 2.5× | 7.5 | 50% *(exploratory)* | 5.2 | 2.8 | 3.3 | 2.7 | 1.7 |
| Synthetic, ~1,000 containers | 2× | 4.0 | 20% | 2.8 | 2.5 | 4.3 | 5.2 | 2.7 |
| Synthetic, ~1,000 containers | 2× | 4.0 | 10% | 3.6 | 3.7 | 8.5 | 11.9 | 4.4 |
| Synthetic, ~1,000 containers | 2× | 4.0 | 5% | 4.2 | 4.6 | 12.2 | 18.7 | 5.8 |
| Synthetic, ~1,000 containers | 2× | 4.0 | 35% *(exploratory)* | 2.0 | 1.6 | 2.0 | 2.1 | 1.6 |
| Synthetic, ~1,000 containers | 2× | 4.0 | 50% *(exploratory)* | 1.5 | 1.2 | 1.3 | 1.3 | 1.3 |
| Synthetic, ~1,000 containers | 3× / 2.5× | 7.5 | 20% | 4.7 | 4.0 | 8.1 | 9.5 | 4.0 |
| Synthetic, ~1,000 containers | 3× / 2.5× | 7.5 | 10% | 6.6 | 6.8 | 18.2 | 25.9 | 7.4 |
| Synthetic, ~1,000 containers | 3× / 2.5× | 7.5 | 5% | 7.9 | 9.0 | 27.6 | 43.6 | 10.2 |
| Synthetic, ~1,000 containers | 3× / 2.5× | 7.5 | 35% *(exploratory)* | 3.0 | 2.1 | 2.8 | 2.8 | 1.9 |
| Synthetic, ~1,000 containers | 3× / 2.5× | 7.5 | 50% *(exploratory)* | 2.0 | 1.3 | 1.5 | 1.5 | 1.4 |

## 3a. Absorption: quality after growth to 2× the minimum

Mean over 5 seeds. *Rooms % of root*: room floor as a share of the whole layout. *Furniture density*: shelves, tables and desks / room floor (at minimum it is the designed density). *Shelf fill*: book widths / shelf length. *Composition drift*: how far the balance between containers and the space around them moved from the minimum design (areas, campuses, buildings; percentage points). *New floor kept by*: where the extra area went.

| dataset | absorb | sampling | rooms % of root | furniture density | shelf fill | room area ×, shelf length × | composition drift | new floor kept by areas / campuses / buildings / rooms / shelves |
|---|---:|---|---:|---:|---:|---:|---:|---|
| Demo hierarchy (C:\Users\Amanda) | minimum | – | 5.1% | 7.4% | 66.0% | 1.0, 1.0 | 0 | – |
| Demo hierarchy (C:\Users\Amanda) | 20% | uniform | 8.1% | 3.0% | 20.4% | 7.28, 3.52 | 8.4 | 71% / 14% / 6% / 8% / 1% |
| Demo hierarchy (C:\Users\Amanda) | 20% | balanced | 8.1% | 3.0% | 20.4% | 7.41, 3.49 | 8.3 | 72% / 14% / 6% / 8% / 1% |
| Demo hierarchy (C:\Users\Amanda) | 10% | uniform | 15.7% | 2.5% | 12.7% | 13.02, 5.36 | 17.4 | 58% / 16% / 7% / 16% / 4% |
| Demo hierarchy (C:\Users\Amanda) | 10% | balanced | 15.6% | 2.5% | 12.7% | 13.25, 5.31 | 17.3 | 58% / 16% / 6% / 15% / 4% |
| Demo hierarchy (C:\Users\Amanda) | 5% | uniform | 22.4% | 2.1% | 9.9% | 17.52, 6.66 | 23.4 | 49% / 17% / 6% / 22% / 6% |
| Demo hierarchy (C:\Users\Amanda) | 5% | balanced | 22.2% | 2.1% | 10.0% | 17.83, 6.58 | 23.3 | 50% / 17% / 6% / 22% / 6% |
| Demo hierarchy (C:\Users\Amanda) | 35% *(exploratory)* | uniform | 3.6% | 4.0% | 37.5% | 3.35, 2.04 | 7.7 | 84% / 9% / 3% / 3% / 0% |
| Demo hierarchy (C:\Users\Amanda) | 50% *(exploratory)* | uniform | 2.0% | 5.3% | 55.0% | 1.91, 1.43 | 9.9 | 91% / 6% / 2% / 1% / 0% |
| Synthetic, ~100 containers | minimum | – | 4.1% | 9.3% | 65.0% | 1.0, 1.0 | 0 | – |
| Synthetic, ~100 containers | 20% | uniform | 8.4% | 3.2% | 20.5% | 10.03, 3.86 | 8.0 | 66% / 18% / 6% / 9% / 1% |
| Synthetic, ~100 containers | 20% | balanced | 8.3% | 3.1% | 21.2% | 10.08, 3.75 | 7.9 | 67% / 18% / 6% / 8% / 1% |
| Synthetic, ~100 containers | 10% | uniform | 16.2% | 2.3% | 13.2% | 19.29, 5.94 | 17.8 | 53% / 20% / 7% / 17% / 3% |
| Synthetic, ~100 containers | 10% | balanced | 15.9% | 2.3% | 13.8% | 19.36, 5.73 | 17.7 | 54% / 19% / 7% / 17% / 3% |
| Synthetic, ~100 containers | 5% | uniform | 22.6% | 1.9% | 10.6% | 26.82, 7.38 | 23.6 | 45% / 20% / 6% / 24% / 5% |
| Synthetic, ~100 containers | 5% | balanced | 22.2% | 1.9% | 11.1% | 26.89, 7.11 | 23.4 | 47% / 19% / 6% / 23% / 5% |
| Synthetic, ~100 containers | 35% *(exploratory)* | uniform | 3.4% | 4.4% | 36.8% | 4.05, 2.18 | 8.0 | 80% / 13% / 4% / 3% / 0% |
| Synthetic, ~100 containers | 50% *(exploratory)* | uniform | 1.7% | 6.3% | 54.2% | 2.02, 1.49 | 9.9 | 89% / 8% / 2% / 1% / 0% |
| Synthetic, ~1,000 containers | minimum | – | 4.5% | 8.8% | 61.5% | 1.0, 1.0 | 0 | – |
| Synthetic, ~1,000 containers | 20% | uniform | 4.8% | 3.9% | 28.5% | 5.16, 2.65 | 8.9 | 82% / 10% / 3% / 4% / 1% |
| Synthetic, ~1,000 containers | 20% | balanced | 4.6% | 3.9% | 27.6% | 5.15, 2.71 | 8.9 | 83% / 10% / 3% / 4% / 1% |
| Synthetic, ~1,000 containers | 10% | uniform | 11.1% | 2.8% | 16.9% | 11.86, 4.38 | 13.9 | 68% / 14% / 4% / 11% / 2% |
| Synthetic, ~1,000 containers | 10% | balanced | 10.6% | 2.9% | 16.2% | 11.84, 4.49 | 14.0 | 69% / 14% / 4% / 11% / 2% |
| Synthetic, ~1,000 containers | 5% | uniform | 17.6% | 2.2% | 12.6% | 18.69, 5.78 | 18.8 | 57% / 16% / 5% / 18% / 4% |
| Synthetic, ~1,000 containers | 5% | balanced | 16.8% | 2.3% | 12.1% | 18.66, 5.94 | 18.7 | 58% / 16% / 5% / 17% / 3% |
| Synthetic, ~1,000 containers | 35% *(exploratory)* | uniform | 1.9% | 6.1% | 48.6% | 2.08, 1.60 | 8.0 | 93% / 5% / 1% / 1% / 0% |
| Synthetic, ~1,000 containers | 50% *(exploratory)* | uniform | 1.3% | 8.1% | 59.6% | 1.35, 1.31 | 9.2 | 98% / 2% / 0% / 0% / 0% |

## 3b. Absorption: quality after growth to 3× / 2.5× the minimum

Mean over 5 seeds. *Rooms % of root*: room floor as a share of the whole layout. *Furniture density*: shelves, tables and desks / room floor (at minimum it is the designed density). *Shelf fill*: book widths / shelf length. *Composition drift*: how far the balance between containers and the space around them moved from the minimum design (areas, campuses, buildings; percentage points). *New floor kept by*: where the extra area went.

| dataset | absorb | sampling | rooms % of root | furniture density | shelf fill | room area ×, shelf length × | composition drift | new floor kept by areas / campuses / buildings / rooms / shelves |
|---|---:|---|---:|---:|---:|---:|---:|---|
| Demo hierarchy (C:\Users\Amanda) | minimum | – | 5.1% | 7.4% | 66.0% | 1.0, 1.0 | 0 | – |
| Demo hierarchy (C:\Users\Amanda) | 20% | uniform | 8.9% | 2.5% | 12.1% | 14.52, 5.73 | 10.6 | 72% / 13% / 6% / 8% / 1% |
| Demo hierarchy (C:\Users\Amanda) | 20% | balanced | 8.9% | 2.5% | 12.1% | 14.76, 5.67 | 10.5 | 72% / 13% / 6% / 8% / 1% |
| Demo hierarchy (C:\Users\Amanda) | 10% | uniform | 19.5% | 1.7% | 7.0% | 28.72, 9.39 | 21.4 | 57% / 15% / 7% / 17% / 4% |
| Demo hierarchy (C:\Users\Amanda) | 10% | balanced | 19.2% | 1.7% | 7.1% | 29.18, 9.26 | 21.2 | 57% / 15% / 7% / 17% / 4% |
| Demo hierarchy (C:\Users\Amanda) | 5% | uniform | 29.1% | 1.4% | 5.4% | 40.24, 11.96 | 28.4 | 46% / 15% / 6% / 25% / 8% |
| Demo hierarchy (C:\Users\Amanda) | 5% | balanced | 28.7% | 1.4% | 5.4% | 40.88, 11.79 | 28.3 | 47% / 14% / 6% / 25% / 7% |
| Demo hierarchy (C:\Users\Amanda) | 35% *(exploratory)* | uniform | 3.2% | 3.2% | 26.1% | 5.45, 2.84 | 10.3 | 85% / 9% / 3% / 3% / 0% |
| Demo hierarchy (C:\Users\Amanda) | 50% *(exploratory)* | uniform | 1.4% | 4.4% | 46.6% | 2.49, 1.67 | 13.3 | 92% / 5% / 2% / 1% / 0% |
| Synthetic, ~100 containers | minimum | – | 4.1% | 9.3% | 65.0% | 1.0, 1.0 | 0 | – |
| Synthetic, ~100 containers | 20% | uniform | 9.7% | 2.2% | 12.2% | 21.56, 6.45 | 10.0 | 66% / 17% / 7% / 9% / 1% |
| Synthetic, ~100 containers | 20% | balanced | 9.5% | 2.1% | 12.7% | 21.60, 6.22 | 9.9 | 67% / 17% / 6% / 9% / 1% |
| Synthetic, ~100 containers | 10% | uniform | 20.6% | 1.5% | 7.4% | 45.66, 10.59 | 21.8 | 51% / 18% / 7% / 19% / 4% |
| Synthetic, ~100 containers | 10% | balanced | 20.2% | 1.4% | 7.7% | 45.71, 10.17 | 21.6 | 52% / 18% / 7% / 19% / 4% |
| Synthetic, ~100 containers | 5% | uniform | 29.7% | 1.2% | 5.8% | 65.85, 13.47 | 28.6 | 43% / 18% / 6% / 27% / 6% |
| Synthetic, ~100 containers | 5% | balanced | 29.1% | 1.2% | 6.1% | 65.89, 12.93 | 28.4 | 44% / 17% / 6% / 27% / 6% |
| Synthetic, ~100 containers | 35% *(exploratory)* | uniform | 3.1% | 3.6% | 25.6% | 7.05, 3.10 | 10.5 | 81% / 12% / 4% / 3% / 0% |
| Synthetic, ~100 containers | 50% *(exploratory)* | uniform | 1.2% | 5.2% | 46.2% | 2.72, 1.75 | 13.1 | 90% / 7% / 2% / 1% / 0% |
| Synthetic, ~1,000 containers | minimum | – | 4.5% | 8.8% | 61.5% | 1.0, 1.0 | 0 | – |
| Synthetic, ~1,000 containers | 20% | uniform | 4.7% | 3.2% | 18.5% | 9.50, 4.00 | 11.6 | 84% / 9% / 3% / 4% / 1% |
| Synthetic, ~1,000 containers | 20% | balanced | 4.5% | 3.3% | 17.8% | 9.50, 4.10 | 11.7 | 84% / 9% / 3% / 4% / 1% |
| Synthetic, ~1,000 containers | 10% | uniform | 13.0% | 1.9% | 9.8% | 25.89, 7.42 | 17.5 | 68% / 13% / 5% / 12% / 2% |
| Synthetic, ~1,000 containers | 10% | balanced | 12.5% | 1.9% | 9.3% | 25.90, 7.64 | 17.6 | 69% / 12% / 4% / 12% / 2% |
| Synthetic, ~1,000 containers | 5% | uniform | 22.0% | 1.4% | 7.1% | 43.57, 10.21 | 23.0 | 57% / 14% / 5% / 20% / 4% |
| Synthetic, ~1,000 containers | 5% | balanced | 21.2% | 1.5% | 6.7% | 43.61, 10.53 | 23.0 | 58% / 14% / 5% / 20% / 4% |
| Synthetic, ~1,000 containers | 35% *(exploratory)* | uniform | 1.4% | 5.2% | 40.0% | 2.81, 1.92 | 11.1 | 94% / 4% / 1% / 1% / 0% |
| Synthetic, ~1,000 containers | 50% *(exploratory)* | uniform | 0.7% | 7.7% | 57.2% | 1.47, 1.36 | 12.6 | 98% / 1% / 0% / 0% / 0% |

## 4. Performance at ~5,000 containers (seed 1, medians of 3 runs after a warm-up)

| absorb | sampling | measure ms | arrange at minimum ms | arrange at 2× ms | candidates explored |
|---:|---|---:|---:|---:|---:|
| 20% | uniform | 263.0 | 61.0 | 39.1 | 35,992 |
| 10% | uniform | 259.3 | 61.3 | 42.4 | 35,992 |
| 5% | uniform | 256.7 | 61.2 | 35.7 | 35,992 |
| 20% | balanced | 278.6 | 57.0 | 44.9 | 35,992 |
| 10% | balanced | 271.3 | 55.7 | 43.9 | 35,992 |
| 5% | balanced | 261.0 | 55.8 | 38.8 | 35,992 |
