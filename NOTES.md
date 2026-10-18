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
| **Milestones done** | **M0**, **M1**, and **M2** items 1-5 (play-tested by the team 2026-10-17). M2 items 6 (burn rate) and 7 (H + dev keys) are built; only items 1-5 were ticked |
| **Milestone in progress** | **M5 — Show polish: act cards, the ending, the juice and `vercel.json` are done and ticked.** Left in M5: the sound pass (needs the missing audio files) and the Vercel deploy. M4 is complete; moths + Act 3 stay optional |
| **Does it run?** | Yes — `npm run dev`, then http://localhost:8080 (see Gotchas if 8080 is taken) |
| **Engine** | Phaser **3.90.0** (not 4 — see Gotchas) |
| **Deadline** | **Sun 18 Oct 2026, 09:30 PKT** (aim 09:00). **Feature freeze Sat 17 Oct, 23:30** — after that, trailer only. Timeline: `PRD.md` §11 |
| **Shipping acts** | **All five**: I Tiny, II The Giant, III Moths to the Flame, IV The Draft, Finale The Last Act. The order IS `ACTS` in `levels/index.js` |
| **Desktop builds** | `desktop/` (Electron) makes a Windows zip and two macOS zips into `desktop/out/` (git-ignored). `cd desktop && npm ci && npm run build`, then `npm run selftest`. Windows tested; **macOS built on Windows, never run on a Mac** |
| **Next task** | **RECORD THE TRAILER.** All five acts are now redesigned and tested (Act I teaches the keys and has lantern checkpoints, Act II's gate is timed, Act III has lure lanterns, Act IV has the ride-the-gust gap, Act V has the final exam). It is the round-one submission and 30% of the score, and the deadline is 09:30 today. All five acts play, Act I teaches the keys, Act II's gate is timed. The two remaining redesign items -- Act III's moth-luring lanterns and Act V's combined final section -- are improvements to acts that already work, so they only happen if the trailer is cut and uploaded with time to spare. Still outstanding either way: **no human has played Acts III and IV, the act cards or the ending** |

**What you see if you run it now:** the title screen in the Midnight Teal
palette → `Space` → **Act 1's real stage**: solid walls built from the map
strings, a warm pool of candlelight that follows the puppet and fades into
teal darkness, the exit door glowing at the far right, the act title on top,
the wax-candle HUD bottom-left and the size dots bottom-right. The jointed
puppet stands on the floor: A/D or arrows walk, W/Up/Space jumps, `R` restarts.
`F1` shows FPS, hitboxes, tile collision and the rig's joint dots.
**Act 2 "The Giant"** follows Act 1's door: grow Huge to climb, push the
crate into the notch onto the switch, shrink through the gate's doorway,
grow again to reach the door (which then shows the "FIN." placeholder).
Hints unfold on both acts when you walk near the `?` spots.
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
- ~~**The tests mentioned in the build log are NOT in the repo.**~~
  **They are now** — `tools/headless/`, with its own README. No npm
  packages: Node built-ins and whatever Chrome is installed. Every
  "checked in headless Chrome" line below can be re-run.
- **Act 1 cannot be finished until M2's Tiny size exists** - the pillar gap is
  the puzzle, not a bug.

---

## Next up

In order. Clock times are from `PRD.md` §11; if a block runs over, cut
from the bottom of §11's cut list instead of pushing the freeze.

**M2 is play-tested** (2026-10-17: sizes, burn rate, wax drops, candle out
and H all work). Still open from it: tune sound volumes in `src/assets.js`,
and fill in `music_theme`'s title and author in CREDITS.md.

**Then:**

1. **Play-test today's fixes** (2026-10-17 afternoon, see the build log):
   the crate stagehand, the new HUD candle and "WAX 87%" / "BURNING FAST",
   the title plate, the backdrops, the glowing wax drops. A human has still
   **not played Act 2**; it was solved by script only. **Music is OFF**
   (`CONFIG.audio.musicOn`) while testing: turn it on for the trailer.
2. **Fire finale: DONE** (burning paper, holes, falling restarts, hit
   feedback, Act 5). **Play-test Act 5:** is the chase scary but fair for
   someone new? Tune `CONFIG.fire` only: `startDelaySeconds`, `speedStart`
   / `speedEnd` / `rampSeconds`, `burnToHoleSeconds`.
   **At 19:30 decide on moths** (§11); read PRD 5's "Moth flight feel" first.
3. **Sat 20:30–22:30: show polish.** Act cards, the real ending, and the
   on-camera juice are **DONE** (see the build log). Still open: the
   **sound pass** (volumes in `src/assets.js`, `CREDITS.md`, and music is
   still switched OFF in `CONFIG.audio.musicOn`). **Play-test the
   ending** and tune `CONFIG.ending` — `puppetScale` and `zoomTo` decide
   how close the curtain call feels.
4. **Sat 22:30–23:30: deploy + full playthrough + README.** `vercel.json`
   is ready and its headers are already proven against the built game, so
   this is: connect the repo to Vercel, deploy, put the live URL in front
   of `/og-image.png` in `index.html`, then F12 → play Act 1 on the live
   link. Then **freeze**.
5. **Off-shift, before Sat 20:00:** write the shot list (`PRD.md` §12) and
   film the real-candle teaser shots.
6. **Desktop builds:** somebody with a Mac should unzip
   `ShadowPlay-mac-arm64.zip` and check it opens (README "Play the game:
   executables"). Upload the three zips as a GitHub Release, never commit them.

---

## Build log

Newest first. One entry per finished feature.

### 2026-10-18 - Desktop executables (Windows + macOS)
*Claude Code*

- **New `desktop/` folder**, an Electron wrapper with its own
  `package.json` (Electron 44.5.1, @electron/packager, @electron/get,
  yazl, yauzl, all pinned). The game's root `package.json` is untouched,
  so the web game still has only phaser + vite. **Nothing in `src/`
  changed.**
- `desktop/main.js` opens one 1280x720 window and serves `dist/` from a
  private `app://game/` address with the same CSP as `vercel.json`:
  sandboxed, no Node in the page, no navigation, no pop-ups, autoplay
  allowed so the title music starts without a click.
- `npm run build` (in `desktop/`) runs the root `npm run build`, stages
  `build/app/`, then writes to `desktop/out/`: `ShadowPlay-win-x64.zip`
  (159 MB), `ShadowPlay-mac-arm64.zip` (132 MB), `ShadowPlay-mac-x64.zip`
  (134 MB), plus the unzipped Windows folder (374 MB, exe 234 MB).
- **macOS is built on Windows without unzipping anything**: the script
  reads Electron's official macOS zip entry by entry and writes a new zip
  with the game added, the Info.plist renamed and the candle icon.
  Checked: 14 framework symlinks kept, the executable keeps mode 755. The
  app is unsigned; README says right-click -> Open / `xattr -cr`.
- `npm run selftest` launches the packaged exe with
  `SHADOW_PLAY_SELFTEST` set: it screenshots the title, records
  `audio-state-changed`, and quits. Result: title drawn, audible at 4.0 s,
  no console errors. Without that variable the self-test code never runs.
- Icons are the 64 px favicon wrapped as .ico/.icns in code (no image
  library). A bigger square icon would look sharper on the taskbar/Dock.
- Not done: the menu's QUIT still does the browser "bow"; closing the
  window quits the app.

**Files:** desktop/package.json, desktop/package-lock.json, desktop/main.js,
desktop/scripts/{stage,build,selftest}.mjs, .gitignore, README.md

### 2026-10-18 - The credits name the team, and the columns line up
*Claude Code - uncommitted at the time of writing*

- **The team is four, and the credits say who.** Ayesha Muzammil,
  Husnain Riaz, Haziq Haroon and Aiza Kashif, on the title CREDITS page
  and under "MADE BY" in the ending programme. The "with AI help" /
  "AI-generated" lines are out of both, and out of README.md.
- **The jam is named in full, and the clock is gone from the credits:**
  "Created for the NASCON Vibe Coding Game Dev Competition" replaces
  "Made in 48 hours for the NASCON game jam" on the title page, in the
  programme (`CREATED FOR`), in README.md and in CREDITS.md. It is split
  over two lines on the title page because one line is wider than the
  card. (CLAUDE.md still says 48-hour game jam -- that is the build
  constraint, not a credit.)
- **The two reading pages had fake columns.** HOW TO PLAY and CREDITS
  were single strings padded with spaces -- and the theatre font is
  PROPORTIONAL, so "walk", "jump" and "pause" each landed somewhere
  different. This is the third time this exact trap has bitten (the
  settings bars twice before it).
- `TextPage` now takes a line as either a string (full width) or a pair
  `['R', 'start the act again']`, drawn as TWO text objects, the second
  on a fixed `CONFIG.title.textPage.columnX` (234). One value for both
  pages, so they line up with each other as well as with themselves.
- `test-pages.mjs` is new and measures it: each page sits on exactly two
  x values, exactly columnX apart, the same two on both pages, and the
  gutter is wider than the longest label that has a value beside it
  (tightest is "E / Q or the wheel", 25 px to spare).
- **NOT touched, on purpose:** the asset table in `CREDITS.md` still
  says which images are AI-generated. That table is the jam's asset
  attribution (CREDITS.md's own preamble and SECURITY.md 16-17), not a
  style choice -- stripping it is a rules decision for the team, not a
  tidy-up.
- Checked: `test-pages` (11, new), `test-menu` (22), `test-credits` (10),
  `test-ending` (12), `test-endspam` (10), `test-intro` (9),
  `test-progression` (12).

### 2026-10-18 - "The End", and the way out moves to the middle
*Claude Code - uncommitted at the time of writing*

- **The show now closes on "The End"** instead of "FIN.". The words live
  in `CONFIG.ending.finalWords` rather than typed into EndScene, so the
  ending can be said differently without touching the scene.
- **The way out is written in the MIDDLE of the shut curtain**, in the
  place the last words just left, rising `CONFIG.ending.promptRisePx`
  (36 px) into it as it fades in. It used to sit 90 px off the bottom --
  the same strip of velvet the programme's closing lines are still
  crossing when it ends, which is what made it look overlapped.
- **It is also left up long enough to read.** `credits.holdMs` was 1200,
  barely longer than the 600 ms the prompt takes to arrive, so the offer
  flickered past before anyone could take it. Now 4000.
- `cdp.mjs` gained `b.config('dotted.path')`, which reads a value out of
  the game's own CONFIG. Three test files hardcoded the string `FIN.` and
  all three broke on a one-word change; they now ask the game what its
  last words are. **Use it for anything config.js owns.**
- Checked: `test-ending` (12), `test-credits` (10), `test-endspam` (10),
  `test-progression` (12), `test-results` (19), `test-flow` (5) and the
  full playthrough -- title to "The End" in 55.2 s, no console errors.

### 2026-10-18 - Act V: the final exam
*Claude Code - uncommitted at the time of writing*

- **The fire chase is untouched.** What is new is the last eight tiles,
  where the act asks for everything at once: a lit screen `|` to shelter
  in, one window `^` and one gust, a crate `C` that only Huge can shove,
  and a last ledge of FOUR tiles.
- **The ledge is the point.** Huge jumps three tiles. Measured, a Huge
  jump from the floor tops out with its feet at y=529 and the ledge top
  is y=520 -- it misses by **9 px**, deterministically, because jump
  height depends only on jump velocity and gravity. So the crate is the
  step, not a shortcut: floor 680 -> crate 600 -> ledge 520, two equal
  two-tile hops. **If anyone ever changes the jump power or gravity,
  check this first** -- 9 px is the whole design.
- **The finale borrows the gust, it does not adopt it.**
  `CONFIG.acts[4].draftIntervalSeconds` is 14 against Act IV's 6, passed
  into `DraftWind` by GameScene. A gust landing on top of every crate
  push would be noise, not a test.
- **The map moved three times before it worked**, and both reasons are
  worth knowing: a crate sitting right at the mouth of the low passage
  leaves a Normal puppet stuck against it with no headroom to grow Huge;
  and Huge needs **more than one** free tile to grow into -- the first
  fix left a gap exactly its own width, which worked from x=880 and
  failed from x=897. There are now three clear tiles between the slab and
  the crate.
- A Huge puppet also cannot walk off the right of the stone block any
  more (the slab starts one tile past its edge), so the route shrinks to
  Normal ON the block. Both scripts were updated to match.
- Checked: `test-finale` (11, new), `solve-act5` (7.5 s), `test-curve`
  (17), `test-validator` (9) and the full playthrough -- title to "Fin."
  in 55.2 s, no console errors.

### 2026-10-18 - Act III: moths go to lights
*Claude Code - uncommitted at the time of writing*

- **New map symbol `l`, a LURE lantern.** Same art and same class as the
  `k` checkpoint, but it saves nothing: lighting it pulls every moth
  within `CONFIG.moth.lureRadius` (420) onto the lantern for
  `CONFIG.lantern.lureSeconds` (6), then it gutters out, its glow dies
  over `lureFadeMs`, and the moths come back. One stands at each mouth of
  Act III's corridor.
- **`Lantern` now takes `{ checkpoint }`.** Checkpoints lure for ever
  (`luresUntil = Infinity`), lures for seconds. Both emit the new
  `LANTERN_LIT`, which finally gives the Act I checkpoint the chime the
  brief always asked for -- `CHECKPOINT_LIT` had no sound cue at all.
- `Moth.steer` prefers a lit lure over the puppet, always. The search is
  `Lantern.lureNear(...)`, a static on Lantern rather than a method on
  Moth, because what counts as a lure is the lantern's business -- and
  Moth.js was already 223 lines before this (over the ~200 guide; it is
  232 now, worth splitting when there is time).
- **Three things had to be told about a new symbol**, and missing any one
  of them fails silently: `SYMBOLS` in core/constants.js, the `SPAWNABLE`
  set in systems/LevelLoader.js, and the factory table in
  systems/ObjectSpawner.js. The lanterns simply did not exist until
  `SPAWNABLE` knew about them, with no error anywhere.
- **Honest finding, for whoever tunes this next:** the lure is insurance
  and a spectacle, not a necessity. A moth tops out at
  `CONFIG.moth.maxSpeed` (90) and the puppet runs at more than twice
  that, so a player who simply RUNS the corridor is never caught either
  way -- measured: the same crossing costs the same wax with the lure lit
  and with it spent. It matters for a player who stops, and it looks
  wonderful on camera. If Act III ever needs to be harder, the corridor
  moths are the dial to turn.
- `CONFIG.acts` gained a `lures` column and `test-curve.mjs` checks it,
  including that only an act with moths has any.
- Checked: `test-lure` (18, new), `test-moth` (15), `test-act1` (13),
  `test-curve` (17), `test-validator` (9) and the full playthrough --
  title to "Fin." in 54.6 s, no console errors.

### 2026-10-18 - Act II: the gate is on a clock
*Claude Code - uncommitted at the time of writing*

- **The switch now holds the gate for three seconds after the weight
  leaves it** (`CONFIG.switchGate.holdSeconds`). The plate still springs
  up at once -- it is the GATE that gets the borrowed time -- while a
  ring of light on the plate shrinks away and a tick counts each second.
- **That gives Act II a second answer.** Before, the crate was the only
  one: step off the switch yourself and the gate shut behind you. Now you
  can stand on it as Huge, jump out of the notch, shrink (Huge is 4 tiles
  and the doorway is 3) and run the gap. Scripted, the dash takes about
  1.5 s of the 3 -- tight to play, and fair. The crate still holds the
  gate open for ever, so the safe answer is untouched.
- `fx/CountdownRing.js` is new and generic: it draws the ring and calls
  back once a second and at the end. It knows nothing about switches, and
  the tick is a normal `SWITCH_TICK` cue in `systems/SoundCues.js`, so no
  object had to learn about audio.
- `Switch` now separates `pressed` (something is on the plate) from
  `holding` (we owe the gate a release). Without that, hopping on and off
  during a countdown would push the gate's `heldBy` up without ever
  bringing it down, and the gate would never close again. `test-gate.mjs`
  checks exactly that.
- **The first ring was unreadable at the moment it mattered**: it shrank
  to 0.45 and faded its halo to nothing, so the last second was a dot on
  a dark floor. It now barely shrinks, keeps a visible track circle, and
  the arc THICKENS when it turns red. The emptying arc tells the time;
  the circle only has to stay findable.
- Checked: `test-gate` (18, three runs), `test-crate` (7),
  `test-difficulty` (6), `test-sound` (16), `solve-act2` (10.1 s) and the
  full playthrough -- title to "Fin." in 54.4 s, no console errors.

### 2026-10-18 - Teaching happens once, and a drop is a breath
*Claude Code - uncommitted at the time of writing*

- **Act I is the only act that explains anything, and it explains the
  KEYBOARD.** Its three `?` panels now read "A / D or arrows to walk / W
  or Space to jump", "Q and E move the candle nearer and further away"
  and "1 2 3 pick a size / R starts the act again". They no longer say
  what a gap or a crate is for -- naming the keys is teaching, naming the
  answer is spoiling.
- **Acts II-V have no text on the stage at all.** Their `hints` arrays and
  every `?` mark are gone from `levels/act2..act5.js`, and
  `CONFIG.acts[].hints` is `3, 0, 0, 0, 0`. A level file with nothing to
  say now leaves `hints` off entirely, so anything reading it must cope
  with the property being absent (`act.hints ?? []`) -- `test-curve.mjs`
  crashed on exactly that.
- **The danger-hint variant is gone with them.** `objects/Hint.js` lost
  `buildWarning` and its `danger` branch (it existed for Act V's "The
  stage is on fire!"), and `tools/headless/test-danger.mjs` was deleted.
  The one thing that still has to shout -- an incoming gust -- is
  `ui/GustWarning.js`, which is HUD, not stage paint.
- **A wax drop gives +8, not +20** (`CONFIG.wax.dropAmount`). At 20 a
  drop was a fifth of the whole candle: two of them paid back whatever the
  act had cost, every act ended at 100%, and the wax was no longer a
  clock. Finding one still matters; it just does not reset the act.
- Checked: `test-curve` (16), `test-validator` (9), `test-poser` (9),
  `test-corners` (17), `test-act1` (13), `test-drop` (4), `solve-act5`
  (6.9 s) and the full `playthrough` -- title to "Fin." in 54.5 s, no
  console errors. PRD 4.3, 4.5, 4.7 and 4.9 updated to match.

### 2026-10-18 - The difficulty curve, and Act I earns its Huge
*Claude Code - commit `d442221`*

- **One table for the whole show.** `CONFIG.acts` holds each act's
  starting wax, drain multiplier and expected prop counts, so the curve is
  a shape you can read in one place instead of five level files: start wax
  100, 100, 95, 90, 85 and drain x0.80, 1.00, 1.10, 1.20, 1.30.
- **Act I is the gentlest act on purpose** and the only one with
  checkpoints: two lanterns (`k`, `objects/Lantern.js`), so a first death
  costs seconds rather than the act. A lantern saves the wax you had when
  you lit it as well as the spot -- without that, reaching one on your
  last drop of wax sends you back to it with that same last drop, for ever.
- **A reason to go Huge in the first minute:** a bonus wax drop sits on a
  ledge that Normal cannot reach even at the top of its jump. Took three
  tries to place: a drop is taken by TOUCHING it, so "out of reach" is
  measured against the apex of a jump, not against where you land, and the
  six-tile hint panels hid the first two placements.
- `tools/headless/test-curve.mjs` reads all five level files and asserts
  the table matches the maps and that the curve only ever rises;
  `test-act1.mjs` proves both lanterns, the saved wax, and that the bonus
  drop is reachable as Huge and ONLY as Huge.

### 2026-10-18 - Play-test pass 2: one style, one death screen
*Claude Code - commit `7743166`*

- **No second windmill.** The code-drawn blades are gone: bg_act4 has one
  baked in, a baked image cannot spin, and blades laid over it never
  matched its hub or sail count. Streaks, scraps and window curtains tell
  the wind instead.
- **A finished show is remembered.** Reaching the last act's door sets
  `completed`, after which the menu drops "Continue", selects "Start the
  Show" first, and opens every act in Act Select.
- **One card at a time.** The results card waits on a "Continue" prompt
  and nothing about the next act exists until it is gone. Its rows,
  candles and prompt are measured from the card's own height.
- **One death screen** (`systems/Death.js`, replacing CandleOut). Falling
  used to half-close the curtain and silently restart while wax-out got a
  proper screen. Now every death closes the curtain fully and shows the
  same card with a reason line and Retry / Act Select / Main Menu. R
  still retries instantly. The CANDLE reports what emptied it, because it
  is the thing subtracting the wax -- Death listening for PLAYER_HURT
  itself did not work, as the candle's own listener runs first and fires
  WAX_OUT before Death has seen the hit.
- **One theatre style** for every pop-up: wine red, gold border, gold
  ornament under the heading, real buttons with a lit plate, an ink
  underline and a press squash. New colours went into PALETTE.md first.
- **Nothing is left on a closing curtain:** hints, the "GUST!" card and
  the gust timer clear on `HIDE_IN_LEVEL_UI`.

**"BURNING SLOW" explained** (it was queried): it is the burn-rate tag
from PRD 4.3.1, not an assist option -- "BURNING FAST" while Huge,
"BURNING SLOW" while Tiny, nothing at Normal. Left as it is pending a
decision; it states a rate without naming what is burning.

### 2026-10-17 - Act IV reworked: the wind is visible, physical and the puzzle
*Claude Code - commit `57c87c0`*

The act was unreadable because the draft was **invisible**: the player
was flattened by something they could not see coming, and the shelters
read as dark scenery nobody walked into.

- **Seen.** A countdown bar under the act title (so a run between two
  screens can be planned) and a "GUST!" card in the danger style for the
  second before it lands (so nobody is caught out) — `ui/GustWarning.js`.
  The windows at each `^` flutter, a rising whistle sounds, then streaks
  and scraps tear across the whole stage, the windmill spins up, and the
  pool of light leans downwind and dims — in the HUD too, where the
  flame bends over.
- **Felt.** The gust shoves the puppet downwind (Tiny hard, bigger sizes
  barely, far more in the air), and out in the open the struggling flame
  burns wax `CONFIG.draft.openDrainScale`× faster.
- **The puzzle.** A five-tile gap in the floor, wider than any jump in
  the game. The only way over is to be in the open when the gust hits —
  which means Tiny, because the gust allows nothing else — and to jump
  INTO it. Verified both ways: short in still air, clears it on a gust.
- **Shelters** are lit screens with a calm glow behind them. Inside, the
  streaks stop, the flame stands straight, nothing pushes you.

Everything is in `CONFIG.draft`. `test-draft` 22/22, and the full
playthrough rides the gust across for real.

**Files:** fx/WindEffects.js, ui/GustWarning.js, systems/DraftWind.js,
objects/Shelter.js, objects/Player.js, objects/PaperScreen.js,
systems/Candle.js, ui/WaxCandle.js, scenes/UIScene.js, levels/act4.js,
config.js

### 2026-10-17 - Sound is back, and the settings are usable
*Claude Code - commits `692a33b`, `2a10bd1`, `4dfdd05`*

**Music is ON again** (`CONFIG.audio.musicOn`). It was off for
play-testing because it got irritating on repeat; the fix was a quieter
default mix and a music dial, not silence.

**Nothing is silent.** 19 of 26 sound files still do not exist.
`systems/SynthSounds.js` builds a stand-in for 18 of them in the browser
from two primitives — a sliding tone and filtered noise. They are a
FLOOR, not a finish: add a real recording, set its `ready` flag, and
`AudioManager` plays that instead and never calls the synth for that key
again. Every boot prints what is still missing, what is being stood in
for, and what is still silent (only `music_finale`).

**The ending plays itself out:** applause cue, "FIN." handing over, and
the programme scrolling up the shut curtain (`ui/CreditsScroll.js`)
before returning to the menu on its own.

**Settings are shared and usable.** `ui/SettingsPage.js` is one page used
by BOTH the title screen and the pause menu — somebody who wants the
music quieter mid-act should not have to quit. Dials are right-aligned
with a paired `− +` at the end, and they CLAMP at each end; they used to
only step up and wrap from silent back to full.

**A new show now asks before wiping progress** (PRD 4.10). Without it,
"CONTINUE — ACT V" sat on the menu for ever after one play-through with
no way to clear it, which reads as the game lying about where you got to.

> **Note on commit `4dfdd05`:** its message describes the sound work
> only, but it also carries the slider alignment, the shared settings
> page, the pause-menu rebuild, the start-over confirm and the
> MenuList listener fix. They were staged together by mistake. The
> message is wrong, not the code.

New tests: `test-sound` 16, `test-credits` 10, `test-intro` 9. Whole
suite green (28 files).

**Files:** systems/SynthSounds.js, systems/AudioManager.js,
systems/SoundCues.js, ui/SettingsPage.js, ui/CreditsScroll.js,
ui/MenuList.js, ui/MenuPage.js, ui/TextPage.js, ui/LoadingCandle.js,
scenes/PauseScene.js, scenes/TitleScene.js, scenes/EndScene.js,
scenes/PreloadScene.js, core/transition.js, config.js, CREDITS.md

### 2026-10-17 - The main menu, difficulty curve and results card
*Claude Code - commits `9732f22`, `40302c7`*

**Difficulty.** `CONFIG.acts` is the clock for each act, in running
order — the maps give the hazards, this gives the time. Act I starts at
100 wax and drains ×1.0; the finale starts at 80 and drains ×1.35.
`startWax` is out of `CONFIG.wax.max`, so a tight act honestly reads
"WAX 80%" from its first frame. **If an act is ever unwinnable, move
these numbers, not the map.**

**Results card** (`ui/ResultsCard.js`) lands on the shut curtain when an
act ends, before the next is announced: time, wax left, restarts, and
1–3 candles. Numbers count up; candles pop in one at a time. The rating
comes from wax left, minus one for 3+ restarts, never below one.

**The main menu** (`scenes/TitleScene.js`). Real `logo.png`, the curtain
drawn back at each side, and one card at a time: Continue / Start the
Show / Act Select / Settings / How to Play / Credits / Quit. Every page
lives in that ONE scene — they share the background and the music, so
swapping a card is a fold, not a scene change. `ui/MenuPage.js` (a card
of choices) and `ui/TextPage.js` (a card of reading) both size and
centre themselves from their own contents.

Act Select lists only acts reached. Settings has master/music/effects
(0–10) plus Reduce Motion, which really does disable the hit shake and
the landing nudge. Quit can't close a browser tab, so the show just
ends: curtain, "Thanks for watching the show", back to the menu
(`scenes/CurtainCallScene.js`).

**The saved record changed shape.** It is now the single JSON record
rule 12 asks for — `{version, highestAct, settings}` under
`shadow-play.save` — with every field re-checked on read. The old bare
number under `shadow-play.highest-act` is read once so nobody loses
progress.

New tests: `test-difficulty` 6, `test-results` 15, `test-menu` 19.
Whole suite green (24 files).

**Files:** scenes/TitleScene.js, scenes/CurtainCallScene.js,
ui/MenuPage.js, ui/TextPage.js, ui/MenuList.js, ui/ResultsCard.js,
systems/SaveProgress.js, systems/AudioManager.js, systems/Candle.js,
systems/ActFlow.js, scenes/ActCardScene.js, scenes/UIScene.js,
scenes/GameScene.js, main.js, config.js

### 2026-10-17 - Five acts: moths (Act III) and drafts (Act IV)
*Claude Code - commits `623e76d`, `2985868`*

The running order is now **Act I - II - III - IV - Finale**, and all five
are solvable start to finish (`tools/headless/playthrough.mjs`, 54.5 s
scripted, no console errors).

- **Moths** (`objects/Moth.js`, PRD 6.4): the one creature where all three
  themes meet — the only way to deal with one is to go Huge, and Huge
  burns the candle twice as fast. The 2-frame art gets procedural flight
  on top: steering with a sine wobble, flap rate following effort, a lift
  and a squash on each downbeat so the bob IS the wing-beat, banking on
  the same damped spring the puppet's joints use, and random flutter so no
  two moths move alike. Near the candle it works harder and sheds embers.
  Swatted: spins, falls, bursts into paper. `fx/MothEffects.js` pools the
  flakes and sparks ONCE for the act, not once per moth.
- **Act III "Moths to the Flame"**: a moth in the open to learn on, a
  3-tile corridor Huge cannot enter (two moths, a wax drop at the end), a
  3-tile climb that needs Huge with a moth over the ledge.
- **Drafts** (`systems/DraftWind.js`, `objects/Shelter.js`): a gust every
  six seconds on a fixed rhythm — a second of warning, then 1.5 s holding
  anything in the open flat at Tiny. Alcoves `|` are the only shelter, and
  stepping out mid-gust catches you again. `SizeChanger.heldTiny` is what
  blocks growing.
- **Act IV "The Draft"**: an alcove beside the start so the first gust
  teaches rather than punishes, a run with shelters spaced along it, and a
  3-tile climb with an alcove at its foot — so the climb has to begin the
  moment a gust ends.

New tests: `test-moth` 15/15, `test-draft` 11/11. Whole suite green
(20 files, ~196 checks).

**Files:** objects/Moth.js, objects/Shelter.js, fx/MothEffects.js,
systems/DraftWind.js, systems/SizeChanger.js, systems/ObjectSpawner.js,
scenes/GameScene.js, levels/act3.js, levels/act4.js, levels/index.js,
config.js

### 2026-10-17 - A full title-to-"Fin." playthrough, and what it caught
*Claude Code - commits `353539b`, `eca12bf`*

- **README rewritten.** It still said "milestone M0 complete, no gameplay
  yet" and listed a gamepad we never built. It is now written for someone
  who has just opened the repo: how to play, the real control map, the
  three acts, how each theme drives the mechanic, and a short tour of the
  source layout.
- **`tools/headless/playthrough.mjs`:** the M6 acceptance run. Clears saved
  progress, then plays title → Act 1 → act card → Act 2 → act card →
  finale → ending, through every door, with **no scene jumps and no dev
  keys**. Completes in 32.5 s scripted, no console errors.

**What it caught:** the finale's "The stage is on fire!" warning spawns
next to the puppet, so it dropped in, shook and settled *behind the
closed curtain* — by the time the player could see the stage the warning
was simply already there. A hint now waits while `GameScene.stageHidden`
is true, and a danger hint sits at `DEPTHS.CURTAIN - 1` (above the
stage, under the theatre) instead of HUD depth.

**Still needs a human:** the M6 item asks for a playthrough *in two
browsers, by hand, on the built game*. This is Chrome only, scripted, on
the dev server.

**Files:** README.md, scenes/GameScene.js, objects/Hint.js

### 2026-10-17 - M5: vercel.json, checked against the real build
*Claude Code - commit `3818e3e`*

`vercel.json` with the headers from `SECURITY.md` rule 10 verbatim, plus
the build settings (`npm ci`, `npm run build`, `dist/`) so the deploy is
one click, and a year of immutable caching on the hashed asset files.

**Checked before deploying, not after:** the production build was served
locally with those exact headers applied
(`tools/headless/serve-dist.mjs` reads `vercel.json` and replays them) and
played through Act 1 — walk, jump, grow, shrink, restart — with no
"Refused to…" and no console errors. The game loads nothing from a third
party, so `script-src 'self'` needs no loosening. `npm audit` reports 0
vulnerabilities and the tree has no keys or tokens in it.

Still to do when it is actually deployed: put the full Vercel URL in
front of `/og-image.png` in `index.html` (`og:image` needs an absolute
URL on some sites), and repeat the F12 check on the live link.

**Files:** vercel.json

### 2026-10-17 - M5: on-camera juice, and a real physics bug it turned up
*Claude Code - commits `7c23c16`, `05d7c2d`, `3853d27`*

- **Curtain flick on R** (and on falling through a hole): the halves
  sweep 40% across, the act is rebuilt while they hide the middle, and
  the new act draws them back — `CONFIG.anim.quickRestartMs` end to end.
  Same handover as the act card (`flick: true` →
  `GameScene.finishFlick`), so there is ONE pattern, not two. `Curtain`
  now works in amounts (0 parked off the sides, 1 shut), which is what
  makes a partial sweep possible.
- **Size change:** three stamped copies left behind (`fx/Afterimage.js`,
  a pool of RenderTextures — a stamp keeps the OLD size and pose, which a
  second sprite could not), and the light pool swells and settles
  (`PaperScreen.breath`, a multiplier so it works at any wax level).
- **Landing:** dust from under the feet, more of it the bigger the
  puppet, plus a camera nudge only when the drop was fast enough
  (`fx/DustPuff.js`, `CONFIG.land`).

**The bug it found:** a long fall could drop the puppet through solid
floor. Arcade checks collisions once a frame, and with
`fastFallMultiplier` the puppet reaches ~1770 px/s at the bottom of a
full-height stage — 30 px a frame, further than Arcade looks into a tile.
It passed through the floor and FallWatch restarted the act, which in
play reads as "I landed and died". Fixed with a terminal velocity
(`CONFIG.physics.maxFallSpeed`) and `tileBias` raised to one tile.

New tests: `test-flick` 8/8, `test-sizefx` 7/7, `test-land` 8/8. Whole
suite re-run green, and Act 2 (9.5 s) and Act 5 (6.3 s) still solve.

**Files:** fx/Afterimage.js, fx/DustPuff.js, systems/SizeEffects.js,
systems/ActFlow.js, systems/StageTextures.js, objects/PaperScreen.js,
objects/Player.js, scenes/GameScene.js, ui/Curtain.js, main.js, config.js

### 2026-10-17 - M5: act cards on the curtain, and the real ending
*Claude Code - commits `bfa6462`, `a3da098`*

**Act cards.** `ActCardScene` now sits on a shut curtain: the act title
ink-writes letter by letter (`fx/UIAnim.js`), the story line fades in
under it, and the act's backdrop loads while it is up. Space finishes the
writing; a second press moves on.

The handover is the part to understand: the card calls
`scene.start(GAME, { act, curtainClosed: true })`, and **GameScene builds
the act behind its OWN closed curtain and then opens it**
(`GameScene.revealStage`). Both scenes draw the curtain in the same
place, so the swap is invisible and no half-built act is ever seen -- and
no scene has to be brought to the top of another one mid-transition.
TitleScene passes the same flag, so the show starts by opening the
curtain on Act 1. R restarts with no reveal.

`ui/Curtain.js` grew `{ closed: true }`, `open()` and `destroy()`.

**The ending.** `EndScene` is no longer the M0 placeholder: the empty
stage, one puppet and the dying light. It bows twice while the camera
creeps to 1.3x, the candle burns out by itself, the stage goes dark, the
curtain closes and "FIN." is written on it. Space cuts it short.

`ui/BowingPuppet.js` draws the puppet from the same `CONFIG.rig` art,
mounts and rods as `PuppetRig`, but with no physics body -- the rig's
pose comes from the player's velocity, size and footing, none of which
exist on an empty stage. A marionette is rigid, so it bows by tipping the
WHOLE figure on its rods.

Checked in headless Chrome: new `test-curtain` 12/12 and `test-ending`
12/12, plus the whole existing suite (polish 8, fire 9, hit 6, drop 4,
flow 5, crate 7, danger 8).

**Files:** scenes/ActCardScene.js, scenes/EndScene.js, scenes/GameScene.js,
scenes/TitleScene.js, ui/Curtain.js, ui/BowingPuppet.js, fx/UIAnim.js,
config.js

### 2026-10-17 - Readability: stage frame + HUD band, wax panel, danger hints
*Claude Code - commits `99e12a6`, `cd24016`, `dc99ee9`, `b96e983`*

- **A dark frame round the stage.** The canvas is now `VIEW_WIDTH` x
  `VIEW_HEIGHT` (1408x792); the 1280x720 stage sits at (`STAGE_X`,
  `STAGE_Y`) and a **HUD band** (`HUD_BAND` in `core/constants.js`) runs
  under it. GameScene / TitleScene clip their camera to the stage with
  `fitCamera(this, { clipToStage: true })`; UIScene does not, so the HUD
  draws in the frame and never over a floor tile.
- **Wax panel** (`ui/WaxPanel.js`): the candle and "WAX n%" on a rounded
  card (panel colour at 85%, panelEdge border) in the band's bottom-left.
  Below `CONFIG.hud.dangerFraction` (25%) the border and text turn the
  danger colour and pulse. `WaxCandle` now only draws the candle. The size
  dots sit bottom-right with their label beside them.
- **Danger hints:** a hint written `{ text, danger: true }` is a warning —
  top-centre under the act title, danger border, flame icon, bigger text
  (`CONFIG.text.hintDanger`); it drops in with Back.Out, shakes, then
  pulses until it closes (`PaperPanel.dropIn`, `CONFIG.hint.danger`).
  Act 5's "The stage is on fire!" uses it; plain strings are unchanged.
- **Backdrops** at 20% (was 30%) with a `palette.frame` tint
  (`CONFIG.backdrop`), so the puppet and platforms read first.

Re-checked in headless Chrome: test-polish 8/8, test-danger 8/8, and the
act screenshots with no console errors.

**Files:** core/constants.js, core/camera.js, main.js, ui/WaxPanel.js,
ui/WaxCandle.js, ui/SizeDots.js, ui/PaperPanel.js, scenes/UIScene.js,
objects/Hint.js, objects/PaperScreen.js, levels/act5.js, config.js

### 2026-10-17 - Act 5 polish: heat glow, paper tiles, theatre, ramping fire
*Claude Code - commit `9268e33`*

- **Heat:** FireGrid reports how much of the act's paper has caught;
  `PaperScreen.setHeat` eases the candle's light towards red-orange
  (`CONFIG.fire.heatTint`, up to `heatTintMax`). Newly lit tiles flare big
  and bright (`frontGlowRadius`) and settle, so the front glows; each
  ignition bursts embers (`frontEmbers`).
- **Paper tiles** are cream with a scorched rim and burnt notches
  (`CONFIG.fire.paperTile`), drawn in `systems/TileTextures.js`.
- **bg_act5** (theatre) at 30%, standing on the floor via the level field
  `backdropRestsOnRow: 17`.
- **The fire speeds up:** `speedStart` 67 -> `speedEnd` 90 px/s over
  `rampSeconds` (6). `spreadSeconds` no longer exists.
- Splits to stay under 200 lines: `fx/FireEffects.js` (the fire's looks),
  `systems/TileTextures.js` (the tileset).

All of it re-checked in headless Chrome: 39 checks plus Act 2 and Act 5
(fast, hesitant, waiting on the block) solved by script.

### 2026-10-17 - M4: fire, hit feedback, Act 5 finale (+ assets, favicon)
*Claude Code - commits `1b3a1ad` .. `f4408f0`*

- **Burning paper** (`systems/FireGrid.js`): `f` tiles light after
  `CONFIG.fire.startDelaySeconds`; a burning tile lights its paper
  neighbours after `spreadSeconds` and becomes a hole after
  `burnToHoleSeconds`. **Per-tile timing on purpose:** PRD 4.4's "spread
  every 2.5 s, hole after 1 s" would put the fire out. Keep
  `spreadSeconds < burnToHoleSeconds`. Tuned: 2.5 s head start, 0.6 s per
  tile (67 px/s), hole at 1.4 s.
- **Falling** (`systems/FallWatch.js`): the stage's bottom edge is now open;
  dropping out announces `PLAYER_DIED` and restarts the act after 450 ms.
- **Getting hurt** (`systems/HurtState.js` via `player.hurt()`): knockback away
  from the danger, keys locked 220 ms, 0.8 s invulnerability, then
  `PLAYER_HURT`, which the Candle subtracts. **Hit feedback**
  (`systems/HitFeedback.js`): white-hot flash, camera shake, blinking. Any
  future hazard just calls `player.hurt()` and gets all of it.
- **Act 5** (`levels/act5.js`, "Finale — The Last Act"): run, crawl Tiny,
  climb Huge onto a stone block, Normal through a low passage, Huge again
  to the door. **The floor is stone from the block on, so the fire can
  never cut the route** (open question 7). Solved by script fast (6.2 s),
  hesitant (8.7 s) and waiting on the block for the fire to burn out (28 s).
  It names its own backdrop (`backdrop: 'bg_act5'`, the theatre), plain
  paper until that art exists.
- **GameScene split**: moving between acts (R, pause, blur-pause, the door,
  dev keys, fall restart) is now `systems/ActFlow.js`; GameScene 219 -> 164.
- **Assets**: `pointer_hand` (points at the exit door as each act starts,
  `ui/Pointer.js`), `gamepad_icons` (loaded, unused: gamepad is cut) and
  `lantern` (loaded, for checkpoints if ever needed) wired in. New candle
  **favicon** and **og-image.png** link preview, plus meta tags in
  `index.html`.


### 2026-10-17 - Afternoon fixes: crate softlock, HUD, title, backdrops, music
*Claude Code - commits `e7765f3` .. `e8d6f59`*

- **Crate softlock (no R needed):** a crate resting `CONFIG.crate.lostDropTiles`
  (2) or more below its start is returned by a "stagehand" (pause, fade,
  reappear at its start; waits if the puppet is standing there). Intentional
  crate drops in a level must be shallower (Act 2's notch is 1 deep).
- **M3 ticked (1, 2, 4):** Act 2 re-solved after the fix, start to door, real
  key presses only, 9.5 s scripted, no console errors.
- **Music off while testing** (`CONFIG.audio.musicOn: false`) and halved
  (`musicVolume` 0.4 -> 0.2). **Turn it on before recording.**
- **HUD candle redrawn:** the old full-height outline (my M0 addition, not
  in the PRD) is gone; shaded round wax, glowing melted pool, a lit dish,
  teardrop drips (`wax_drip` texture).
- **"WAX x1" replaced:** the label reads "WAX 87%"; the tag says "BURNING
  FAST" (Huge) / "BURNING SLOW" (Tiny), nothing at Normal. PRD 4.3.1 updated.
- **Act title on a plate** (`ui/ActTitle.js`) so no pillar shows through it.
- **Backdrops shown:** `bg_act1-3` wired in at 30% (`CONFIG.backdrop.alpha`);
  Act 1's loads at boot, later acts in `GameScene.preload`.
- **Wax drops glow:** a twinkling `flameCore` halo that bobs with the drop.

All checked in headless Chrome with real key presses and zoomed screenshots,
using a throwaway harness (Chrome DevTools Protocol from plain Node, no npm
package); it is not in the repo.


### 2026-10-17 - M3: Act 2 "The Giant"
*Claude Code - commit (see `git log`, "M3: Act 2")*

`levels/act2.js`, added to `ACTS`. A 3-tile ledge only Huge can jump
(Normal and Tiny checked: they cannot); a crate a Huge puppet pushes into
a **3-wide, 1-deep notch** with the switch in its middle, so once in it
cannot be pushed out and keeps the gate open (standing in the notch as Huge
also works, but only while you stay); a doorway 3 tiles tall behind the
gate, so Huge must shrink to pass; the door on another 3-tile ledge, so
grow again. Three wax drops, three hints on row 8 (above a Huge head).
**Solved in headless Chrome with real key presses only** (no teleports):
start -> door in 14.7 s scripted, so a first-time player should land in
PRD's 60-120 s. Known softlock: jumping over the crate and pushing it LEFT
off the first ledge; R restarts. The door currently leads to the "FIN."
placeholder, because there is no next act yet.

**Files:** `levels/act2.js`, `levels/index.js`

### 2026-10-17 - M3: `?` hints on the stage
*Claude Code - commit (see `git log`, "M3: hints")*

`objects/Hint.js` is a Zone holding a `PaperPanel` with the act's hint
text; it unfolds when the puppet is within `CONFIG.hint.showTiles` (3)
**sideways** and folds beyond `hideTiles` (4). PRD 5.1 says 4 tiles; 3/4
keeps two neighbouring hints from overlapping, and the gap stops flapping.
`LevelLoader` now puts the text on each `?` spawn. `PaperPanel.open/close`
cancel each other's tweens and `open` restores alpha, so a panel can be
reopened (the pause menu still works). `HINT_SHOWN` -> `sfx_paper`. Act 1
has three hints on row 11 teaching walk/jump, Q at the gap, and E plus
"big shadows burn wax faster" (the tutorial is cut, so these teach the
controls). **Gotcha:** in a level file, a hint's line break is `
`
inside the string. Checked in headless Chrome: the right hint opens at each
spot, never two at once, quick back-and-forth settles; no console errors.

**Files:** `objects/Hint.js`, `ui/PaperPanel.js`, `systems/LevelLoader.js`,
`systems/ObjectSpawner.js`, `systems/SoundCues.js`, `levels/act1.js`,
`core/events.js`, `config.js`

### 2026-10-17 - M3: switches and gates
*Claude Code - commit (see `git log`, "M3: switches and gates")*

`objects/Switch.js` (`S`) is pressed by a Huge puppet standing on its
tile or by any crate resting there (`pressesSwitches`), and announces
`SWITCH_PRESSED / RELEASED { gateId }` for the **nearest** gate (PRD 6.4).
A light line joins it to the gate for 1 s. `objects/Gate.js` (`G` = its
**bottom** tile, 3 tall) counts the switches holding it, rises into the wall
(drawn just behind the tiles, so it slides up into the stonework) with a
small shake, and only closes again once nothing is in its doorway, so it
can never trap the puppet or a crate. A closed gate also blocks growing.
`LevelValidator` now flags a switch with no gate. `GATE_OPENED / CLOSED`
and `SWITCH_PRESSED` are in SoundCues (silent until the files exist).
Checked in headless Chrome on the draft Act 2: gate blocks, Normal does
not press, Huge does, stepping off closes, a busy doorway keeps it open,
the crate in the notch holds it open; no console errors.

**Files:** `objects/Switch.js`, `objects/Gate.js`, `systems/ObjectSpawner.js`,
`systems/LevelValidator.js`, `systems/SoundCues.js`, `core/events.js`,
`config.js`

### 2026-10-17 - M3: crates
*Claude Code - commit (see `git log`, "M3: crates")*

`objects/Crate.js` (`C` = the crate's **bottom-left** tile; it is 2x2).
To the puppet it is always a wall (`pushable = false`); when a Huge
puppet presses its side while walking towards it, the crate gets
`CONFIG.crate.pushSpeed` (90 px/s) and slides, and gravity, tiles and drag
do the rest (it drops into holes, stops at walls). **PRD 6.4's
`pushable` toggle was tried first**: Arcade shares the overlap between the
bodies and the drag ate the rest, so Huge crawled at ~20 px/s.
`ObjectSpawner` now reads small flags instead of knowing classes:
`isSolid` (collider, not overlap), `isMovable` (collides with tiles and
solids), `link({ objects, player, listeners })` once all objects exist.
`SizeChanger.fits` also refuses a grow into any body with `blocksGrowth`
(**open question 3 answered**: props block growing, like walls). New
`push` pose (arms out, lean 12). Checked in headless Chrome on the draft
Act 2: Normal cannot move it, Huge pushes it into the notch where it stays,
growing beside it is refused, the pose shows; no console errors.

**Files:** `objects/Crate.js`, `systems/ObjectSpawner.js`,
`systems/SizeChanger.js`, `systems/PuppetPoser.js`, `scenes/GameScene.js`,
`config.js`

### 2026-10-17 - M2: H hides the HUD; N / B skip acts (dev only)
*Claude Code - commit (see `git log`, "M2: H hides the HUD")*

For recording trailer takes (PRD 4.6, moved up from M5). **H** hides
UIScene's camera, so the whole HUD (and anything added to it later) goes;
it comes back with the next act, because UIScene restarts with it.
**N / B** (`systems/DevActKeys.js`) jump to the next / previous act, and
**only when `CONFIG.DEBUG` is true**. GameScene's act change is now one
`goToAct(act)` used by the door and the dev keys alike; past the last act
it shows the ending. Checked in headless Chrome: H off and on, N ignored
with DEBUG off, N -> "FIN." with DEBUG on. `DEBUG` is back to `false`.

**Files:** `systems/DevActKeys.js`, `scenes/GameScene.js`,
`scenes/UIScene.js`, `config.js`

### 2026-10-17 - M2: the burn rate is visible on the HUD candle
*Claude Code - commit (see `git log`, "M2: show the burn rate")*

PRD 4.3.1 (the synergy shot). `Candle` now sends `rate` (the size's
`waxMultiplier`) in `WAX_CHANGED`, so the HUD shows the real drain without
knowing about sizes. `WaxCandle` eases a shown rate over 200 ms: the flame
is 0.85x at Tiny and 1.6x at Huge and flickers twice as fast at Huge. The
flicker now runs on its own clock (`flickerClock`), because multiplying
`time` by a changing speed made the flame jump on every size change.
`ui/WaxDrips.js` runs pooled drips down the sides at rate squared (Tiny
0.56/s, Huge 4/s), and spawns none while paused (no `WAX_CHANGED` for
`CONFIG.hud.idleMs`). `ui/BurnRateTag.js` shows `x0.75 / x1 / x2` next to
the WAX label, pops on a change and throbs in accent while Huge.

**Surprises:** drips drawn inside the candle edge were invisible (wax on
wax), so they bulge over the edge. On the lit stage the tag was washed out
and the puppet stands on it at spawn, so it sits on the dark floor strip.
**Checked in headless Chrome** (HUD crops at each size, paused, after R; no
console errors). Not yet watched by a human; still frames make the drips
look subtler than they are in motion. Knobs: `CONFIG.hud`.

**Files:** `ui/WaxDrips.js`, `ui/BurnRateTag.js`, `ui/WaxCandle.js`,
`scenes/UIScene.js`, `systems/Candle.js`, `core/events.js`, `config.js`

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

- ~~Acts 3 and 5 are not written; Act 4 is cut.~~ **All five acts are
  built and solvable** (2026-10-17). Only the checkpoint lantern `k` has
  no object behind its symbol.
- Size-change juice: the afterimage and light "breath" are built
  (`systems/SizeEffects.js`); the whoosh needs a sound file.
- Sounds: 7 of 26 files are in (see the build log). Real art so far: the puppet parts, crate, door, gate,
  moth and switch. Everything else in `ASSETS.md` is still a placeholder.
- `src/fx/` has `FireEffects.js`, `UIAnim.js` (the ink-written reveal),
  `Afterimage.js` and `DustPuff.js`. No `Transitions.js` or `Juice.js`:
  curtain motion lives in `ui/Curtain.js`, which draws it, and each piece
  of juice sits with the thing it reacts to.
- ~~`vercel.json`~~ — **built** and checked against the real build.
  Nothing is deployed yet.
- The tutorial, settings, act select and results card — M5 (the pause menu exists).

---

## Gotchas (do not learn these twice)

- **Never commit `desktop/out/`.** Every zip is over GitHub's 100 MB per-file
  limit and a push with one fails. It is git-ignored; share builds as a
  GitHub Release. **@electron/packager cannot make a macOS app on Windows**
  (an .app is full of symlinks Windows cannot write), which is why
  `desktop/scripts/build.mjs` copies Electron's mac zip entry by entry instead.

- **A half-dead test browser looks like a broken game.** Chrome keeps
  answering `/json/version` for a second or two after `Browser.close`, so
  a new harness run could connect to the corpse: every browser test then
  "crashed" or reported an empty act (no crates, no wind, moths frozen)
  while the pure-logic tests passed. `cdp.mjs` now polls until the port
  really stops answering. If a whole run fails at once and the logic
  tests do not, suspect this before suspecting the game.
- **A level file's `hints` can be missing, not just empty.** Only Act I
  has any, and Acts II-V leave the property off altogether, so read it as
  `act.hints ?? []`. Reading `act.hints.length` straight is what broke
  `test-curve.mjs` the moment the hints came out.
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
  is 2816x1584 (the 1408x792 frame at render scale 2) and the camera zoom
  is what maps it back. A scene that draws the STAGE passes
  `{ clipToStage: true }`, so world (0,0) is the stage's top-left and
  nothing spills into the frame; UIScene does NOT, so it can draw in the
  frame and the HUD band (`HUD_BAND`, world y 720-784). A new scene
  without `fitCamera` draws in the top-left quarter. GameScene also pins
  the physics world to 1280x720.
- **An outside force must change the TARGET speed, not the velocity.**
  `Player.moveHorizontally` lerps `body.velocity.x` towards
  `direction * speed` every frame, so anything shoved straight into the
  velocity is wiped out before it carries the puppet anywhere. The
  draft's push took an hour to work out for exactly this reason: it is
  `player.windPush`, ADDED to that target. Knockback gets away with it
  only because `hurtState.stunned` makes the lerp bow out entirely.
- **An event sent from `GameScene.create` reaches nobody.** UIScene is
  launched from there and does not finish starting until the next frame,
  so its listeners are not up yet — which is why the act title is handed
  over as scene DATA. `DraftWind` defers its first countdown by a tick
  for the same reason, and the HUD also reveals the bar on the first
  telegraph as a belt-and-braces.
- **A key missing from the test harness's `KEYS` map silently does
  nothing.** Without a virtual key code Phaser never sees the press, so a
  test "proves" the game ignores a key that works perfectly by hand. M
  looked broken for exactly this reason.
- **A `MenuList` must be destroyed when its card closes.** It binds keys
  on the SCENE, so a screen that swaps cards (the menu, the pause menu)
  leaves a live listener behind for every page ever opened: one press
  then moves several invisible cursors, and the ones belonging to
  destroyed cards throw inside Phaser's renderer. `MenuPage.close()`
  and `TextPage.close()` call `menu.destroy()` before the text objects
  go.
- **Phaser hands a scene its PREVIOUS data** when `scene.start(key)` is
  called with none. `core/transition.js` always passes an object for
  exactly this reason — the title replayed its whole curtain-up on every
  return to the menu before that.
- **A sound with no file is not silent any more.** `SynthSounds` makes a
  stand-in. That means a MISSING file no longer announces itself by
  being quiet, so trust the boot report, not your ears.
- **The test harness double-captures console messages.** A single
  `console.log` in the page shows up twice in `b.logs` (verified by
  counting inside the page). It is the harness, not the game — do not
  chase a phantom duplicate log.
- **The saved record is ONE JSON blob** under `shadow-play.save`:
  `{version, highestAct, settings}` (SECURITY.md rule 12). Only
  `systems/SaveProgress.js` touches localStorage, and every field is
  re-checked on the way out, because the file is editable by anyone with
  a console. Tests that want a fresh game call `localStorage.clear()`,
  not the old `shadow-play.highest-act` key.
- **A dark silhouette will not take a `setTint`.** Tint MULTIPLIES, so
  black stays black. `setTintFill` replaces the colour and keeps the
  alpha — that is what makes the menu's pointing hand visible on a dark
  card.
- **A path with a space breaks the headless Chrome launcher.** The
  profile directory goes into `--user-data-dir=...` unquoted, so
  `D:\Game Dev\profile` becomes two arguments and Chrome dies with
  "Multiple targets are not supported in headless mode". Use a
  space-free path.
- **A danger hint is `{ text, danger: true }`** in a level's `hints` list;
  a plain string is a normal hint. Keep it for real threats only, or it
  stops meaning anything.
- **A fast enough fall used to go THROUGH the floor.** Arcade physics
  checks collisions once a frame, so a body that moves further in one
  frame than `tileBias` reaches into a tile never collides with it.
  Guarded now by `CONFIG.physics.maxFallSpeed` (terminal velocity) and
  `tileBias: 40`. **If you ever raise gravity, `fastFallMultiplier` or a
  jump speed, re-check that per-frame step** — `speed / 60` must stay
  well under 40.
- **Teleporting a body with `setPosition` is not safe.** It leaves the
  body's previous position stale, so Arcade sees one enormous step and
  tunnels through everything. Use `body.reset(x, y)` (this bit the
  headless tests before it bit the game).
- **`camera.zoomTo()` does NOT take `CONFIG.anim` easing names.** The
  camera's own effects use Phaser's internal names (`'Sine.easeInOut'`),
  and anything else throws `this.ease is not a function` inside the game
  loop -- which kills every scene at once, so it looks like the whole
  game broke. Tween the camera's `zoom` property instead
  (`EndScene.create`).
- **An act reached through the act card starts behind a closed curtain**
  (`scene.start(GAME, { curtainClosed: true })`). If you add a scene that
  draws over the stage during the reveal, give it a depth below
  `DEPTHS.CURTAIN`. The HUD and the mouse pointer sit ABOVE it on
  purpose.
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
- **Background music is switched OFF in config** (`CONFIG.audio.musicOn`)
  for play-testing. It must be `true` for the trailer recording and the
  final build.
- **Fire timing is per tile.** `TILE_SIZE / CONFIG.fire.speedStart` (40 / 67
  = 0.6 s) must stay below `burnToHoleSeconds` (1.4), or every tile burns out
  before it spreads and the fire dies. FireGrid warns in the console if so. Never put paper `~` on the only route to the door AFTER a safe
  stone spot, or a player resting there can be cut off.
- **Never hard-code which act is the finale.** It is simply the LAST
  entry in `levels/index.js` — it was act 3 this morning and is act 5 now.
  Music and backdrops already look it up that way; the test harness asks
  the running build with `b.actCount()`. Anything that writes `act: 3`
  meaning "the fire one" breaks the next time an act is added.
- **A level file is data, but its GEOMETRY is a contract.** A 3-tile gap
  fits Normal and blocks Huge (4 tiles); a 3-tile step needs Huge to
  climb; a 1-tile gap is Tiny only. Both new acts had a map that read
  fine and played wrong on the first pass (a sealed room, then a 2-tile
  "Huge" climb). Count the rows before trusting a map.
- **Crates cannot climb.** A crate that ends up 2+ tiles below its start is
  put back by the stagehand, so a level must never NEED a crate to drop 2
  or more tiles (raise `CONFIG.crate.lostDropTiles` if one ever does).
- **`GameScene.js` is past 200 lines** (about 210). Split something out
  before adding more to it (e.g. the act-complete / pause wiring).
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
- **Testing without the Chrome extension:** it is all in
  `tools/headless/` now — read its README first. In short: Chrome with
  `--headless=new --remote-debugging-port=9333`, driven from Node over
  the DevTools protocol (Node 24 has `WebSocket` built in). Turn on
  `Emulation.setFocusEmulationEnabled`, or the game never sees a key. A
  mouse click on the title screen also starts the act.
- **A test that has not been run in a while is probably wrong.** Two of
  the three pure-logic tests had quietly rotted against code that moved
  on under them (the poser gained `player.controls` with crates; the
  validator gained a hints-count check). Re-run the whole folder after a
  change, not just the test that looks related.
- **Never read `JustDown` inside `.some()`.** It stops at the first true
  key, and an unread key keeps its "just down" flag and fires a frame
  late. `PlayerInput.anyJustDown` reads every key with `map` first.
- **Recording takes with N / B:** set `CONFIG.DEBUG = true` locally and
  **never commit it**. DEBUG also draws the physics hitboxes at the start
  of EVERY act (Phaser's arcade debug comes from the game config), so
  press F1 once per act to hide them before you record.
- **Editing a file while a headless test runs reloads the page** (Vite
  hot reload), and the test quietly carries on against the title screen.
  Change config, wait a few seconds, then start the test.
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
