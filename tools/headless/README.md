# `tools/headless` — the checks that are run before every commit

These are **not** part of the game. They are how a change gets checked
without a human having to replay three acts, and they are in the repo so
the next shift can re-run every claim in `NOTES.md` instead of taking it on
trust.

They need **no npm packages**: Node's built-ins, and whatever Chrome is
already on the machine. Nothing here is bundled into the game — Vite only
builds `src/` and `index.html`.

## Running them

Start the dev server on port 5199 first, in another terminal:

```bash
npx vite --config vite/config.dev.mjs --port 5199
```

Then, from this folder:

```bash
node test-flow.mjs          # one check
node playthrough.mjs . ../../shots    # the whole game, with screenshots
```

Every path and port can be overridden, because no two machines here agree:

| Variable | Default |
| --- | --- |
| `CHROME` | `C:/Program Files/Google/Chrome/Application/chrome.exe` |
| `GAME_URL` | `http://localhost:5199/` |
| `DIST_URL` | `http://localhost:5311/` (the built game, see below) |
| `CHROME_PROFILE` | `./.chrome-profile` |
| `CDP_PORT` | `9333` |

```bash
CHROME=/usr/bin/google-chrome GAME_URL=http://localhost:8080/ node test-flow.mjs
```

A script's first argument is still a Chrome profile directory, and the
second (where it takes pictures) a folder to write PNGs into.

## What each one checks

| Script | What it proves |
| --- | --- |
| `playthrough.mjs` | **The M6 acceptance run.** Title → Act 1 → act card → Act 2 → act card → finale → the bow → the last words, through every door, with no scene jumps and no dev keys |
| `solve-act2.mjs` | Act 2 is solvable, and how long it takes |
| `solve-act5.mjs` | The finale is solvable. `node solve-act5.mjs . slow` plays it hesitantly; `. linger` waits on the stone block and proves the fire can never burn away the route ahead |
| `test-flow.mjs` | R restarts, Esc pauses, leaving the window pauses |
| `test-flick.mjs` | A quick restart is a curtain flick: part-way across, never shut, gone again |
| `test-curtain.mjs` | The act card writes its title in ink on a shut curtain, and hands over to an act built behind it |
| `test-ending.mjs` | The bow, the candle going out, the curtain, "FIN.", and Space skipping it |
| `test-gameover.mjs` | Wax to zero: limp puppet, curtain, "The candle went out", R |
| `test-fire.mjs` | Paper catches, burns to holes, and the fire spreads at the configured speed |
| `test-hit.mjs` | A hit flashes the puppet, shakes the camera and blinks while invulnerable |
| `test-land.mjs` | Landing dust, and a camera nudge only after a real drop |
| `test-sizefx.mjs` | The size afterimage and the light "breath", and that the pools are reused |
| `test-drop.mjs`, `test-crate.mjs`, `test-polish.mjs` | Wax drops, crate pushing and the stagehand, and the look of the stage |
| `test-music.mjs` | The finale gets the right music |
| `test-csp.mjs` | **The built game** under the real `vercel.json` headers (see below) |
| `test-act1.mjs` | Act I: the two checkpoint lanterns, and that the bonus wax drop is reachable as Huge and ONLY as Huge |
| `test-pages.mjs` | HOW TO PLAY and CREDITS: their two-column rows really are two columns, on one shared x, with the gutter wider than the longest label |
| `test-finale.mjs` | The finale's final exam: the screen, the window and the crate are all there, its gusts are rarer than Act IV's, a Huge jump alone can never reach the four-tile ledge, and with the crate pushed home it is two ordinary steps |
| `test-lure.mjs` | Act III's lure lanterns: lighting one pulls the moths off the puppet and holds them, it gutters out and they come back, and a Huge puppet still swats |
| `test-gate.mjs` | Act II's timed gate: the ring and tick start when the plate rises, the gate shuts on its own, standing back on it stops the clock, the crate holds it for good, and the Huge-press-then-shrink-and-run dash makes it through |
| `test-poser.mjs`, `test-validator.mjs`, `test-corners.mjs`, `test-curve.mjs` | Pure logic, no browser: pose choice, map validation, corner correction, one-way shelves, and that the difficulty table matches the five maps |

## Checking the production build and its headers

`serve-dist.mjs` serves `dist/` with the **exact** headers from
`vercel.json`, so the Content-Security-Policy can be tested before anything
is deployed:

```bash
npm run build
node tools/headless/serve-dist.mjs .     # from the project root
node tools/headless/test-csp.mjs         # in another terminal
```

If the policy ever blocks something the game needs, the test prints the
"Refused to…" line, and `SECURITY.md` rule 10 says to loosen **only that
one directive**.

## Two things that will bite you

- **Editing a source file while a test runs reloads the page** (Vite hot
  reload), and the test quietly carries on against the title screen. Change
  config, wait a few seconds, then start the test.
- **Teleporting the puppet with `setPosition` is not safe** — it leaves the
  physics body's previous position stale, so Arcade sees one enormous step
  and tunnels through the floor. Use `player.body.reset(x, y)`.
