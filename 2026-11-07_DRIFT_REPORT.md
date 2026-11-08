# Drift Report — 2026-11-07

Scope: design/README documents at the repository root, checked against the current
source in `karachi-rush/app/`.

## README.md (repository root)

- Documents **three selectable circuits** (Cyber City Grand Prix / Gurugram, Karachi Grand Prix, Delhi Heritage Circuit) with per-circuit scenery and a circuit picker. `karachi-rush/app/components/game/data.ts` defines a single `TRACK` (`id: "karachi"`, `name: "Karachi Rush Circuit"`, one 10-point spline) and there is no circuit list, circuit id array, or circuit-selection control anywhere in `KarachiRushGame.tsx`.
- Lists the third garage vehicle as **Cyber Cruiser** (cyan/obsidian, 48 km/h, +22 boost). The third `VEHICLES` entry is `HASSAN SPECIAL` (`id: "hassan"`, subtitle "Chaudhry-tuned cyan prototype", 48 km/h, `nitroBonus: 22`). No "Cyber Cruiser" string exists in the source.
- Documents a rival roster of **Kabir 0.96, Tariq 0.93, Zain 0.91, Arjun 0.88, Farhan 0.85, Bilal 0.82, Rohan 0.79**. `RIVALS` in `data.ts` is **TARIQ 0.96, ZAIN 0.93, FARHAN 0.91, BILAL 0.88, USMAN 0.85, IMRAN 0.82, HASSAM 0.79`. Four documented names (Kabir, Arjun, Rohan) do not exist; Usman, Imran and Hassam are undocumented; every skill value is attached to a different driver.
- E2E instructions point at `python ../scratch/playwright_autorush_test.py`. `D:\game auto\scratch` does not exist and no Python test file exists anywhere in the repository, so the documented verification command cannot run.
- License section links `[MIT License](LICENSE)`. There is no `LICENSE` file at the repository root, so the link is dead.
- "Playwright E2E Verified" badge and the "0 JavaScript console errors" checklist have no committed suite: there is no `playwright.config.*`, `*.spec.*` or `*.test.*` file outside `node_modules/` and `.next/`. The only suite is an untracked `rush-verify.cjs` under `%TEMP%`, so a clean clone cannot reproduce the claim.
- Directory Structure block omits `app/components/game/data.ts` (which holds `TRACK`, `DISTRICTS`, `VEHICLES`, `RIVALS`, `DIFFICULTIES`, `OBSTACLE_TUNING`, `STORAGE_KEYS`) and omits `server.js` and `package-lock.json`.
- Describes `globals.css` as a "Glassmorphic arcade HUD". The stylesheet contains no `backdrop-filter`; the only gradients are two `linear-gradient` menu scrims (`globals.css:881`, `globals.css:1250`), and `karachi-rush/README.md` separately claims the opposite (flat, no gradients).
- Coverage checklist asserts "Three.js WebGL canvas initialization ($1280 \times 720$ resolution)". The renderer is sized from the DOM (`renderer.setSize(width, height)` at `KarachiRushGame.tsx:686` and `:1681`, falling back to `850 x 500`, pixel ratio capped at 2). No code path sets 1280x720.
- Coverage checklist asserts "Circuit selection (Gurugram, Karachi, Delhi) and Rickshaw garage selection". Only vehicle, difficulty and lap-count selection exist.

## karachi-rush/README.md

- Section is titled "**6 AI Rivals**" and states "Race against six Pakistani-named drivers ... Tariq (0.96), Zain (0.93), Farhan (0.91), Bilal (0.88), Usman (0.85), Imran (0.82)". `RIVALS` in `app/components/game/data.ts:164-172` has **seven** entries — the list omits `HASSAM` (skill 0.79, `targetOffset: 0.0`). The in-file comment above the array even says "7 AI RIVALS".
- States "Nitro adds `+8 km/h` and `×1.6` accel while boosting". `VehicleDef.nitroBonus` is 18 / 20 / 22 / 24 km/h per vehicle and boost only raises `maxSpeed` (`KarachiRushGame.tsx:1373`); there is no `1.6` acceleration multiplier.
- States the fairness gap is "≥ **38 m** (`OBSTACLE_TUNING.minGapMeters`)". The constant is `minGapMeters: 60` (`data.ts:221`). The stale comment at `KarachiRushGame.tsx:963` still says "(38m)", and the E2E assertion only requires `>= 38`, so the suite cannot detect the divergence.
- Difficulty table gives Easy a "Score mult ×0.85". `DIFFICULTIES[0].scoreMult` is `0.8`.
- States a fixed **3 district laps**. The menu exposes a 1 / 3 / 5 lap selector (`KarachiRushGame.tsx:1930`, `:1971`) and the district lookup clamps with `DISTRICTS[Math.min(hud.lap - 1, 2)]` (`:1759`), so laps 4 and 5 replay CLIFTON rather than a fourth/fifth district. The lap selector and the clamping behaviour are undocumented.
- Debug API table documents `cycleTimeMode()` and `quitRace()`. The `window.__rush` object (`KarachiRushGame.tsx:1193-1237`) exposes only `get`, `start`, `setDifficulty`, `forceLap`, `addBank`, `unlockAll`, `warp`, `listCoinRows`, `listObstacles`. Both documented methods are absent.
- States the results screen shows "a champion ranking (YOU + 6 rivals by traveled distance)". `rankRows` is truncated to six entries (`rankings: rankRows.slice(0, 6)`, `:1303`) and the UI renders only the first five (`finalStats.rankings.slice(0, 5)`, `:2074`), so a full eight-driver field is never shown.
- States `globals.css` is "~1,240 lines". The file is **1,496** lines.
- States the design system has "**no gradients and no backdrop blur** anywhere". `.menu-overlay` uses `linear-gradient` at `globals.css:881` (desktop scrim) and `globals.css:1250` (mobile sheet), both intentional menu scrims.
- E2E instructions run `node C:\Users\Hp\AppData\Local\Temp\opencode\rush-verify.cjs`, an absolute path inside the author's temp directory. No suite is committed to the repository, so the "23/23 green" claim is not reproducible from a checkout.
