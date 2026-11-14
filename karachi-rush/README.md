# 🛺 Karachi Rickshaw Rush

A high-performance, in-browser 3D arcade racing game set on real Karachi road circuits, inspired by [AutoRush](https://autorush.autos/). Drive iconic Karachi street vehicles (Chingchi, CNG auto-rickshaw, Bolan van, Ravi pickup, Mehran hatchback) against 7 rivals through Saddar, Burns Road, Mazar-e-Quaid, Clifton, and Sea View.

**Tagline:** کراچی کی سڑکوں پر ریس، چلو! (*Karachi ki sadkon par race, Chalo!*)  
**Engine:** Next.js 16 (App Router, Turbopack) · React 19 · Three.js (WebGL HD, ACES Filmic Tone Mapping) · Web Audio API · BroadcastChannel

---

## 📖 Complete Documentation
The full 6-part project specification is documented in [KARACHI_RICKSHAW_RUSH_SPEC.md](../KARACHI_RICKSHAW_RUSH_SPEC.md):
1. **PRD** (Product Requirements Document)
2. **TRD** (Technical Requirements Document)
3. **App Flow Document**
4. **UI/UX Design Brief & Token System**
5. **Backend & Database Schema**
6. **Implementation Plan & Roadmap**

---

## 🌟 Core Features

- **Single-Player Grand Prix:** Player + 7 Pakistani-named AI rivals with unique driving styles, spline pathfinding, collision physics, and rollover/flip takedowns.
- **Race Customization:** 1, 3, or 5 laps; Easy, Normal, or Hard difficulty; Morning, Sunset, or Night times of day; Clear or Monsoon rain weather.
- **8 Karachi Street Vehicles:** Authentic procedural 3D models with under-seat CNG tanks, safety passenger rails, fare meter boxes, bull bars, roof racks, and chamakpatti trims.
- **CNG Nitro Boost & Drifting:** Collect roadside gas canisters or initiate handbrake drifts to charge nitro.
- **Multiplayer PIN System:** Instant room creation with 4-digit PINs, room sharing, and peer-to-peer browser synchronization via `BroadcastChannel` (no account needed).
- **Daily Progression:** Daily login streak bonuses, 3 daily procedural challenges, vehicle stat upgrades, and persistent bank economy.
- **Clean UI & Responsive Controls:** Full keyboard (`WASD` / arrows, `Space` drift, `N` nitro, `H` horn), 4 camera views (Low, Normal, High, Roof), and touch controls.

---

## 🛺 Vehicle Garage & Attributes

| # | Vehicle | Type / Inspiration | Top Speed | Accel | Handling | Nitro | Unlock Price |
|---|---|---|---|---|---|---|---|
| 1 | **Chingchi Classic** | Qingqi 4-stroke motor rickshaw | 42 km/h | 12.0 | 1.15 | +18 km/h | **Starter (Free)** |
| 2 | **CNG Auto Green** | 3-wheel Karachi CNG auto | 45 km/h | 11.5 | 1.05 | +20 km/h | 1,000 coins |
| 3 | **Truck Art Auto** | Peacock cyan & floral chamakpatti | 48 km/h | 13.0 | 1.12 | +25 km/h | 2,000 coins |
| 4 | **Mehran Mast** | Lightweight Karachi street boss | 52 km/h | 14.5 | 1.10 | +22 km/h | 3,200 coins |
| 5 | **Bolan Bhai** | Commercial Suzuki-style van | 47 km/h | 12.0 | 1.25 | +22 km/h | 4,500 coins |
| 6 | **Ravi Raja** | Heavy-duty commercial pickup | 46 km/h | 13.5 | 1.20 | +20 km/h | 5,500 coins |
| 7 | **Sea View Cruiser** | Smooth coastal highway cruiser | 50 km/h | 14.0 | 1.18 | +24 km/h | 7,000 coins |
| 8 | **Golden Chingchi** | Supreme championship gold rickshaw | 54 km/h | 15.0 | 1.22 | +26 km/h | 10,000 coins |

---

## 🏙️ Circuit & District Laps

The ~2.9 km closed spline circuit takes racers through 3 distinct districts:
1. **Saddar Circuit (Day):** Empress Market, Chaar Minar, and heritage colonial streets.
2. **II Chundrigar Road (Sunset):** Habib Bank Plaza, Boulton Market, and financial skyline.
3. **Clifton & Sea View (Night):** Mazar-e-Quaid silhouette, coastal promenade, illuminated billboards, and active rickshaw headlights.

---

## 🏁 AI Rival Roster

| Rival | Skill Mult | Lane Target | Livery Style |
|---|---|---|---|
| **Tariq** | 0.96 | -0.35 (Inside left) | Deep Navy & Cream |
| **Zain** | 0.93 | +0.35 (Wide right) | Tangerine Orange & Midnight |
| **Farhan** | 0.91 | -0.15 (Center left) | Crimson Red & Gold |
| **Bilal** | 0.88 | +0.20 (Center right) | Persian Green & Charcoal |
| **Usman** | 0.85 | -0.40 (Far left) | Royal Purple & Pearl White |
| **Imran** | 0.82 | +0.40 (Far right) | Emerald Green & Leaf |
| **Hassam** | 0.79 | 0.00 (Center line) | Warm Sand & Onyx |

---

## 🕹️ Controls Guide

| Action | Desktop Key | Touch Button | Function |
|---|---|---|---|
| **Accelerate** | `W` or `↑` | **GO** | Throttle engine forward |
| **Brake / Reverse** | `S` or `↓` | **BRAKE** | Decelerate or reverse |
| **Steer Left / Right** | `A` / `D` or `←` / `→` | **◄ / ►** | Turn front wheel fork with natural roll |
| **Handbrake Drift** | `Space` or `Shift` | **DRIFT** | Slide around corners, score points, charge Nitro |
| **Nitro Boost** | `N` | **⚡** | Inject N₂O boost, widen camera FOV |
| **Horn** | `H` | — | Karachi auto-rickshaw dual-tone horn |
| **Camera View** | `C` | Menu Setting | Cycle Low, Normal, High, and Roof cameras |
| **Pause Game** | `P` or `Esc` | Header Icon | Open in-race pause menu |

---

## 🛠️ Project Architecture

```
karachi-rush/
├── app/
│   ├── components/
│   │   ├── KarachiRushGame.tsx   # Three.js WebGL engine, game loop, HUD & PIN multiplayer
│   │   └── game/
│   │       ├── data.ts           # TRACK, DISTRICTS, VEHICLES (8), RIVALS, DIFFICULTIES
│   │       └── icons.tsx         # Clean SVG HUD icons
│   ├── globals.css               # Clean typography, tokenized CSS variables, no slop
│   ├── layout.tsx                # Metadata & PWA viewport headers
│   └── page.tsx                  # Client entry point
├── public/                       # Audio and static icons
└── package.json                  # Next.js 16, React 19, Three.js
```

---

## 🚀 Running the Game Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server with Turbopack
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in any modern browser.

---

## ⚖️ Brand Safety & Disclaimer
"Suzuki" is a registered trademark of Suzuki Motor Corporation. This project is a community-developed indie racing tribute using custom original models, stylized liveries, and fictional designations (*Chingchi Classic, Bolan Bhai, Ravi Raja, Mehran Mast*).
