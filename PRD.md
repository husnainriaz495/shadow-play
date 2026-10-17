# Shadow Play — Product Requirements Document

> **For Claude Code:** this file is the single source of truth for the game. Build it milestone by milestone (section 9), in order. After each milestone: run `npm run dev`, check every acceptance item, then commit with a clear message. Keep code simple and well commented — the team are beginners and will read it. **Write all code from scratch. Never copy code from an existing open-source game** (that is instant disqualification in this jam).
>
> **Companion files (each is the single source for its topic):** `ASSETS.md` lists every image, sound, music and font file with its key and path. `CODE_RULES.md` says how the code is structured (folders, patterns, no magic numbers). `SECURITY.md` lists the safety rules for the repo and the deployed game. `NOTES.md` is the shift handover note. If they ever disagree with this file on their own topic, they win.

---

## 1. One-line pitch

**A shadow-puppet show lit by one melting candle. Move the candle closer and your shadow grows huge; move it away and you shrink. The candle is your power and your clock.**

## 2. Context (the jam)

| Item | Detail |
| --- | --- |
| Event | NASCON vibe-coding game jam |
| Themes | Fire, Shadow, Time (we use all three; 10 marks are for multi-theme use, and each theme must be in the core, not just decoration) |
| Team | 2 beginners, working in shifts on one GitHub repo |
| Time | ~48 hours. Repo started Fri 16 Oct 2026, 21:07 (PKT, UTC+5) |
| **Deadline** | **Sun 18 Oct 2026, 09:30 AM** (Day 3, confirmed from the official handbook). Aim to be submitted by 09:00 |
| Submit | A **Google Drive trailer link** and a **PUBLIC GitHub repo with all code and assets**. A deployed URL is optional |
| First-round judging | **Only the 3-minute trailer.** At least **2 minutes must be real screen-recorded gameplay** (judges may recreate any moment, so it must be genuine), and the trailer **must show how each theme is used** |
| Second round | The **top 5 trailers** get their games **played by the judges**: the build must run start to "Fin." without crashing |
| Rules | Any engine. Free/AI/self-made assets OK (credit them). Reskins and copied game code are not allowed. |

### 2.1 Scoring (official handbook)

| Criterion | Weight | What earns it for us |
| --- | --- | --- |
| **Themes** | **30%** | |
| · Core integration | 15 | Each theme drives a mechanic: Shadow = the sizes, Fire = the candle + burning paper, Time = the wax |
| · Multi-theme synergy | 10 | **"Bigger shadow = faster candle burn"** must be *visible* on screen, not just true in code (4.3.1) |
| · Atmosphere | 5 | Candlelight, paper, crackle, curtain, act cards |
| Gameplay feel | rest | Puppet rig, coyote time, size-change juice |
| Visual polish | rest | Palette, light pool, transitions |
| Audio | rest | Music, crackle, one sound per action |
| Innovation | rest | Size = distance from the candle |
| Stability | rest | Feature freeze, full playthrough on the final build, no console errors |
| Completeness | rest | Title → every act → "Fin." with no dead ends. **3 polished acts beat 5 rough ones** |
| Trailer quality | rest | 8+ hours set aside for it (section 11), shot list written before the freeze |

The handbook gives the theme split; the other criteria share the remaining 70% (weights not given).

## 3. Theme integration (show this in the trailer)

| Theme | Core mechanic | Look and sound | Story |
| --- | --- | --- | --- |
| **Shadow** | You *are* a shadow on a paper screen. Your size depends on the light. | Pure black silhouettes on warm paper | You are the shadow-puppet of an old puppeteer |
| **Fire** | The candle is your tool: its distance sets your size (Tiny / Normal / Huge). Flames burning through the paper destroy the stage itself. | Flickering orange glow, crackle, smoke | The puppeteer's very last candle |
| **Time** | The candle melts as you play. Wax is the timer; being Huge melts it faster (shown on screen, 4.3.1). When it dies, the curtain falls. | A wax meter shaped like a candle that visibly burns faster when you are big; light dims as wax runs low | The final show must finish before the candle dies |

**Synergy line (use in trailer):** *"The fire gives you shape. Time takes it away."*

## 4. Core gameplay

### 4.1 The world

- Side view, 2D platformer, 1280×720.
- The whole screen is a **paper theatre screen** lit from behind by a candle. Everything visible is a black silhouette: you, the scenery, enemies.
- **Scenery is painted onto the paper**, so it never changes size. **Only you, the puppet, are held between the candle and the screen**, so only your shadow changes size. (This is the in-world reason only the player scales.)

### 4.2 Player: three shadow sizes

The player chooses how close the candle is, in three steps. The shadow smoothly tweens between sizes (~200 ms).

| Size | Candle | Scale | Move speed | Jump velocity | Can do | Wax drain |
| --- | --- | --- | --- | --- | --- | --- |
| Tiny | Far | 0.5 | 260 | −430 | Fit through 1-tile gaps, walk under low walls | ×0.75 |
| Normal | Middle | 1.0 | 220 | −540 | Balanced | ×1.0 |
| Huge | Close | 2.0 | 160 | −680 | Push heavy crates, reach high ledges, swat moths, press heavy switches | ×2.0 |

- **Growing must be blocked if there is no room**: before scaling up, test the new body rectangle (anchored at the player's feet) against solid tiles; if it overlaps, refuse, shake the player slightly and play a "squeeze" sound.
- Scaling keeps the feet anchored (the player grows upward, not into the floor).
- Base player body is 1 tile wide × 2 tiles tall (40×80 px at Normal).
- **The puppet is a jointed cut-out**, like a real shadow puppet. Full spec in 4.2.1.

#### 4.2.1 Puppet rig and joint motion (`objects/PuppetRig.js`)

**Structure**
- A `Phaser.GameObjects.Container` that follows an **invisible Arcade physics body**. The rig is **visual only**: limbs never collide, never change the hitbox, and never affect movement.
- Five parts: `puppet_body`, two `puppet_arm`, two `puppet_leg` (the same arm and leg image reused for both sides).
- **Pivot points:** each limb's origin is at its joint, at the top-centre of the image (`setOrigin(0.5, 0.06)`). **Mount points** on the body (left/right shoulder, left/right hip) are pixel offsets in `CONFIG.rig.mounts`, so they can be adjusted when the real art arrives without touching code. With `DEBUG` on, draw a small dot at each joint to check alignment.
- **Draw order (back to front):** far leg, far arm, body, near leg, near arm. All parts are black, so the order only matters at the edges where they overlap.
- **Puppet rods:** a thin line (2 px, black, 60% alpha) from each hand going up and off the top of the screen, drawn every frame in code. The rods follow the hands and sell the "puppet on a screen" look.
- **Facing:** facing left flips the container (`scaleX = -1`), with a 60 ms squash on turn so it doesn't snap.
- **Size states:** the whole rig scales with the size state around the feet (container origin at the feet). After a size change, the limbs overshoot and wobble for about 0.3 s (spring, see below).

**Motion model: target angles + springs (no physics engine)**
- Each pose defines a **target angle** for every joint. Every frame, each joint moves toward its target with a damped spring: `vel += (target - angle) * stiffness * dt; vel *= damping; angle += vel * dt`. This gives natural lag, overshoot and follow-through for free, and makes switching poses smooth. `stiffness` and `damping` are in `CONFIG.rig`; it must use `delta`, so it's frame-rate independent.
- **Angle limits:** clamp each joint so it never bends unnaturally (arms −160° to +60°, legs −50° to +50°; values in `CONFIG.rig.limits`).
- **Walk cycle phase is driven by distance moved, not time** (`phase += |vx| * dt * CONFIG.rig.strideFactor`), so the feet don't slide on the ground at any speed or size.
- Legs swing opposite to each other; each arm swings opposite to the leg on the same side.

| Pose (chosen from the player's state) | Legs | Arms | Body |
| --- | --- | --- | --- |
| Idle | Straight, tiny ±2° alternating sway | Hanging, ±3° slow sway | Slow breathing bob (±1 px, 2 s) |
| Walk / run | ±25° swing by distance | ±15° swing, opposite to legs | Small bob twice per stride; lean 4° forward |
| Jump (rising) | Near leg tucked forward 30°, far leg back 15° | Both arms up (−140°) | Stretched 6% taller |
| Fall | Both legs reaching down and slightly apart (±10°) | Arms out to the sides (−80°) | Normal |
| Land | Quick bend, then back to idle | Arms drop | Squash 10% for 100 ms |
| Push crate (Huge, touching a moving crate) | Walk cycle at half the stride length | Both arms forward and straight (−90°) | Lean 12° forward |
| Squeeze (growing refused) | Brief shiver | Arms in tight | Horizontal squash-wobble |
| Hurt | Knock-back kick | Arms flung back | Flash, 6° tilt away from the hit |
| Swat (Huge hits a moth) | No change | Near arm swings fast from −150° to +40° | No change |
| Gust (draft forcing Tiny) | Braced apart | Arms up shielding the head | Lean into the wind 10° |
| Candle out / death | Go limp: every joint's target becomes "hanging", with low damping so limbs swing loosely | Hanging | The rig drops 8 px, then the curtain closes |
| Final bow (ending) | Straight | Near arm sweeps across the chest | Body bends forward 35° and back, twice |

**Acceptance**
- No foot sliding at any size or speed.
- Pose changes are always smooth, never snapping.
- Joints line up with the real art just by editing `CONFIG.rig.mounts`.
- 60 fps, with no objects created per frame (the rods are redrawn on one reused `Graphics`).

### 4.3 Candle wax (the timer)

- Each level starts with `wax = 100`.
- Wax drains at `BASE_DRAIN` per second × the size multiplier above. Tune `BASE_DRAIN` so a level takes ~60–120 s at a relaxed pace (start with 100 / 120 s).
- **Wax drops** (pickup `w`) restore +20 wax.
- As wax falls below 30, the screen's glow dims and the flame flickers harder (pure visual warning).
- `wax = 0` → the candle goes out → the curtain closes → restart the level.

#### 4.3.1 Making "bigger shadow = faster burn" visible (added 2026-10-17)

This is the multi-theme synergy (10 marks) and it must read in a trailer clip **with no voice-over**. The drain is already right in code (120 s Normal, 60 s Huge, 160 s Tiny); the job is to make it obvious to someone watching:

- **HUD flame scales with the burn rate:** small and calm when Tiny, taller and flickering hard when Huge (eased with the size tween).
- **Wax drips run down the HUD candle** at a rate tied to the size multiplier: an occasional drip when Tiny, a steady stream when Huge.
- **A burn-rate tag next to the candle** (`×0.75`, `×1`, `×2`) that pops and pulses when the size changes, in the accent colour when Huge.
- The **light pool already grows and shrinks** with size (`SizeEffects`); keep it.
- All numbers in `CONFIG.wax` / `CONFIG.hud`; nothing reacts except to `SIZE_CHANGED` and `WAX_CHANGED`.

Acceptance: a person who has never seen the game watches a 5-second clip of Normal → Huge and can say "the candle burns faster when the puppet is big".

### 4.4 Hazards and objects

| Symbol | Object | Behaviour |
| --- | --- | --- |
| `#` | Painted wall/ground | Solid tile |
| `P` | Player start | |
| `D` | Exit (stage door) | Touching it ends the act |
| `w` | Wax drop | +20 wax, then disappears |
| `C` | Crate | Solid. Only movable when the player is **Huge** (otherwise immovable) |
| `S` | Heavy switch | Pressed only when the player is Huge and standing on it, or a crate is on it. Opens matching gate `G` |
| `G` | Gate | Solid until its switch is pressed |
| `~` | Paper (burnable floor/wall tile) | Solid, but can catch fire |
| `f` | Fire start | A burning paper tile. Fire spreads to neighbouring `~` tiles every `FIRE_SPREAD_SECONDS` (start with 2.5 s). A burnt tile becomes a hole (non-solid) after 1 s of burning. Touching a burning tile = lose 15 wax + knockback |
| `m` | Moth | Shadow moth that flies toward the player in a gentle sine path. Contact = lose 10 wax. Huge player touching it destroys it ("swat") |
| `^` | Draft window | Every `DRAFT_INTERVAL` s (start 6 s), a gust blows for 1.5 s, telegraphed by fluttering curtain lines 1 s before. During a gust the candle is pushed **far** (player forced to Tiny) unless the player is standing in a `|` shelter zone |
| `|` | Shelter | Marks tiles where drafts don't reach |
| `=` | One-way platform | Thin shelf: jump up through it from below, stand on top, Down + Jump to drop through |
| `k` | Checkpoint lantern | Lights on touch; respawn here with the wax you had when you lit it (Acts 4–5) |
| `?` | Tutorial hint | Hand-lettered text painted on the paper; the text comes from the level file's `hints` list in order |
| `.` | Empty | |

Falling off the bottom of the screen (through a burnt hole) = restart the level.

### 4.5 Level structure (5 acts)

Levels are 32 columns × 18 rows of 40 px tiles, written as arrays of strings in `src/levels/`. Each act teaches one idea, then tests it.

| Act | Title | Teaches |
| --- | --- | --- |
| 1 | "The Lighting of the Candle" | Move, jump, wax timer, Normal ↔ Tiny (crawl through a gap) |
| 2 | "The Giant" | Huge: high ledge, push crate onto switch to open gate |
| 3 | "Moths to the Flame" | Moths; swat them when Huge, but Huge burns wax fast — choose when |
| 4 | "The Draft" | Draft windows forcing Tiny; time your growth between gusts, use shelters |
| 5 | "The Last Act" | Burning paper chases you across the stage; everything combined; finale |

Example (Act 1 draft; Claude Code may refine it but must keep it solvable). The wall at column 14 leaves a 1-tile gap at floor level that only Tiny fits through; the 2-tile step on the right needs Normal's jump; the door `D` waits on top:

```
################################
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#................#
#.............#..............D.#
#.............#.......##########
#.P.....w.........w...##########
################################
```

(Every row must be exactly 32 characters; validate this in the level loader and log a clear error if not.)

### 4.6 Controls

| Action | Keys |
| --- | --- |
| Move | A / D or ← / → |
| Jump | W, ↑ or Space |
| Candle closer (grow) | E or mouse wheel up |
| Candle farther (shrink) | Q or mouse wheel down |
| Direct size | 1 Tiny, 2 Normal, 3 Huge |
| Restart act | R |
| Pause menu | Esc or P (also auto-pauses when the browser tab loses focus) |
| Mute | M |
| Fullscreen | F |
| Hide HUD (for trailer recording) | H |
| Gamepad | Left stick/D-pad move, A jump, LB/RB candle farther/closer, Start pause (Phaser built-in gamepad input) |
| Dev only: next / previous act | N / B, enabled only when `CONFIG.DEBUG` is true |

### 4.7 Story and screens

- **Title screen:** a curtain, the candle, title "Shadow Play", "Press Space to begin the show".
- **Act cards:** between levels, the curtain closes and opens on "Act II — The Giant" (text on curtain).
- **Story text:** one or two lines per act card, e.g. *"The old puppeteer has one candle left. One last show."*
- **Ending:** after Act 5, the candle burns out by itself as the puppet takes a bow; "Fin."
- **Game over (wax = 0):** curtain closes, "The candle went out" → press R.
- **Act select:** the title screen has "Begin the show" and "Choose an act" (only unlocked acts are clickable). Judges in the top 5 can jump straight to any act they've unlocked.
- **Pause menu:** Resume, Restart act, Act select, Sound on/off, Reduce motion & flicker on/off.
- **Act results card:** after each exit door, the curtain shows the act time, wax left and number of restarts, plus a 1–3 candle rating based on wax left (`CONFIG.ratings`). Kept in memory only, no online scores.
- **Credits screen:** reachable from the title screen and shown after "Fin.", reading from the same list as `CREDITS.md`.

### 4.8 Game feel and quality of life (modern 2D standards)

These are small, cheap features players expect from a 2D game today. All their numbers live in `config.js`.

| Feature | Requirement |
| --- | --- |
| Coyote time | Can still jump for 80 ms after walking off a ledge |
| Jump buffer | A jump pressed up to 100 ms before landing still happens |
| Variable jump height | Releasing jump early cuts upward speed by half (short hop vs full jump) |
| Acceleration and friction | Player reaches top speed in ~0.1 s and stops in ~0.08 s; not instant, not floaty |
| Fast fall | Gravity ×1.6 while falling, so jumps feel snappy |
| Fast restart | Death or R → back in control in under 1 second (a short curtain flick, not the full act card) |
| Mid-act checkpoint | Map symbol `k`: a small lantern. Touching it lights it and saves position **and wax at that moment**. Used once in Acts 4 and 5 only |
| Hit feedback | On damage: 80 ms hit-stop (pause physics), white-hot flash on the puppet, camera shake, short invulnerability (0.8 s, blinking) |
| On-screen tutorial hints | Act 1–2 show hand-lettered hints painted on the paper ("Q / E: move the candle", "Huge can push crates"), as map symbols `?` with the text in the level file |
| Frame-rate independence | All movement and timers use `delta`, so the game plays the same at 60 and 144 Hz |
| Accessibility | "Reduce motion & flicker" option (see 5.1); keyboard and gamepad both fully supported; text at least 24 px |
| Audio mix | Separate volumes for music and SFX in `config.js`; music crossfades between acts; sound starts only after the first key press (browser autoplay rule) |
| Camera | Each act fits exactly one screen (32×18 tiles), so the camera is fixed: no scrolling needed. Camera is used only for shake, fade and a slow zoom on the final bow |

### 4.9 First-time tutorial

Shown automatically the **first time** someone plays; never again after it is finished or skipped. Keep it short: under 90 seconds and skippable at any time.

**Saved state (`systems/SaveProgress.js`):** one small record, `{ version: 1, highestAct: 1, tutorialDone: false, tipsSeen: [] }`, stored in the browser (see `SECURITY.md` rule 12 for why this is not an httpOnly cookie). It is read once at boot and validated: unknown or broken data means a fresh record. Pause menu → "Replay tutorial" and title → "How to play" reset `tutorialDone` for that run only.

**Workflow**

```
Boot → Title ("Begin the show")
   │
   ├─ tutorialDone = true ──────────────────────────────► Act 1 (normal, painted hints)
   │
   └─ tutorialDone = false
        │
        ▼
   PROLOGUE: 3 story cards on the closed curtain (Space / click / A to advance, "Skip" always visible)
        1. "An old puppeteer. One candle left."
        2. "You are his shadow. The light gives you shape."
        3. "When the wax is gone, the show is over."
        │
        ▼
   Curtain opens → Act 1 in TUTORIAL MODE (painted hints hidden, wax drain paused until step 5)
        │
   Step 1  MOVE    "Walk with A / D."             done when moved 3 tiles
   Step 2  JUMP    "Jump with W or Space."         done on first jump
   Step 3  SHRINK  "Press Q: the candle moves away, you shrink." + spotlight on the gap   done when Tiny
   Step 4  GROW    "Press E to grow back."         done when Normal, past the gap
   Step 5  WAX     Spotlight on the HUD candle: "This is the candle. It melts while you play, faster when you're big." (wax starts draining here)   done on Continue
   Step 6  EXIT    Arrow over the door: "Reach the door to end the act."   done on reaching the door
        │
        ▼
   "Bravo!" card → tutorialDone = true (saved) → normal act transition → Act 2
```

**One-time mechanic tips (after the tutorial):** the first time the player meets a crate, moth, draft, burning paper or checkpoint, a single short dialogue panel explains it (e.g. "Only a huge shadow can move this crate. Press E."). Each tip's id goes into `tipsSeen` so it never repeats. Gameplay keeps running (no pause), and the tip closes itself after 4 s or on any key.

**Skipping:** a "Skip tutorial" button (bottom-right on every tutorial card, and "Hold Esc to skip" during the steps; hold for 1 s, with a filling ring). Skipping sets `tutorialDone = true` and continues the act normally.

**Components (reuse, don't duplicate):** cards and dialogue use `ui/PaperPanel.js` (5.1). New pieces: `ui/KeyCap.js` (a key icon), `ui/Spotlight.js` (darkens everything except a circle), `ui/Pointer.js` (a bobbing pointing-hand silhouette), `systems/Tutorial.js` (the step machine above, driven by `EventBus` events such as `PLAYER_MOVED`, `PLAYER_JUMPED` and `SIZE_CHANGED`). The steps live as **data** in `levels/tutorial.js` (text, completion event, highlight target), so the wording can change without touching code.

**Animations**

| Element | Appear | While visible | Disappear |
| --- | --- | --- | --- |
| Prologue card | Drops from above onto the curtain, `Back.Out` 400 ms, settles with a 2° tilt; text typewrites (5.1) | Gentle float; a small "Space ▸" prompt pulses (alpha 0.4 ↔ 1, 800 ms) once the text is done | Slides left and fades (200 ms) while the next card drops in: a card-stack feel |
| Step dialogue panel (top-centre) | Unfolds `Back.Out` 300 ms with `sfx_paper`; the old puppeteer's line typewrites | KeyCap icons press down and up every 1.2 s to show which key to use | When the step is done, a gold ink tick draws itself across the panel (250 ms) with a chime, then the panel folds up (200 ms) |
| Spotlight | The dark overlay fades in to 70% while its circle shrinks from full screen onto the target (500 ms, `Cubic.Out`) | Circle edge breathes slightly (±4 px) | The circle grows back to full screen and the overlay fades (300 ms) |
| Pointer | Slides in from off-screen towards the target, `Back.Out` | Bobs ±6 px towards the target (600 ms `Sine.InOut`) | Fades out |
| Skip button / hold-ring | Fades in after 1 s | The ring fills clockwise while Esc is held | Fades on release or completion |
| "Bravo!" card | Pops in (scale 0.6 → 1, `Back.Out`), applause, 3 small confetti-paper bursts | — | Folds up, then the normal act transition (5.1) |
| Mechanic tip | Slides down from the top edge (250 ms) | Thin timer bar shrinks over 4 s | Slides back up (200 ms) |

With "Reduce motion & flicker" on, all of these become simple fades and the pointer stops bobbing.

**Acceptance**
- A fresh browser shows the prologue and tutorial; after finishing or skipping, a reload goes straight to the title and Act 1 has no tutorial.
- Every step can be completed with the keyboard and with a gamepad.
- Skip works from every card and step.
- Broken or edited saved data never crashes the game.

### 4.10 Basic-feature checklist from reference games

We compared Shadow Play against three well-known 2D games, for **basic features only** (not theme or story): **Celeste** (precise platformer, one-screen rooms), **Hollow Knight** (menus, settings, saving) and **Limbo** (minimal HUD, fast respawn, silhouette art). Features we already had are marked "have"; the rest are added here and are part of the normal milestones.

| Basic feature | Seen in | Status | Our requirement |
| --- | --- | --- | --- |
| Coyote time, jump buffer, variable jump | Celeste | have (4.8) | |
| Instant respawn, frequent checkpoints | Celeste, Limbo | have (4.8) | |
| One-screen rooms, fixed camera | Celeste | have (4.8) | |
| Minimal HUD | Limbo | have (5) | |
| **Corner correction** | Celeste | add | If the head clips a ceiling corner by ≤ 8 px while jumping, or the feet miss a ledge corner by ≤ 6 px, nudge the player around it instead of stopping them. Numbers in `CONFIG.player.cornerCorrection` |
| **One-way platforms** | Celeste, most platformers | add | Map symbol `=`: a thin shelf you can jump up through from below and stand on (Arcade `checkCollision` down only). Press Down + Jump to drop through |
| **Continue / New show** | Hollow Knight | add | Title shows "Continue (Act N)" when progress exists, and "New show", which asks "Start over? Your progress will be lost." with Yes/No before resetting |
| **Confirmation for destructive actions** | Hollow Knight | add | Any reset (new show, reset settings) uses a PaperPanel with Yes/No; No is selected by default |
| **Settings menu** | Hollow Knight | add | Title → Settings and Pause → Settings: Master, Music and SFX volume sliders (0–10), Reduce motion & flicker, Assist options, Fullscreen, Controls page. Saved in the same record as 4.9 |
| **Controls page** | All three | add | A card showing keyboard and gamepad layouts with KeyCap icons; reachable from Settings and Pause |
| **Device-aware button prompts** | Celeste, Hollow Knight | add | Whenever a key is shown (tutorial, hints, menus), show the keyboard key or the gamepad button depending on the last device used |
| **Assist options** | Celeste (Assist Mode) | add | Off by default: "Slower wax" (50% drain), "Invincible to moths and fire", "Skip this act" (offered after 5 restarts in one act). Using them is fine, and results show a small "assist" mark |
| **Pause on gamepad disconnect** | Hollow Knight | add | Auto-pause with "Controller disconnected" |
| **Total stats at the ending** | Celeste | add | After "Fin.": total time, total restarts, candles earned (ratings) across all acts |
| **Death animation before respawn** | Limbo | have (4.2.1, 5.1) | |
| **Audio unlock on first input** | Web games | have (4.8) | |
| **Page polish** | Web games | add | Browser tab title "Shadow Play", a candle favicon, a meta description, a link-preview image (`og:image`) for when the link is shared, and a simple CSS loading screen (candle + "Loading…") shown before Phaser starts |
| **Keyboard doesn't scroll the page** | Web games | add | Arrow keys and Space are captured by the game (`this.input.keyboard.addCapture`) so the browser page never scrolls |
| **Version label** | Most games | add | Small "v1.0" in a corner of the title screen, read from `package.json` |

**Saved record update:** the 4.9 record becomes `{ version: 1, highestAct, tutorialDone, tipsSeen, settings: { master, music, sfx, reduceMotion, assist: { slowWax, invincible } }, stats: { totalTimeMs, totalRestarts } }`, validated as in `SECURITY.md` rule 12.

## 5. Look and feel

- **Palette:** Midnight Teal: warm candlelight on paper fading into teal darkness, near-black silhouettes, orange flame, warm accent for goals. Every colour, and how the glow, vignette, flame and titles are built, is in **`PALETTE.md`** (single source). Everything gameplay-relevant is a black silhouette.
- **Glow:** a large radial gradient on the paper centred on the candle (see `PALETTE.md`), stronger when the candle is closer (Huge) and dimmer as wax runs low. Add a slow random flicker (alpha/scale noise) every frame.
- **Shadow edges:** player silhouette blurs slightly more when Huge (real shadows get softer as the light gets closer). A simple trick is a second, larger, low-alpha copy behind the sprite.
- **Paper texture:** generated at boot with `Graphics` (subtle noise lines) baked into a texture — no external image needed.
- **Candle HUD:** bottom-left, a small candle whose height = wax, with a live flame. Bottom-right: three dots showing Tiny / Normal / Huge.
- **Juice:** camera shake on damage, ember particles near fire, curtain transitions, squash-and-stretch on landing.
- **Art approach:** the puppet, moths, crates and scenery are simple silhouettes. They can be drawn in code with `Graphics` and turned into textures (`generateTexture`), so no art skills are needed. Optional: replace with hand-made/AI-made PNG silhouettes later; the exact files, sizes and keys are in `ASSETS.md`.
- **Audio:** candle crackle loop (volume follows wax), soft music box theme, whoosh on grow/shrink, squeeze when blocked, gust, moth flutter, paper burning, curtain swish, applause at the end. The full list of sound keys and files is in `ASSETS.md`; list every source in `CREDITS.md`.

### 5.1 Transitions and animation (modern 2D standard)

Everything on screen moves with intent: nothing pops in or out instantly. All durations and easings live in `CONFIG.anim`. Animation code is in `src/fx/` (`Transitions.js`, `UIAnim.js`, `Juice.js`, `Particles.js`), following `CODE_RULES.md`. Use Phaser tweens, timelines, camera effects and particles; no extra libraries.

**Easing standard:** entrances `Back.Out` (slight overshoot) or `Cubic.Out`; exits `Cubic.In`; continuous motion `Sine.InOut`. UI entrances 250–400 ms, exits 150–250 ms, so exits are always faster than entrances.

#### Screen and level transitions

| Moment | Animation |
| --- | --- |
| Game start (Boot → Title) | Black screen; a match strikes (spark particles), the candle flame grows from a dot with `Back.Out`, then the paper glow fades in over 800 ms; the logo ink-bleeds in (alpha + slight scale 0.95 → 1) |
| Title → Act 1 | Title UI slides down and fades; the curtain **opens** from the centre (two halves slide apart, 900 ms, `Cubic.InOut`, slight fabric sway at the end) |
| Act complete → next act | Door glows; the puppet walks through and fades; the **curtain closes** (700 ms) → the results card drops in → the act card (next act's title writes in letter by letter like ink, the story line fades in under it) → behind the closed curtain the new act loads → the **curtain opens** |
| Quick restart (R or death) | "Curtain flick": the halves close only to 40% and reopen (total under 450 ms) with the level reset hidden in the middle |
| Candle out (game over) | Flame shrinks and dies, a smoke wisp rises, the glow fades to near-black over 600 ms, the puppet goes limp (see 4.2.1), then the curtain closes and "The candle went out" ink-writes in |
| Pause | The game dims to 60% with a warm vignette; the pause card drops in; on resume it lifts out and the dim fades (200 ms) |
| Act select / credits / menus | Paper cards slide in from below with a 2–4° random tilt and settle with `Back.Out`, staggered 60 ms apart |
| Ending | The camera slowly zooms 1.0 → 1.15 on the bow; the candle burns out by itself; the curtain closes; "Fin." ink-writes; applause swells; credits scroll up like a theatre programme |

#### Dialogue boxes, hints and cards

The same "paper scrap" component (`ui/PaperPanel.js`) is used for tutorial hints, act cards, the results card, toasts and (if built) dialogue:
- **Appear:** it unfolds (scaleY 0 → 1, `Back.Out`, 300 ms) with a soft paper-rustle sound, tilting 2° and settling.
- **Text:** a typewriter reveal (`CONFIG.anim.textCps`, default 40 characters a second) with a faint tick every few letters; Space or click finishes the text instantly, a second press closes it.
- **Idle:** a very gentle float (±2 px, 2.5 s `Sine.InOut`).
- **Disappear:** folds up and fades (200 ms, `Cubic.In`).
- **Hints painted on the stage** (`?` symbols) ink-bleed in when the player comes within 4 tiles, and fade out when they walk away.
- **Results card:** numbers count up from 0 (600 ms); the 1–3 candle icons pop in one at a time (`Back.Out`, 150 ms apart, a chime each); the best result glows.
- **Toasts** (e.g. "Checkpoint lit"): slide in from the top, stay 1.5 s, slide out.

#### Buttons and menu feedback

- Hover/focus: scale 1.0 → 1.05 with an ink underline drawing left to right (120 ms); keyboard/gamepad focus looks the same as mouse hover.
- Press: quick squash 0.95 then back (`Back.Out`), plus the `sfx_ui` tick.
- Disabled (locked acts): greyed out with a small padlock silhouette; shakes gently if clicked.

#### In-game "juice" (modern feel)

| Event | Animation |
| --- | --- |
| Size change | Afterimage: 3 fading silhouette copies at the old size (pooled), a soft "breath" of light on the paper, a short limb wobble (4.2.1), and a whoosh |
| Landing | Small dust puff (pooled particles), squash, light camera nudge only from high falls |
| Wax pickup | The drop bobs and twinkles while idle; on pickup it flies into the HUD candle along a curve (300 ms), the HUD candle grows slightly and flares |
| Low wax (below 30) | The vignette slowly pulses, the HUD flame flickers faster, and the music low-passes slightly |
| Hit | 80 ms hit-stop, the puppet flashes warm white, camera shake (strength from `CONFIG.anim.shake`), invulnerability blink |
| Moth swat | Small camera zoom punch (1.0 → 1.03 → 1.0, 120 ms), the moth bursts into paper flakes |
| Burning paper | Each burning tile glows at its edges, ember particles rise, ash flakes fall, and the hole edge stays charred |
| Crate push | Dust at the crate's base, slight wobble when it stops |
| Switch and gate | The switch clunks down; the gate rises with a short shake and dust; a thin light line links the switch to its gate for 1 s so the player sees the connection |
| Door available | Soft pulsing glow; it opens with a swing when touched |
| Checkpoint lantern | It lights with a flare and stays gently flickering |
| Draft warning | The window curtains flutter (wave tween) 1 s before the gust; paper scraps blow across the screen during it |
| Candle | The flame never stays still: layered noise on scale, rotation and glow alpha |

#### Accessibility and performance

- **"Reduce motion & flicker"** option (in the pause menu): disables camera shake and zoom punches, calms the flicker, and makes transitions simple fades.
- All particles come from pre-made pools; no animation may create objects every frame.
- Transitions must never block input for more than 1 s (except the ending), and every screen can be skipped with Space after its first 300 ms.

## 6. Technical design

### 6.1 Stack

- **Phaser 3** (latest 3.x) with **Arcade Physics**, **Vite**, plain **JavaScript** (no TypeScript).
- Scaffold: `npm create @phaserjs/game@latest` → Vite + JavaScript template.
- Deploy: Vercel (build `npm run build`, output `dist`).

### 6.2 Game config

- Size 1280×720, `Phaser.Scale.FIT`, `autoCenter: CENTER_BOTH`, `pixelArt: false`.
- Arcade physics, `gravity.y = 1400`, `debug` toggled by a `DEBUG` constant (press F1 in dev to toggle the debug draw).

### 6.3 Folder structure

This is the overview. The full folder rules (including `states/`, `ui/` and `core/`) and the design patterns to use are in `CODE_RULES.md`, which wins if the two differ.

```
src/
  main.js                 # Phaser game config, scene list
  config.js               # ALL tunable numbers (speeds, wax, timers) in one place
  assets.js               # asset manifest mirroring ASSETS.md (keys + paths); code uses keys only
  scenes/
    BootScene.js          # generate textures (paper, silhouettes), then Preload
    PreloadScene.js       # load audio and any PNGs, show a loading bar
    TitleScene.js
    GameScene.js          # loads a level by index, runs gameplay
    UIScene.js            # HUD overlay (wax candle, size dots), runs in parallel with GameScene
    ActCardScene.js       # curtain transition + act title
    EndScene.js
  objects/
    Player.js             # movement, size states, grow-blocked check
    Candle.js             # wax, drain, glow/flicker visuals, emits 'waxOut'
    Crate.js
    Moth.js
    FireGrid.js           # paper tiles, fire spread, holes
    Draft.js              # gust timer, telegraph, forces Tiny
  levels/
    act1.js … act5.js     # each exports { title, story, hints: [strings], map: [32-char strings] }
    index.js              # ordered list of acts
  systems/
    LevelLoader.js        # parses map strings → tiles and objects; validates row lengths
    SaveProgress.js       # the one saved record: highest act, tutorialDone, tipsSeen (see 4.9, SECURITY.md rule 12)
    Tutorial.js           # first-time tutorial step machine (see 4.9)
public/assets/           # images/, audio/sfx/, audio/music/, fonts/ (see ASSETS.md)
vercel.json              # security headers (see SECURITY.md)
NOTES.md                 # shift handover note
CREDITS.md
README.md                 # how to play, controls, theme explanation, credits link
```

### 6.4 Key implementation notes

- **Tiles:** build a Phaser tilemap from the string grid (`make.tilemap({ data, tileWidth: 40, tileHeight: 40 })`) using a generated tileset texture, or use a static physics group of 40×40 rectangles. Either is fine; prefer the tilemap so the fire grid can call `removeTileAt`.
- **Size change:** store `sizeIndex` (0,1,2). On change: compute target scale, check room with `tilemapLayer.getTilesWithinWorldXY(x, y, w, h, { isColliding: true })` for the new body rect; if any, cancel. Otherwise tween `scale` and call `body.setSize` / `setOffset` so the hitbox matches, keeping feet anchored.
- **Crates:** `body.pushable = (player.sizeIndex === 2)` updated every frame; crates have drag so they stop when not pushed.
- **Switch/Gate:** each `S` links to the nearest `G` in the same level (or use matching letters if a level needs several, e.g. `S1`/`G1` – keep it simple first).
- **Wax:** `Candle.update(dt)` drains wax and emits events. UIScene listens and redraws the HUD.
- **Fire grid:** a 2D array of states for `~` tiles: `paper → burning → hole`. Spread with a timer, not every frame.
- **Moths:** simple steering toward the player, `sin(time)` vertical wobble, max speed 90.
- **Moth flight feel (procedural, no extra art):** the 2-frame flap alone looks stiff, so `Moth.js` adds code-driven motion on top. Numbers in `CONFIG.moth`.
  - **Flap speed follows effort:** flap frame rate goes up when climbing or accelerating (≈14 fps), down when gliding or diving (≈6 fps). Each wing-down frame gives a small upward push, so the moth bobs in time with its wings.
  - **Squash and stretch per flap:** on wings-down, scaleY 0.9 / scaleX 1.08 for one frame, back to 1.0 on wings-up.
  - **Tilt into motion:** rotation eases toward the velocity direction (max ±20°) with a damped spring, so turns look banked, not instant.
  - **Flutter noise:** small random jitter (±1.5 px, new target every 120–200 ms, smoothed) so two moths never move identically.
  - **Drawn to the flame:** flapping speeds up and the jitter grows near the candle or burning paper; a few ember sparks when one gets very close.
  - **Swat reaction:** on swat the moth spins (720°/s), falls with gravity, and bursts into paper flakes (see 5.1).
- **Drafts:** `Draft` has a repeating timer: telegraph (1 s) → gust (1.5 s) → calm. During a gust, if the player is not in a shelter tile, force `sizeIndex = 0` and block growing.
- **All tunable numbers live in `config.js`** so the team can tweak feel without hunting through code.
- **Restart** rebuilds the scene with `this.scene.restart({ act })`.
- Use `localStorage` only for the single saved record in 4.9 (highest act, tutorialDone, tipsSeen), wrapped in try/catch and validated.

### 6.5 Performance and stability

- Target 60 fps on a normal laptop browser.
- No console errors. Every level must be completable (test each one fully before marking a milestone done).

## 7. Lowest priority: build ONLY if time is left

> **Least important features.** Do not start any of these until milestones M0–M6 are done **and** the section 8 stretch goals are done or dropped. They are listed in order of value (most useful first), so pick from the top. Each one must still follow `CODE_RULES.md` and `SECURITY.md`, and must not break any existing act. If time runs out halfway through one, remove it rather than ship it half-working.

### 7.1 Remappable keys
- **What:** a "Controls" page in the pause menu listing each action (move left/right, jump, candle closer/farther, restart, pause). Select an action, press a new key, and it's saved.
- **How:** a `systems/InputMap.js` that every scene reads instead of hard-coded keys; defaults from `CONFIG.controls`. Save the mapping in `localStorage` (try/catch, validated against a whitelist of key codes; reset button restores defaults).
- **Done when:** a remapped key works in every act and survives a page reload.

### 7.2 Mobile touch controls
- **What:** on touch devices, on-screen buttons: left/right on the bottom-left, jump and candle −/+ on the bottom-right, pause top-right. Buttons are paper-cut silhouettes at 40% opacity.
- **How:** show only when `this.sys.game.device.input.touch` is true; buttons feed the same `InputMap` actions as the keyboard. Add multi-touch (`this.input.addPointer(2)`).
- **Done when:** Act 1 and Act 2 can be finished on a phone in landscape.

### 7.3 Achievements
- **What:** 6 local achievements shown as small paper badges on the title screen, e.g. "Tiny Hero" (finish Act 1 without going Huge), "Moth Swatter" (swat 10 moths), "Wax Miser" (finish any act with 80+ wax), "Fireproof" (finish Act 5 without touching fire), "Encore" (finish all acts), "Speedy" (any act under 45 s).
- **How:** `systems/Achievements.js` listens to `EventBus` events; unlocks saved in `localStorage` (try/catch, booleans only). A small toast slides in from the top when unlocked.
- **Done when:** each badge can be earned and stays unlocked after reload.

### 7.4 Parallax depth and richer backdrops
- **What:** each act's backdrop split into 2–3 silhouette layers (far, mid, near) that shift slightly when the candle size changes, as if the light moved. More depth for the trailer.
- **How:** extra keys `bg_actN_far`, `bg_actN_mid` added to `ASSETS.md` first; layers offset by `CONFIG.parallax[size]` with a tween on size change.
- **Done when:** layers move smoothly and never cover gameplay.

### 7.5 Boss: the Great Moth (Act 6 / encore)
- **What:** a giant moth silhouette circles the candle at the top of the screen and dives at the player in telegraphed patterns (shadow grows on the paper before a dive). Three phases: dives → dives + dropping burning dust that ignites paper → fast dives. The player damages it by being **Huge** and jumping into its body right after a dive (when it's stunned). Three hits per phase.
- **How:** `objects/MothBoss.js` with a small state machine (`circle → telegraph → dive → stunned → recover`), all timings in `CONFIG.boss`. A boss health bar shaped like three candles.
- **Done when:** the fight is beatable in under 3 minutes without knowing the patterns in advance, and the game never soft-locks.

### 7.6 Real-time shadow lighting
- **What:** scenery casts real soft shadows from the candle position (shadows stretch and rotate as the candle moves), instead of the current glow overlay.
- **How:** Phaser's Light2D pipeline with normal maps for the silhouettes, or ray-cast shadow polygons from tile corners drawn into a render texture. Must keep 60 fps; turned off automatically if fps drops below 50.
- **Done when:** it looks better than the overlay and runs at 60 fps on a normal laptop. Otherwise keep the overlay.

### 7.7 Physics-driven puppet limbs
- **What:** replace the spring-animated limbs with jointed physics (arms and legs dangle and swing with momentum, like real puppets on rods).
- **How:** Phaser's Matter.js physics for the limbs only (`Matter` constraints at shoulders and hips), while the player body stays on Arcade physics. Limbs are visual only and never affect collisions.
- **Done when:** limbs swing naturally, never stretch or explode, and fps stays at 60.

### 7.8 Scrolling levels and a world map
- **What:** larger acts (e.g. 3 screens wide) with a camera that follows the player smoothly, plus a "theatre programme" world map to pick acts.
- **How:** maps wider than 32 columns; `camera.startFollow(player, true, 0.1, 0.1)` with dead-zone and bounds; burning-paper and draft systems must work off-screen. The row-length validation becomes "all rows equal length".
- **Done when:** a 3-screen act plays without the camera revealing outside the stage.

### 7.9 Dialogue with the puppeteer
- **What:** short in-game lines from the old puppeteer (shown as handwritten text on a paper scrap at the top), triggered at story moments: start of an act, first Huge, candle below 30, the final bow.
- **How:** `systems/Dialogue.js` reading lines from each level file's `dialogue` list, triggered by `EventBus` events; text appears letter by letter, skippable with Space; never pauses gameplay for more than 2 seconds.
- **Done when:** every act has 2–4 lines and none of them block play.

### 7.10 Collect-and-spend: a costume shop
- **What:** hidden paper stars (stretch goal 3) are spent between acts on cosmetic puppet costumes (knight, jester, dragon), purely visual.
- **How:** costume = an alternate set of `puppet_body/arm/leg` keys in `ASSETS.md`; choice saved in `localStorage` (validated against the known costume list).
- **Done when:** buying and switching costumes works and never changes gameplay.

### 7.11 Procedurally generated "Endless Rehearsal" mode
- **What:** a bonus mode that stitches random one-screen rooms from a library of hand-made room chunks, getting harder (less wax, more moths) each room. Score = rooms survived.
- **How:** a library of 10–15 room chunks in `levels/chunks/`; a seeded random generator picks chunks whose exits line up; difficulty from `CONFIG.endless`.
- **Done when:** 20 generated rooms in a row are always solvable.

### 7.12 Localization (Urdu and English)
- **What:** all text available in English and Urdu, switchable from the pause menu.
- **How:** every string moves to `src/i18n/en.js` and `src/i18n/ur.js`; code uses `t('key')`. Urdu needs a right-to-left-capable font added to `ASSETS.md` (e.g. Noto Nastaliq Urdu) and RTL text alignment.
- **Done when:** every screen reads correctly in both languages with no overflowing text.

### 7.13 Online leaderboard and cloud saves
- **What:** fastest time per act, shown on the results card, shared between players; progress synced across devices.
- **How:** needs a backend (for example a small serverless function plus a database). **This conflicts with `SECURITY.md`** (no third-party services, no secrets in the browser), so `SECURITY.md` must be updated first: secrets stored only on the server, names filtered for abuse, scores validated server-side to stop cheating, rate limiting on submissions.
- **Done when:** scores submit and display safely, and the game still works fully offline if the service is down.

### 7.14 Local two-player co-op
- **What:** a second puppet on the same keyboard/gamepad. One candle is shared, so both puppets are the same size; or each has their own candle, making two separate light sources.
- **How:** a second `Player` with its own `InputMap`; puzzles need redesigning for two players, so this means new co-op acts.
- **Done when:** at least one co-op act is finishable by two people.

### 7.15 Level editor
- **What:** an in-game editor to paint the 32×18 grid with the map symbols, play-test it instantly, and export/import the level as text.
- **How:** an `EditorScene` that edits the same string-array format `LevelLoader` reads; export copies the text to the clipboard. Never loads code, only the map symbols (whitelisted).
- **Done when:** a level made in the editor can be pasted into `levels/` and plays identically.

### 7.16 3D version
- **What:** recreate the stage in 3D (paper screen as a plane, a real light source casting the puppet's shadow).
- **How:** a different engine (Three.js). This is essentially a new game and is listed only for completeness; **not realistic within the jam**.
- **Done when:** not applicable during the jam.

## 8. Stretch goals (only after milestone M6 is done; build these before anything in section 7)

1. Optional mouse control: drag the candle on a small "backstage" strip at the bottom of the screen for continuous size (snap to 3 sizes on release).
2. A secret 6th act: "The Encore", with everything at once.
3. Hidden collectible in each act (a paper star) shown on the results card.
4. Parallax: two backdrop layers moving slightly with the candle position.
5. A one-off mini-boss for the encore: a giant moth circling the candle.

## 9. Milestones (build in this order)

> **Re-plan 2026-10-17 (after the official handbook).** Judging is the trailer first, so the order below is now driven by **what makes 2 minutes of strong, varied footage** and by the clock in section 11. Items marked **CUT** are not built unless every other item is done before the freeze; **OPTIONAL** items are built only in the slot section 11 gives them. Shipping acts: **1, 2 and the fire finale (5)**, plus **3 (moths)** only if it fits. Act 4 (drafts) is cut. The tiers below are kept for reference; where they disagree with the re-plan, the re-plan wins.

**Priority tiers.** Inside each milestone, build in this order and never start a lower tier while a higher one is broken:
- **P1, must ship:** the three sizes, wax timer, crates/switches/gates, moths, drafts, burning paper, five acts, title, act cards with the curtain, basic transitions, deployed build.
- **P2, should ship:** tutorial (4.9), pause menu, settings and volume, results card, checkpoints, hit feedback, puppet rig poses beyond walk/jump, sounds and music.
- **P3, nice to have:** assist options, device-aware prompts, gamepad-disconnect pause, ending stats, og-image/favicon, version label, act select, Hide-HUD and dev keys (except when needed for the trailer).

**Level design for Acts 2–5:** Claude Code drafts each map following the 4.5 table, then must prove it is solvable by playing it with DEBUG on. Each act should take 60–120 s for a first-time player, introduce its new idea safely first, then test it once with real danger.

Each milestone ends with: run the game, check every item, commit and push.

### M0 — Setup (target: hour 2)
- [x] Phaser + Vite JS project created, runs with `npm run dev`
- [x] Folder structure from 6.3 created, `config.js` exists
- [x] `src/assets.js` manifest and placeholder textures in `BootScene`; `PreloadScene` skips missing files without errors (see `ASSETS.md`)
- [x] `.gitignore` as in `SECURITY.md` rule 2
- [x] Starter files created: `NOTES.md` (handover template: Works / Broken / Next), `CREDITS.md` (table: asset, source link, licence), `README.md` (title, how to run, controls placeholder)
- [x] `DEBUG` mode shows an FPS counter and physics bodies (F1 toggles)
- [x] Repo pushed (private for now) — **partner still needs inviting** (GitHub → Settings → Collaborators)

### M1 — Shadow on paper (target: hour 8)
- [x] Paper background with warm glow and flicker
- [x] Act 1 map loads from strings; walls are solid; the loader validates every level: all rows the same length, only known symbols, exactly one `P` and one `D`, and a clear console error naming the act and row if not
- [x] Silhouette player moves and jumps with good feel: coyote time, jump buffer, variable jump height, acceleration, fast fall (section 4.8)
- [x] Jointed puppet rig (section 4.2.1): springs, distance-driven walk, idle, jump, fall and land poses, rods, debug joint dots
- [x] Remaining rig poses (push, squeeze, hurt, swat, gust, death, bow) are added in the milestone that adds that mechanic *(deferred by design; each goes in `systems/PuppetPoser.js` with its mechanic)*
- [x] Pause menu, auto-pause on tab blur, fast restart (R), mute (M), fullscreen (F)
- [x] Corner correction, one-way platforms `=`, page scroll capture (4.10)

### M2 — The candle (by Sat 13:00)
- [ ] Tiny / Normal / Huge with Q/E, 1/2/3 and mouse wheel; smooth tween; feet stay anchored
- [ ] Growing is refused when there is no room (shake + sound placeholder)
- [ ] Wax drains with size multiplier; HUD candle shows wax; wax drops work
- [ ] Wax 0 → curtain → restart; exit door → next act
- [ ] **Checkpoint: Act 1 is fun to play. If not, improve feel before going on.**
- [ ] **Burn rate visible (4.3.1):** HUD flame, drips and `×` tag react to size *(added 2026-10-17: synergy marks)*
- [ ] Hide-HUD key (H) and dev act-skip keys for trailer recording *(moved up from M5 2026-10-17: needed to record takes quickly)*

### M3 — Puzzles (by Sat 17:00)
- [ ] Crates pushable only when Huge; switches and gates work
- [ ] Tutorial hint symbol `?` works with the PaperPanel animation (5.1); hints added to Acts 1 and 2
- [ ] ~~Gamepad support~~ **CUT 2026-10-17**
- [ ] Act 2 complete and solvable

### M4 — Danger (by Sat 20:30; moths optional until 22:00)
- [ ] Burning paper spreads and leaves holes; falling through a hole restarts *(never cut: the Fire theme)*
- [ ] Hit feedback (flash, shake, knockback, short invulnerability); hit-stop and checkpoint lanterns `k` only if Act 5 needs them
- [ ] Act 5 "The Last Act" (fire finale) complete and solvable
- [ ] **OPTIONAL:** Moths (swat when Huge) + Act 3, only if Act 5 is playable by Sat 19:30 *(good synergy footage: swatting means going Huge, which burns wax)*
- [ ] ~~Drafts with telegraph and shelters; Act 4~~ **CUT 2026-10-17**

### M5 — Show polish (by Sat 23:30, trimmed to what the trailer and the top-5 judges see)
- [ ] Act cards with curtain (+ one story line) between acts; ending with candle burning out, the bow and "Fin." (replaces the M0 placeholder `EndScene`)
- [ ] Transitions and juice from 5.1 that show on camera: curtain flick, size-change light "breath", afterimage, shake, particles. ~~Reduce motion & flicker~~ **CUT**
- [ ] All sounds and music in, volumes tuned, `CREDITS.md` filled
- [ ] `vercel.json` security headers added (`SECURITY.md` rule 10)
- [ ] Deployed on Vercel and tested from the live link with no console errors *(optional for marks, but gives the top-5 judges a one-click build)*
- [ ] ~~Act select, results card, credits screen~~ **CUT 2026-10-17** (credits live in `CREDITS.md`, README and the trailer)
- [ ] ~~Continue / New show, Settings, Controls page, device-aware prompts, gamepad-disconnect pause, ending stats, page polish, version label~~ **CUT 2026-10-17**; a favicon and page `<title>` only if 5 minutes are spare
- [ ] ~~First-time tutorial (4.9)~~ **CUT 2026-10-17**: the `?` hints in Acts 1–2 teach the controls instead

### M6 — Freeze (Sat 23:30, hard)
- [ ] Feature freeze; bug fixes only. **No new features after 23:30**, even small ones
- [ ] README complete (how to play, controls, theme table, credits)
- [ ] `SECURITY.md` pre-deploy checklist done
- [ ] Full playthrough of every shipped act, title → "Fin.", in Chrome and Edge (or Firefox) with the keyboard, on the build that the judges will get

## 10. Working as a team (shifts)

Only one person works at a time, so handovers matter.

**Every handover (5 minutes, never skip):**
1. Commit and push everything, even half-done work.
2. Tick finished boxes in section 9 of this file and push.
3. Write 3 lines at the top of `NOTES.md`: what works, what's broken, what's next.
4. The next person: pull first, read `NOTES.md`, run `npm run dev`, then start a Claude Code session with: *"Read PRD.md and NOTES.md, then continue with the next unchecked milestone item."*

**Git basics:** pull → work → commit (short message, e.g. "add crate pushing") → push. Commit at least every hour. Keep the repo **private** until just before submitting, then switch it to public (GitHub → Settings → General → Change visibility). Give it a unique name.

## 11. Schedule (re-planned 2026-10-17, clock times PKT)

M0 and M1 were done on Fri 16 Oct; M2 is built but not yet play-tested. From Sat 11:00 that leaves **12.5 h to build, 8.5 h for the trailer and 1.5 h to submit.**

| When | Goal | Footage it unlocks |
| --- | --- | --- |
| Sat 11:00–12:00 | **Finish M2**: play-test, tick boxes, tune volumes, "Act 1 is fun" checkpoint | Act 1: Tiny crawl, wax drops, candle out |
| Sat 12:00–13:00 | **Burn rate visible (4.3.1)** + H hide-HUD + dev act-skip keys | The synergy shot: Normal → Huge, candle races |
| Sat 13:00–17:00 | **M3**: crates, switches, gates, `?` hints; **Act 2** solvable | Growing Huge, refused grow, crate on switch, gate opens |
| Sat 17:00–20:30 | **M4 fire finale**: burning paper, holes, falls, hit feedback; **Act 5** solvable | The chase across a burning stage |
| Sat 19:30 check | Is Act 5 playable? **Yes** → moths + Act 3 in 20:30–22:00, polish gets 1.5 h less. **No** → moths are cut, keep going on Act 5 | Swatting moths while the wax drops |
| Sat 20:30–22:30 | **M5 show polish**: act cards, real ending + "Fin.", juice that shows on camera, sound pass | Teaser shots, act cards, the bow |
| Sat 22:30–23:30 | Deploy with `vercel.json`, full playthrough, bug fixes, README | (stability) |
| **Sat 23:30** | **FEATURE FREEZE** (M6). Bug fixes only, and only if they block a shot | |
| Sat 23:30–Sun 01:30 | Record (OBS, 1080p 60 fps), 3+ takes of every shot on the shot list | |
| Sun 01:30–06:00 | Pick takes, edit, theme cards, captions | |
| Sun 06:00–07:00 | Music and sound mix, check it is ~3:00 and 2:00+ is gameplay | |
| Sun 07:00–08:00 | Export, upload to Drive ("Anyone with the link"), watch it in a private window | |
| Sun 08:00–09:30 | Repo **public**, check all assets are in it, test every link, **submit by 09:00** (30 min buffer) | |

**Before the freeze (whoever is off shift):** write the shot list from section 12 by Sat 20:00, and film the real-candle teaser shots. Sleep in turns: whoever is recording at 23:30 should sleep during the evening build shift.

**If behind, cut in this order:** moths (Act 3) → act-card story text → juice beyond the curtain → deploy (the repo is enough to submit). **Never cut:** the three sizes, the wax timer with its visible burn rate, Act 2, the burning paper finale, the 23:30 freeze.

## 12. Trailer plan (exactly ~3:00)

| Time | Content |
| --- | --- |
| 0:00–0:35 | Teaser (creative freedom): a real-looking candle is lit behind a paper screen; a puppet's shadow appears; the puppeteer's hands; "One candle. One last show." Title card **SHADOW PLAY**. |
| 0:35–1:00 | Three theme cards, each with a gameplay clip: "Shadow: you are the puppet." "Fire: the candle shapes you." "Time: the wax is melting." End on the synergy line. |
| 1:00–3:00 | **Real screen-recorded gameplay (2:00, required).** Shot list below. |

**Gameplay shot list (re-planned 2026-10-17).** Each beat names the theme it proves, because the trailer must show how each theme is used. HUD **on** for all gameplay (the candle is the Time theme); H hides it only for teaser shots.

| Time | Shot | Themes shown |
| --- | --- | --- |
| 1:00–1:20 | Act 1: walk in the candlelight, grab a wax drop, shrink to Tiny and crawl under the pillar | Shadow, Time |
| 1:20–1:35 | **Synergy beat:** Normal → Huge, the HUD flame flares, drips pour, `×2` pops; then Tiny, the candle calms. Caption: *"Bigger shadow. Faster burn."* | Shadow × Fire × Time |
| 1:35–2:05 | Act 2: grow Huge, refused grow in a tight spot, push the crate onto the switch, the gate opens, wax getting low | Shadow, Time |
| 2:05–2:20 | Act 3 (if built): go Huge to swat moths while the candle drains. If cut, a longer Act 2 or a candle-out → curtain beat | Shadow × Time |
| 2:20–2:55 | Act 5: the paper catches fire, flames spread, holes open, switch sizes to escape across the burning stage | Fire, Shadow, Time |
| 2:55–3:00 | The bow, the candle burns out, "Fin." | Time, atmosphere |

Record with OBS at 1080p 60 fps; edit in CapCut or DaVinci Resolve. Gameplay must be real and recreatable: no editing that shows something the game cannot do. Record several takes of every shot.

## 13. Submission checklist (deadline Sun 18 Oct, 09:30; aim for 09:00)

- [ ] Trailer on Google Drive, "Anyone with the link", plays fine in a private window, ~3:00, at least 2:00 real gameplay, every theme shown
- [ ] GitHub repo **public**, contains all code and **all assets** (check the PNGs that were only on one machine), `README.md`, `CREDITS.md`
- [ ] Live Vercel link works (optional)
- [ ] Form submitted
