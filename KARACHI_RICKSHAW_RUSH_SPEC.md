Karachi Rickshaw Rush — Complete Project 
Documentation
A Karachi-themed browser racing game inspired by AutoRush (autorush.autos), built with
Next.js. Contains all 6 documents: PRD, TRD, App Flow, UI/UX Brief, Backend Schema,
Implementation Plan.
0. Read This First: Assumptions and Reference Analysis
What AutoRush is (from the live site)
AutoRush is a free browser racing game. The player drives an auto-rickshaw against 7 CPU
rivals on tracks that follow real roads in two cities (Gurugram and Delhi). Observed
features to mirror:
Garage of 8 auto liveries, with starter / locked / upgrade states
1, 3 or 5 laps; Easy / Normal / Hard rivals; Morning / Sunset / Night; Clear / Rain
Arrow-key steering, Shift to drift, N₂O canisters picked up from the road for nitro
Coins banked after each race, used to unlock a second city (5,000) and upgrade autos
Daily bonus and daily challenges
Multiplayer: create a room, share a 4-digit PIN, up to 8 racers, no sign-up, quick chat,
emoji, typed chat and voice chat
Police pursuit and wrong-way warnings
Camera options (Low / Normal / High / Roof), keyboard, controller and touch controls,
vibration setting
Festival theming (Diwali banner), rewarded ads ("×2 AD"), and static pages: How to
play, Tracks, About, Support, Contact, Privacy
Audio credits for CC-licensed sounds and 3D models
Our version
Name: Karachi Rickshaw Rush (working title; alternative: Karachi Street Rush) Tagline:
"Karachi ki sadkon par race — ﭼﻠﻮ "!Subtitle (replaces "Gurugram Grand Prix"): Karachi
Grand Prix

Assumptions (change any of these)
1. It is a game, not a car-sales site. "Auto" means vehicles, mainly the Suzuki-class street
vehicles of Karachi.
2. Brand safety: "Suzuki" is a registered trademark. In the shipped game, use Suzuki-
style vehicles (Bolan-style van, Ravi-style pickup, Mehran-style hatchback) with
original names, e.g. "Bolan Bhai", "Ravi Raja", "Mehran Mast". Use the real brand name
only with written permission.
3. Free to play, no sign-up needed, ad-supported with optional rewarded ads.
4. Languages: English and Urdu (RTL support), with Roman Urdu in UI flavour text.
5. Platforms: desktop and mobile browsers, installable as a PWA.
6. Track geometry is built from OpenStreetMap data (ODbL licence, attribution
required), simplified by hand.
DOCUMENT 1: PRD — Product 
Requirements Document
1.1 Overview
Item Detail
App name Karachi Rickshaw Rush
One-line idea A free in-browser 3D arcade racer where you drive
Karachi's street vehicles (chingchi, CNG rickshaw,
Bolan, Ravi pickup) against 7 rivals through real
Karachi roads.
Platform Web (Next.js), mobile-first responsive, PWA
Price Free; ads and optional supporter tier
Core loop Pick vehicle → set up race → race → earn rupees →
upgrade or unlock → repeat

1.2 Problem Statement
Pakistani players, especially in Karachi, have almost no localized browser racing
games. Existing ones are generic or foreign-themed.
People want short, free, no-download sessions that run on mid-range phones with
limited data.
Karachi has a strong visual identity (truck art, rickshaws, the sea, chaos) that is not
represented in games.
1.3 Target Users
1.4 User Roles
Guest (default): full single-player and multiplayer, progress stored in the browser.
Registered player (optional Google/email login): progress synced across devices,
leaderboards, name reserved.
Admin: manage tracks, vehicles, challenges, events, reports, content.
Moderator: review chat/voice reports, mute or ban abusers.
1.5 Core Features (MVP)
1. Single-player race: 8 racers (player + 7 CPU), 1/3/5 laps, Easy/Normal/Hard.
2. Garage with 8 vehicles and 3 upgrade stats each (speed, handling, boost).
Persona Description Need
Hamza, 16, Karachi Plays on a mid-range
Android
Fast load, touch controls, plays with
school friends
Ayesha, 24, Lahore Casual desktop gamer Nostalgia, shareable results, daily
challenges
Overseas
Pakistani, 30
Wants a taste of home Recognizable places, Urdu, festival
events
Group of friends Want to race together
instantly
PIN rooms, voice chat, no sign-up

3. 6 tracks in 2 districts: Old Karachi (free) and Clifton and Sea View (unlock for 5,000
rupees).
4. Nitro system: collect "CNG Boost" cylinders on the road.
5. Drift system with drift-distance scoring.
6. Time of day (Morning, Sunset, Night) and weather (Clear, Rain / monsoon).
7. Hazards: donkey carts, buses, water tankers, speed bumps, puddles, stray cats.
8. Warden Chase: a traffic warden or police mobile chases you if you go the wrong way
or hit things.
9. Economy: earn rupees per race; double with rewarded ad; unlock district; buy
upgrades.
10. Daily bonus and 3 daily challenges.
11. Multiplayer: create room, 4-digit PIN, join by PIN or link, up to 8 racers, host sets
track/laps/time/weather.
12. Chat: quick chat phrases, emoji, typed text; voice chat (push-to-talk or open mic).
13. Controls: keyboard, gamepad, touch; vibration setting; 4 cameras.
14. Settings: music, effects, camera, controls, vibration, language, graphics quality.
15. Static pages: How to play, Tracks, About, Support, Contact, Privacy, Terms.
16. Festival themes: 14 August (Independence Day), Eid, Ramadan, Basant-free cultural
events.
17. English / Urdu with RTL UI.
1.6 User Stories
As a player, I want to start racing within 10 seconds of opening the site, so I do not
drop off.
As a mobile player, I want big touch buttons for steering, gas, brake, nitro and drift.
As a player, I want to recognize Karachi landmarks (Empress Market, Frere Hall,
Mazar-e-Quaid, Teen Talwar, Sea View) while racing.
As a player, I want to earn rupees and upgrade my chingchi so I feel progression.
As a host, I want to create a room and share a 4-digit PIN over WhatsApp so friends
join in seconds.
As a friend, I want to join with just a name, no sign-up.
As a player, I want to talk to friends by voice during the room.
As a parent or moderator, I want to report and mute abusive chat or voice users.

As a returning player, I want a daily bonus so I have a reason to come back.
As an Urdu speaker, I want the full UI in Urdu.
1.7 Out of Scope for Version 1
Real-money purchases and in-game stores (supporter donations only, later)
Open-world free roam
Account friend lists and clans
Tournaments and prize payouts
Native iOS / Android apps
User-generated tracks
Licensed real-brand vehicles (until permission is secured)
1.8 Success Metrics
1.9 Content Requirements
Vehicles (8):
Metric Target (first 90 days)
Time to first race under 15 seconds on 4G
Day-1 retention 30%+
Day-7 retention 10%+
Average session 8+ minutes
Races per session 3+
Multiplayer share of sessions 20%+
Rewarded ad opt-in 15%+ of finishes
Core Web Vitals LCP under 2.5s for the landing shell, INP under
200ms
Crash/error rate under 1% of sessions

Tracks (6):
# Name Real-world inspiration Unlock Trait
1 Chingchi
Classic
Qingqi motor rickshaw Starter Light, quick
turns
2 CNG Auto
Green
3-wheel CNG rickshaw Starter Balanced
3 Truck Art
Auto
Hand-painted decorated
rickshaw
1,500 Great boost
4 Mehran Mast Mehran-style hatchback 2,500 High top speed
5 Bolan Bhai Bolan-style van 3,500 Heavy, stable
drifts
6 Ravi Raja Ravi-style pickup 4,500 Tough, hard to
push
7 Sea View
Cruiser
Cultus-style hatchback 6,000 Fast and
smooth
8 Golden
Chingchi
Gold-plated chingchi Reach level 10 or
supporter
Best all round
# District Track Real route (simplified) Feel
1 Old Karachi Saddar Circuit Empress Market,
Zaibunnisa Street, Frere
Hall, Regal Chowk, Bohri
Bazaar
Tight, crowded,
shortcuts
2 Old Karachi Burns Road to
Native Jetty
Burns Road food street,
Jinnah Bridge, Native Jetty
Bridge, Kemari side
Mixed, one bridge
jump-free climb
3 Old Karachi Quaid Run Numaish Chowrangi, M.A.
Jinnah Road, Mazar-e-
Quaid, Guru Mandir
Fast, wide
4 Clifton and
Sea View
Teen Talwar
Loop
Do Talwar, Teen Talwar,
Clifton, Boat Basin
Sunset showcase

Landmarks must be stylized, not photo-scanned. Verify every route on OpenStreetMap
before modelling.
DOCUMENT 2: TRD — Technical 
Requirements Document
2.1 Architecture Summary
Browser (Next.js app, React Three Fiber game)
   |-- HTTPS --> Next.js server (App Router, Route Handlers, Server Actions)
   |                 |--> PostgreSQL (players, progress, rooms, scores)
   |                 |--> Redis (rate limits, leaderboards, room PINs)
   |-- WSS ----> Realtime game server (Node.js, Colyseus)
   |-- WebRTC -> LiveKit (voice chat)
   |-- CDN ----> Cloudflare R2 (3D models, textures, audio)
Key rule: Next.js on Vercel serves pages and APIs only. Vercel serverless cannot hold
WebSocket connections, so multiplayer runs on a separate always-on service.
2.2 Frontend Stack
# District Track Real route (simplified) Feel
5 Clifton and
Sea View
Sea View Sprint Bilawal Chowrangi, Sea
View promenade, camel
carts
Long straights, sea
breeze
6 Clifton and
Sea View
Shahrah-e-
Faisal Rush
Airport, Karsaz, Nursery,
PIDC, Metropole
Fast highway,
buses
Area Choice Reason
Framework Next.js 15 (App Router) + React 19 +
TypeScript
SSR/SEO for landing and info
pages, client-only game canvas
3D engine Three.js via @react-three/fiber +
@react-three/drei
Declarative, large ecosystem

Game code must be loaded with dynamic(() => import(...), { ssr: false })  and
live in a client component. Keep the 3D scene out of SSR entirely.
2.3 Backend Stack
Area Choice Reason
Physics Custom arcade vehicle controller
(fixed 60 Hz step) with simple
collision (@dimforge/rapier3d-
compat for collisions only)
Arcade feel, deterministic
enough for netcode
State Zustand (game/UI state), TanStack
Query (server data)
Light, fast
Styling Tailwind CSS + CSS variables Fast theming for Karachi
palettes and festival skins
i18n next-intl (en, ur) with RTL Urdu support
Audio Howler.js or Web Audio API Engine pitch, mixing, mobile
unlock
Input Keyboard, Gamepad API, custom
touch controls
Matches AutoRush
PWA next-pwa / Serwist service worker Installable, offline shell, asset
caching
Forms/validation Zod Shared client/server schemas
Area Choice
API Next.js Route Handlers (REST/JSON) and Server
Actions
ORM Drizzle ORM (or Prisma)
Database PostgreSQL (Neon or Supabase)
Cache and counters Upstash Redis

2.4 Authentication
Guest-first: on first visit, create an anonymous player ID (signed cookie +
localStorage). No login needed to play or join rooms.
Optional login: Auth.js (NextAuth v5) with Google and email magic link. On login,
merge guest progress into the account.
Sessions: httpOnly, secure, SameSite=Lax cookies; JWT or DB sessions.
Admin routes: role-based ( admin , moderator ) with middleware protection.
2.5 Multiplayer Technical Design
Room PIN: 4 digits (0000-9999 range excluding reserved), stored in Redis with 2-hour
TTL. Collision-checked on creation. Brute-force protection: max 10 join attempts per
IP per minute.
Authority model: server-authoritative for race state (lap counting, finish order,
pickups, rewards); clients predict their own movement and send input at 30 Hz.
Sync: server sends snapshots at 20 Hz; clients interpolate remote cars with 100 ms
buffer.
Room lifecycle: lobby → countdown (3-2-1) → racing → results → lobby.
Capacity: 8 racers per room; empty slots filled by CPU if host chooses.
Reconnect: 20-second grace window, same player token.
Anti-cheat: server validates max speed, lap order (checkpoint sequence) and pickup
collisions; rewards for multiplayer are computed server-side only.
Area Choice
Realtime server Node.js 20 + Colyseus (rooms, state sync, 20 Hz
snapshots) on Fly.io (Mumbai bom  or Singapore
sin , closest to Pakistan)
Voice LiveKit Cloud (WebRTC SFU), tokens issued by
Next.js
File storage Cloudflare R2 + CDN for models, textures, audio
Background jobs Vercel Cron or Upstash QStash (daily challenge
generation, cleanup)

Chat: quick-chat IDs, emoji, typed text up to 120 chars; profanity filter (English + Urdu
+ Roman Urdu list); rate limit 1 msg per second.
Voice: LiveKit room per game room, push-to-talk default, per-user mute, report
button; audio only, never recorded by default.
2.6 Game Engine Requirements
Fixed timestep physics at 60 Hz; render at display refresh, capped at 60 FPS.
Quality presets: Low (no shadows, 30% fewer props, 720p render scale), Medium,
High. Auto-detect on first run using GPU benchmark and
navigator.hardwareConcurrency .
Track data format: JSON (centerline spline, width, checkpoints, boost spawn points,
hazard spawn points, AI racing line) + GLB scene file.
CPU rivals: follow the racing line with per-difficulty speed multiplier (Easy 0.88,
Normal 0.96, Hard 1.04), rubber-banding capped at ±8%, random mistakes on
Easy/Normal.
Models: glTF/GLB with Draco and KTX2 textures; each vehicle under 600 KB, each
track under 6 MB.
Total first-load JS under 250 KB gzip before the game chunk; game chunk lazy-loaded;
assets streamed per track.
2.7 Performance Requirements
Item Target
Landing page LCP under 2.5 s on 4G
Time to playable (first race) under 15 s on 4G, cached under 4 s
Frame rate 60 FPS desktop; 30+ FPS on 3 GB RAM Android
Memory under 500 MB tab usage on mobile
Multiplayer latency playable up to 150 ms RTT
Realtime server 500 concurrent rooms per instance (to be load-
tested)

2.8 Security Requirements
Validate every input with Zod; never trust client-submitted scores, rupees or lap times
for ranked features.
Rate-limit all public endpoints (Upstash Ratelimit).
CSRF protection for cookie-authenticated mutations; strict CORS.
Content Security Policy that allows only needed hosts (LiveKit, ad provider, analytics).
Player names sanitized and filtered; no personal data stored for guests besides name
and anonymous ID.
IP addresses kept only for abuse control, hashed, retained 30 days (disclose in Privacy
page).
Admin panel behind login, MFA recommended, audit log of all admin actions.
Secrets only in environment variables; separate dev / staging / prod.
Compliance: privacy policy, cookie consent for ads/analytics, child-safety wording
(many players are minors), report and block tools.
2.9 Third-Party Integrations
Purpose Service
Ads Google AdSense / AdMob-for-web or Ad Manager
rewarded ads
Analytics PostHog or Plausible (privacy friendly)
Error tracking Sentry
Voice LiveKit
Email (contact form) Resend
Maps data OpenStreetMap (attribution in About page)
Optional supporter payments Stripe, or local options like JazzCash / Easypaisa via
a payment aggregator

2.10 Deployment
2.11 Key Technical Decisions and Reasons
Environment Hosting
Web (Next.js) Vercel (or self-host with Docker on a VPS)
Realtime server Fly.io, 2 regions (bom, sin), autoscale
Database Neon / Supabase Postgres, daily backups
CDN and assets Cloudflare R2 + Cloudflare CDN
CI/CD GitHub Actions: lint, typecheck, unit tests,
Playwright smoke test, deploy on merge
Domains e.g. karachirickshawrush.com (confirm availability)
Decision Reason
Separate realtime server Vercel serverless does not support persistent
WebSockets
Guest-first accounts AutoRush needs no sign-up; lowers friction
Server-authoritative multiplayer
rewards
Prevents rupee cheating
R3F instead of raw Three.js Faster development, React lifecycle
Custom arcade physics Full physics engines feel wrong for rickshaw
arcade handling
LiveKit for voice Avoids building WebRTC SFU ourselves
Drizzle + Postgres Typed, relational data fits economy and rooms

DOCUMENT 3: App Flow Document
3.1 Site Map and Routes (Next.js App Router)
3.2 First Visit Journey
1. User opens the site. Show the Loading screen: "Engine start ho raha hai…" with a
rickshaw animation and a progress bar (assets stream in).
Route Screen Rendering
/ Game shell: loading, main menu,
garage, race setup
Client game inside SSR
landing wrapper
/play Direct-to-race entry (deep link, used
by PWA icon)
Client
/room/[pin] Join-by-link into multiplayer lobby Client
/how-to-play Controls and tips Static (SSG)
/tracks Track guide with landmark info Static
/leaderboard Daily / weekly / all-time best laps ISR (60 s)
/about About, credits, OSM and asset
licences
Static
/support Support the game, FAQ Static
/contact Contact form Server Action
/privacy ,
/terms
Legal Static
/login Optional sign in Auth.js
/profile Stats, synced progress Auth required
/admin/* Admin panel (tracks, vehicles,
challenges, events, reports)
Auth + role
/api/* Route handlers Server

2. Prompt "Tap anywhere for sound" (browser audio unlock). Tap or key press starts the
menu music.
3. A guest player ID is created silently. Starter vehicle (Chingchi Classic) is selected.
Track 1 (Saddar Circuit) is preselected.
4. Main Menu appears: vehicle carousel, district tabs, track dropdown, big START RACE
— ﭼﻠﻮ!button.
5. Tutorial overlay on first race only (3 tips: steer, gas, nitro), dismissable.
3.3 Screen-by-Screen Behaviour
Screen A: Loading
Elements: logo, progress %, rotating tips in English/Urdu, "Starting the engine…".
Success: moves to sound prompt then main menu. Error: after 20 s show "Network
slow hai. Retry" with a retry button and low-quality mode toggle.
Screen B: Main Menu
Element Action
Left/right arrows or swipe on vehicle Change vehicle; locked ones show padlock
and price
District tabs (Old Karachi / Clifton and Sea
View)
Switch district; locked district shows "Unlock
5,000"
Track dropdown "Race 1/3 · Saddar Circuit" Pick a track in the district
START RACE Starts race with current setup
Race setup chip ("3 laps · Normal") Opens Race Setup modal
Garage button Opens Garage
Friends button Opens Multiplayer
Daily Challenges icon (badge when
unclaimed)
Opens Challenges modal
Settings gear Opens Settings
Language toggle (EN / اردو)Switches language and RTL layout

Empty state: new player sees balance 0, one vehicle unlocked, others padlocked.
Error state: if saved progress fails to load, show toast "Progress load nahi hua —
retry" and use local copy.
Screen C: Race Setup Modal
Options: Laps (1/3/5), Rivals (Easy/Normal/Hard), Time (Morning/Sunset/Night),
Weather (Clear/Rain). Done button saves to local state.
Night + Rain is allowed; show a small "Slippery!" hint for Rain.
Screen D: Garage / Upgrade
Shows 3D vehicle turntable, stats bars (Speed, Handling, Boost), upgrade cost,
balance.
Buttons: Upgrade (disabled if not enough rupees, shows "Need X more"), Race now,
Back.
Success: coin sound, bar animates, "Upgraded!" toast. Error: "Not enough rupees".
After finishing a race with enough balance, show "Upgrade ready!" popup with
Upgrade now / Later.
Screen E: Unlock District Modal
Text: cost 5,000, balance. Buttons Unlock (enabled if balance is enough) and Keep
racing. Success: confetti with truck-art colours, new district tab opens.
Screen F: Race HUD (in race)
Top left: position ("1st / 8"), lap (1/3), timer, best lap.
Bottom center: speedometer (km/h), gear-style throttle bar, N₂O / CNG boost meter.
Right: drift distance counter, wrong-way warning, Warden Chase indicator.
Mobile: left thumb steering arrows; right thumb GAS, BRAKE, CNG boost (glows
when ready), DRIFT; pause at top right; chat and mic icons in multiplayer.
Element Action
Footer links How to play, Tracks, About, Support, Contact,
Privacy
Rupee balance Shows balance; tap opens economy help

Start sequence: camera fly-over, 3-2-1-ﭼﻠﻮ!countdown.
Events: pickup (boost canister) → meter fills; collision with cart/bus → slowdown,
camera shake, horn sound; wrong way for 3 s → red banner “ULTA CHAL RAHE HO!”;
Warden Chase triggers after 2 wrong-way or 5 collisions: warden vehicle pursues,
touching you drops 10 percent of the race's rupee reward.
Screen G: Pause Menu
Single player: race pauses. Multiplayer: race continues (banner states this).
Buttons: Resume, Restart (single player only), Settings, Main menu, Quit to room
(multiplayer). Shows "X rupees banked when you finish".
Screen H: Results (Finished)
Final position, time, best lap, drift score, rupees earned breakdown (position bonus,
drift, pickups, clean race).
Buttons: ×2 (watch ad), Race again, Garage, Main menu. Multiplayer: Back to room,
Chat, Leave room.
Daily challenge progress bar updates with animation; claim button when done.
Ad states: loading, not available (button hidden), watched (reward granted), failed
("Ad nahi chala, try later").
Screen I: Daily Bonus and Challenges
On first open each day: Daily Bonus popup, streak grows (Day 1: 100, then 150, 200 …
cap 500). Button Claim.
Challenges shows 3 items, e.g. "Drift 500 m total", "Collect 10 boosts", "Finish 2 races
on Clifton". Each has progress and reward.
States: not started, in progress, completed (claim), claimed, expired.
Screen J: Settings
Music slider, Effects slider (default 80%), multiplayer music auto-lowered, camera
(Low/Normal/High/Roof), controls tabs (Keyboard / Controller / Touch), vibration
(Off/Light/Full), graphics (Auto/Low/Med/High), language, reset progress (with
confirmation), credits link.

Screen K: Multiplayer (Play with Friends)
Entry: name field (pre-filled with guest name) → Create a room or enter PIN → Join.
1. Create: server returns PIN (e.g. 4827). Lobby opens with Copy link, Share (WhatsApp
first), PIN large.
2. Join: invalid PIN → "Room nahi mila"; full room → "Room full hai (8/8)"; race already
started → "Race chal rahi hai, wait karo" with option to spectate or queue.
3. Lobby: list of racers with vehicle thumbnails, ready ticks, host crown; panel for the
host: district, track, laps, time, weather, CPU fill toggle; each player picks vehicle.
4. Voice: Join voice button, mic on/off, per-player mute. Permission denied → helpful
instruction toast.
5. Host Start enabled when at least 2 players are ready. Countdown 5 s, then race.
6. Disconnect: 20 s reconnect window; after that the car is removed and finishes as
DNF.
7. Host leaves: host transferred to the next player.
Report button next to each player opens a reason list (abusive chat, abusive voice,
name, cheating).
Screen L: Login / Profile (optional)
Login with Google or email link. After login, prompt to merge guest progress. Profile
shows stats: races, wins, best laps per track, distance, rupees earned, vehicles owned.
Logout returns to guest state with local data intact.
Screen M: Static Pages
How to play (controls tables for keyboard, Xbox, PlayStation, touch), Tracks (map
thumbnail, landmark list, difficulty), About (credits, OSM attribution, CC asset
credits), Support (donate, FAQ, ad info), Contact (form: name, email, message;
success and error states), Privacy and Terms.
Each page has the same header, footer, language toggle and "Play now" button.

3.4 Navigation Flow Summary
Loading → Sound prompt → Main Menu
Main Menu → Race Setup | Garage | Challenges | Settings | Multiplayer | 
Unlock District
Main Menu → Start Race → Countdown → HUD → Finish → Results → (Race again | 
Garage | Menu)
Multiplayer → Create/Join → Lobby → Countdown → HUD → Results → Back to Lobby
3.5 Payment / Upgrade Flow
There is no mandatory payment. Upgrade flow uses in-game rupees only.
Optional Support flow: Support page → choose amount → payment provider checkout
→ success page → grants "Supporter" badge and the Golden Chingchi.
Failure states: payment cancelled (return to Support with message), webhook delay
(show "Verifying…" up to 60 s).
3.6 Global Error and Empty States
Situation Behaviour
WebGL not supported Friendly page: "Browser update karein" plus
supported browser list
Very low memory / crash Auto-switch to Low quality, offer retry
Offline PWA shell loads; single-player works with cached
tracks; multiplayer disabled with notice
Server API failure Local progress is used; sync retries in background
Mic or audio blocked Explain how to enable it

DOCUMENT 4: UI/UX Design Brief
4.1 Design Direction
Theme: Karachi Truck Art meets Seaside Night. Bold, hand-painted, joyful chaos —
chingchi stickers, truck-art flowers, Urdu calligraphy, neon night signs of Burns Road and
the Arabian Sea glow of Clifton. Arcade, loud, friendly, readable. Not corporate.
Mood words: vibrant, rowdy, warm, proudly desi, fast.
4.2 Color Palette
Festival skins swap tokens: 14 August (green and white with crescent bunting), Eid (gold
and emerald), Ramadan (deep blue with lantern motifs).
Contrast: all text must meet WCAG AA (4.5:1). Never use red text on green.
Token Hex Use
--night #14102B App background, night UI
--sea #0E7C86 Secondary, Sea View accents
--rickshaw-green #1E8E3E Primary CNG-green buttons
--truck-yellow #FFC21A Highlights, coins, START button
--truck-red #E5322D Warnings, wrong-way, danger
--truck-pink #FF4F9A Festive accents, badges
--cream #FFF4DC Text on dark, cards
--sand #E8C98E Old Karachi district tint
--sky-sunset #FF8A3D Sunset time-of-day gradient

4.3 Typography
Load fonts with next/font , subset Urdu glyphs, display: swap .
4.4 Layout Rules
Mobile-first, landscape-first for gameplay; portrait for menus.
8 px spacing grid; menu cards max width 480 px on desktop, centered.
Safe-area insets respected on notched phones.
RTL: mirror menus and arrows when Urdu is active, but never mirror the HUD steering
controls or the speedometer.
Touch targets minimum 48 px; gameplay buttons 72-96 px.
Keep UI off the center road view; only brief centre banners (countdown, wrong way).
4.5 Component Style
Buttons: chunky rounded (16 px), thick dark outline, bottom "3D" shadow, press-down
animation. Primary START is truck-yellow with green text and a bunting-shaped
ribbon.
Cards / modals: cream paper with a painted border pattern (repeating truck-art
flowers), 20 px radius, slide-up animation.
Vehicle carousel: big 3D turntable with painted name plate in English and Urdu.
Badges: pill shapes in pink/yellow for NEW, LOCKED, UPGRADE.
Sliders / toggles: thick tracks, round knobs with a rickshaw-wheel icon.
Use Font
Logo and big headings Bungee or Lilita One (poster-style Latin)
UI body (Latin) Poppins or Inter
Urdu text Noto Nastaliq Urdu for display, Noto Naskh Arabic
for small UI text (Nastaliq is hard to read below 14
px)
Numbers / HUD Orbitron or tabular Inter

Icons: filled, rounded, consistent stroke; Lucide as base, custom rickshaw, boost, horn
icons.
Motion: 150-250 ms ease-out; respect prefers-reduced-motion .
4.6 Dashboard / Menu Structure
Main menu is split into three zones: left = vehicle carousel and stats, centre = district and
track picker with START, right = quick actions (Friends, Challenges, Garage, Settings). On
mobile portrait these stack: vehicle on top, track picker middle, big START bottom, quick
actions as a bottom tab bar.
4.7 Visual World Direction
Old Karachi: warm sand tones, colonial stone arches (Frere Hall, Empress Market
clock tower), hanging wires, signboards in Urdu, chai dhabas, fruit carts, dense buses.
Clifton and Sea View: wide roads, palm trees, sea horizon, camel carts and horse rides
on the beach, sunset gradients, kite flyers, lit-up promenade.
Props: water tankers, minibuses with bright art, donkey carts, rickshaw stands,
billboards with fictional brands, speed breakers.
Weather: monsoon rain with reflective roads and splashes; haze for morning.
Keep everything stylized low-poly with painted textures so it runs on weak phones.
4.8 Audio Direction
Menu music: instrumental with dhol, harmonium and light electronic beat. Race music:
faster tempo, Sindhi/Pakistani folk-pop feel (original or properly licensed only).
SFX: rickshaw two-stroke or CNG putter, truck horn "pap-pap", tyre squeal, coin ding,
nitro whoosh, azan-free by design (avoid religious sounds as game effects).
Voice lines (optional): "Chalo!", "Aagay nikal!", "Bhai side de!"
4.9 Content and Cultural Guidelines
Respectful, humorous, not mocking. No real political party flags or slogans; no real
shop brands.
No religious symbols used as pickups or hazards.
Real landmarks are stylized and clearly labeled in the Tracks page with factual notes.

Avoid depicting real accidents or injuries; collisions are cartoon-level.
4.10 Responsive and Accessibility
Colour-blind safe indicators (icons plus colour). Subtitles for voice lines. Vibration
optional. Adjustable camera. Full keyboard navigation in menus. aria  labels on
buttons and modals; focus trap in dialogs.
4.11 Inspiration References
AutoRush menu structure and HUD; truck art of Karachi (Pakistani decorated trucks and
buses); Mario Kart-style arcade clarity; Burns Road and Clifton signage.
DOCUMENT 5: Backend Schema Document
Database: PostgreSQL. ORM: Drizzle. IDs are UUID v7 unless noted. All tables have
created_at timestamptz default now() ; mutable tables also have updated_at . Money
is stored as integer rupees (in-game currency, not real money).
5.1 Identity and Authentication
players  (every user, guest or registered)
Breakpoint Behaviour
under 480 px Portrait menu stack; prompt to rotate for racing
480-1024 px Landscape racing with touch controls
over 1024 px Keyboard/gamepad HUD, side-by-side menu
Column Type Notes
id uuid PK Anonymous player ID
display_name varchar(20) Sanitized, filtered
is_guest boolean default true

users  (Auth.js)
Column Type Notes
user_id uuid FK → users.id, nullable, unique Set after login/merge
rupees integer default 0, check >= 0
xp integer default 0
level smallint default 1
selected_vehicle_id smallint FK → vehicles.id default 1
district_unlocked text[] default {old_karachi}
language varchar(2) en  or ur
last_seen_at timestamptz
banned_until timestamptz, nullable
Column Type Notes
id uuid PK
email varchar(255) unique
email_verified timestamptz
name, image text
role enum( player , moderator , admin ) default player

accounts  (OAuth links) — id PK, user_id FK, provider, provider_account_id, 
access/refresh token fields; unique(provider, provider_account_id).
sessions  — id PK, session_token unique, user_id FK, expires timestamptz.
verification_tokens  — identifier, token, expires; composite PK (identifier, 
token).
5.2 Game Content (admin-managed)
vehicles
districts
Columns: id  varchar PK ( old_karachi , clifton_sea_view ) · name_en , name_ur
varchar · unlock_price  integer · sort_order  smallint · is_active  boolean
Column Type
id smallint PK
slug varchar unique (e.g. chingchi-classic )
name_en, name_ur varchar
price integer
unlock_rule enum( starter , purchase , level , supporter )
unlock_level smallint nullable
base_speed, base_handling, base_boost numeric(5,2)
model_url text (GLB on CDN)
is_active boolean

tracks
events  (festival skins)
Columns: id  PK · slug  varchar unique ( independence-day , eid ) · starts_at ,
ends_at  timestamptz · theme_tokens  jsonb · banner_text_en , banner_text_ur  ·
is_active  boolean
5.3 Progress and Economy
player_vehicles
Columns: player_id  FK · vehicle_id  FK · speed_level  smallint (0-5) ·
handling_level  smallint (0-5) · boost_level  smallint (0-5) · acquired_at  timestamptz.
PK: (player_id, vehicle_id).
Column Type Notes
id smallint PK
district_id varchar FK →
districts.id
slug varchar unique
name_en, name_ur varchar
description_en,
description_ur
text
data_url text JSON
spline/checkpoints/spawns
scene_url text GLB
length_m integer
difficulty smallint 1-5
osm_attribution text
is_active boolean

rupee_transactions  (append-only ledger)
player_settings
Columns: player_id  PK/FK · music_volume  smallint · effects_volume  smallint · camera
enum (low, normal, high, roof) · vibration  enum (off, light, full) · graphics  enum (auto,
low, medium, high) · default_laps  · default_difficulty  · default_time  ·
default_weather
daily_bonus_claims
Columns: player_id  FK · claim_date  date · streak_day  smallint · amount  integer. PK:
(player_id, claim_date).
Column Type Notes
id uuid PK
player_id FK
amount integer + earn, -
spend
reason enum( race_reward , daily_bonus , challenge , ad
_double , vehicle_purchase , upgrade , district_u
nlock , admin_adjust , merge )
ref_id uuid nullable race_id,
challenge_id
etc.
balance_after integer
Index (player_id,
created_at desc).
players.rupees
must always equal
the latest
balance_after ;
update both in one
transaction.

5.4 Races and Records
races
Columns: id  uuid PK · track_id  FK · mode  enum (single, multi) · laps  smallint ·
difficulty  enum (easy, normal, hard) · time_of_day  enum · weather  enum · room_id
FK nullable · started_at  · finished_at
race_results
track_records  (best per player per track/config)
Columns: player_id  FK · track_id  FK · laps  smallint · best_total_ms  integer ·
best_lap_ms  integer · race_id  FK. PK: (player_id, track_id, laps). Index: (track_id, laps,
best_total_ms) for leaderboards. Daily and weekly boards are cached in Redis sorted sets.
Column Type
id uuid PK
race_id FK
player_id FK nullable (null = CPU)
vehicle_id FK
position smallint
total_time_ms integer nullable (null = DNF)
best_lap_ms integer nullable
drift_distance_m integer
boosts_collected smallint
collisions smallint
rupees_earned integer
validated boolean (server checks passed)
Indexes: (race_id, position), (player_id, created_at
desc).

5.5 Challenges
challenge_templates
Columns: id  smallint PK · type  enum (drift_distance, collect_boosts, finish_races,
win_races, track_specific, no_collisions) · target  integer · reward  integer · params
jsonb · description_en , description_ur
player_challenges
Columns: id  uuid PK · player_id  FK · template_id  FK · for_date  date · progress
integer · completed_at  · claimed_at . Unique: (player_id, template_id, for_date). A cron
job generates 3 per active player on their first daily visit.
5.6 Multiplayer and Moderation
rooms
Column Type Notes
id uuid PK
pin char(4) Unique among
active rooms
(Redis is the
source of truth;
DB is a record)
host_player_id FK
status enum( lobby , countdown , racing , results , close
d )
track_id, laps,
time_of_day,
weather
Host settings
fill_with_cpu boolean
closed_at timestamptz

room_members
Columns: room_id  FK · player_id  FK · vehicle_id  FK · is_ready  boolean · joined_at
· left_at . PK: (room_id, player_id, joined_at).
reports
Columns: id  uuid PK · reporter_player_id  FK · reported_player_id  FK · room_id  FK
nullable · reason  enum (chat, voice, name, cheating, other) · note  varchar(280) ·
chat_snapshot  jsonb (last 10 messages, stored only on report) · status  enum (open,
reviewed, actioned, dismissed) · handled_by  FK users.id · handled_at
bans
Columns: id  PK · player_id  FK · ip_hash  text · reason  · expires_at  nullable ·
created_by  FK users.id. Indexes: (ip_hash), (player_id).
Chat messages are not stored permanently. They live in memory in the realtime server;
only reported snapshots are saved.
5.7 Support, Ads and Admin
contact_messages
Columns: id  PK · name  · email  · message  text · status  enum (new, read, replied) ·
ip_hash  · created_at
ad_rewards
Columns: id  PK · player_id  FK · race_id  FK · provider  · provider_token  text unique
· amount  integer · granted_at . Unique: (race_id, player_id), so a race can be doubled only
once.
supporter_purchases
Columns: id  PK · player_id  FK · provider  · provider_ref  unique · amount_minor
integer · currency  char(3) · status  enum (pending, paid, failed, refunded) · created_at

admin_audit_log
Columns: id  PK · user_id  FK · action  varchar · entity  varchar · entity_id  text ·
before  jsonb · after  jsonb · ip_hash  · created_at
5.8 Relationships Summary
users 1–1 players (optional)
players 1–N player_vehicles N–1 vehicles
players 1–N rupee_transactions
players 1–N race_results N–1 races N–1 tracks N–1 districts
players 1–N track_records N–1 tracks
rooms 1–N room_members N–1 players ; rooms 1–N races
players 1–N player_challenges N–1 challenge_templates
players 1–N reports (as reporter and as reported)
5.9 Redis Keys
5.10 Permissions and Data Ownership Rules
1. A player can read and write only their own players , player_vehicles ,
player_settings , player_challenges , and rupee_transactions  (read only).
2. Rupees are only changed server-side through a transaction function; clients never
send balances.
Key Purpose TTL
room:{pin} Active room metadata and server
instance
2 h,
refreshed
rl:{ip}:{route} Rate limits 1-60 min
lb:{track}:{laps}:daily:
{yyyymmdd}
Daily leaderboard sorted set 8 days
lb:{track}:{laps}:all All-time leaderboard none
join_attempts:{ip} Brute-force PIN guard 1 min

3. race_results  for multiplayer are written only by the realtime server using a service
key. Single-player results are accepted from the client but run through plausibility
checks (min lap time per track, checkpoint order, reward cap) and flagged
validated=false  if suspicious; unvalidated results do not touch leaderboards.
4. Public reads: track records and leaderboards (display name and score only).
5. Moderators: read reports , write bans . Admins: all content tables plus audit log
(read only for everyone).
6. Guest to user merge: sum rupees, union vehicles (keep highest upgrade levels), keep
best records, write one merge  ledger row, then mark the guest players  row merged.
7. Data deletion: on request, delete players , ledger, settings and anonymize
race_results.player_id .
8. If using Supabase, enable Row Level Security with matching policies; if using plain
Postgres, enforce the same rules in the API layer.
5.11 Required Indexes (summary)
players(user_id) , rupee_transactions(player_id, created_at desc) ,
race_results(race_id, position) , race_results(player_id, created_at desc) ,
track_records(track_id, laps, best_total_ms) , player_challenges(player_id,
for_date) , rooms(pin) where status <> 'closed' , reports(status, created_at) ,
bans(ip_hash) .
DOCUMENT 6: Implementation Plan
Team assumption: 1-3 developers plus an AI coding agent, one 3D/texture artist.
Estimated total: 14-16 weeks to public launch. Build phase by phase; do not move on until
the phase deliverables pass their checks.
Phase 0: Preparation (Week 1)
Finalize name, domain, brand-safe vehicle names. Decide Suzuki-style naming (see
assumptions).
Create GitHub repo, project board, /docs  folder with these 6 documents.
Collect assets plan: licensed or CC0 models, audio (record licences in CREDITS.md ).
Verify every track route on OpenStreetMap; export road geometry (ODbL).
Deliverables: repo, docs, asset licence sheet, track route sketches.

Phase 1: Project Setup (Week 1-2)
1. create-next-app  (TypeScript, App Router, Tailwind, ESLint).
2. Add Zustand, TanStack Query, Zod, next-intl, Drizzle, Auth.js, Sentry.
3. Folder structure: app/ , components/ui , game/  (engine), game/tracks ,
game/vehicles , server/ , realtime/  (separate package), db/ , messages/en.json ,
messages/ur.json .
4. Configure Prettier, Husky, GitHub Actions (lint, typecheck, test).
5. Environments and .env.example ; Vercel project; Neon database.
Deliverables: deployed empty shell on a preview URL, CI passing.
Phase 2: Design System and Static Pages (Week 2-3)
1. Implement tokens (colors, fonts, spacing) and Tailwind theme.
2. Build base components: Button, Card/Modal, Toggle, Slider, Badge, Tabs, Toast.
3. i18n with Urdu RTL; language toggle.
4. Static pages: How to play, Tracks, About, Support, Contact (Server Action + Resend),
Privacy, Terms.
5. SEO: metadata, Open Graph image, sitemap, robots, structured data (VideoGame
schema).
Deliverables: all static pages live in English and Urdu, Lighthouse SEO 95+.
Phase 3: Database and Auth (Week 3-4)
1. Write Drizzle schema for all tables in Document 5 and run migrations.
2. Seed vehicles, districts, tracks, challenge templates.
3. Guest identity: signed cookie, /api/player/bootstrap .
4. Auth.js Google + email link, guest-merge endpoint.
5. API routes: progress get/save, settings, rupee transactions, vehicle
purchase/upgrade, district unlock, daily bonus.
6. Rate limiting and Zod validation everywhere.
Deliverables: passing API tests, Postman/Bruno collection, guest to login merge
tested.

Phase 4: Game Engine Core (Week 4-7)
1. R3F canvas component loaded client-only; fixed-timestep loop; asset loader with
progress.
2. Vehicle controller: acceleration, steering, drift, collisions, boost; tune per vehicle.
3. Camera system (4 modes), input layer (keyboard, gamepad, touch).
4. Track loader from JSON spline: road mesh, checkpoints, lap logic, wrong-way
detection, minimap.
5. Build Track 1 (Saddar Circuit) as the vertical slice with landmarks and props.
6. CPU rivals following racing line with difficulty tuning.
7. HUD, countdown, pause, results screen, rupee reward formula.
8. Pickups (CNG boost), hazards (carts, buses, bumps), Warden Chase.
9. Audio engine: engine pitch, horn, tyre squeal, boost, music, mobile audio unlock.
Deliverables: fully playable single-player race on Track 1 at 60 FPS on desktop and 30+
FPS on a 3 GB Android phone.
Phase 5: Menu, Garage and Progression UI (Week 7-9)
1. Loading screen, main menu, vehicle carousel, race setup modal.
2. Garage with upgrades and stat bars; district unlock modal.
3. Results screen economy, daily bonus popup, daily challenges (server cron + client
tracking).
4. Settings screen persisted locally and synced.
5. Add remaining 5 tracks (one every 3-4 days), time-of-day lighting, rain weather.
6. Add vehicles 3-8 with distinct tuning.
Deliverables: complete single-player game, 6 tracks, 8 vehicles, economy loop
balanced (average player unlocks the second district in about 12-15 races).
Phase 6: Multiplayer (Week 9-12)
1. Stand up Colyseus server ( realtime/ ), Docker image, deploy to Fly.io.
2. Room create/join with PIN, lobby state, host controls, ready system.
3. Input sync, 20 Hz snapshots, client interpolation, server lap and finish validation.
4. Reconnect logic, host migration, CPU fill, DNF handling.

5. Chat: quick chat, emoji, typed text with profanity filter and rate limits.
6. Voice: LiveKit token endpoint, join/leave voice, push-to-talk, mute, speaking
indicators.
7. Report and moderation flow; admin report queue.
8. Load test with simulated bots (target 100 rooms on one instance first).
Deliverables: 8 real players can race, chat and talk with under 150 ms RTT; reports
reach the admin panel.
Phase 7: Leaderboards, Admin and Monetization (Week 12-13)
1. Leaderboard page (daily, weekly, all-time) with Redis and ISR.
2. Admin panel: tracks and vehicles toggles, challenges, events and festival skins,
reports, bans, audit log.
3. Rewarded ads (×2 reward) and a light display ad slot on static pages only; cookie
consent banner.
4. Support page and optional supporter payment with webhook.
5. Festival theme system (14 August skin first).
Deliverables: admin can run the game without code changes; ads and support flow
tested in staging.
Phase 8: Testing (Week 13-14)
Type Tools Scope
Unit Vitest Physics helpers, reward formula,
schema validators, economy
functions
API /
integration
Vitest + test DB All route handlers, transactions,
merge logic
E2E Playwright First visit, race finish, purchase,
login merge, join room
Multiplayer Bot clients Join/leave churn, reconnects,
desync checks

Deliverables: bug list closed for P0/P1, performance targets met.
Phase 9: Deployment and Launch (Week 14-15)
1. Production Vercel, Fly.io (2 regions), Neon with backups, Cloudflare R2/CDN, domain
and SSL.
2. Environment secrets, Sentry, analytics, uptime monitor, status page.
3. PWA install prompt, icons, splash screens.
4. Soft launch to friends and Karachi communities (Reddit r/pakistan, Facebook groups,
university societies, TikTok clips of races).
5. Monitor errors and retention for one week; hotfix.
Deliverables: public launch, monitoring dashboards, rollback plan.
Phase 10: Final Polish and Post-Launch (Week 15-16 onward)
Balance economy from real data; tweak AI difficulty.
Add Eid and Ramadan skins, new tracks (Lahore and Islamabad later as new "cities"),
new vehicles, seasonal challenges.
Controller and haptics polish, more Urdu voice lines, improved visuals.
Type Tools Scope
Performance Lighthouse, WebPageTest on 4G,
real devices (low-end Android,
iPhone, laptop)
LCP, FPS, memory
Compatibility Chrome, Safari, Firefox, Samsung
Internet
Audio unlock, touch controls,
gamepad
Accessibility axe, manual keyboard test, RTL
check
Menus and dialogs
Security Dependency audit, rate-limit tests,
auth bypass checks
All endpoints
Playtest 20-30 real players in Karachi Difficulty, controls, fun, Urdu copy

6.1 Rupee Reward Formula (starting point, tune in playtests)
base = 100 * laps
position_bonus = [1st: 300, 2nd: 200, 3rd: 150, 4th: 100, 5th: 70, 6th: 50, 
7th: 30, 8th: 20]
drift_bonus = min(floor(drift_m / 10), 150)
boost_bonus = 10 * boosts_collected (max 100)
clean_bonus = 50 if collisions <= 2
total = base + position_bonus + drift_bonus + boost_bonus + clean_bonus
ad_double = total * 2 (once per race)
unlock district = 5000, vehicle prices per Document 1, upgrade cost = 300 * 
(level + 1)
6.2 Risk Register
6.3 AI Coding Agent Instructions (how to use all 6 docs)
Give the agent this prompt at the start of each phase:
Risk Impact Mitigation
Low-end phones cannot run 3D High Quality presets, low-poly, render scale, texture
compression
Trademark complaint (Suzuki
etc.)
High Original names, "-style" models, no logos
Asset licensing mistakes High Licence sheet, CC0 or paid assets only, credits
page
Multiplayer desync Medium Server authority, snapshot interpolation, bot
testing
Voice chat abuse (many
minors)
High Push-to-talk default, report, mute, moderation,
clear privacy text
Realtime cost growth Medium Autoscale, room TTL, CPU fallback, cap rooms
Scope creep Medium Version 1 scope is fixed by Document 1

"Read all 6 documents in /docs. Do not start coding yet. Summarize what you
understood, list missing details or conflicts, then propose the task list for Phase N
only. After I approve, build Phase N, write tests, and stop with a summary of what
changed and how to run it."
Rules for the agent:
1. Never build a later phase early.
2. Use the exact table and column names from Document 5.
3. Use the exact colors, fonts, and screen behaviours from Documents 3 and 4.
4. Keep game code client-only and server code separate; never trust client rupee values.
5. Ask before adding a library not listed in Document 2.
6. Update CREDITS.md  whenever an asset is added.