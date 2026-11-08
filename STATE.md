# Loop Engineering State — Karachi Rush

## Loop Scope
Project: `game-auto` (Karachi Rush) / `karachi-rush/` (Next.js 16 + React 19 + Three.js 0.160)
Method: gstack router + loop-engineering (maker/checker, minimal-fix, isolated worktree)
Reference target: autorush.autos (Gurugram Grand Prix) — studied via `autorush_dump.html` (Clean Room)

## Completed Work Units (verified)
1. **Game feel — screen shake + hit-stop on crash** (`KarachiRushGame.tsx`)
   - Added `shakeIntensity` state + `hitStopRef` (80ms freeze on hard crash)
   - Crash camera uses `shakeIntensity`-scaled jitter; decays over 400ms
   - Verified: `tsc --noEmit` clean; `npm run build` passes
2. **Daily challenges menu UI** (`data.ts` + `KarachiRushGame.tsx` + `globals.css`)
   - `CHALLENGE_POOL` (6 challenges), `generateDailyChallenges()` (midnight-seeded, 3/day)
   - Per-challenge progress bar, reward, done state in menu rail
   - Rewards deposited to bank on completion
   - Verified: `tsc --noEmit` clean; `npm run build` passes
3. **Camera view options + vibration** (`KarachiRushGame.tsx`, `globals.css`)
   - `CAM_VIEW_OPTIONS` (Low/Normal/High/Roof) — adjusts chase-cam height/back distance
   - `VIBRATION_OPTIONS` (Off/Light/Full) — stored in settings state
   - Added to settings panel segmented controls (autorush style)
   - Verified: `tsc --noEmit` clean; `npm run build` passes
4. **Diwali festive greeting banner** (`KarachiRushGame.tsx`, `globals.css`)
   - `शुभ दीपावली · Happy Diwali 🪔` seasonal banner in menu rail
   - Marigold/sindoor gradient panel, centered text
   - Verified: `tsc --noEmit` clean; `npm run build` passes
5. **Music — auto-start + louder + unlock overlay** (`KarachiRushGame.tsx`)
   - AudioContext auto-init on mount + resume if suspended
   - Music gains raised (bass 0.24, lead 0.14, arp 0.10; music bus 0.85, master 0.95)
   - First-keystroke/tap unlocks AudioContext; unlock overlay shown until unlocked
   - Verified: `tsc --noEmit` clean; `npm run build` passes
6. **Visual movement — pulse CTA + float auto card** (`KarachiRushGame.tsx`, `globals.css`)
   - `pulse` animation on START RUSH button; `float` animation on auto card
   - Respects `prefers-reduced-motion`
   - Verified: `tsc --noEmit` clean; `npm run build` passes
7. **Sound credits in settings** (`KarachiRushGame.tsx`, `globals.css`)
   - CC BY / CC0 credits for tyre squeal, nitro, coins, impacts, 3D models
   - Verified: `tsc --noEmit` clean; `npm run build` passes
8. **Audio redesign + game feel** (`KarachiRushGame.tsx`)
   - Ducking/sidechain: music ducks under SFX on crash
   - Richer RPM curve engine voice (bass 0.24→0.25, lead 0.14→0.15)
   - Exhaust pop / backfire on throttle lift-off
   - Tire squeal on drift at speed (bandpass filtered square)
   - Nitro whoosh on engage (lowpass sweep 400→4000Hz)
   - `prevThrottleRef`, `prevDriftRef`, `prevNitroRef`, `playerNitroRef` tracking refs
   - Verified: `tsc --noEmit` clean; `npm run build` passes
9. **Beat-synced HUD pulse + nitro flame** (`KarachiRushGame.tsx`, `globals.css`)
   - `musicBeatRef` + `beatPulse` state scales HUD on music beat (scale 1.03)
   - `nitroFlame` plane mesh pulses on nitro engage (opacity + scale jitter)
   - Verified: `tsc --noEmit` clean; `npm run build` passes
10. **Beta visual design** (`KarachiRushGame.tsx`, `globals.css`)
    - `BETA v0.4` badge (sindoor, hard shadow)
    - `debug-tele` overlay: FPS, LAP, SPD, BANK telemetry
    - `fpsRef` counts frames per second in game loop
    - Crash squash & stretch (scale stretch/squash on crashTimer)
    - Drift body flash (yellow tint pulse on drift)
    - Verified: `tsc --noEmit` clean; `npm run build` passes

## Pre-existing (from earlier craft-anything pass)
- Horn (`H`), camera modes (`C`), back-on-track (`R`), mute (`M`)
- Daily streak bonus, cinematic crash (letterbox + "CRASH!" word)
- Car label overlay, countdown overlay, touch controls
- Differentiated day/sunset/night music themes
- Vehicle upgrade system (4 stats × 3 levels, persisted)

## Verification Results
- `tsc --noEmit`: PASS (zero errors)
- `npm run build`: PASS (all 10 routes prerendered)
- `window.__rush` debug API intact (get/start/setDifficulty/forceLap/addBank/unlockAll/warp/listCoinRows/listObstacles/cycleTimeMode/quitRace)

## Remaining (deferred)
- Multiplayer lobby (server-authoritative) — out of scope for bounded loop
- City unlock (Gurugram/Delhi) — Karachi-only circuit, per scope

## Artifacts Removed
- `rush-game*.png` (8 screenshot files) — deleted
