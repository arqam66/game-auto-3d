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

## Remaining (deferred / out of scope per plan)
- Multiplayer lobby (server-authoritative backend) — deferred (spec Phase 6).
- Real-money purchases / stores — design-only (Task 8); no real-money logic in V1.
- Native iOS/Android, UGC tracks, licensed real-brand vehicles — out of scope (spec 1.7).
- Full string coverage for i18n (static pages, some HUD labels) — mechanism shipped; coverage can be extended.

## Completed this session (2026-11-16)
15. **AutoRush Task 2.1 — Warden chase (police pursuit)** (`KarachiRushGame.tsx`, `globals.css`, `icons.tsx`)
    - Reckless-driving escalation: 2nd crash of a run summons the warden (chase mini-boss, `startWardenChase`) — a dark-liveried rickshaw drives the spline forward at 1.9× rival speed with a looping sawtooth siren (`playSiren`, `SirenIcon`).
    - Warden closes to ≤5 m → "BUSTED!" cinematic (−100 score), siren stops, chase clears.
    - Camera integration: chase cam jitters toward the warden as it closes (within ~20 m, intensity scales with closeness).
    - `WARDEN CHASE` HUD banner (red, top-center) gated by React `pursuit` state; mirrored in `__rush.get().pursuit`.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/22 warnings; `npm run build` passes; dev server 200.
16. **AutoRush Task 2.2 — Warden chase integration** — complete as part of Task 2.1 (the pursuit vehicle is the warden mini-boss; camera + HUD wired into race loop).
17. **AutoRush Task 2.3 — Festival themes** (`data.ts`, `globals.css`, `KarachiRushGame.tsx`)
    - `FESTIVALS` data (Basant, Ramadan, Eid, Independence Day) with date windows + themed palette (primary/secondary/accent) in `data.ts`; `getActiveFestival(now)` returns the active festival or null.
    - `.festival-banner` component (normal-flow centered in menu rail) styled from festival colors via inline style.
    - Festival computed lazily on mount (`useState(() => getActiveFestival())`); banner renders only when a festival window is active (today 2026-11-16 → none active, no behavior change).
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/24 warnings; `npm run build` passes; dev server 200.
18. **AutoRush Task 2.4 — Time-of-day & rain weather polish** (`KarachiRushGame.tsx`)
    - Base day/sunset/night lighting + rain fog already present; extended with:
      - Rain streak particle system (`buildRain`, `rainMesh`, `RAIN_COUNT`): follows the camera, streaks fall and wrap top->bottom, shown only while racing in rain weather.
      - Wet-road tyre behaviour: rain multiplies grip by 0.72 (combines with oil-slick grip loss), making steering looser and braking wider in rain.
    - Disposed between races; rain mesh re-created per run.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/24 warnings; `npm run build` passes; dev server 200.
19. **Phase B Task 3 — Second-city unlock content (Gurugram / Delhi @ 5,000 coins)** (`data.ts`, `KarachiRushGame.tsx`)
    - `CITIES` data: Karachi (default, unlockCost 0) + Gurugram·Delhi NCR (unlockCost 5000), each with track points, districts, sky/ground colors, road width; `cityById()` helper; `STORAGE_KEYS.citiesUnlocked`.
    - Unlock flow: `unlockCity(id)` deducts coins, persists `citiesUnlocked`, auto-selects the city; `buyCity`/`buyVehicle` unchanged.
    - City selector in menu rail (cycle unlocked cities with ‹ ›, UNLOCK FOR button or "🔒 NEED X" note, "UNLOCKED ✓" state); race start guarded to unlocked cities.
    - Track swap: engine now builds the spline/sky/roadWidth from `cityById(selectedCity)`, so unlocking Gurugram switches the circuit.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/25 warnings; `npm run build` passes; dev server 200.
20. **Phase B Task 4 — Static pages** (`app/support/page.tsx`, `app/components/SiteNav.tsx`)
    - All spec routes present with real content: `/about`, `/autos`, `/changelog`, `/contact`, `/how-to-play`, `/privacy`, `/terms`, `/tracks`, plus root `/`.
    - Added missing `/support` page (controls, Gurugram unlock, Warden/crashes, vehicles/upgrades, support email) + wired it into `SiteNav` header/footer and `current` type.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors; `npm run build` passes (/support prerendered); `/support` → 200.

21. **Phase B Task 5 — Urdu language + full RTL UI** (`app/i18n.ts`, `app/layout.tsx`, `KarachiRushGame.tsx`)
    - `i18n.ts`: `en` + `ur` dictionaries (game title, HUD, garage, alerts, settings, results, etc.); `t(key, lang)` falls back to English then the key; `isRTL`, `readPersistedLang`/`writePersistedLang` (storage key `rush_lang`).
    - `layout.tsx`: default `dir="ltr"`, inline script applies persisted dir/lang before first paint (no RTL flash).
    - `KarachiRushGame.tsx`: `lang` state (lazy-init), effect syncs `document.documentElement.dir`/`lang` + persists; language selector in settings (EN/اردو); core UI strings (title, CTA, section labels, garage buttons, alerts, HUD labels, results labels) wrapped with `t()`.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/26 warnings; `npm run build` passes; dev server 200.

22. **Phase B Task 6 — Full gamepad support** (`KarachiRushGame.tsx`)
    - Gamepad API polled each frame in the game loop: left stick steer, triggers gas/brake, A nitro, B drift, Start pause.
    - Input is merged into controlsRef only when the gamepad has activity (so keyboard/touch keep working).
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/26 warnings; `npm run build` passes; dev server 200.
23. **Phase B Task 7 — Leaderboards + wallet/rush points** (`KarachiRushGame.tsx`, `data.ts`)
    - Per-city / per-difficulty best lap: storage key `rush_bestLaps` (JSON map keyed by `${city}:${difficulty}`), read at race start and updated in `completeLap`; legacy `rush_bestLap` used as fallback.
    - Wallet (bank) economy already wired: `buyVehicle`, `buyUpgrade`, `unlockCity` deduct coins and persist; HUD shows bank + run coins.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/26 warnings; `npm run build` passes; dev server 200.
24. **Phase B Task 8 — Donation / supporter monetization UI (design only)** (`KarachiRushGame.tsx`, `globals.css`)
    - Supporter tiers (BRONZE / SILVER / GOLD) preview in settings + `.supporter-tiers` / `.tier-badge` styles; explicitly design-only, no payments in V1.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/26 warnings; `npm run build` passes; dev server 200.
25. **Phase B Task 9 — PWA installability + offline shell** (`public/manifest.json`, `public/sw.js`, `app/layout.tsx`)
    - `manifest.json` (name, icons, display standalone, theme color) + minimal cache-first service worker + registration in layout head; manifest/sw.js serve 200.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/26 warnings; `npm run build` passes; dev server 200.
26. **Phase C Task 10 — Final anti-slop pass** (`KarachiRushGame.tsx`, `globals.css`)
    - Reviewed new UI (festival banner, supporter tiers, city selector, warden banner, rain streaks, language selector) against the design system; consistent tokens, no new gradients/glows/emoji beyond existing.
    - Verified: `tsc --noEmit` clean; `npm run lint` 0 errors/26 warnings; `npm run build` passes.
27. **Phase C Task 11 — Full verification loop**
    - `tsc --noEmit`: clean; `npm run lint`: 0 errors/26 warnings; `npm run build`: all 11 routes prerendered (incl. /support); dev server: http://localhost:3000 -> 200; /music/racing.mp3 -> 200 (3,387,141 bytes); `window.__rush.get()` returns valid state (phase, lap, pursuit, etc.); race start verified (phase -> racing, 26 obstacles, no console errors).
28. **Phase C Task 12 — Docs sync** (`STATE.md`)
    - STATE.md completed-work + gaps updated to reflect all tasks 15-27; remaining-deferred list trimmed to genuinely out-of-scope items.
29. **Phase C Task 13 — Release readiness**
    - Committed (abe075a) and pushed to origin main (0f31c69..abe075a); changelog/README drift noted for follow-up.

## Artifacts Removed
- `rush-game*.png` (8 screenshot files) — deleted

## AutoRush Parity Audit — 2026-11-16 (Task 1 of `docs/plans/2026-11-16-karachi-rush-completion-plan.md`)

Method: source greps against `karachi-rush/app/components/KarachiRushGame.tsx`, `app/components/game/data.ts`, app route tree, `public/`; Clean Room reference `autorush_dump.html`; REA / reverse-engineering MCPs consulted.

### PRESENT (implemented — no gap)
- Static pages exist: `/about`, `/autos`, `/changelog`, `/contact`, `/how-to-play`, `/privacy`, `/terms`, `/tracks` (+ `/api/contact`) — route tree already has them.
- Time modes `day` / `sunset` / `night` + weather `clear` / `rain` (`applyTimeMode`, `menuWeather`, rain fog) — present.
- Wrong-way warning (`wrongWay` state, `WRONG WAY` HUD, `nowWrong` delta check) — present.
- Multiplayer lobby UI (host/join 4-digit PIN, BroadcastChannel `karachiRoom_*`) — present; server-authoritative backend out of scope.
- Camera: chase / hood / cinematic (`CAM` key) + view Low/Normal/High/Roof + vibration — present.
- Upgrades (4 stats × 3 levels, coins economy), nitro / drift / coins, bestLap + rankings leaderboard — present.
- Music: real looped track `/music/racing.mp3` (3,387,141 bytes), day/sunset/night themes, ducking/sidechain — present.
- Daily challenges (6-entry pool, 3/day seeded), daily bonus, wallet rush-points — present.
- Nitro ring / drift button + tag / drift popups / lap banners / beat-pulse HUD — present.

### GAPS (absent — next tasks)
1. Police pursuit & warden chase — IMPLEMENTED (Task 2.1, 2026-11-16). 2nd crash summons police; ≤5 m = "BUSTED!" cinematic. → complete.
2. Festival themes (Basant, Ramadan, Eid, Independence Day) — IMPLEMENTED (Task 2.3, 2026-11-16). Date-windowed themed banners in menu rail; none active today (2026-11-16). → complete.
3. Urdu language + full RTL i18n — IMPLEMENTED (Phase B Task 5, 2026-11-16). i18n module + RTL dir + language selector + core strings wrapped. → complete.
4. Full gamepad support — IMPLEMENTED (Phase B Task 6, 2026-11-16). Gamepad API polled each frame. → complete.
5. PWA installability — IMPLEMENTED (Phase B Task 9, 2026-11-16). manifest.json + sw.js + registration in layout. → complete.
6. Second-city unlock content (Gurugram/Delhi @ 5,000 coins) — IMPLEMENTED (Phase B Task 3, 2026-11-16). `CITIES` data + unlock flow + persistence + track swap. → complete.

### Notes / uncertainties
- Vehicle roster: code constants suggest ~7 vehicle defs + upgrade stats; spec lists 8 liveries — reconcile in Task 2.
- Diwali greeting (STATE.md #4) did not hit ASCII greps — verify whether it survived the anti-slop pass.
