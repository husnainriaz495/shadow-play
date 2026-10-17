# NOTES — the running tracker for Shadow Play

> **If you are Claude Code: read this whole file before writing any code, and
> update it after every feature you finish.** It is the single record of what
> exists, what does not, and what to do next. `PRD.md` says what to build;
> this file says *where we actually are*.
>
> **If you are a human starting a shift:** read "Start here", run
> `npm run dev`, then ask Claude Code to continue from the next task.

**How to update it** — after each finished feature, in the same change:
1. Add one entry to the top of the **Build log**.
2. Move the finished task out of **Next up**.
3. Tick the box in `PRD.md` section 9 if that completes a milestone item.
4. Add anything surprising to **Gotchas** so nobody learns it twice.

---

## Start here

| | |
| --- | --- |
| **Milestones done** | **M0 — Setup** and **M1 — Shadow on paper.** All boxes ticked in `PRD.md` §9 |
| **Milestone in progress** | **M2 — The candle.** Items 1-4 built and Node-tested, **not yet watched in a browser**, so PRD boxes stay unticked |
| **Does it run?** | Yes — `npm run dev`, then http://localhost:8080 (see Gotchas if 8080 is taken) |
| **Engine** | Phaser **3.90.0** (not 4 — see Gotchas) |
| **Deadline** | **Sun 18 Oct 2026, 09:30 PKT** (aim 09:00). **Feature freeze Sat 17 Oct, 23:30** — after that, trailer only. Timeline: `PRD.md` §11 |
| **Shipping acts** | 1, 2 and the fire finale (5); Act 3 (moths) only if Act 5 is playable by Sat 19:30; Act 4 cut |
| **Next task** | Play-test M2 in a browser, then "Act 1 is fun", then **make the burn rate visible** (PRD 4.3.1) — see Next up |

**What you see if you run it now:** the title screen in the Midnight Teal
palette → `Space` → **Act 1's real stage**: solid walls built from the map
strings, a warm pool of candlelight that follows the puppet and fades into
teal darkness, the exit door glowing at the far right, the act title on top,
the wax-candle HUD bottom-left and the size dots bottom-right. The jointed
puppet stands on the floor: A/D or arrows walk, W/Up/Space jumps, `R` restarts.
`F1` shows FPS, hitboxes, tile collision and the rig's joint dots.
**Sizes now switch:** Q/E, 1/2/3 or the mouse wheel; the puppet eases to
the new size over 200 ms, the limbs wobble and the light pool widens or
narrows. Going Tiny lets you crawl under the centre pillar (the Act 1
puzzle, PRD 4.5). Growing where there is no room (Tiny in that gap) is
refused: the puppet shivers with its arms pulled in. Next to a wall it
slides out just enough to grow. **The wax melts** (120 s at Normal, 60 s
Huge, 160 s Tiny), the light dims below 30, and the two wax drops refill
it. At 0 the puppet goes limp, the curtain closes and R restarts.

### Re-plan (2026-10-17, from the official handbook)

- **Judging round 1 is only the 3-minute trailer**: 2:00+ of real
  screen-recorded gameplay, and it must show how each theme is used. The
  top 5 trailers get their games played, so the build must be stable
  from title to "Fin.". Scoring is in `PRD.md` §2.1: themes are 30%, with
  10 of that for multi-theme synergy.
- So the plan is now driven by **footage**: every block in `PRD.md` §11
  says which shot it unlocks, and §12 has the shot list.
- **Cut:** Act 4 / drafts, gamepad, the 4.9 tutorial (the `?` hints teach
  instead), act select, results card, credits screen, settings, continue /
  new show. **Optional:** moths + Act 3. **Never cut:** sizes, wax with its
  visible burn rate, Act 2, the fire finale, the 23:30 freeze.
- Submit = Google Drive trailer link + **public** GitHub repo with all code
  and assets (the PNGs below that were never committed must be in it).

### Handover notes (2026-10-16, end of the first shift)

- **First time on this repo?** Accept the GitHub collaborator invite, then
  `git clone`, `npm ci` (not `npm install`: it uses the exact versions in
  `package-lock.json`), `npm run dev`. Start Claude Code with: *"Read
  NOTES.md and continue from the next task."*
- **Not in git yet:** `public/assets/images/bg_act1.png`, `bg_act2.png`,
  `bg_act3.png` and `lantern.png` exist only on the first teammate's
  machine. They are not wired in (boxes unticked, `ready: false`), so the
  game does not need them; ask for them to be committed before working
  on backdrops or checkpoints. When they arrive: check the size against
  `ASSETS.md`, tick the box, flip `ready`, add a CREDITS.md row (all art so
  far is "AI-generated (ChatGPT)").
- **`PALETTE.md` has a stray `I ` typed before its title** on the first
  teammate's machine (uncommitted). Harmless; just delete it if it shows up.
- **The tests mentioned in the build log are NOT in the repo.** The level
  validator (9), corner correction / one-way shelves (17) and pose choice (9)
  were checked with throwaway Node scripts during development. If you change
  those files, re-check them by hand or ask Claude Code to test them again.
- **Act 1 cannot be finished until M2's Tiny size exists** - the pillar gap is
  the puzzle, not a bug.

---

## Next up

In order. Clock times are from `PRD.md` §11; if a block runs over, cut
from the bottom of §11's cut list instead of pushing the freeze.

**M2, by Sat 12:00:**

1. **Look at M2 in a browser, then tick PRD M2 items 1-4.** The logic is
   tested (41 Node checks) but nobody has watched it yet: check the feet
   stay planted, the 200 ms ease looks smooth, the limb wobble is not too
   much (`CONFIG.rig.sizeWobble`), pressing E while Tiny in the pillar gap
   shivers instead of growing, the HUD candle shrinks faster when Huge,
   the two wax drops refill it, and that standing still as Huge for 60 s
   ends in the limp puppet, the curtain and "Press R". Tip: set
   `CONFIG.wax.start` to 5 while checking the game over, then put it back.
   (A headless run on 2026-10-17 showed sizes, HUD dots and wax drops
   working, but nobody has played it by hand yet.)
2. **Listen to the sounds and tune volumes** in `src/assets.js`. Jump and
   grow are now capped in code (see the build log); adjust `maxMs` /
   `fadeMs` there if the cut sounds wrong.
3. **Fill in `music_theme`'s title and author** in CREDITS.md (unknown
   when it was added).
4. **Checkpoint: Act 1 is fun to play.** It has now been finished in a
   browser for the first time (2026-10-17: door → the M0 "FIN." placeholder,
   because Act 2 does not exist yet; that is expected).

**Then:**

5. **Sat 12:00–13:00: burn rate visible** (`PRD.md` 4.3.1): the HUD flame
   size, wax drips and a `×0.75 / ×1 / ×2` tag react to `SIZE_CHANGED`. Plus
   the H hide-HUD key and dev act-skip keys (needed to record takes).
6. **Sat 13:00–17:00: M3**: crates (Huge only), switches, gates, `?` hints
   in Acts 1–2, **Act 2** solvable.
7. **Sat 17:00–20:30: fire finale**: burning paper, holes, falling restarts,
   hit feedback, **Act 5** solvable. **At 19:30 decide on moths** (§11).
8. **Sat 20:30–22:30: show polish**: act cards, the real ending and "Fin."
   (replace `EndScene`), on-camera juice, sound pass.
9. **Sat 22:30–23:30: deploy + full playthrough + README.** Then **freeze**.
10. **Off-shift, before Sat 20:00:** write the shot list (`PRD.md` §12) and
    film the real-candle teaser shots.

---

## Build log

Newest first. One entry per finished feature.

### 2026-10-17 - Re-plan from the official handbook (docs only)
*Claude Code - no game code changed*

The deadline is Sun 18 Oct 09:30 (confirmed with the team). Round 1 judges
only the trailer, so `PRD.md` now has the scoring (§2.1), a spec for making
"bigger shadow = faster burn" visible (4.3.1), a trimmed §9 (cuts marked
CUT / OPTIONAL, H and act-skip keys moved up to M2), a clock-time schedule
with a **23:30 Saturday freeze** and 8.5 h for the trailer (§11), and a
gameplay shot list mapped to themes (§12).

**Files:** `PRD.md`, `NOTES.md`

### 2026-10-17 - Jump and grow sounds capped
*Claude Code - commit (see `git log`, "Cap sfx_jump")*

The files ran 3.6 s (jump) and 3.5 s (grow). No audio tool was on the
machine, so they are capped **in code**, not trimmed: an sfx entry in
`assets.js` may have `maxMs` / `fadeMs`, and `AudioManager.playCapped`
plays a Phaser marker of that length (Web Audio cuts it even if the scene
ends) with a volume fade over the last `fadeMs`. Jump: 400 / 80 ms. Grow:
800 / 150 ms. Measured in headless Chrome: jump 402 ms, grow 804 ms;
everything else unchanged, no console errors.

**Files:** `assets.js`, `systems/AudioManager.js`

### 2026-10-17 - First real sounds and the theme music
*Claude Code - commit (see `git log`, "Sound")*

Seven files in: `sfx_crackle`, `sfx_grow`, `sfx_shrink`, `sfx_jump`,
`sfx_hurt`, `sfx_wax` and `music_theme` (boxes ticked, `ready` flipped,
CREDITS.md rows). **`sfx_wax` is a WAV** (made in jsfxr): no converter was
on the machine and it is 7 KB, so the loader path was changed to `wax.wav`
instead of converting; ASSETS.md notes the exception.

`systems/SoundCues.js` is **one table of event -> sound key**, so no game
object knows about audio; adding a sound is one line. It also starts the
music and the crackle loop (heard at 0.2, fading with the wax below 30,
paused with the pause menu, destroyed on restart). `AudioManager` gained
`startLoop` and `playMusic`; music is game-wide and keeps playing through R
instead of starting over. Volumes: an asset's `volume` x
`CONFIG.audio.sfxVolume` (0.8) or `musicVolume` (0.4); the whooshes are 0.3.
`sfx_hurt` is wired to `PLAYER_HURT`, which nothing emits until M4.

**Checked in a real (headless) Chrome:** all 7 load and decode, no console
errors, each sound fires on its moment (jump, grow, shrink, wax pickup),
exactly one music and one crackle are playing at any time, the crackle
stops while paused and does not double after R. Also the first time the M2
sizes were seen running.

**Files:** `systems/SoundCues.js`, `systems/AudioManager.js`,
`systems/SizeEffects.js`, `objects/WaxDrop.js`, `scenes/GameScene.js`,
`scenes/TitleScene.js`, `assets.js`, `ASSETS.md`, `CREDITS.md`,
`.gitattributes`, `public/assets/audio/`

### 2026-10-17 - M2: candle out -> curtain -> R to restart
*Claude Code - commit (see `git log`, "M2: candle out")*

On `WAX_OUT`, `systems/CandleOut.js` switches the keys off
(`player.controls.enabled = false`: every PlayerInput question answers
"nothing pressed"), makes the puppet go limp (new `limp` pose: joints hang
on looser springs, rig sags 8 px), waits `CONFIG.candleOut.limpMs`, closes
the new reusable `ui/Curtain.js`, and fades in "The candle went out /
Press R to try again". The existing R key does the restart. The polished
version (flame dying, smoke, ink text, 450 ms curtain flick) is M5. The
door half of this item was already done. 4 Node checks pass.

**Files:** `systems/CandleOut.js`, `ui/Curtain.js`, `systems/PlayerInput.js`,
`systems/PuppetPoser.js`, `objects/PuppetRig.js`, `scenes/GameScene.js`,
`config.js`

### 2026-10-17 - M2: the wax timer and wax drops
*Claude Code - commit (see `git log`, "M2: wax timer")*

`systems/Candle.js` (in GameScene, so pausing stops it) melts
`CONFIG.wax.baseDrain` x the size's `waxMultiplier` per second and
announces `WAX_CHANGED { wax, max }` every frame; the HUD candle already
listened. It also dims the stage light below `lowThreshold` (30), fires
`WAX_LOW` once per crossing, and `WAX_OUT` exactly once at 0 (nothing
reacts to WAX_OUT yet - next task). `objects/WaxDrop.js` (`w`) bobs,
announces `WAX_PICKED_UP { amount: 20 }` and fades; it is **hidden, not
destroyed**, so the overlap never touches a dead object. Pickups are
**capped at 100** (open question 9 answered). 10 Node checks pass
(120 / 60 / 160 s drain, mid-act size change, cap, low, out).

**Files:** `systems/Candle.js`, `objects/WaxDrop.js`,
`systems/ObjectSpawner.js`, `scenes/GameScene.js`, `scenes/UIScene.js`,
`config.js`

### 2026-10-17 - M2: growing refused when there is no room
*Claude Code - commit (see `git log`, "M2: refuse to grow")*

Before growing, `SizeChanger.findRoom()` tests the bigger body (standing
on the same feet) against colliding tiles and the stage edges. It tries
centred first, then **slid sideways by half the extra width**: without
the slide you could never grow while standing against a wall. The test
rect is inset 1 px so merely touching the floor does not count. One-way
`=` shelves count as blocking. If there is no room it emits
`GROW_BLOCKED`; `SizeEffects` shivers the rig (`rig.shake`, picture only),
plays the new `squeeze` pose (arms in tight) and calls
`AudioManager.playSfx('sfx_squeeze')`, which stays silent until the file
exists. 11 Node checks against the real Act 1 map pass (pillar gap,
walls, ceiling). Props (crates, moths) are **not** tested - open question 3.

**Files:** `systems/SizeChanger.js`, `systems/SizeEffects.js`,
`systems/AudioManager.js`, `systems/PuppetPoser.js`, `objects/PuppetRig.js`,
`objects/Player.js`, `config.js`

### 2026-10-17 - M2: the three sizes
*Claude Code - commit (see `git log`, "M2: the three sizes")*

Q/E, 1/2/3 and the mouse wheel switch Tiny / Normal / Huge.
`systems/SizeChanger.js` (owned by Player) swaps the size state and the
hitbox **at once**, so you can never walk into a gap you no longer fit, and
eases `visualScale` (which the rig now draws from) over
`CONFIG.player.sizeTweenMs`. It announces `SIZE_CHANGED { sizeIndex,
previousIndex }`; `systems/SizeEffects.js` reacts by easing the light pool
(`CONFIG.glow.scale*`) and kicking the limb springs
(`PuppetPoser.wobble`). A wheel flick fires a burst of events, so the wheel
waits `CONFIG.controls.wheelCooldownMs` between steps. `LEVEL_READY` now
carries `sizeIndex` so R resets the HUD dots. 16 throwaway Node checks pass
(input and changer); **not yet watched in a browser** (see Next up).

**Files:** `systems/SizeChanger.js`, `systems/SizeEffects.js`,
`systems/PlayerInput.js`, `systems/PuppetPoser.js`, `objects/Player.js`,
`objects/PuppetRig.js`, `scenes/GameScene.js`, `scenes/UIScene.js`, `config.js`

### 2026-10-16 - M1 complete: land pose; poser split out of the rig
*Claude Code - commit `62cb786`*

The land pose (PRD 4.2.1) existed in CONFIG but was never chosen; it now
plays on touch-down after real air time (not on spawn). Squash and stretch
scale the whole puppet from the feet. Deciding poses moved to
`systems/PuppetPoser.js` (PuppetRig was 242 lines); every future pose goes
there. 9 Node tests on pose choice and walk phase pass.

**Files:** `systems/PuppetPoser.js`, `objects/PuppetRig.js`, `config.js`

### 2026-10-16 - Corner correction and one-way platforms
*Claude Code - commit `e73d5e5`*

`systems/CornerCorrection.js` slides you round a ceiling corner clipped by
8 px or less, and pops you onto a ledge missed by 6 px or less (airborne,
pushing towards it, with room to stand). `=` tiles collide on their top
face only; Down + Jump opens a 250 ms drop-through window
(`systems/PlatformDrop.js`). 17 Node tests pass. **Act 1 has no `=` tiles**,
so shelves cannot be seen in play until a level uses them. Key reading
moved to `systems/PlayerInput.js` (Player was 210 lines).

**Files:** `systems/CornerCorrection.js`, `systems/PlatformDrop.js`,
`systems/PlayerInput.js`, `objects/Player.js`, `systems/LevelLoader.js`,
`scenes/GameScene.js`, `core/constants.js`, `config.js`

### 2026-10-16 - M mute, F fullscreen, no page scrolling
*Claude Code - commit `bca8858`*

`systems/GlobalKeys.js` binds M and F; used in TitleScene and UIScene (which
runs through the act and the pause menu). The HUD shows "SOUND OFF" while
muted. Arrows and Space are captured so the page never scrolls.

**Files:** `systems/GlobalKeys.js`, `scenes/UIScene.js`, `scenes/TitleScene.js`,
`main.js`

### 2026-10-16 - Pause menu and auto-pause
*Claude Code - commit `7190d25`*

Esc or P opens `scenes/PauseScene.js` (Resume, Restart act, Sound on/off,
Back to title); GameScene is paused whole, so nothing moves or drains
behind it. It also opens on window blur / hidden tab. Built from two
reusable pieces: `ui/PaperPanel.js` and `ui/MenuList.js`.
`systems/AudioManager.js` owns mute.

**Files:** `scenes/PauseScene.js`, `scenes/GameScene.js`, `ui/PaperPanel.js`,
`ui/MenuList.js`, `systems/AudioManager.js`, `main.js`, `config.js`

### 2026-10-16 - Puppet joints aligned to the art
*Claude Code - commit `9d88144`*

From the F1 screenshot, zoomed and checked row by row against the PNG:
shoulders moved from helmet height (y 46) to where the neck widens (y 66);
hips nudged forward under the tunic hem. `CONFIG.rig.centreX` (50) puts
the torso, not the image centre, over the hitbox (the cape fills the back
of the image).

**Files:** `config.js`, `objects/PuppetRig.js`

### 2026-10-16 - Rods follow raised arms; credits; PRD moth section
*Claude Code - commits `51b4bf4`, `c1e6d93`, `eb9a797`, `5f28403`*

The landing play-test showed the rods ending on the opposite side from a
raised arm. `handPosition()` had the sine's sign flipped: Phaser rotates
`(x, y)` to `(x*cos - y*sin, ...)`, so a hanging arm ends at `-length*sin`.
Invisible while arms hang straight; up to ~67 px wrong in the jump and fall
poses. Verified against Phaser's own rotation.

All eight real images are credited as AI-generated (ChatGPT). The team's
PRD edit is committed as-is (palette, candle-centred glow, new "Moth flight
feel" section); it had also un-ticked M0, so a separate commit re-ticks it.

**Files:** `objects/PuppetRig.js`, `CREDITS.md`, `PRD.md`

### 2026-10-16 - Real crate, door, gate, moth and switch art
*Claude Code - commit `c015a20`*

All five match ASSETS.md exactly and use `#0b0806`; boxes ticked, `ready`
flags flipped. They load over the placeholders through the same pending-key
swap as the puppet, with sprite-sheet frames kept (moth wing beat, switch
pressed). Only the door is in play now; the rest wait for M3/M4.

**Files:** `assets.js`, `ASSETS.md`, `CREDITS.md`, `public/assets/images/`

### 2026-10-16 - Sharp text and art, smaller candle light
*Claude Code - commit `a9f3277`*

Text looked blurry because the game was drawn at 1280x720 and stretched to
fit the window (~1.7x on a 1440p screen). Raising text resolution alone
cannot fix that, so the canvas is now drawn at `CONFIG.render.scale` (2x)
and every scene calls `fitCamera(this)` (`core/camera.js`) to zoom back to
the 1280x720 stage. Text styles render at the same scale; the text shadow
is tighter. The candle light radius went from 1200 to 700 px, as asked.
The F1 view moved out of GameScene into `systems/PhysicsDebugView.js` to keep
the scene under 200 lines.

**Files:** `core/camera.js`, `config.js`, `main.js`, every scene,
`systems/PhysicsDebugView.js`

### 2026-10-16 - Exit door with a glow
*Claude Code - commit `f4d8883`*

The door is the first object built from the map. A soft `accent` glow
breathes behind it (PALETTE.md "The goal glows"), because the light now
follows the puppet and the far side of the stage is dark. Touching it
unlocks the next act and moves on, or goes to the ending after the last
act; the curtain and results card are M5. `systems/ObjectSpawner.js` holds
the symbol-to-object factory table: every object answers
`onPlayerTouch(player)`, so one overlap rule wires them all.

**Files:** `objects/Door.js`, `systems/ObjectSpawner.js`, `scenes/GameScene.js`

### 2026-10-16 - Act title moved onto the UI layer
*Claude Code - commit `96acb26`*

The title was drawn inside the stage, so the Act 1 pillar cut through it.
It now lives in UIScene, above everything: uppercase, letter-spaced, light
with a soft shadow. The first title arrives as scene data, later ones via
`EVENTS.LEVEL_READY`.

**Files:** `scenes/UIScene.js`, `scenes/GameScene.js`

### 2026-10-16 - Midnight Teal palette, light from the candle
*Claude Code - commit `fee4326`*

`PALETTE.md` is the colour source and `CONFIG.palette` mirrors its tokens
exactly; every old token was migrated. The light is an opaque gradient
through `paperStops` that **follows the puppet** (the candle is held behind
it). Vignette and grain are baked at boot. The HUD flame has an additive
halo. Text styles collapsed into one light-with-shadow set.

**Files:** `config.js`, `systems/StageTextures.js`, `objects/PaperScreen.js`,
`systems/PropTextures.js`, `ui/WaxCandle.js`, `ui/SizeDots.js`, all scenes,
`main.js`, `public/style.css`

### 2026-10-16 - Puppet size and rod fixes
*Claude Code - commit `28e8d7d`*

The puppet art is drawn at 2x Normal (ASSETS.md) but was shown at full size,
four tiles tall on a two-tile hitbox; `CONFIG.rig.artScale` (0.5) fixes it.
The rods were vertical lines from the hand, so every idle arm sway slid the
whole line sideways and it looked like shaking; the top of each rod is now
held still above its shoulder and only the bottom follows the hand.

**Files:** `objects/PuppetRig.js`, `objects/RigDebugDots.js`, `config.js`

### 2026-10-16 - M1: jointed puppet rig
*Claude Code - commit `19196a0`*

The real art is assembled into a jointed cut-out driven by damped springs
(`systems/JointSpring.js`), so limbs lag, overshoot and settle instead of
snapping between poses. The walk cycle advances with **distance moved**,
not time - that is what stops the feet sliding at any speed or size. Idle,
walk, jump and fall poses are in; the rest arrive with their mechanics.

`CONFIG.rig.mounts` became four explicit points instead of one symmetric
offset, because the art is not centred in its canvas. **The values are a
first estimate and still need aligning by eye - see Start here.**

**Files:** `objects/PuppetRig.js`, `objects/RigDebugDots.js`,
`systems/JointSpring.js`, `config.js`, `scenes/GameScene.js`

### 2026-10-16 - M1: player movement
*Claude Code - commit `bea1dce`*

The player is an **invisible** Arcade body; the rig is what you see. Coyote
time, jump buffer, variable jump height, acceleration/friction and fast
fall, all driven by delta so 60 Hz and 144 Hz play the same. Key bindings
moved to `CONFIG.controls`.

Settles open question 4: Tiny is exactly one tile tall and a crawl gap is
exactly one tile high, and Arcade snags on a zero-clearance fit, so
`CONFIG.player.bodyClearancePx` trims 2 px off every size.

**Files:** `objects/Player.js`, `config.js`, `systems/LevelLoader.js`,
`scenes/GameScene.js`

### 2026-10-16 - M1: level loading and validation
*Claude Code - commit `3723eb1`*

Act 1's map strings become a real tilemap with solid walls.
`systems/LevelValidator.js` checks a map before anything is built and names
the act, row and column for wrong row lengths, unknown symbols, a missing
or duplicated `P`/`D`, and `?` markers with no hint text. **9 tests, all
passing.** `LevelLoader` uses a symbol-to-tile table and a spawn list, so a
new hazard is one line rather than another `if/else` branch.

**Files:** `systems/LevelLoader.js`, `systems/LevelValidator.js`,
`core/constants.js`, `systems/StageTextures.js`, `scenes/GameScene.js`

### 2026-10-16 - M1: real puppet art wired in
*Claude Code - commit `c2e3b08`*

The three puppet PNGs match ASSETS.md exactly (80x120, 24x72, 28x64, RGBA,
`#0b0806`). Boxes ticked and `ready` flags flipped.

This exposed a trap worth knowing: Phaser **refuses to overwrite a texture
key already in use** - it logs a red error and throws the new file away. So
loading onto `puppet_body`, which BootScene had already filled with a
placeholder, would have silently discarded the art. PreloadScene now loads
under a `pending:` key and renames it over the placeholder once it arrives.

**Files:** `scenes/PreloadScene.js`, `assets.js`, `ASSETS.md`, `CREDITS.md`

### 2026-10-16 — Lighting fix after first play-test
*Claude Code · commit `208cc6c`*

The first run blew out to pure white across the middle of the screen and the
body text was almost invisible. Two stacked causes:

- the paper texture already carried a bright radial gradient **and** the glow
  was drawn over it with an `ADD` blend, so 242 + 242 clipped to white
- text was paper-coloured, which disappears on lit paper

Fixed by making `paper_bg` the **dim, unlit** paper (new
`palette.paperDim`) and painting the glow over it normally, so the brightest
point lands on `palette.paper` and cannot clip. Verified numerically: the
centre composites to (246, 222, 175) against a target of (242, 214, 162),
no channel reaching 255. Text styles are now grouped by background.

**Files:** `config.js`, `systems/StageTextures.js`, `objects/PaperScreen.js`,
all five scenes, `ui/WaxCandle.js`, `ui/SizeDots.js`

### 2026-10-16 — M0 setup complete
*Claude Code · commits `39b8465`, `0528efa`*

- Engine swapped from the template's Phaser 4 to **Phaser 3.90.0**, as
  `PRD.md` 6.1 requires. Dependencies are exactly `phaser` + `vite`;
  `npm audit` reports **0 vulnerabilities**.
- Full folder structure from `CODE_RULES.md` §3. `config.js` holds every
  tunable number; `assets.js` mirrors all 46 entries in `ASSETS.md`.
- Four texture generators draw a placeholder for **every** image key, so the
  game runs with zero asset files and a clean console.
- `core/`: constants, event names, `EventBus`, and `Listeners`, which removes
  EventBus handlers on scene shutdown so a restart cannot double them up.
- `states/`: Tiny/Normal/Huge reading their numbers from `CONFIG`.
- HUD wax candle and size dots, wired to the EventBus, waiting for real wax
  values in M2.
- Seven scenes; Boot → Preload → Title → Game + UI runs end to end.
- `F1` developer mode: FPS counter and physics bodies.
- Removed the template's `log.js`, which pinged an external domain on every
  dev and build run (`SECURITY.md` rule 7).
- `.gitignore` per `SECURITY.md` rule 2, plus `.gitattributes` so line-ending
  churn does not wreck handover diffs.

---

## Not built yet

- **Acts 2, 3 and 5 are not written; Act 4 is cut** (re-plan 2026-10-17).
  Act 1 can be finished; its door leads to the M0 placeholder "FIN." screen
  because `src/levels/index.js` lists only `act1`.
- The visible burn rate (PRD 4.3.1): the HUD candle does not yet show
  that Huge burns faster, beyond shrinking faster.
- Crates, switches, gates, moths and lanterns (drafts are cut). `LevelLoader`
  already records where each one goes (`spawns`). The door and wax drops
  are built.
- Size-change juice from PRD 5.1: afterimage copies, light "breath",
  whoosh. Hooks go in `systems/SizeEffects.js`.
- Sounds: 7 of 26 files are in (see the build log). Real art so far: the puppet parts, crate, door, gate,
  moth and switch. Everything else in `ASSETS.md` is still a placeholder.
- `src/fx/` is an empty placeholder (see the README inside it) — M5.
- `vercel.json` — M5.
- The tutorial, settings, act select and results card — M5 (the pause menu exists).

---

## Gotchas (do not learn these twice)

- **Phaser 3, not Phaser 4.** The scaffold shipped Phaser 4; `PRD.md` 6.1
  asks for Phaser 3, so we downgraded to 3.90.0. When you search for help
  online, check the answer is for **Phaser 3** — the APIs differ.
- **`ready` flags in `src/assets.js`.** Only entries with `ready: true` are
  requested from the server. This is what keeps the console free of 404s
  while the art does not exist. **When you add a real file you must flip
  that flag**, or the game keeps using the code-drawn placeholder and you
  will think your file is broken.
- **Colours come from `PALETTE.md`.** Change that file first, then
  `CONFIG.palette`; no code names a colour. All text styles are light with a
  soft dark shadow, so one set works everywhere (the old `onPaper`/`onDark`
  split is gone).
- **The big stage light is opaque, not additive.** Its outer colour equals
  the dark base, which is why there is no seam. Only SMALL glows (the HUD
  flame halo, the door) use additive blending.
- **The light follows the puppet** (GameScene.update calls
  `paperScreen.setLightSource`). If the team decides the glow should come
  from the HUD candle instead, change that one line to the candle's flame
  position.
- **Every scene that draws must call `fitCamera(this)` first.** The canvas
  is 2560x1440 (render scale 2) and the camera zoom is what maps it back
  to the 1280x720 stage. A new scene without it draws in the top-left
  quarter. GameScene also pins the physics world to 1280x720.
- **The puppet art is drawn at 2x.** Anything that scales the rig must use
  `rig.displayScale` (size scale x `CONFIG.rig.artScale`), not the size
  state's scale alone.
- **Phaser refuses to overwrite a texture key.** It logs a red error and
  discards the new file. Real art must be loaded under a temporary key and
  renamed over its placeholder - `PreloadScene` already does this, so just
  flipping `ready` is enough.
- **The rig is visual only.** Limbs never collide and never change the
  hitbox. If you find yourself giving a limb a physics body, stop.
- **Bind `GlobalKeys` in only one running scene.** It is in TitleScene and
  UIScene, which are never running at the same time. Add it to a scene that
  runs alongside either and one press of M or F toggles twice.
- **The player's keys are `player.controls`, not `player.input`.** Phaser
  game objects already own a property called `input`.
- **Game-wide events (`this.game.events`) outlive scenes too.** GameScene
  removes its blur/hidden listeners on shutdown by hand; copy that pattern.
- **Keep files under ~200 lines by splitting jobs, not by deleting
  comments.** Every split so far has a clear job: PlayerInput (keys),
  PuppetPoser (poses), PhysicsDebugView (F1), ObjectSpawner (factories).
- **`EventBus` outlives scenes.** Always register through
  `core/Listeners.js`, which removes handlers on shutdown. A raw
  `EventBus.on()` in a scene survives `R` restarts and ends up firing twice,
  which looks like a physics bug and eats hours.

- **PRD.md section 5 has a "Moth flight feel" spec** (added 2026-10-16,
  commit `eb9a797`): effort-driven flap rate, squash and stretch, banking,
  flutter noise, attraction to flames, swat spin. Read it in full before
  building moths (M4); do not rely on older notes or memory.
- **Rotating a point by hand?** Phaser's rotation is
  `(x*cos - y*sin, x*sin + y*cos)`. Getting the sign wrong mirrors the
  result, and it hides when the angle is near zero.
- **Sounds are game-wide; `scene.events` survives R.** A looping sound
  started in a scene must be destroyed on `shutdown`, and any handler put
  on `scene.events` (pause/resume) removed by hand, or every restart adds
  another crackle. See `SoundCues.startCrackle`.
- **A looping Phaser sound is TWO audio nodes** (it queues the next loop
  ahead for a seamless join), and `resume()` builds new ones. Counting
  node starts makes one loop look like two.
- **Testing without the Chrome extension:** start Chrome with
  `--headless=new --remote-debugging-port=9333` and drive it from Node
  over the DevTools protocol (Node 24 has `WebSocket` built in). Turn on
  `Emulation.setFocusEmulationEnabled`, or the game never sees a key. A
  mouse click on the title screen also starts the act.
- **Never read `JustDown` inside `.some()`.** It stops at the first true
  key, and an unread key keeps its "just down" flag and fires a frame
  late. `PlayerInput.anyJustDown` reads every key with `map` first.
- **Port 8080 can be taken by a Windows service.** On the second
  teammate's machine `AgentService.exe` listens there, so `npm run dev`
  fails with `EACCES ... 8080`. Do not kill it; run
  `npx vite --config vite/config.dev.mjs --port 5174` instead.
- **Stage files by name when committing.** `git add -A` will sweep in docs
  a teammate is in the middle of editing.

---

## Open design questions (decide these during M1–M4)

None of these is answered by the PRD, and each is a bug waiting to happen.
Decide when you reach the relevant milestone, then **write the answer here**.

**Sizes and growing (M2)**
1. A gust forces you Tiny and you crawl into a 1-tile tunnel. The gust ends.
   Do you stay Tiny until you reach open space? (Suggested: yes — the
   existing "is there room?" check handles it for free.)
2. Does a gust reach you if you are Huge but standing in a shelter `|`?
   ("Shelters are where drafts don't reach" suggests you are immune.)
3. The grow check tests **tiles**. It does not test crates or moths, so you
   can currently grow into one. Should props count as blocking?
4. ~~Tiny's body is 40 px tall and a 1-tile gap is 40 px: an exact fit.~~
   **ANSWERED in M1:** `CONFIG.player.bodyClearancePx` trims 2 px off every
   size, so no size ever has to fit a gap with zero clearance.
5. If a gust snatches Huge away 1.4 s after you paid for it, does that feel
   like challenge or theft? Consider refunding the wax.

10. With the light radius now 700 px, silhouettes stay readable (about
    2.6:1) out to ~430 px from the candle and drop below 2:1 past ~525 px
    (checked numerically). Most of the stage is now in that dark zone at any
    moment. PALETTE.md suggests a thin
    `accent` rim light on edges in the dark. Decide once it has been seen.

**Hazards and level design (M4)**
6. A hole opens under a Huge player. Huge is 2 tiles wide, so it can straddle
   a 1-tile hole. Does straddling save you?
7. Can fire burn away the **only** route to the exit? In Act 5 the fire must
   chase from behind, or the act becomes unwinnable with wax still on the
   clock.
8. Tiny cannot press switches, so any switch reachable only through a
   Tiny-sized gap makes a level unsolvable. A level-design rule to respect,
   not a code fix.
9. ~~A wax drop at 95/100 wastes 15. Cap it, or allow a brief overfill?~~
   **ANSWERED in M2:** capped at `CONFIG.wax.max` (`Candle.add`). Simple,
   and it rewards saving drops for later. Revisit if play-tests disagree.

---

## Numbers worth knowing

Checked against the PRD's own values, with `gravity = 1400`:

| Size | Jump height | Horizontal reach |
| --- | --- | --- |
| Tiny | 66 px (1.65 tiles) | ~4.0 tiles |
| Normal | 104 px (2.6 tiles) | ~4.2 tiles |
| Huge | 165 px (4.1 tiles) | ~3.9 tiles |

Act 1's design claim checks out exactly: a 2-tile step is impossible at Tiny
and clears at Normal. Note that all three sizes cross roughly the **same
horizontal gap** — only height separates them. That is quietly elegant (gaps
stay fair at any size, ledges become the real gate) and worth preserving if
anyone retunes the jump numbers.

**Wax budget**, with `baseDrain = 100/120`: always Tiny = 160 s, always
Normal = 120 s, always Huge = 60 s. One wax drop buys 24 s of Normal or 12 s
of Huge. So an act built for ~90 s of relaxed play has ~30 s of slack —
enough for about 15 s of Huge **or** two mistakes, not both. An act needing
more than 120 s of Normal play is unwinnable by construction.

---

## Known deviation from CODE_RULES

`src/config.js` is **444 lines** (it was 271 at M0), over the "split at
~200" guidance in rule 2. Left whole on purpose: rule 5 says every number
lives in `config.js` and rule 6.5 names it one of exactly three singletons.
Most of the growth is the rig poses, palette, text styles and UI settings,
and roughly a third of it is comments.

If it keeps growing, the clean fix is to split it into small files under
`src/config/` (e.g. `rig.js`, `palette.js`) that `config.js` gathers into
the one `CONFIG` object, so nothing that imports CONFIG has to change.
That changes CODE_RULES section 3's folder layout, so it is a team
decision, not something to do quietly.

---

## Entry template (copy this into the Build log)

```
### YYYY-MM-DD — what you built
*Who · commit `abc1234`*

What changed and why, in two or three sentences. Mention anything the next
person would be surprised by.

**Files:** path/one.js, path/two.js
```
