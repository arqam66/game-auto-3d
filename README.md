# game-auto-3d

<div align="center">

# 🛺 Auto Rush: Karachi Grand Prix 3D
### An Arcade 3D Auto Rickshaw Endless Runner Powered by Next.js & Three.js

[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev/)

**[🎮 Play the Game](#-quick-start) • [🗺️ Maps & Environments](#️-maps--race-environments) • [🛺 Rickshaw Garage](#-rickshaw-garage) • [🕹️ Controls](#️-controls--mechanics) • [🧪 Testing](#-automated-testing)**

</div>

---

## 🌟 Overview

**Auto Rush: Karachi Grand Prix 3D** brings the high-octane energy of Karachi's legendary streets into a high-performance 3D WebGL runner. Built from scratch with **Next.js (App Router)** and **Three.js**, the game delivers real-time lighting transitions, customized procedural vehicle models, particle trails, traffic AI, and progressive difficulty scaling across 3 intense laps.

---

## 🗺️ Maps & Race Environments

The game features distinct atmospheric maps and circuit environments that recreate the iconic aesthetic of Karachi:

| Map / Environment | Mode / Setting | Description | Visual Profile |
|---|---|---|---|
| **🏙️ M.A. Jinnah Expressway** | Day Mode (Standard) | The bustling commercial heart of Karachi under midday sun. Flanked by high-rise corporate towers, architectural complexes, and the iconic Karachi telecom spire. | Lush emerald green verges, crisp directional sunlight, high contrast shadows. |
| **🌃 Karachi Night Grand Prix** | Night Mode (`N` Toggle) | A thrilling midnight street circuit with dynamic low-light illumination, indigo night sky, atmospheric road fog, and glowing headlights. | Deep navy sky (`#0B1026`), volumetric distance fog (`60-320m`), moody blue ambient lighting. |
| **⚡ Saddar Rush Hour Circuit** | Hard Difficulty | Extreme traffic density simulating Karachi's peak rush hour. Minimal spacing between incoming heavy vehicles, faster speed ramp-up, and razor-sharp reaction windows. | Tight obstacle gaps ($300\text{ units}$), aggressive speed multiplier ($8.5\times$). |
| **🌊 Clifton Coastal Boulevard** | Easy Difficulty | A relaxed open cruise along the coastal strip. Wider traffic lanes and spacious vehicle intervals designed for smooth drifting and coin collection. | Generous obstacle spacing ($420\text{ units}$), accessible cruising speed ($6.0\times$). |
| **🏁 Grand Prix Championship** | Medium (Standard) | The balanced tournament track. Requires tactical jumping, sliding, and obstacle evasion across 3 full laps (1,500 distance units). | Standard spacing ($350\text{ units}$), progressive speed multiplier up to $2.0\times$. |

---

## 🛺 Rickshaw Garage

Earn coins on the track to expand your fleet. Each vehicle features distinct hand-crafted Three.js geometry, authentic chassis coloring, and tuned aerodynamics:

| Vehicle | Livery & Style | Unlock Cost | Description |
|---|---|:---:|---|
| **Baba Auto** | 🟢 Green / ⚪ White | **Free (Default)** | The undisputed king of Karachi streets. Classic retro body with green chassis and ivory weather canopy. |
| **Karachi Queen** | 🔴 Crimson / ⚪ White | **3 Coins** | High-velocity racing edition inspired by Karachi's decorated minibus culture. Striking red body with reinforced roll-frame. |
| **Hassan Special** | 🔵 Maritime Blue / ⚪ White | **6 Coins** | Premium coastal edition built for high-speed coastal cruising with aerodynamic body plating. |
| **Bhatta Express** | 🟡 Turbo Gold / ⚫ Obsidian | **10 Coins** | The legendary underground street beast. Vibrant golden chassis with pitch-black blackout canopy and sport trim. |

---

## 🚦 Traffic & Obstacle Hierarchy

Karachi's roads are shared with diverse vehicles. Time your hops and fast-slides to clear traffic:

```
    [ 🚌 Bedford Bus ]    → W-11 style transit minibus (Heavy hitbox: 60x70)
    [ 🚛 Freight Truck ]   → Heavy commercial container hauler
    [ 🛺 Rival Rickshaw ]  → Agile green city runabouts
    [ 🚗 Commuter Sedan ]  → Low-profile city commuter cars
```

---

## 🕹️ Controls & Mechanics

| Input | Key / Action | In-Game Effect |
|---|---|---|
| **Hop / Jump** | `Space` / `↑` / `W` / Tap | Launches the auto rickshaw into the air to jump over oncoming traffic. |
| **Fast Slide / Drop** | Release Key / `↓` / `S` | Engages downforce to quickly land back onto the tarmac and maintain road control. |
| **Night Mode Toggle** | `N` or Top-Right Button | Instantly toggles between Day and Night environments with dynamic lighting and fog shifts. |
| **Pause / Resume** | `P` | Freezes the physics and game loop for quick breaks. |
| **Difficulty Select** | `Easy` / `Medium` / `Hard` Buttons | Adjusts obstacle spacing, spawn frequencies, and base velocity on the fly. |
| **Garage Purchase** | Click vehicle card in HUD | Spend collected coins to permanently unlock and drive new rickshaws. |

### Physics & Scoring Mechanics
- **Multi-Lap Progression**: 3 full laps of 500 distance units each ($1,500\text{ total units}$ to victory).
- **Hop Counter**: Tracks every jump maneuver executed during the run.
- **Dynamic Speed Scaling**: Velocity increases by $10\%$ every 25 score units up to $2.0\times$ max multiplier.
- **Exhaust Particles**: Real-time 3D particle emitter emitting smoke trails behind the rickshaw exhaust.
- **Personal Best Persistence**: Scores are automatically saved to `localStorage` across sessions.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (v9 or higher)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/arqam66/game-auto-3d.git
cd game-auto-3d/karachi-rush

# Install all dependencies
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to play immediately with Hot-Module-Replacement.

### 3. Production Build & Run
```bash
npm run build
npm run start
```

---

## 🧪 Automated Testing

The project includes an end-to-end automated test suite utilizing **Playwright Chromium**:

```bash
# Run the Playwright test suite
python ../scratch/playwright_test.py
# or using npx playwright test
```

### Test Coverage Checklist:
- [x] Three.js WebGL canvas creation and responsive viewport sizing ($850 \times 450$)
- [x] Start overlay, instructions modal ("How to Play"), and start trigger
- [x] Rickshaw jump mechanics and hop step increment verification
- [x] Day / Night environmental lighting transitions
- [x] Difficulty mode switching (Easy, Medium, Hard)
- [x] Pause and Resume state synchronization
- [x] Zero JavaScript console errors and zero unhandled page exceptions

---

## 📁 Project Architecture

```
game-auto-3d/
├── .gitignore                    # Root gitignore (clean dependency & build isolation)
├── README.md                     # Main repository documentation
├── assets/                       # Vector & raster game design assets
│   ├── Auto 1.png                # Original 2D reference art
│   ├── Auto 1.svg                # Scalable vector graphics
│   └── Obstacle [1-4].svg        # Obstacle design references
├── Fonts/                        # Typography assets
└── karachi-rush/                 # Next.js App Router 3D Application
    ├── app/
    │   ├── components/
    │   │   └── KarachiRushGame.tsx   # Three.js 3D Engine, physics loop, & UI HUD
    │   ├── globals.css               # Arcade styling, responsive layout, retro HUD
    │   ├── layout.tsx                # HTML root layout & viewport metadata
    │   └── page.tsx                  # Next.js entry page mounting the 3D scene
    ├── public/                       # Static web icons and SVGs
    ├── package.json                  # Dependencies & execution scripts
    ├── tsconfig.json                 # Strict TypeScript configuration
    └── next.config.ts                # Next.js & Turbopack build settings
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
