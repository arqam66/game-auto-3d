# 🛺 Karachi Rush: Rickshaw Circuit Championship

Complete 3D Auto-Rickshaw Racing Game — a Karachi-only spline circuit.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

Play it at **<http://localhost:3000>** (after `npm run build && npm run start`, or `npm run dev`).

---

## 🏙️ Karachi Sprint Circuit — 3 District Laps

One closed spline loop (~2.9 km) shared by player and 7 AI rivals. Each lap is a different Karachi district with its own landmarks and time-of-day:

| Lap | District | Time of Day | Landmarks |
|---|---|---|---|
| 1 | **SADAR** | ☀️ Day | Empress Market, Chaar Minar |
| 2 | **II CHUNDRIGAR** | 🌅 Sunset | Habib Bank Plaza, Boulton Market |
| 3 | **CLIFTON** | 🌃 Night | Mazar-e-Quaid, Sea View billboard (headlights on) |

The menu exposes a 1 / 3 / 5 lap selector. Laps 4 and 5 replay the CLIFTON district (the track has 3 districts; the lookup clamps with `DISTRICTS[Math.min(lap - 1, 2)]`).

---

## 🛺 Rickshaw Garage (Shop Economy)

Coins collected on-track are deposited into your persistent bank (`localStorage`) after each race.

| Vehicle | Price | Top Speed | Accel | Handling |
|---|---|---|---|---|
| **Baba Auto** | Free | 42 km/h | 11 | 1.00 |
| **Karachi Queen** | 2,500 | 46 km/h | 12.5 | 1.10 |
| **Hassan Special** | 4,500 | 48 km/h | 13 | 1.15 |
| **Bhatta Express** | 10,000 | 50 km/h | 14 | 1.20 |

Nitro adds the vehicle's `nitroBonus` (18–24 km/h) to top speed and a **×1.6 acceleration multiplier** while boosting. Nitro recharges by drifting (16%/s) or passively (4%/s above 15 km/h).

---

## 🏎️ 7 AI Rivals

Race against seven Pakistani-named drivers with distinct skill levels and lane targets:

| Rival | Skill | Offset |
|---|---|---|
| **Tariq** | 0.96 | −0.35 |
| **Zain** | 0.93 | +0.35 |
| **Farhan** | 0.91 | −0.15 |
| **Bilal** | 0.88 | +0.20 |
| **Usman** | 0.85 | −0.40 |
| **Imran** | 0.82 | +0.40 |
| **Hassam** | 0.79 | 0.00 |

Each rival has independent speed modulation, spline pathfinding, collision avoidance, and floating 3D nameplates.

---

## ⚠️ Trap Hazards — 6 Kinds

| Hazard | Effect | Tuning |
|---|---|---|
| Tyre stack | Hard crash — speed ×0.25 | static collision 3.4 m |
| Cone field | Hard crash — speed ×0.25 | static collision 3.4 m |
| Moving rickshaw | Hard crash (weaves across lanes) | 3.0 m/s shoulder crawl |
| Speed breaker zone | Speed ×0.82, nitro −8 | zone collision 4.2 m |
| Oil slick zone | Grip loss — steering roll drifts | zone collision 4.2 m |
| Manhole zone | Speed ×0.9, brief wobble | static collision 3.4 m |

**Fairness guarantee:** obstacles are placed with a stratified distribution across the lap; the minimum gap between consecutive obstacles is **60 m** (`OBSTACLE_TUNING.minGapMeters`).

### Difficulty table

| Difficulty | Speed mult | Density mult | Base obstacles | Coins value | Score mult |
|---|---|---|---|---|---|
| Easy | 0.86 | 0.6 | 16 | ×2 | ×0.8 |
| Medium | 1.00 | 1.0 | 26 | ×1 | ×1.0 |
| Hard | 1.13 | 1.5 | 40 | ×1 | ×1.3 |

Obstacle placement is seeded per difficulty (easy 1010 / medium 2020 / hard 3030) so runs are reproducible.

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
| `H` | Horn | Auto-rickshaw honk |
| `C` | Camera | Cycle chase / hood / cinematic views |
| `R` | Back on Track | Reset to track center with speed penalty |

---

## 📊 Post-Race Telemetry

The results screen shows a champion ranking (all finishers by traveled distance), stat boxes, and a per-lap summary. Lifelog-style telemetry: **steps = distance (m) × 1.4**.

---

## 🧪 Debug / Test API

Exposed on `window.__rush` after boot:

| Method | Purpose |
|---|---|
| `get()` | Full race state (phase, lap, playerU, lateral, speed, score, runCoins, bank, difficulty, obstacles, coinRows, distanceM, steps, trapsDodged, crashes, timeMode, trackLength) |
| `start()` | Start race (uses active difficulty + vehicle) |
| `setDifficulty(id)` | Set + persist easy/medium/hard |
| `forceLap()` | Complete the current lap instantly (advances districts / finishes race) |
| `addBank(n)` | Add coins to the persisted bank |
| `unlockAll()` | Unlock every vehicle |
| `warp(u, lateral?)` | Teleport the player to track fraction `u` with an optional lateral offset |
| `listCoinRows()` | `{ u, lateral }` for every triple-coin row |
| `listObstacles()` | `{ u, kind }` for every placed hazard |
| `cycleTimeMode()` | Live time-of-day toggle (day → sunset → night) |
| `quitRace()` | Abandon the current race and return to the menu |

### localStorage keys

| Key | Meaning |
|---|---|
| `rush_bank` | Coin balance |
| `rush_unlocked` | JSON array of owned vehicle ids |
| `rush_vehicle` | Selected vehicle |
| `rush_bestLap` | Best single-lap time |
| `rush_difficulty` | Persisted difficulty |
| `rush_dailyLastRace` | Last race timestamp (streak) |
| `rush_dailyStreak` | Consecutive-day race streak |
| `rush_dailyChallengeDate` | Daily challenge generation date |
| `rush_dailyChallenges` | Active daily challenge IDs |
| `rush_upgradeLevels` | Per-vehicle per-stat upgrade levels |

---

## 💅 Design System

Flat "streets of Karachi" UI: warm aubergine ground, cream type, one marigold accent. Depth comes from panel-vs-ground contrast and a single hard shadow per screen. Two intentional menu scrims use `linear-gradient` (desktop and mobile sheets). Defined in `app/globals.css` (~1,496 lines of tokenized CSS, including the motion / `prefers-reduced-motion` section).

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
# or: npm run start:express  # node server.js
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
│   │       ├── data.ts           # TRACK, DISTRICTS, VEHICLES, RIVALS, DIFFICULTIES, OBSTACLE_TUNING, STORAGE_KEYS
│   │       └── icons.tsx         # HUD icon components
│   ├── globals.css               # flat design system (~1,496 lines)
│   ├── layout.tsx                # HTML5 metadata & viewport configuration
│   ├── page.tsx                  # Root page entry
│   ├── about/page.tsx
│   ├── autos/page.tsx
│   ├── changelog/page.tsx
│   ├── contact/page.tsx
│   ├── how-to-play/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   └── tracks/page.tsx
├── public/                       # Static icons and assets
├── package.json                  # next@16.4.5, react@19.3, three@0.160.0
├── package-lock.json
├── server.js                     # Express production server
├── tsconfig.json                 # Strict TypeScript configuration
└── next.config.ts                # Next.js build and Turbopack configuration
```
