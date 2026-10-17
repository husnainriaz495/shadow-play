# Shadow Play

**A shadow-puppet show lit by one melting candle.** Move the candle closer and
your shadow grows huge; move it away and you shrink. The candle is your power
and your clock.

Made in ~48 hours for the **NASCON vibe-coding game jam** by a team of two.

> **Status: milestone M0 (setup) complete.** The project runs and the stage is
> lit, but there is no gameplay yet — the player, the level and the wax timer
> arrive in M1 and M2. See `NOTES.md` for exactly where things stand.

---

## How to run it

You need [Node.js](https://nodejs.org) (version 20 or newer).

```bash
npm install     # first time only (use `npm ci` on a fresh clone)
npm run dev     # then open http://localhost:8080
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload, on port 8080 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm audit` | Check dependencies for known vulnerabilities |

## Controls

Full list in `PRD.md` section 4.6. Not all of these are implemented yet —
the ones that work today are marked **✔**.

| Action | Keys |
| --- | --- |
| Move | `A` / `D` or `←` / `→` |
| Jump | `W`, `↑` or `Space` |
| Candle closer (grow) | `E` or mouse wheel up |
| Candle farther (shrink) | `Q` or mouse wheel down |
| Set size directly | `1` Tiny, `2` Normal, `3` Huge |
| Restart act | `R` **✔** |
| Pause | `Esc` or `P` |
| Mute | `M` |
| Fullscreen | `F` |
| Hide HUD (for recording) | `H` |
| Developer view (FPS + hitboxes) | `F1` **✔** |

A gamepad is also supported: left stick or D-pad to move, `A` to jump,
`LB` / `RB` to move the candle, `Start` to pause.

## The three themes

The jam's themes are **Fire**, **Shadow** and **Time**. All three are in the
core mechanic, not the decoration — take any one away and the game stops
working.

| Theme | How it drives the game |
| --- | --- |
| **Shadow** | You *are* a shadow on a paper screen. Your size depends entirely on the light. |
| **Fire** | The candle is your tool: how close you hold it decides whether you are Tiny, Normal or Huge. Fire also burns through the paper stage and destroys the floor you stand on. |
| **Time** | The candle melts as you play. Wax is the timer — and being Huge melts it twice as fast. When the wax runs out, the curtain falls. |

> *"The fire gives you shape. Time takes it away."*

So every puzzle is really one question: **is being big worth the seconds it
costs you?**

## Credits

Every asset and library is listed in [CREDITS.md](CREDITS.md). All game code
is written by the team with AI help; none of it is copied from another game.

## Documentation

| File | What it is the single source of truth for |
| --- | --- |
| [PRD.md](PRD.md) | What the game is: gameplay, tech design, milestones |
| [CODE_RULES.md](CODE_RULES.md) | How the code is organised: folders, patterns, no magic numbers |
| [ASSETS.md](ASSETS.md) | Every image, sound, music and font file, with its key and path |
| [SECURITY.md](SECURITY.md) | Keeping the repo and the deployed game safe |
| [NOTES.md](NOTES.md) | Shift handover notes — read this first |
