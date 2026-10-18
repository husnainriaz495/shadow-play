# Shadow Play

**A shadow-puppet show lit by one melting candle.** Move the candle closer and
your shadow grows huge; move it away and you shrink. The candle is your power
and your clock.

Created for the **NASCON Vibe Coding Game Dev Competition** by Ayesha Muzammil,
Husnain Riaz, Haziq Haroon and Aiza Kashif.

> *"The fire gives you shape. Time takes it away."*

---

## How to play

Press **Space** at the title, then get to the glowing door at the end of each
act before the wax runs out.

| Action | Keys |
| --- | --- |
| Move | `A` / `D` or `←` / `→` |
| Jump | `W`, `↑` or `Space` |
| Candle closer — **grow** | `E` or mouse wheel up |
| Candle farther — **shrink** | `Q` or mouse wheel down |
| Set size directly | `1` Tiny, `2` Normal, `3` Huge |
| Restart the act | `R` |
| Pause | `Esc` or `P` |
| Mute | `M` |
| Fullscreen | `F` |
| Hide the HUD (for recording) | `H` |
| Developer view — FPS, hitboxes, joints | `F1` |

Keyboard and mouse only; there is no gamepad support.

**The one rule worth knowing:** being **Huge** burns wax twice as fast as
Normal, and **Tiny** burns it slowest. Every puzzle is the same question —
*is being big worth the seconds it costs you?*

The bottom-left panel is the wax you have left; it turns red and pulses under
25%. The dots bottom-right are your size. Hints unfold on their own when you
walk near them, so nothing needs to be looked up.

## The three acts

| | |
| --- | --- |
| **Act I — The Lighting of the Candle** | Walking, jumping, and your first squeeze: only **Tiny** fits under the pillar. |
| **Act II — The Giant** | **Huge** to climb and to push the crate onto the switch, **Tiny** to get through the gate's doorway. |
| **Finale — The Last Act** | The paper stage catches fire behind you. Run right, changing size as you go, while the floor burns into holes. |

Then the puppet takes its bow, the candle burns out, and the curtain falls.

## How the three themes drive it

The jam's themes are **Fire**, **Shadow** and **Time**. All three are in the
core mechanic, not the decoration — take any one away and the game stops
working.

| Theme | How it drives the game |
| --- | --- |
| **Shadow** | You *are* a shadow on a paper screen. Your size depends entirely on the light, and so does every puzzle. |
| **Fire** | The candle is the tool: how close you hold it decides whether you are Tiny, Normal or Huge. Fire is also the hazard — in the finale it eats the paper floor you are standing on. |
| **Time** | The candle melts while you play. Wax *is* the timer, and holding it close to be Huge spends it twice as fast. At zero the puppet goes limp and the curtain closes. |

They meet in one decision: **the thing that gives you power is the thing that
runs out.**

## Running it yourself

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm ci          # exact versions from package-lock.json
npm run dev     # then open http://localhost:8080
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload, on port 8080 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm audit` | Check dependencies for known vulnerabilities |

The checks that run before every commit are in
[`tools/headless/`](tools/headless/) — including a scripted playthrough of
the whole game, title to "Fin.". They need no extra packages; see the
README in that folder.

If port 8080 is taken (a Windows service can hold it), run
`npx vite --config vite/config.dev.mjs --port 5174` instead.

Deploying is set up for Vercel: `vercel.json` carries the build settings and
the security headers from `SECURITY.md`, so connecting the repo is enough.

## Play the game: executables

Shadow Play also runs as a desktop app, with no browser and no Node.js
needed to play. The game inside it is the same production build as the web
version; `desktop/` only wraps it in an [Electron](https://www.electronjs.org)
window.

| Download | For | Size | How to start it |
| --- | --- | --- | --- |
| `ShadowPlay-win-x64.zip` | Windows 10/11, 64-bit | ~159 MB | Unzip, open the `Shadow Play` folder, run **`Shadow Play.exe`** |
| `ShadowPlay-mac-arm64.zip` | Macs with Apple Silicon (M1 and newer) | ~132 MB | Unzip, then right-click **`Shadow Play.app`** → **Open** → **Open** |
| `ShadowPlay-mac-x64.zip` | Intel Macs | ~134 MB | Same as above |

The executables are **not in the git repo**: each one is bigger than
GitHub's 100 MB per-file limit. They are shared as release downloads
instead, or you can build them yourself (below).

**Windows:** the exe is not code-signed, so SmartScreen may say "Windows
protected your PC". Click **More info → Run anyway**. Keep the whole folder
together; the exe needs the files next to it.

**macOS:** the app is unsigned (a jam team has no Apple developer account),
so the first launch needs right-click → Open. If macOS says the app "is
damaged and can't be opened", that is the download quarantine, not damage.
Run this once in Terminal, then open it normally:

```bash
xattr -cr "/Applications/Shadow Play.app"
```

The macOS builds are made on Windows and have not been run on a real Mac
yet; please report it if one does not start.

### Building the executables

```bash
npm ci                  # the game, once
cd desktop
npm ci                  # Electron and the packaging tools, once
npm run build           # Windows + both macOS zips into desktop/out/
npm run build:win       # or just Windows
npm run build:mac       # or just macOS
npm run selftest        # launches the Windows build, checks title + sound
npm start               # run the desktop app without packaging it
```

`desktop/` has its own `package.json`, so the game itself still depends on
only `phaser` and `vite` (`SECURITY.md` rule 4). The build runs
`npm run build` at the root and never changes anything in `src/`. Inside
the app the game is served from a private `app://` address with the same
Content-Security-Policy as the website, with no Node.js access in the page.

## How it is built

Plain JavaScript modules, **Phaser 3.90** and **Vite** — exactly two
dependencies, no framework and no third-party scripts on the page. Everything
you see is drawn in code or loaded from `public/assets/`; the game still runs
with no art files at all, falling back to shapes drawn from the palette.

```
src/
  core/      constants, the event bus, scene-safe listeners, the camera fit
  scenes/    boot, preload, title, game, UI, pause, act card, ending
  objects/   things on the stage: player, puppet rig, door, crate, hint...
  systems/   rules: levels, sizes, wax, fire, input, act flow, audio
  ui/        things that only draw: HUD, panels, curtain, size dots
  fx/        reusable animation and particle pools
  levels/    the acts, as pure data (map strings + hints)
  config.js  every tunable number in the game, in one object
```

Three conventions the code sticks to, in case you read it:

- **No magic numbers or colours.** Every tunable value is in `src/config.js`
  and every colour comes from `PALETTE.md` through `CONFIG.palette`.
- **Rules and drawing are separate.** `systems/` decides, `objects/` and `ui/`
  draw. A level file is pure data with no logic in it.
- **Events, not references.** Things announce what happened on an `EventBus`
  rather than calling each other, so a hazard knows nothing about the HUD.

All game code is written by the team with AI assistance. None of it is copied
from another game.

## Credits

Every asset, font and library is listed in [CREDITS.md](CREDITS.md).

## Documentation

| File | What it is the single source of truth for |
| --- | --- |
| [PRD.md](PRD.md) | What the game is: gameplay, tech design, milestones |
| [NOTES.md](NOTES.md) | Where the project actually is — **read this first** |
| [CODE_RULES.md](CODE_RULES.md) | How the code is organised: folders, patterns, no magic numbers |
| [PALETTE.md](PALETTE.md) | Every colour in the game |
| [ASSETS.md](ASSETS.md) | Every image, sound, music and font file, with its key and path |
| [SECURITY.md](SECURITY.md) | Keeping the repo and the deployed game safe |
