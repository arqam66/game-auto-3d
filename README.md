# game-auto-3d

# Auto Rush: Karachi Grand Prix 🛺

A 3D auto rickshaw runner game built with **Next.js** (App Router) and **Three.js** (`three@0.160.0`).

## 🎮 Features

- 🚕 **Karachi Grand Prix Theme**: Procedurally rendered 3D city buildings, landmarks, and atmospheric environments.
- 🌙 **Day / Night Mode**: Seamless real-time lighting transition with directional shadows and headlamps (toggle with **N**).
- 🏎️ **Vehicle Garage**: Choose and unlock multiple custom auto rickshaws (Baba Auto, Karachi Queen, Hassan Special, Bhatta Express).
- 💰 **Coins & Laps**: Collect coins, avoid traffic obstacles (buses, trucks, cars, rickshaws), and complete 3 fast-paced laps.
- ⚡ **Difficulty Modes**: Easy, Medium, and Hard speed & gap balancing.
- 📊 **Local Persistence**: High score & personal best tracked via browser `localStorage`.

## 🕹️ Controls

| Key / Input | Action |
|---|---|
| `Space` / `↑` / `W` / Tap | Hop / Jump |
| Release / `↓` / `S` | Fast slide / land |
| `N` | Toggle Day / Night lighting |
| `P` | Pause / Resume |
| UI Buttons | Start, Difficulty tuning, Garage vehicle select |

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / pnpm / yarn

### Installation & Run

```bash
# Navigate to the game directory
cd karachi-rush

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
cd karachi-rush
npm run build
npm run start
```

## 🧪 Testing & Verification

- **Linting & Type-checking**: Clean ESLint and TypeScript verification (`npm run lint`, `npm run build`).
- **End-to-End Testing**: Automated browser testing with **Playwright** covering WebGL canvas rendering, scene initialization, jump mechanics, day/night toggles, pause/resume, and HUD metrics.
