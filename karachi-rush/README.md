# 🛺 Karachi Rush: Rickshaw Circuit Championship

### Complete 3D Auto-Rickshaw Racing Game — a Karachi-only spline circuit, verified 23/23 green by Playwright

[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-23%2F23_Verified-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev/)

Play it at **<http://localhost:3000>** (after `npm run build && npm run start`, or `npm run dev`).

---

## 🏙️ Karachi Sprint Circuit — 3 District Laps

One closed spline loop (~2.9 km) shared by player and 6 AI rivals. Each lap is a different Karachi district with its own landmarks and time-of-day:

| Lap | District | Time of Day | Landmarks |
|---|---|---|---|
| 1 | **SADAR** | ☀️ Day | Empress Market, Chaar Minar |
| 2 | **II CHUNDRIGAR** | 🌅 Sunset | Habib Bank Plaza, Boulton Market |
| 3 | **CLIFTON** | 🌃 Night | Mazar-e-Quaid, Sea View billboard (headlights on) |

---

## 🛺 Rickshaw Garage (Shop Economy)

Coins collected on-track are deposited into your persistent bank (`localStorage`) after each race.

| Vehicle | Price | Top Speed | Accel | Handling |
|---|---|---|---|---|
| **Baba Auto** | Free | 42 km/h | 11 | 1.00 |
| **Karachi Queen** | 2,500 | 46 km/h | 12.5 | 1.10 |
| **Hassan Special** | 4,500 | 48 km/h | 13 | 1.15 |
| **Bhatta Express** | 10,000 | 50 km/h | 14 | 1.20 |

Nitro adds `+8 km/h` and `×1.6` accel while boosting. Nitro recharges by drifting (16%/s) or passively (4%/s above 15 km/h).

---

## 🏎️ 6 AI Rivals

Race against six Pakistani-named drivers with distinct skill levels and lane targets: **Tariq** (0.96), **Zain** (0.93), **Farhan** (0.91), **Bilal** (0.88), **Usman** (0.85), **Imran** (0.82).

---

## �trap Hazards — 6 Kinds

| Hazard | Effect | Tuning |
|---|---|---|
| Tyre stack | Hard crash — speed ×0.25, 1.1s wobble | obstacle radius 1.4m |
| Cone field | Hard crash — speed ×0.25 | obstacle radius 1.2m |
| Moving rickshaw | Hard crash (weaves across lanes; lateral is tracked) | 6–11 km/h shoulder crawl |
| Speed breaker **zone** | Debuff ripples while inside (speed capped while zone active) | zone length `breakerMeters` |
| Oil slick **zone** | Grip loss — steering roll drifts | zone length `oilMeters` |
| Manhole **zone** | Consecutive bump shake/debuff | zone length `manholeMeters` |

**Fairness guarantee:** obstacles are placed with a stratified distribution across the lap; the minimum gap between consecutive obstacles is ≥ **38 m** (`OBSTACLE_TUNING.minGapMeters`). Verified deterministically per difficulty (min gap 44 m on this seed).

### Difficulty table

| Difficulty | Speed mult | Density mult | Base obstacles | Placed | Coins mult | Score mult |
|---|---|---|---|---|---|---|
| Easy | 0.86 | 0.6 | 16 | **10** | ×2 | ×0.85 |
| Medium | 1.00 | 1.0 | 26 | **26** | ×1 | ×1.0 |
| Hard | 1.13 | 1.5 | 40 | **60** | ×1 | ×1.3 |

Obstacle placement is seeded per difficulty (easy 1010 / medium 2020 / hard 3030) so runs are reproducible — the E2E suite asserts the exact counts above.

---

## 🕹️ Controls

| Input | Key / Action | In-Game Effect |
|---|---|---|
| `W` / `↑` | Accelerate / Gas | Throttle forward acceleration |
| `S` / `↓` | Brake / Reverse | Slow down or reverse |
| `A` / `←` | Steer Left | Turn front wheel with body roll |
| `D` / `→` | Steer Right | Turn front wheel with body roll |
| `Space` / `Shift` | Drift | Slide into turns, recharge Nitro |
| `N` / `Ctrl` | Nitro Boost | Top-speed bonus + widened FOV |
| Button | Day / Dusk / Night | Cycle time-of-day lighting + headlights |
| `P` | Pause / Resume | Toggle the pause panel |

---

## 📊 Post-Race Telemetry

The results screen shows a champion ranking (YOU + 6 rivals by traveled distance), 8 stat boxes, and a per-lap summary. Lifelog-style telemetry: **steps = distance (m) × 1.4**, with per-lap step counts — verified to exact math by the E2E suite.

---

## 🧪 E2E Verification Suite

```
node C:\Users\Hp\AppData\Local\Temp\opencode\rush-verify.cjs   # with the prod server on :3000
```

23 checks: boot, exact obstacle counts per difficulty, ≥38 m fairness gap, forceLap → sunset/night + district banner, coin warp pickup, KeyP pause/resume, full results DOM (8 stats / 3 lap rows / 5+ rankings), bank deposit + persistence, purchase flow (39999 → 37499, queen unlocked), HUD day→sunset→night cycling, flat-design chip check, zero console errors.

> **Note:** headless SwiftShader runs at ~2 fps with `dt` capped at 0.1 s, so real keyboard driving is time-dilated ~10–50×. The suite verifies game logic through the timed-sim-safe debug API instead of long drives.

---

## 🛠️ Debug / Test API

Exposed on `window.__rush` after boot:

| Method | Purpose |
|---|---|
| `get()` | Full race state (phase, lap, playerU, lateral, speed, score, runCoins, bank, difficulty, obstacles, coinRows, distanceM, steps, trapsDodged, crashes, timeMode, trackLength) |
| `start()` | Start race (uses active difficulty + vehicle) |
| `setDifficulty(id)` | Set + persist easy/medium/hard |
| `forceLap()` | Complete the current lap instantly (advances districts / finishes race) |
| `addBank(n)` | Add coins to the persisted bank |
| `unlockAll()` | Unlock every vehicle |
| `warp(u, lateral?)` | Teleport the player to track fraction `u` with an optional lateral offset (test gains) |
| `listCoinRows()` | `{ u, lateral }` for every triple-coin row |
| `listObstacles()` | `{ u, kind }` for every placed hazard |
| `cycleTimeMode()` / `quitRace()` | Live time-of-day toggle / abandon race |

### localStorage keys

| Key | Meaning |
|---|---|
| `rush_bank` | Coin balance |
| `rush_unlocked` | JSON array of owned vehicle ids |
| `rush_vehicle` | Selected vehicle |
| `rush_bestLap` | Best single-lap time |
| `rush_difficulty` | Persisted difficulty |

---

## 💅 Design System

Flat "streets of Karachi" UI: `#1a1a1e` asphalt panels, `#f2b632` taxi-yellow accents, `#2f9e44` green CTAs, `#0b1026` night blue, `#ffd700` coins. 1 px borders, hard offset shadows, **no gradients and no backdrop blur** anywhere. Defined in `app/globals.css` (~1,240 lines of tokenized CSS, including the MOTION section).

### Living motion system

The menus are never static — the Three.js scene keeps rendering behind every screen, autorush-style:

- **Docked live menu** — the start menu parks left over a scrim that fades to
  transparent (~90 %) to the right, revealing a slow **orbiting camera** around
  the parked rickshaw on the start grid (idle engine bob, restless front
  wheel, always-spinning coins, rivals waiting on the grid).
- **Crawl ticker** — a yellow shop-board strip glued to the panel top scrolls
  track names / tips on a loop.
- **Spring pop-ins** — panels, garage/difficulty cards (staggered by index),
  bank pill, action buttons and HUD chips all mount with a spring easing
  (`--pop-spring: cubic-bezier(.22,1.4,.36,1)`), never a hard cut.
- **Perpetual life loop** — title sways, bank coin flips, section-label dashes
  stretch, the START arrow bobs, the progress pin hops, the speedo rumbles
  while nitro > 50 %, results stats and lap/ranking rows cascade in.
- **Press feedback** — buttons press into their own hard shadow on click and
  lift slightly on hover.
- **Reduced motion** — every infinite ambient animation is switched off for
  `prefers-reduced-motion` users; entry pops stay finite so the UI never feels
  unresponsive.

---

## 🚀 Running the Game

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build and launch production server
npm run build
npm run start
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Layout

```
karachi-rush/
├── app/
│   ├── components/
│   │   ├── KarachiRushGame.tsx   # Three.js engine, race loop, debug API
│   │   └── game/
│   │       └── data.ts           # TRACK, DISTRICTS, VEHICLES, RIVALS, DIFFICULTIES, OBSTACLE_TUNING
│   └── globals.css               # flat design system
├── package.json                  # next@16.4.5, react@19.3, three@0.160.0
└── README.md
```
