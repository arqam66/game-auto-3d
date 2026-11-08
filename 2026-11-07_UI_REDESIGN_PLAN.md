# Karachi Rush — UI rebuild plan, based on a study of autorush.autos

* **Author:** OpenCode agent
* **Status:** Proposed — awaiting approval
* **Date:** 2026-11-07
* **Workflow:** `unslop` (audit → direction → nine passes) wrapped in EGM (`egm-draft` structure, `egm-review` next)

---

## Overview

`https://autorush.autos/` is the same genre of game as this repo: a browser 3D
auto-rickshaw racer. It looks finished. Karachi Rush does not, and the gap is not
a missing feature — it is craft. The scene is already there, the race loop
already works, and the data model is complete. What is broken is the layer
between the player and the game: a 540 px menu card that clips its own start
button, a HUD of eight ragged chips stacked down the left edge, an emoji icon
set, a type system of one font at 11 px, and a stylesheet that has been appended
to five times with rules that contradict each other.

This plan rebuilds that layer. It takes autorush's **structure** — full-bleed
live 3D scene, narrow left rail, one primary action, HUD pushed to the corners —
and rejects its **surface treatment** (hue gradient, glow, glass blur), because
copying it would make a Karachi game look like a Gurugram game, and because
those are the exact tells `unslop` exists to remove.

The palette stays Karachi's. Nothing here ships a pink-purple gradient.

---

## What this plan is and is not

**Is:** a visual and structural rebuild of the menu, HUD, results, pause,
settings, loading screen, and the design tokens behind them, plus six specific
bugs in the 3D scene that make the background look empty.

**Is not:** a gameplay change. `TRACK`, `DISTRICTS`, `VEHICLES`, `RIVALS`,
`DIFFICULTIES`, `OBSTACLE_TUNING`, the physics loop, the coin economy, and the
`window.__rush` debug API all stay byte-identical. If a screen needs data the
state does not expose, the plan says so instead of inventing it.

---

# Part 1 — What autorush.autos actually does

Observed from the live DOM and its 151 KB stylesheet, not from screenshots.

## 1.1 Structure

```
body.hud-clean
├── #loading.screen          logo lockup + load bar, fades out
├── #menu.home
│   ├── .wallet-bar          coins · points · streak · daily · settings
│   └── .home-sidebar
│       └── .home-content
│           ├── header.home-top    logo, district line
│           ├── .home-dock         scrolling body: garage entry, mode picker
│           └── .chal-card         DAILY CHALLENGES list + goal bar
├── #setup.sheet             bottom sheet, not a modal
├── #garage                  .gar-top · .gar-cards (3 .up-card) · .gar-bottom "चलो!"
├── #hud
│   ├── .race-info           .ri-pos / .ri-lap / .ri-time / .ri-best
│   ├── canvas               minimap
│   ├── .pts-box             score + THROTTLE meter
│   ├── .car-label           .cl-pos / .cl-spd
│   ├── .hud-btn cluster     nitro · drift · brake · gas
│   └── .countdown .toast .drift-tag .wrong-way .police
├── #results                 .results-table · .rewards · streak · goal bar
└── #settings                sound bars · camera seg · controls tabs
```

Three decisions in there are worth taking:

1. **The menu is a rail, not a card.** ~380 px pinned left, the live 3D scene
   fills the remaining ~1220 px. The scene is the hero visual. No stock art, no
   illustration, no empty space.
2. **One primary action, always visible.** `चलो!` sits at the bottom of the
   garage and the dock, in the same place every time.
3. **The HUD lives in the corners.** Position/lap/time top-left, minimap
   top-right, buttons bottom-right. The middle of the screen — where the road
   is — stays empty.

## 1.2 What it gets wrong, and must not be copied

Measured from the stylesheet:

| Tell | Evidence |
|---|---|
| Gradient text logo | logo uses `--grad` as `-webkit-background-clip: text` |
| Gradient as a system | `--grad: linear-gradient(90deg,#ff4f8b,#ff8a3d)` reused on buttons, bars, borders |
| Glow instead of hierarchy | `box-shadow: 0 0 30px #ff4f8b73` on active nitro |
| Glass blur | `backdrop-filter: blur(3px)` on `#pause` and `#results` |
| Pulsing idle element | `animation: pulse` on the ready nitro button |
| Modal on arrival | `#daily` bonus dialog covers the scene before the player can race |

Its palette is also a Diwali campaign theme (`body.festive-diwali`,
pink/magenta/marigold, Bangers + Teko + Baloo 2). That is a seasonal skin for an
Indian city, not a Karachi identity. Taking it would be a reskin, not a design.

---

# Part 2 — What Karachi Rush looks like today

All numbers measured in the running app at 1600×900 via Chrome DevTools, plus a
second pass at 1366×728 (the actual window size on this machine).

## 2.1 The menu clips its own start button

```
.home-dock   box 540×860 at (80, 20)
             clientHeight 856
             scrollHeight 1020      → 164 px of content below the fold
             overflow-y: auto
```

`START RUSH`, the Race setup / Settings buttons, and the controls hint are all in
that clipped 164 px. `globals.css:1011` tries to fix this:

```css
/* START must never scroll away — pin it to the panel's visible bottom */
.menu-overlay .action-btn { position: sticky; bottom: 10px; }
```

It does not work. The sticky element's containing block is `.go-row`, which is
exactly as tall as the button, so sticky has no distance to travel. The button
scrolls away like everything else.

**The one action the screen exists for is invisible on first load.** That is the
single most serious defect in the UI.

## 2.2 There is no type system

| Element | Measured | Problem |
|---|---|---|
| `body` | `"Segoe UI"` | one system font for a game; no display face at all |
| `.game-title` | 44px / 900 / letter-spacing **4.4px** | stretched system bold, reads as a document heading |
| `.game-subtitle` | 13px / 700 / ls **2.86px** | same |
| `.section-label` | 11px / 900 / ls **3.08px** | the exact "uppercase tracked label" tell `unslop` names |
| `.select-card-desc` | 11px / 400 | below comfortable reading size |
| `.select-card-stats` | 11px / 800, `#2f9e44` | 11 px, and green used decoratively so it no longer means "good" |
| `.owned-tag` | 10px / 900 / dashed border | 10 px, and a dashed border reads as a placeholder |

Seven sizes, five weights, one family, and every piece of text is either 10, 11,
13 or 44 px. Nothing sits at a normal body size, so nothing looks intentional.

## 2.3 Every surface is the same surface

* `border-radius: 0px` on every element measured, with no exception anywhere.
* `box-shadow: 3px 3px 0 rgba(0,0,0,.55)` on the ticker bar, every chip, every
  vehicle card, both arrow buttons, the minimap, and the wrong-way banner.
* `1px solid #3a3a42` border on nearly all of them.

When every element has the same border, the same radius and the same shadow,
nothing on screen is more important than anything else. The eye has no entry
point.

## 2.4 Layout accidents

* **Garage grid:** `.compact { grid-template-columns: repeat(3, 1fr) }` with
  **4** vehicles → a full row of 3 and one orphan card on row 2. Visible in
  `rush-menu.png`.
* **Arrow buttons:** `.home-picker` holds `‹` and `›` in a flex row with nothing
  between them — two 38×38 buttons floating side by side under the coin bank,
  controlling a vehicle that is already shown in the grid below. They are
  orphaned controls.
* **HUD chips:** all at `x: 14`, widths `241 / 241 / 55 / 70 / 82 / 89` px. Seven
  different widths, left-aligned, stacked 8 px apart. The left third of the race
  view is a ragged column of boxes.
* **Nitro meter:** `.hud-bottom-bar` renders nitro as a 5 px-tall inline bar with
  no track, no label, and no ring. It is the most important mechanic in the game
  and the least visible element in the HUD.

## 2.5 Icons are emoji and box glyphs

```tsx
83:   sunset: "🌅 DUSK",
1790: {phase === "paused" ? "▶ RESUME" : "❚❚ PAUSE"}
1787: {soundEnabled ? "🔊 SOUND" : "🔇 MUTED"}
2019: {soundEnabled ? "🔊 SOUND ON" : "🔇 MUTED"}
2095: <div className="touch-btn nitro" …>⚡</div>
2097: <div className="touch-btn" …>🛑</div>
```

Six different visual languages in one interface: colour emoji, a geometric box
glyph, a triangle, and `‹ ›`. Each renders differently per OS and font. On the
`❚❚` pause glyph it reads as two vertical bars of the wrong weight next to text
that is 900-weight bold.

## 2.6 The stylesheet is five passes stacked on each other

`globals.css` (1,496 lines, 28.9 KB) contains:

* two `.wrong-way` blocks — line 1428 and line 1482, the second overriding
  `top: 30%` → `28%` and adding an infinite `count-pop` pulse;
* two `.minimap` blocks — line 1399 and line 1446;
* an **invalid nested rule** at 1446–1449:
  ```css
  .minimap {
    position: absolute;
    .minimap { top: 70px; right: 8px; width: 120px; height: 120px; }
  }
  ```
  A bare `.minimap` selector inside a declaration block is not valid CSS. The
  browser drops the whole rule, so the mobile minimap sizing never applies;
* **mojibake in 5 places** (`â€”` where `—` belongs, `Â·` where `·` belongs) plus
  a stray U+FEFF — the file has been through a bad encoding round-trip;
* section comments naming four different design intentions
  (`flat panel design system`, `autorush-style home dock & HUD chrome`,
  `premium micro-states (ui-ux-pro-max)`, `wrong-way warning`) — i.e. four
  separate agents appended to it without reading what was there.

Patching this further will not produce a system. The plan replaces the token
block and the component blocks, and deletes the appended layers.

## 2.7 The scene behind the UI is not doing its job

The whole argument for a left rail is that the 3D scene is worth 1200 px of
screen. Right now the scene is a green plane.

```
buildTrackMesh()   KarachiRushGame.tsx:725
  road verts: left/right pairs at pt.y + 0.05
  indices:    push(a, b, c, b, d2, c)      ← a=left_i, b=right_i, c=left_i+1

splineFrame()      normal = (-t.z, 0, t.x)
  → cross(b-a, c-a) = cross(-n, t) = −Y      → road faces point DOWN
  → MeshStandardMaterial default side: FrontSide → every road triangle is culled
  → you see the ground plane at y = −0.1 (TRACK.groundColor #4a6b52, green)
```

The curbs pass `+n` instead of `−n` in the same index order, which inverts the
result and makes them face **up** — which is why the render shows a red and a
cream ribbon with grass between them. The road is not dark asphalt; it is not
rendered at all. Meanwhile `roadNormals` are hard-coded to `(0,1,0)`, so the
lighting data claims the surface faces up regardless.

Second scene bug: `TRACK.points` have `y` from **−4 to 12**, the ground plane is
flat at `y = −0.1`, and nothing connects the two. The road floats up to 12 units
in the air with grass directly underneath. Buildings are placed at
`mesh.position.y = bh / 2` and landmarks at `y = 0`, both ignoring `pt.y`, so the
city sinks where the track crests and floats where it dips.

Third: `FogExp2(skyBlue, 0.0018)` against `scene.background = 0x7ec8e3` washes the
city to flat blue by ~400 m, which is why the far track reads as empty sky.

Fixing these is cheap (one inverted index order, one skirt mesh, one `pt.y`) and
it changes what the player sees more than any CSS on this list.

## 2.8 Leftovers from the site this repo was cloned from

`app/layout.tsx` still ships the source site's metadata:

```tsx
title: "Auto Rush 3D: Grand Prix | Auto-Rickshaw 3D Racing Game"
description: "…through Gurugram Cyber City, Karachi Grand Prix, and Delhi
              Heritage Circuit…"
```

The browser tab says Auto Rush 3D. The description advertises three circuits
that do not exist. This is the same drift the `egm-drift-report` run already
logged, in the one place a player is guaranteed to see it.

---

# Part 3 — Findings, ranked by damage

| # | Finding | Evidence | Cost to fix |
|---|---|---|---|
| 1 | Menu clips `START RUSH` (164 px) | `scrollH 1020` vs `clientH 856` | M |
| 2 | Road mesh is backface-culled, scene reads as a green field | index order vs `normal = (-t.z,0,t.x)` | **S** |
| 3 | No type system; everything 10/11/13/44 px Segoe UI | measurements §2.2 | M |
| 4 | No hierarchy; identical border + shadow on every surface | §2.3 | M |
| 5 | HUD is 7 ragged chips; nitro is a 5 px bar | `x=14`, widths 55–241 | M |
| 6 | Emoji and box-glyph icon set | 6 glyphs, 6 styles | S |
| 7 | Garage 3×4 grid orphans one card | `.compact` + 4 items | S |
| 8 | Road floats up to 12 u above a flat ground plane | `TRACK.points.y` −4…12 | M |
| 9 | Stylesheet has duplicate + invalid rules and mojibake | §2.6 | M |
| 10 | Layout metadata still advertises Auto Rush 3D | `app/layout.tsx` | S |
| 11 | Orphaned `‹ ›` vehicle buttons | `.home-picker` | S |
| 12 | Vehicle/difficulty cards are `div`s with `onClick` | `KarachiRushGame.tsx:1890` | S |

---

# Part 4 — The Direction (unslop, five lines)

Written before any code, from the product itself rather than from autorush.

> **Product** — A 3D street race through a real city, driven by people who drive
> for a living. The prize is coins, not a trophy.
>
> **Character** — Karachi swagger: hand-painted signage, truck-art borders,
> bilingual shorthand, working-class pride. Loud but not glossy. No esports
> chrome, no glass, no glow.
>
> **World** — The track already in the build: Sadar, II Chundrigar, Clifton,
> Chaar Minar, Empress Market, the sea bend. The UI's job is to stay out of its
> way, then frame it like a poster.
>
> **Moments** — The countdown. The drift chain that keeps climbing. Crossing the
> line and watching the coin total land. Those three get all the motion budget;
> everything else is instant.
>
> **Signature** — A painted border: a 6 px strip of marigold / sindoor-red /
> cream running down the rail's inner edge, the way a rickshaw's panel is
> edged. One per screen. Plus one Urdu word — `چلو` — on the button that starts
> the race.

What each line rules out, concretely:

* no gradient text, no gradient buttons, no `--grad` variable;
* no `backdrop-filter`, no `box-shadow` with blur > 0;
* no colour emoji anywhere in the UI;
* no per-item spring stagger on load;
* no accent colour used as a background fill;
* no more than three marigold elements visible on any screen.

---

# Part 5 — Design system

## 5.1 Spacing

One scale: `4 8 12 16 20 24 32 40 48 64`. No arbitrary values. Groups of related
things get 8; sections get 24; the rail's edge padding is 24.

Row heights: 32 for segmented controls, 40 for list rows, 44 for touch targets,
56 for the primary action.

## 5.2 Colour

Deep ground, cream text, two accents, one of which is decorative only.

```css
--ground:      #120d18;  /* page + rail base, warm near-black aubergine   */
--panel:       #1b1424;  /* raised surface                                */
--panel-2:     #241a30;  /* inputs, inactive segments                     */
--edge:        #3a2e46;  /* 1px hairlines only                            */
--cream:       #f7ecd9;  /* primary text                                  */
--cream-dim:   #b9a992;  /* secondary text                                */
--marigold:    #ffb020;  /* the accent: CTA, active state, one underline  */
--sindoor:     #e0392b;  /* decorative + danger, never body text          */
--jade:        #2bb673;  /* owned / success                               */
--shadow:      6px 6px 0 #0a0710;  /* one element per screen only        */
```

Contrast, verified with a WCAG 2.2 calculator:

| Pair | Ratio | Verdict |
|---|---|---|
| `--cream` on `--ground` | 16.38:1 | AAA |
| `--cream-dim` on `--ground` | 8.35:1 | AAA |
| `--marigold` on `--ground` | 10.47:1 | AAA |
| `--ground` on `--marigold` (CTA label) | 10.47:1 | AAA |
| `--sindoor` on `--ground` | **4.37:1** | **AA normal text FAIL** |

`sindoor` therefore never carries text below 24 px. It is for the painted
border, the curb stripes, and the wrong-way banner (large text on a filled
field), nothing else.

`#f2b632` becomes `#ffb020` — same family, but the current yellow is used as a
*background* on the ticker and the chips, which makes the accent into wallpaper.
Hotter and used three times beats duller and used everywhere.

## 5.3 Type

Three faces, three jobs. Loaded with `next/font/google` (self-hosted fallback in
`public/fonts/` if the build cannot reach Google — both are OFL).

| Role | Face | Size / weight / tracking |
|---|---|---|
| Wordmark | **Bungee** | 40px / 400 / 0 |
| Section labels | **Teko** | 15px / 600 / 0.04em, uppercase |
| Body | Teko | 14px / 400 / 0.01em |
| HUD numerals | Teko | 26px / 600, `font-variant-numeric: tabular-nums` |
| Speed readout | Teko | 56px / 600, tabular |
| Urdu accent | **Noto Naskh Arabic** | 18px / 400 |

Teko's tall x-height and condensed width fit a racing HUD and a narrow rail at
the same time. Bungee is sign-painter lettering — the closest free face to
hand-lettered rickshaw panels — and it is used **once per screen**, on the
wordmark.

Body text goes 11 px → 14 px. That single change is most of why the current
screen reads as a wireframe.

## 5.4 Surfaces and elevation

* Radius: `999px` pills (wallet chips), `10px` cards, `8px` buttons, `0` panels
  (panels are flat and edge-to-edge, so radius would read as a bug).
* Borders: `1px solid var(--edge)` for separators, `2px solid var(--cream)` for
  the selected card, `2px solid var(--ground)` on the CTA only.
* Shadow: `--shadow` on **one** element per screen — the primary action. Nowhere
  else. Depth comes from the panel/ground contrast instead.
* No `backdrop-filter` in the codebase.

## 5.5 Icons

Six inline SVGs, 20×20, `stroke-width: 1.75`, `stroke: currentColor`,
`aria-hidden` on the svg and an `aria-label` on the button:

`coin` · `bolt` · `pause` · `play` · `speaker` · `speaker-off` · `warning`

Defined once in a `components/game/icons.tsx` file. No dependency, no icon font,
no emoji.

## 5.6 Motion

* Rail entrance: 180 ms `ease-out`, `translateX(-12px)` + opacity. One animation
  for the whole rail, not eight staggered children.
* Card hover: 90 ms `ease`, border to marigold. No lift, no shadow growth.
* Press: `translateY(2px)`, 60 ms.
* The three moments keep their punch: countdown scale, drift popup, coin total
  count-up on results. These encode state, so they earn the motion.
* `prefers-reduced-motion: reduce` disables every transform, keeps opacity.
* Delete `--pop-spring: cubic-bezier(0.22,1.4,0.36,1)`. Overshoot on a menu that
  has no physics is decoration.

---

# Part 6 — Screen by screen

## 6.1 Menu → a left rail

```
┌──────────────────────────┐
│ ● 1,240        🔥 4      │  wallet strip, 40px pills
│                          │
│ KARACHI RUSH             │  Bungee 40, cream
│ SADAR · CHUNDRIGAR · CLIFTON │  Teko 15, marigold
│                          │
│ RICKSHAW                 │  label
│ ┌────────┐ ┌────────┐    │
│ │ BABA   │ │ QUEEN  │    │  2×2 grid, 172×96 cards
│ │ 42 km/h│ │ 2,500  │    │
│ └────────┘ └────────┘    │
│ ┌────────┐ ┌────────┐    │
│ │ HASSAN │ │ BHATTA │    │
│ └────────┘ └────────┘    │
│                          │
│ EASY │ MED │ HARD        │  segmented, 32px
│ 1 LAP │ 3 │ 5            │  segmented, 32px
│                          │
│ ▐ START RUSH      چلو    │  56px, marigold, the only shadow
│                          │
│ Race setup    Settings   │  36px text buttons
│ W ↑ S ↓ A D · SPACE · N │  11px cream-dim, 2 lines max
└──────────────────────────┘
  400px wide, full height       rest of screen: live 3D scene
```

**Height budget at 400×900**, content width 352:

| Block | Height |
|---|---|
| top padding | 24 |
| wallet strip | 40 |
| gap | 16 |
| wordmark + district line | 68 |
| gap | 24 |
| `RICKSHAW` label | 18 |
| 2×2 cards + 8 gap | 200 |
| gap | 20 |
| difficulty segmented | 32 |
| laps segmented | 32 |
| gap | 20 |
| CTA | 56 |
| gap | 12 |
| setup / settings row | 36 |
| gap | 12 |
| controls hint (2 lines) | 34 |
| bottom padding | 24 |
| **total** | **668** |

668 of 900 — 232 px of slack. At 1366×728 the rail still fits with 60 px spare,
which means **no internal scrolling at any desktop size**. That is the fix for
finding #1, achieved by deleting content rather than by scrolling it.

What gets deleted to make room:

* the crawl ticker (33 px) — it repeats the district names already under the
  wordmark, and it is a moving element with no information in it;
* the orphaned `‹ ›` pair — the 2×2 grid already shows every vehicle;
* the separate RACE SETUP sheet's LAPS and TIME rows, folded into the rail as
  segmented controls (the sheet keeps only camera/sound).

`globals.css:1011`'s sticky hack is removed with the clipping it was written for.

## 6.2 Vehicle card

```
┌──────────────────┐
│ BABA AUTO        │  Teko 15/600, cream
│ 42 km/h          │  Teko 13, cream-dim + unit
│                  │
│ EQUIPPED         │  jade 11/600, or "2,500" + coin glyph
└──────────────────┘
```

* Selected: `2px solid var(--marigold)`, `ground` text.
* Locked: `panel-2` fill, `cream-dim` name, price in marigold with a coin glyph,
  `cursor: not-allowed`, `aria-disabled`.
* Rendered as `<button type="button">` so Tab reaches it and Enter selects it.
* Price gets a thousands separator: `2,500`, not `2500`.
* The old `TOP 42 KM/H` green stat line becomes `42 km/h` in cream-dim; the
  decorative green is what made it stop meaning anything.

## 6.3 HUD → three corners, empty middle

```
┌─────────────────┐                          ┌──────────┐
│ 3rd  / 8        │                          │ minimap  │
│ LAP 1 / 3       │                          │  SADAR   │
│ 0:36.2          │                          └──────────┘
│ BEST 0:34.8     │                          │ 1,240 ●  │
└─────────────────┘
                                                
                                             ┌────┐
   1 0 2  km/h          [drift ×2.4]         │ ⚡ │ 64 ring
                                             ├────┤
                                             │ ≋  │ 48
                                             ├────┤
                                             │ ❚❚ │ 40
                                             └────┘
```

* **Top-left, one panel** (168 px, `panel` fill, 1 px edge, 10 px radius): a
  4-row stack. Position `3rd` at 26 px with `/8` at 14 px dim. `LAP 1/3`.
  `0:36.2`. `BEST 0:34.8`. Replaces seven chips.
* **Top-right**: minimap 120×120 with a 1 px edge, the district name centred
  under it, and the coin count under that. Not a chip — a small instrument.
* **Bottom-right**: nitro as a 64 px ring whose arc is the charge level
  (SVG `stroke-dasharray`), with a bolt glyph in the middle. `DRIFT` 48 px
  square and `PAUSE` 40 px square beneath it. These are the only lit surfaces in
  the HUD.
* **Bottom-left**: speed at 56 px tabular with `km/h` at 13 px, and the drift
  multiplier as a small marigold pill that appears only while `drift > 0`.
* **Removed from the HUD**: `TRAPS`, `STEPS`, `DIFF` chips, the 5 px nitro bar,
  the `chip-score` box. Traps, steps and score move to results, where a player
  can actually read them.
* Centre stays clear. Countdown, lap banner, wrong-way and drift popup remain
  centred and transient — they are allowed there because they are the moment.

## 6.4 Results

Structure borrowed from autorush's `.results-table` + `.rewards`:

* Headline: `CHAMPION` or `3RD PLACE`, Bungee 32, marigold.
* **Rankings first**, above the stats — the player wants to know where they
  finished before what they earned. All 7 entries; the current code slices the
  6-entry state to 5 in the UI and silently hides rivals.
* Rewards as a list of labelled rows (`Coins`, `Drift bonus`, `Clean lap`,
  `Difficulty ×1.2`) summing to one large total, then the new bank balance.
* Stats grid becomes 4 columns × 2 rows of `value / label`, values at 22 px
  tabular, labels at 11 px `cream-dim`. `RACE SEC` → `RACE TIME` showing
  `1:42.6` through `fmtTime`, not `103`.
* Two buttons: `RACE AGAIN` (primary) and `MAIN MENU` (ghost).

## 6.5 Pause and Settings

* Pause: 120 px of content, centred, `panel` fill, `2px cream` edge, no blur.
  `❚❚ PAUSED`, the vehicle and lap line, `RESUME`, `MAIN MENU`.
* Settings becomes a real panel with rows, not a stack of `.action-btn`s:
  `SOUND` with a 3-segment `OFF / LOW / FULL` (the state is currently a boolean,
  so `soundEnabled` maps to OFF/FULL and LOW is left out — see Open Questions),
  `CAMERA` is out of scope (no camera mode exists in the engine), `CONTROLS`
  as a two-column `dl` with `<kbd>` chips.
* `🔊 SOUND ON / 🔇 MUTED` becomes `speaker` / `speaker-off` SVG + `SOUND ON` /
  `MUTED`.

## 6.6 Loading

Keep the drawn loading screen — it is one of the few things that already works —
and change three things: wordmark to Bungee, subtitle to Teko at 15 px (currently
13/700/2.86 px tracking), and replace the three `.coin-dot` pulses with a
single 180 px progress bar in marigold on `panel-2`. The dots currently animate
with no relationship to load progress.

---

# Part 7 — The world, so the rail has something to frame

Ordered by visual return per line of code.

1. **Reverse the road index order.** `push(a, c, b, b, c, d2)` instead of
   `push(a, b, c, b, d2, c)`. One line, restores the asphalt. Verified against
   `splineFrame`'s `normal = (-t.z, 0, t.x)`: the current order yields a face
   normal of `−Y`, which `FrontSide` culls.
2. **Give the road a base.** Build a skirt from each curb's outer edge down to
   `y = -0.1` in `roadColor` darkened 20%, so the elevated parts of the spline
   read as embankment instead of floating ribbon.
3. **Respect `pt.y` when placing buildings and landmarks.** `placeAt` and the
   90-building loop both pin `y` to 0/`bh/2` while the track runs from −4 to 12.
4. **Warm the ground.** `#4a6b52` (golf green) → `#6f6046` (Karachi dust). The
   asphalt road will then sit against a neutral instead of competing with grass.
5. **Thin the fog.** `FogExp2(sky, 0.0018)` → `0.0011`, and sunset 0.0025 →
   0.0016. The city should fade, not vanish at 400 m.
6. **Balance the light.** `AmbientLight(0.95)` + `DirectionalLight(1.6)` blows
   out every surface. Replace with `HemisphereLight(sky, ground, 0.85)` +
   `DirectionalLight(1.15)` and keep the existing shadow camera.
7. *Optional:* a large inverted sphere with a 3-stop vertical gradient for the
   sky, so `scene.background` stops being a flat hex.

Items 1–6 are mechanical and independently verifiable by screenshot. Item 7 is
optional and cut first if the schedule slips.

---

# Part 8 — Copy pass

| Now | Change | Why |
|---|---|---|
| `☀ DAY` / `🌅 DUSK` / `🌙 NIGHT` | `DAY` / `DUSK` / `NIGHT` segmented | emoji |
| `❚❚ PAUSE` | `pause` icon + `PAUSE` | glyph weight clash |
| `START RUSH ▶` | `START RUSH` + `چلو` | the arrow is noise; the Urdu is the signature |
| `TOP 42 KM/H` | `42 km/h` | shouting in a stat |
| `BUY 2500` | `2,500` + coin glyph | thousands separator |
| `RACE SEC 103` | `RACE TIME 1:42.6` | unit mismatch with every other time on screen |
| `TRAPS DODGED` | `TRAPS` | the label is longer than the value |
| `LOADING DISTRICTS…` | keep | already good |
| `SADAR — II CHUNDRIGAR — CLIFTON` | `SADAR · CHUNDRIGAR · CLIFTON` | em dash at 12 px reads as a hyphen |

Also: `app/layout.tsx` metadata rewritten to Karachi Rush, and `<span lang="ur">`
on the Urdu wordmark.

---

# Part 9 — Technical plan

## 9.1 Files

| File | Action | Scope |
|---|---|---|
| `karachi-rush/app/globals.css` | **rewrite** | Delete lines 11–25 (tokens) and the appended layers at 850–1496. Rebuild on the new token set. Keep the working blocks: `#game-container`, `#viewport`, `.screen-overlay`, `.countdown`, `.lap-banner`, `.drift-popup`, `.mobile-controls`, `.touch-btn`. Target ~1,100 lines with no duplicate selectors. |
| `karachi-rush/app/components/KarachiRushGame.tsx` | **edit** | Menu JSX 1850–1961 → rail. HUD 1748–1840 → three corners. Results 2045–2086. Pause 2033–2042. Settings 2012–2030. Loading 1731–1740. Scene: line 757 (index order), 712–719 (ground), 765 (road material), 825–860 (`placeAt` + building `y`), 678–687 (fog/light), 1064–1090 (`applyTimeMode` fog values). |
| `karachi-rush/app/components/game/icons.tsx` | **create** | 7 SVG components, ~90 lines. |
| `karachi-rush/app/layout.tsx` | **edit** | Metadata + `next/font` setup. |
| `karachi-rush/app/components/game/data.ts` | **edit (1 value)** | `TRACK.groundColor` only. Nothing else in this file changes. |

No new dependencies. `three`, `next`, `react` versions untouched.

## 9.2 Order of work

The nine `unslop` passes in order, each one shippable and screenshot-checkable:

1. **Spacing** — rail geometry, 400 px, padding 24, the height budget.
2. **Colour** — tokens, surfaces, the three-accent rule.
3. **Icons** — `icons.tsx`, delete every emoji.
4. **Copy** — the table in Part 8.
5. **Type** — `next/font`, the scale in §5.3.
6. **Layout** — 2×2 garage, segmented controls, HUD corners, results order.
7. **Details** — focus rings on every control, `aria-label`, keyboard-reachable
   cards, `aria-live` on the lap banner and countdown, thousands separators.
8. **Visuals** — the scene fixes in Part 7 (this is where the "hero visual"
   comes from; no image generation needed, the scene is the visual).
9. **Motion** — the rail entrance, hover/press, reduced-motion sweep.

---

# Part 10 — Alternatives considered

### A. Literal autorush reskin (pink/magenta on deep purple, Bangers + Teko)

* **Pros:** closest possible reading of "make it like this"; the reference is
  visually proven; no design decisions required.
* **Cons:** it is a Diwali campaign theme for an Indian city; the palette
  duplicates a competitor's brand; `unslop`'s own reference guidance says take a
  reference's qualities, never its subject, palette or layout. Two rickshaw
  racing games in the same palette is the opposite of a signature.
* **Rejected because:** it answers "copy" when the request was "improve on".

### B. Keep the centered card, just make it scroll properly

* **Pros:** smallest diff; no JSX restructuring; the clipping bug disappears.
* **Cons:** leaves 1,200 px of screen showing a 3D scene nobody is looking at,
  keeps the menu in the middle of the road, and keeps a scroll container on a
  screen whose only job is one button.
* **Rejected because:** scrolling to reach "start" is a worse experience than
  not having that much content.

### C. Full-screen menu with a blurred scene backdrop

* **Pros:** simplest layout, most room for content, common in web games.
* **Cons:** hides the only asset that makes this game look expensive, and blur is
  an explicit `unslop` sign.
* **Rejected because:** the scene is the hero.

---

# Part 11 — Counter-arguments and risks

**"A 400 px rail leaves too little room for a garage of four vehicles."**
Correct at three columns. It works at 2×2 with 172 px cards, which is the layout
in §6.1. If a fifth vehicle is added, the grid becomes a horizontally scrolling
strip, not a taller grid.

**"Deleting the ticker removes personality."** The ticker is 33 px of moving text
that repeats the district line directly above it. The personality budget moves
to the painted border and the Urdu wordmark, which sit still and read instantly.

**"Bungee and Teko are both loud faces."** They are used at different jobs and
never in the same block: Bungee for one wordmark per screen, Teko for everything
else. The risk is real and the mitigation is a hard rule — Bungee appears once.

**"Urdu on the start button could fail to render."** `Segoe UI` on Windows ships
Naskh coverage, and `next/font` provides a subsetted `Noto Naskh Arabic`. If both
fail, the fallback is Latin-only `START RUSH` and nothing breaks structurally.
This is the one element in the plan that is a genuine cultural bet — see Open
Questions.

**"Changing scene lighting risks the gameplay read."** Materials on the player
rickshaw and the rivals are untouched; only the world lights move. Verification
is a screenshot of the race at day, dusk and night, checked for rival
visibility and curb contrast.

**"Rewriting globals.css could regress the screens that already work."** The
blocks kept are listed by line range in §9.1, and the mobile touch controls are
explicitly preserved. Verification includes a 390×844 pass.

**Biggest honest risk:** this is a large diff across three files, done without a
test suite. Mitigation is phase-by-phase screenshots at four viewports plus
`npm run lint` and `npm run build` at each checkpoint, and a `__rush` smoke test
that the debug API still exposes the same 9 keys.

---

# Part 12 — Phased implementation

| Phase | Content | Verification |
|---|---|---|
| **0. Foundation** | Road index fix, `pt.y` placement, skirt, ground colour, fog, lights; delete duplicate/invalid CSS; fix layout metadata | race screenshot: asphalt visible, no floating road, city readable at 200 m |
| **1. Tokens & type** | New `:root`, `next/font` (Bungee / Teko / Noto Naskh), spacing scale, delete `--pop-spring` | computed styles: no 11 px body text, no blur, no gradient |
| **2. Menu rail** | Rail JSX + CSS, 2×2 garage, segmented controls, CTA with shadow, delete ticker and arrows | `scrollH === clientH` at 1600×900, 1366×728, 1280×720 |
| **3. HUD** | 4-row stack, minimap block, nitro ring, speed block, remove 4 chips | race screenshot; nitro arc moves when N is held |
| **4. Results / pause / settings** | Rankings first, rewards list, 4×2 stats, settings rows | reach the results screen via `__rush.start()` + `__rush.forceLap()` per lap, screenshot |
| **5. Icons & copy** | `icons.tsx`, copy table, `kbd` chips | zero emoji in JSX; every button has an accessible name |
| **6. Motion & responsive** | Rail entrance, hover/press, reduced motion, 390×844 | reduced-motion screenshot static; mobile layout has no overlap |

Phases 0 and 2 carry the value. If only one ships, ship phase 0 — a working
asphalt road under a clipped menu is still worse than a green field under a
menu that fits, but the scene fix is the cheaper of the two.

---

# Part 13 — Verification plan

Measured, not "looks better":

| Check | Pass condition |
|---|---|
| Menu clipping | `scrollHeight <= clientHeight` on `.home-dock` at 1600×900, 1366×728, 1280×720 (desktop rail never scrolls; the ≤700 px breakpoint becomes a bottom sheet and may scroll) |
| Start visible | `getBoundingClientRect().bottom <= innerHeight` for the CTA at all four sizes, including 390×844 |
| Type floor | no rendered text below 11 px; body text ≥ 14 px |
| Accent discipline | ≤ 3 elements with `--marigold` on the menu; exactly 1 `box-shadow` with blur `0` and spread > 0 |
| No gradients | `grep -c "gradient" globals.css` returns only the painted-border strip |
| No blur | zero `backdrop-filter` |
| No emoji | zero codepoints in `U+1F300–U+1FAFF` and `U+2600–U+27BF` in `KarachiRushGame.tsx` |
| Contrast | `#f7ecd9`, `#b9a992`, `#ffb020` on `#120d18` ≥ 4.5:1 (verified above) |
| Keyboard | Tab reaches every control; vehicle cards focusable; visible focus ring |
| Scene | race screenshot shows dark asphalt between the white lines at day, dusk and night |
| Road geometry | no point of the road surface is more than 1 u above ground without a skirt beneath it |
| Build | `npm run lint` and `npm run build` clean |
| API | `Object.keys(window.__rush)` still returns the same 9 keys; `start`, `warp`, `forceLap` still work |

Screenshots at each checkpoint, read back and compared against the previous one.

---

## Open questions

1. **Urdu `چلو` on the primary button — include or drop?** It is the strongest
   local signal in the plan and the only element that depends on Arabic-script
   rendering. Include, or keep the button Latin-only?
2. **Sound control:** `soundEnabled` is a boolean in state. A 3-segment
   `OFF / LOW / FULL` needs an engine change (volume level). Out of scope per
   §"What this plan is not", so the plan ships a 2-state toggle — or the state
   change is approved as a small exception.
3. **Lap selector 5 vs 3 districts:** laps 4 and 5 both display `CLIFTON`
   (`DISTRICTS[Math.min(lap-1, 2)]`). Leave, or restrict the selector to 1/3?

---

## Additional resources

* `2026-11-07_DRIFT_REPORT.md` — verified doc-vs-code divergences already logged
* `C:\Users\Hp\AppData\Local\Temp\opencode\unslop-ref\autorush-live.png` — live reference
* `C:\Users\Hp\AppData\Local\Temp\opencode\unslop-ref\autorush.css` — 151 KB reference stylesheet
* `C:\Users\Hp\AppData\Local\Temp\opencode\unslop-ref\rush-menu.png` — current menu, clipped
* `C:\Users\Hp\AppData\Local\Temp\opencode\unslop-ref\rush-hud.png` — current HUD, green road
* `unslop` — Damir Sokolovsky, CC BY 4.0

## Future improvements

* **The idea:** a `garage` full-screen view with the rickshaw rendered large,
  reached by tapping the selected vehicle. autorush has one; this plan folds the
  garage into the rail instead, which is the right call for four vehicles and the
  wrong call at twelve.
* **The idea:** district-themed rail accent — marigold in Sadar, jade on the sea
  bend, sindoor at night — so the menu's one accent tracks the race's progress.

---

*Drafted with EGM · direction from `unslop`*
