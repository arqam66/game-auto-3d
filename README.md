# game-auto-3d

<div align="center">

# 🛺 Auto Rush 3D: Karachi Circuit Championship

Complete 3D Auto-Rickshaw Racing Game — Reverse-Engineered & Rebuilt with Next.js & Three.js

[![Reverse Engineered](https://img.shields.io/badge/Reverse_Engineered-autorush.autos-FF5722?style=for-the-badge&logo=google-chrome)](https://autorush.autos/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**[🎮 Play Now](#-quick-start) • [🗺️ Karachi Circuit](#-karachi-circuit) • [🛺 Rickshaw Garage](#-rickshaw-garage) • [🏎️ 7 AI Rivals](#-7-ai-rivals) • [🕹️ Controls](#-controls--mechanics) • [🔊 Audio Synth](#-procedural-audio-engine)**

</div>

---

## 🌟 Overview & Reverse-Engineering

**Auto Rush 3D: Karachi Circuit Championship** is a full 3D racing simulator reverse-engineered from **[autorush.autos](https://autorush.autos)** and rebuilt as a modern **Next.js (App Router)** and **Three.js** web application.

Instead of a basic runner, this is an **arcade 3D circuit racer** featuring a closed-loop spline track through Karachi's three districts (Sadar → II Chundrigar → Clifton), 7 AI competitor rivals, realistic 2-stroke tuk-tuk audio synthesis, dynamic vehicle physics (throttle, brakes, steering, drift slides, nitro boost), and real-time lighting transitions (Day, Dusk, Night).

---

## 🗺️ Karachi Circuit — 3 District Laps

One closed spline loop (~2.9 km) shared by the player and 7 AI rivals. Each lap is a different Karachi district with its own landmarks and time-of-day:

| Lap | District | Time of Day | Landmarks |
|---|---|---|---|
| 1 | **SADAR** | ☀️ Day | Empress Market, Chaar Minar |
| 2 | **II CHUNDRIGAR** | 🌅 Sunset | Habib Bank Plaza, Boulton Market |
| 3 | **CLIFTON** | 🌃 Night | Mazar-e-Quaid, Sea View (headlights on) |

---

## 🛺 Rickshaw Garage

Choose your custom tuk-tuk / auto-rickshaw before heading out to the grid:

| Vehicle | Price | Top Speed | Accel | Handling | Nitro |
|---|---|---|---|---|---|
| **Baba Auto** | Free | 42 km/h | 11 | 1.00 | +18 |
| **Karachi Queen** | 2,500 | 46 km/h | 12.5 | 1.10 | +20 |
| **Hassan Special** | 4,500 | 48 km/h | 13 | 1.15 | +22 |
| **Bhatta Express** | 10,000 | 50 km/h | 14 | 1.20 | +24 |

Each owned vehicle can be upgraded 3 times per stat (top speed, acceleration, handling, nitro) from the persistent coin bank.

---

## 🏎️ 7 AI Rivals

You don't race alone — compete on the grid against 7 distinct AI drivers:

| # | Rival | Skill | Livery |
|---|---|---|---|
| 1 | YOU (Player) | — | Your custom rickshaw |
| 2 | Tariq | 0.96 | Navy & Beige |
| 3 | Zain | 0.93 | Orange & Slate |
| 4 | Farhan | 0.91 | Crimson & Cream |
| 5 | Bilal | 0.88 | Teal & Forest |
| 6 | Usman | 0.85 | Purple & White |
| 7 | Imran | 0.82 | Green & Forest |
| 8 | Hassam | 0.79 | Bronze & Black |

Each rival has independent speed modulation, spline pathfinding, collision avoidance, and floating 3D nameplates.

---

## 🕹️ Controls & Mechanics

| Input | Key (Keyboard) | Touch / Mobile | Action |
|---|---|---|---|
| **Accelerate** | `W` or `↑` | 🚀 Gas Button | Full throttle forward acceleration. |
| **Brake / Reverse** | `S` or `↓` | 🛑 Brake Button | Strong brake deceleration and reverse gear. |
| **Steer Left** | `A` or `←` | ◀️ Left Arrow | Steers the front wheel left with dynamic suspension body roll. |
| **Steer Right** | `D` or `→` | ▶️ Right Arrow | Steers the front wheel right with dynamic body roll. |
| **Drift Mode** | `Space` or `Shift` | 💨 Drift Button | Breaks rear traction into a lateral power-slide, accumulating drift points and charging Nitro! |
| **Nitro Boost** | `N` or `Ctrl` | ⚡ Nitro Button | Fires rocket thrusters, boosting speed past normal limits with camera shake and widened FOV! |
| **Time of Day** | Top-right button | — | Cycles between Day, Dusk, and Night modes. |
| **Pause / Resume** | `P` | ⏸️ Pause Button | Toggles in-race pause menu. |
| **Horn** | `H` | — | Auto-rickshaw honk. |
| **Camera** | `C` | — | Cycles chase / hood / cinematic views. |
| **Back on Track** | `R` | — | Resets to track center with a speed penalty. |

---

## 🔊 Procedural Audio Engine

All sound effects are generated in real-time via the **Web Audio API** with zero external audio downloads:

- **2-Stroke Engine Roar**: Sawtooth oscillator modulated by engine RPM, frequency-shifting dynamically.
- **Tire Drift Screech**: Bandpass-filtered procedural noise triggering upon high-speed drifts.
- **Nitro Jet Thrust**: Lowpass-swept triangle wave (400→4000 Hz) on engage.
- **Starting Lights Countdown**: 3 ascending beeps followed by a high GO tone.
- **Collision Impact**: Square-wave pitch-drop thump when hitting obstacles.
- **Exhaust Pop / Backfire**: On throttle lift-off at speed.
- **Music Ducking**: Music dips under SFX on crash.

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/arqam66/game-auto-3d.git
cd game-auto-3d/karachi-rush
npm install
```

### 2. Development Mode
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Production Build & Start
```bash
npm run build
npm run start
```

---

## 🧪 Verification

- `tsc --noEmit`: zero errors
- `npm run build`: all routes prerender successfully
- `window.__rush` debug API: `get`, `start`, `setDifficulty`, `forceLap`, `addBank`, `unlockAll`, `warp`, `listCoinRows`, `listObstacles`, `cycleTimeMode`, `quitRace`

---

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.

---

## 📁 Directory Structure

```
game-auto-3d/
├── .gitignore                    # Clean Git isolation rules
├── LICENSE                       # MIT License
├── README.md                     # Main documentation
├── assets/                       # Vector graphics and 2D design references
├── autorush_assets/              # Reference assets from autorush.autos
├── Fonts/                        # Game font assets
├── karachi-rush/                 # Next.js 16 + Three.js 3D Racing Application
│   ├── app/
│   │   ├── components/
│   │   │   ├── KarachiRushGame.tsx   # Complete 3D Three.js engine, physics, AI & Web Audio
│   │   │   ├── game/
│   │   │   │   ├── data.ts           # TRACK, DISTRICTS, VEHICLES, RIVALS, DIFFICULTIES, OBSTACLE_TUNING, STORAGE_KEYS
│   │   │   │   └── icons.tsx         # HUD icon components
│   │   │   └── SiteNav.tsx           # Site navigation shell
│   │   ├── globals.css               # Flat signage design system (~1,496 lines)
│   │   ├── layout.tsx                # HTML5 metadata & viewport configuration
│   │   ├── page.tsx                  # Root page entry
│   │   ├── about/page.tsx
│   │   ├── autos/page.tsx
│   │   ├── changelog/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── how-to-play/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── tracks/page.tsx
│   ├── public/                       # Static icons and assets
│   ├── package.json                  # Dependencies (Next.js 16, Three.js, React 19)
│   ├── package-lock.json
│   ├── server.js                     # Express production server
│   ├── tsconfig.json                 # Strict TypeScript configuration
│   └── next.config.ts                # Next.js build and Turbopack configuration
```
