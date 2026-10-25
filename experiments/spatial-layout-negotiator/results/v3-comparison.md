# α.v2 vs α.v3 — same datasets, same seeds

Measured 2026-10-25T23:14:56.882Z on Intel(R) Xeon(R) Processor @ 2.10GHz (4 cores, 15.7 GB), Linux 6.18.44-fc-v153 x64, Node v22.22.0. α.v2 is laid out at its minimum size (its most compact state; no external enlargement, uniform sampling, 20% absorption). α.v3 is laid out at the only size it has (balanced sampling, MAX_ROOM_WIDTH 10 m). Geometry: mean over the seeds listed; timings: seed 1, median of 3–7 runs after a warm-up; memory: serialized size of the saved plans (offers and their recipes, input tree excluded) and retained heap of one placed tree (three kept alive, forced GC: true). Timings on this shared VM vary by about ±20% between runs.

Each cell shows **α.v2 / α.v3**.

## 1. Validity

| dataset | size | seeds | layouts | validator failures | containers (books excluded) |
|---|---|---:|---:|---|---|
| Demo hierarchy | small | 5 | 10 | 0 / 0 | 118 / 118 |
| Synthetic ~100 | small | 5 | 10 | 0 / 0 | 105 / 105 |
| Synthetic ~1,000 | medium | 5 | 10 | 0 / 0 | 1,055 / 1,055 |
| Synthetic ~5,000 | large | 1 | 2 | 0 / 0 | 5,223 / 5,223 |
| Demo + one ≈1,000 m folder | extreme | 5 | 10 | 0 / 0 | 119 / 239 |
| Synthetic ~1,000, 3% of folders 10–400 m | extreme | 5 | 10 | 0 / 0 | 1,055 / 1,451 |
| The extreme room alone (≈1,000 m + 40 folders + 600 files) | extreme | 1 | 2 | 0 / 0 | 42 / 162 |

## 2. Performance (seed 1)

| dataset | measure ms | arrange ms | candidates explored | offers retained | saved plans KB | placed tree heap MB |
|---|---|---|---|---|---|---|
| Demo hierarchy | 10.07 / 9.13 | 4.82 / 2.09 | 938 / 831 | 323 / 210 | 100 / 85 | 1.12 / 1.19 |
| Synthetic ~100 | 8.99 / 9.16 | 2.41 / 1.92 | 817 / 766 | 296 / 197 | 90 / 78 | 1.13 / 1.12 |
| Synthetic ~1,000 | 86.96 / 81.99 | 19.4 / 14.87 | 7,413 / 6,964 | 2,939 / 1,952 | 901 / 784 | 10.32 / 10.8 |
| Synthetic ~5,000 | 438.88 / 347.73 | 115.58 / 65.96 | 35,992 / 34,087 | 14,635 / 9,740 | 4,447 / 3,946 | 52.12 / 54.25 |
| Demo + one ≈1,000 m folder | 11.53 / 11.92 | 53.68 / 29.67 | 955 / 845 | 328 / 212 | 102 / 108 | 22.49 / 22.8 |
| Synthetic ~1,000, 3% of folders 10–400 m | 87.45 / 107.14 | 62.49 / 49.87 | 7,423 / 6,897 | 2,930 / 1,924 | 906 / 832 | 81.29 / 82.7 |
| The extreme room alone (≈1,000 m + 40 folders + 600 files) | 0.95 / 2.86 | 60.58 / 16.96 | 164 / 58 | 131 / 43 | 32 / 38 | 22.82 / 23.1 |

## 3. World size and rooms

| dataset | root area m² | rooms % of root | mean room m² | room imbalance (mean \|ln w/d\|) | rooms beyond 3 : 1 | worst room ratio | widest room m | rooms wider than MAX |
|---|---|---|---|---|---|---|---|---|
| Demo hierarchy | 11,002 / 10,835 | 5.1% / 4.6% | 12.9 / 11.7 | 0.37 / 0.33 | 1% / 0% | 2.9 / 2.7 | 7.6 / 6.0 | 0.0 / 0.0 |
| Synthetic ~100 | 10,909 / 11,108 | 4.1% / 4.1% | 14.5 / 14.6 | 0.40 / 0.32 | 0% / 0% | 2.1 / 1.8 | 5.7 / 7.3 | 0.0 / 0.0 |
| Synthetic ~1,000 | 103,172 / 106,081 | 4.5% / 4.2% | 14.6 / 13.9 | 0.42 / 0.39 | 0% / 0% | 2.6 / 2.6 | 7.6 / 7.6 | 0.0 / 0.0 |
| Synthetic ~5,000 | 552,909 / 572,896 | 4.2% / 3.8% | 14.7 / 13.9 | 0.43 / 0.38 | 0% / 0% | 2.8 / 3.2 | 7.8 / 7.8 | 0.0 / 0.0 |
| Demo + one ≈1,000 m folder | 190,217 / 29,107 | 3.8% / 8.6% | 167.9 / 58.1 | 0.62 / 0.49 | 5% / 6% | 171.7 / 64.6 | 1067.9 / 10.0 | 1.2 / 0.0 |
| Synthetic ~1,000, 3% of folders 10–400 m | 555,242 / 139,566 | 5.0% / 8.2% | 84.6 / 35.7 | 0.60 / 0.53 | 8% / 9% | 83.3 / 26.0 | 415.5 / 10.0 | 15.0 / 0.0 |
| The extreme room alone (≈1,000 m + 40 folders + 600 files) | 57,355 / 1,773 | 100.0% / 100.0% | 57355.0 / 1773.2 | 2.99 / 2.88 | 100% / 100% | 19.9 / 17.7 | 1067.7 / 10.0 | 1.0 / 0.0 |

## 4. Floor use

*Unused floor*: floor that is neither a child, furniture, a feature zone, nor the designed minimum of a band (aisle, clearance, wall, corridor, street, path, courtyard, plaza, boundary, entrance); open floor without a purpose (α.v3 row ends, open circulation, lobbies, campus grounds; α.v2 widened bands and table envelopes) is unused. Area packing gaps are listed separately (both versions pack areas the same way).

| dataset | unused, % of root | unused in rooms, % of room floor | unused per room m² | unused in buildings m² | unused in campuses m² | area own space, % of root | furniture density |
|---|---|---|---|---|---|---|---|
| Demo hierarchy | 4.7% / 3.0% | 16.2% / 12.5% | 2.1 / 1.5 | 14 / 0 | 416 / 260 | 68.7% / 71.3% | 7.4% / 7.4% |
| Synthetic ~100 | 2.1% / 2.0% | 13.4% / 14.1% | 2.0 / 2.1 | 3 / 0 | 163 / 158 | 66.3% / 67.5% | 9.3% / 8.7% |
| Synthetic ~1,000 | 2.7% / 3.5% | 13.9% / 12.4% | 2.0 / 1.7 | 78 / 0 | 2,031 / 3,113 | 64.4% / 63.8% | 8.8% / 8.7% |
| Synthetic ~5,000 | 2.9% / 3.5% | 14.3% / 12.7% | 2.1 / 1.8 | 395 / 0 | 12,292 / 17,311 | 67.3% / 67.2% | 8.9% / 8.7% |
| Demo + one ≈1,000 m folder | 17.7% / 6.8% | 18.7% / 8.0% | 31.5 / 4.6 | 12 / 10 | 32,323 / 1,760 | 55.1% / 64.9% | 16.1% / 17.2% |
| Synthetic ~1,000, 3% of folders 10–400 m | 11.0% / 3.9% | 18.5% / 8.8% | 15.7 / 3.1 | 79 / 68 | 55,282 / 4,431 | 62.7% / 62.0% | 15.3% / 15.1% |
| The extreme room alone (≈1,000 m + 40 folders + 600 files) | 1.8% / 0.7% | 1.8% / 0.7% | 1050.4 / 11.9 | 0 / 0 | 0 / 0 | 0.0% / 0.0% | 26.8% / 26.5% |

## 5. Shelves, segments and room features

| dataset | shelf fill (books / fixture length) | shelf-row occupancy | physical shelves | segments (stacks) | rooms grown by their building | room features | feature types (α.v3) |
|---|---|---|---|---|---|---|---|
| Demo hierarchy | 66.0% / 72.5% | 79.5% / 71.1% | 57 / 57 | 0 (0) / 0 (0) | 31 of 43 / 19 of 43 | 0.0 / 0.8 | workstations 0.4, plants 0.4 |
| Synthetic ~100 | 65.0% / 70.5% | 91.0% / 77.8% | 53 / 53 | 0 (0) / 0 (0) | 19 of 31 / 14 of 31 | 0.0 / 0.0 | – |
| Synthetic ~1,000 | 61.5% / 68.8% | 83.9% / 73.3% | 544 / 544 | 0 (0) / 0 (0) | 204 of 319 / 151 of 319 | 0.0 / 2.8 | plants 2.4, workstations 0.4 |
| Synthetic ~5,000 | 61.7% / 68.9% | 84.5% / 73.8% | 2,768 / 2,768 | 0 (0) / 0 (0) | 1,109 of 1,574 / 788 of 1,574 | 0.0 / 12.0 | plants 8.0, workstations 3.0, waiting 1.0 |
| Demo + one ≈1,000 m folder | 31.9% / 91.0% | 80.6% / 88.3% | 58 / 178 | 0 (0) / 121 (1) | 30 of 43 / 27 of 43 | 0.0 / 8.8 | workstations 4.6, plants 4.2 |
| Synthetic ~1,000, 3% of folders 10–400 m | 33.2% / 88.0% | 85.2% / 85.6% | 544 / 940 | 0 (0) / 411 (15) | 200 of 319 / 162 of 319 | 0.0 / 41.8 | plants 31.6, workstations 7.2, reading 1.0, waiting 1.0, classroom 1.0 |
| The extreme room alone (≈1,000 m + 40 folders + 600 files) | 2.4% / 91.2% | 100.0% / 97.7% | 41 / 161 | 0 (0) / 121 (1) | 0 of 1 / 0 of 1 | 0.0 / 0.0 | – |

## 6. Extreme shelf lengths

| dataset | root size m (seed 1) | widest room m | deepest room m | measure ms | arrange ms |
|---|---|---|---|---|---|
| Demo + one ≈1,000 m folder | 1124.0 × 174.4 / 128.1 × 220.1 | 1067.9 / 10.0 | 6.2 / 155.0 | 11.53 / 11.92 | 53.68 / 29.67 |
| Synthetic ~1,000, 3% of folders 10–400 m | 467.2 × 974.0 / 444.8 × 315.8 | 415.5 / 10.0 | 7.5 / 62.5 | 87.45 / 107.14 | 62.49 / 49.87 |
| The extreme room alone (≈1,000 m + 40 folders + 600 files) | 1067.7 × 53.7 / 10.0 × 177.3 | 1067.7 / 10.0 | 53.7 / 177.3 | 0.95 / 2.86 | 60.58 / 16.96 |
