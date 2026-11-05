# game-auto-3d

<div align="center">

# 🛺 Auto Rush 3D: Grand Prix Championship
### Complete 3D Auto-Rickshaw Racing Game — Reverse-Engineered & Rebuilt with Next.js & Three.js

[![Reverse Engineered](https://img.shields.io/badge/Reverse_Engineered-autorush.autos-FF5722?style=for-the-badge&logo=google-chrome)](https://autorush.autos/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev/)

**[🎮 Play Now](#-quick-start) • [🗺️ Circuits & Maps](#️-circuits--race-maps) • [🛺 Rickshaw Garage](#-rickshaw-garage) • [🏎️ 7 AI Rivals](#️-7-ai-rivals) • [🕹️ Controls](#️-controls--mechanics) • [🔊 Audio Synth](#-procedural-audio-engine)**

</div>

---

## 🌟 Overview & Reverse-Engineering

**Auto Rush 3D: Grand Prix Championship** is a full 3D racing simulator reverse-engineered from **[autorush.autos](https://autorush.autos)** and rebuilt as a modern **Next.js (App Router)** and **Three.js** web application. 

Instead of a basic runner, this is an **arcade 3D circuit racer** featuring closed-loop spline tracks, 7 AI competitor rivals, realistic 2-stroke Tuk-Tuk audio synthesis, dynamic vehicle physics (throttle, brakes, steering, drift slides, nitro boost), and real-time lighting transitions (Day, Dusk, Night).

---

## 🗺️ Circuits & Race Maps

Select between three authentic closed-loop 3D grand prix circuits:

| Circuit / Map | City | Description | Scenery & Environment |
|---|---|---|---|
| **🏙️ Cyber City Grand Prix** | **Gurugram** | High-speed sweeping turns through towering glass tech towers and corporate corridors. | Glass & steel modern high-rises, wide asphalt dual-carriageway with street lighting, clear blue daytime sky. |
| **🌊 Karachi Grand Prix** | **Karachi** | Coastal bends and urban straights featuring Karachi's iconic architectural landmarks. | Habib Bank Plaza & Karachi telecom spire, high-density city blocks, coastal curbs, and palm trees. |
| **🏛️ Delhi Heritage Circuit** | **Delhi** | Historic grand avenues and rounded rotaries inspired by India Gate and Connaught Place. | Red stone heritage architecture, grand rotaries, wide turning radii, and landscaped boulevards. |

### ☀️ Atmospheric Time-of-Day Engine
- **☀️ Day Mode**: Crisp direct sunlight, bright blue skies, sharp road shadows.
- **🌅 Dusk Mode**: Warm golden hour orange-amber sunset lighting with lengthened shadows.
- **🌙 Night Mode**: Cyberpunk midnight atmosphere with indigo sky (`#0B1026`), volumetric distance fog, glowing skyscraper windows, and **active vehicle headlights** projecting illumination beams onto the road!

---

## 🛺 Rickshaw Garage

Choose your custom Tuk-Tuk / Auto-Rickshaw before heading out to the grid:

| Vehicle | Livery | Max Speed | Handling | Boost | Description |
|---|---|:---:|:---:|:---:|---|
| **Baba Auto** | 🟢 Green / ⚪ White | **42 km/h** | Balanced | $+18\text{ km/h}$ | The iconic classic subcontinent rickshaw. Agile, reliable, and authentic. |
| **Karachi Queen** | 🔴 Crimson / ⚪ Ivory | **46 km/h** | Tuned | $+20\text{ km/h}$ | High-speed street racer inspired by decorated transit minibuses. |
| **Cyber Cruiser** | ⚡ Cyan / ⚫ Obsidian | **48 km/h** | Responsive | $+22\text{ km/h}$ | Futuristic electric prototype built for high-G drifting and corner carving. |
| **Bhatta Express** | 🏆 Turbo Gold / ⚫ Carbon | **50 km/h** | Elite | $+24\text{ km/h}$ | Championship-winning underground monster with maximum top speed. |

---

## 🏎️ 7 AI Rivals

You don't race alone — compete on the grid against 7 distinct AI drivers:

```
[1] YOU (Player)     → Your custom Rickshaw
[2] Kabir            → Aggressive Red & Ivory livery (High skill: 0.96)
[3] Tariq            → Navy & Beige tactical overtaker (Skill: 0.93)
[4] Zain             → Orange & Slate high-speed drifter (Skill: 0.91)
[5] Arjun            → Teal & Forest green steady runner (Skill: 0.88)
[6] Farhan           → Purple & White challenger (Skill: 0.85)
[7] Bilal            → Green & Forest racer (Skill: 0.82)
[8] Rohan            → Bronze & Black competitor (Skill: 0.79)
```

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
| **Time of Day** | Top-Right Button | — | Cycles between Day, Dusk, and Night modes. |
| **Pause / Resume** | `P` | ⏸️ Pause Button | Toggles in-race pause menu. |

---

## 🔊 Procedural Audio Engine

All sound effects are generated in real-time via the **Web Audio API** with zero external audio downloads:
- **2-Stroke Engine Roar**: Sawtooth oscillator modulated by engine RPM, frequency-shifting dynamically between $24\text{ Hz}$ and $180\text{ Hz}$.
- **Tire Drift Screech**: Bandpass-filtered procedural pink noise triggering upon high-speed drifts.
- **Nitro Jet Thrust**: Dual-frequency triangle wave resonance simulating supersonic exhaust.
- **Starting Lights Countdown**: 3 authentic low-frequency beeps ($440\text{ Hz}$) followed by a high-pitch GO tone ($880\text{ Hz}$).
- **Collision Impact**: Square-wave pitch drop thump when rubbing rails or obstacles.

---

## 🚀 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/arqam66/game-auto-3d.git
cd game-auto-3d/karachi-rush

# Install dependencies
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

## 🧪 Playwright End-to-End Verification

Automated browser tests verify the entire 3D racing pipeline:
```bash
python ../scratch/playwright_autorush_test.py
```

### Test Coverage Checklist:
- [x] Three.js WebGL canvas initialization ($1280 \times 720$ resolution)
- [x] Circuit selection (Gurugram, Karachi, Delhi) and Rickshaw garage selection
- [x] 3-2-1-GO! countdown start sequence
- [x] Throttle acceleration, front wheel steering fork turn, and dynamic body roll
- [x] Drift slide mechanic and Nitro boost burst
- [x] Real-time HUD updates (Speedometer in km/h, Position ranking 1st-8th, Lap counter)
- [x] Day, Dusk, and Night environmental lighting transitions
- [x] Pause and Resume state synchronization
- [x] 0 JavaScript console errors and 0 unhandled page exceptions

---

## 📁 Directory Structure

```
game-auto-3d/
├── .gitignore                    # Clean Git isolation rules
├── README.md                     # Main documentation
├── assets/                       # Vector graphics and 2D design references
└── karachi-rush/                 # Next.js 16 + Three.js 3D Racing Application
    ├── app/
    │   ├── components/
    │   │   └── KarachiRushGame.tsx   # Complete 3D Three.js engine, physics, AI & Web Audio
    │   ├── globals.css               # Glassmorphic arcade HUD & responsive UI
    │   ├── layout.tsx                # HTML5 metadata & viewport configuration
    │   └── page.tsx                  # Root page entry
    ├── public/                       # Static icons and assets
    ├── package.json                  # Dependencies (Next.js 16, Three.js, React 19)
    ├── tsconfig.json                 # Strict TypeScript configuration
    └── next.config.ts                # Next.js build and Turbopack configuration
```

---

## 📄 License

Open-source and distributed under the [MIT License](LICENSE).
