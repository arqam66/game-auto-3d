# 🛺 Auto Rush: Karachi Grand Prix 3D
### An Arcade 3D Auto Rickshaw Endless Runner Powered by Next.js & Three.js

[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Verified-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev/)

Play it directly at **<http://localhost:3000>**.

---

## 🗺️ Maps & Race Environments

| Map / Environment | Mode / Setting | Description |
|---|---|---|
| **🏙️ M.A. Jinnah Expressway** | Day Mode (Standard) | High-noon race flanked by iconic Karachi architectural high-rises and the landmark telecom skyscraper tower. |
| **🌃 Karachi Night Grand Prix** | Night Mode (`N` Toggle) | Midnight street racing under moody blue-indigo skies with dynamic atmospheric depth fog and glowing headlights. |
| **⚡ Saddar Rush Hour Circuit** | Hard Difficulty | Minimal vehicle spacing ($300\text{ units}$), fast speed ramp-up ($8.5\times$), extreme traffic density. |
| **🌊 Clifton Coastal Boulevard** | Easy Difficulty | Relaxed cruising with generous obstacle spacing ($420\text{ units}$) and steady speeds ($6.0\times$). |
| **🏁 Grand Prix Championship** | Medium (Standard) | The balanced 3-lap tournament circuit ($350\text{ units}$ spacing, progressive acceleration up to $2.0\times$). |

---

## 🛺 Rickshaw Garage

- **Baba Auto** (🟢 Green / ⚪ White) — Default classic runner.
- **Karachi Queen** (🔴 Crimson / ⚪ White) — High-velocity racing edition (Cost: 3 Coins).
- **Hassan Special** (🔵 Maritime Blue / ⚪ White) — Coastal cruiser edition (Cost: 6 Coins).
- **Bhatta Express** (🟡 Turbo Gold / ⚫ Obsidian) — Underground street racer (Cost: 10 Coins).

---

## 🕹️ Controls

| Input | Key / Action | In-Game Effect |
|---|---|---|
| `Space` / `↑` / `W` / Tap | Hop / Jump | Jump over oncoming buses, trucks, cars, and rickshaws |
| Release / `↓` / `S` | Fast Slide | Rapidly descend back onto the road |
| `N` | Night Mode | Toggle Day / Night lighting and volumetric fog |
| `P` | Pause / Resume | Freeze / continue current race |
| UI Buttons | Garage & Settings | Select vehicles, adjust difficulty, and review instructions |

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
