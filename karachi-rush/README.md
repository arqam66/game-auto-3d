# Auto Rush: Karachi Grand Prix 🛺

The **Karachi version of Auto Rush** — reverse-engineered from [autorush.autos](https://autorush.autos) and rebuilt as a proper **Next.js** (App Router) game powered by **Three.js**.

Play it at **<http://localhost:3000>**.

## What's in this repo

- `app/page.tsx` — the game route.
- `app/components/KarachiRushGame.tsx` — the full game (Three.js scene, physics, HUD, overlays).
- `app/globals.css` — game styling.
- `app/layout.tsx` — root layout / metadata.

## Features

- 🚕 **Karachi Grand Prix** theme — Karachi landmarks (tower, buildings) on a stylized road.
- 🌙 **Night mode** — toggle with **N** or the **Night** button.
- 🏁 **Laps** — 3 laps of length 500.
- 🎯 **Coins** — collect coins to earn currency; spend it to buy new vehicles.
- 🏁 **Obstacles** — buses, trucks, rickshaws, cars; hop with **Space / ↑ / W / tap**, release to slide down.
- ⚡ **Difficulty** — **Easy / Medium / Hard** (speed + gap tuning).
- 📈 **Score & personal best** — persisted in `localStorage` (`personalBest`).
- 📏 **"Track every step"** — hop counter.

## Controls

| Input | Action |
|---|---|
| `Space` / `↑` / `W` / tap | Hop |
| Release (↑/Space/W) or `↓` / `S` | Slide down |
| `N` | Night / day toggle |
| `P` | Pause / resume |
| Buttons | Start, difficulty, night, vehicle buy |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

```bash
npm run build
npm run start
```

## Tech

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- [Three.js](https://threejs.org) (`three@0.160.0`) — WebGL renderer, HD (pixel ratio capped at 2)
- Tailwind CSS 4 (scaffold), plain CSS for game UI
- Playwright for browser verification (`/tmp/karachi_next_playwright_test.py`)

> The original single-file HTML version is archived at `..\karachi-rush-html-backup\` (before the Next.js conversion).
