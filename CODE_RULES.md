# Shadow Play — Code Rules

> **Single source of truth for how the code is organised.** `PRD.md` = what to build, `ASSETS.md` = which files, `SECURITY.md` = how to stay safe, this file = how to structure the code. Claude Code must follow these rules in every milestone. Adapted from our web-dev rules, rewritten for a Phaser game.

---

## 1. Use the engine first (don't hand-roll what Phaser already has)

*(Web rule: "Always use Shadcn components, never custom ones".)*

- Before writing any system, check if Phaser already provides it: Arcade Physics (movement, collision, overlap), Tilemaps, Tweens, Timers (`this.time.addEvent`), Cameras (shake, fade), Particles, Input (keyboard, wheel), Sound manager, Scene manager, Events.
- **Never write custom physics, a custom game loop, or a custom tween system.**
- If a Phaser feature almost fits, **extend or wrap it** (e.g. `class Player extends Phaser.Physics.Arcade.Sprite`), don't replace it.

## 2. Single responsibility: one job per file

*(Web rule: "Break every page into focused components".)*

- **Scenes orchestrate; they don't contain game rules.** A scene creates objects, wires events and switches scenes. The logic of *how* things behave lives in `objects/` and `systems/`.
- Always extract into its own file: each game object (Player, Crate, Moth…), each system (wax/candle, fire spread, drafts, level loading, saving), each level, the HUD.
- **One class per file, file named after the class, PascalCase** (`Player.js` exports `Player`). Data/config files are camelCase (`config.js`, `assets.js`, `act1.js`).
- **Size limit:** if a file passes ~200 lines or does two different jobs, split it.

## 3. Folder structure (strict)

*(Web rule: "components/[Page]/Component".)* Group by **role**:

```
src/
  main.js        # creates the Phaser.Game with the scene list. Nothing else.
  config.js      # every tunable number and colour (single source)
  assets.js      # asset manifest mirroring ASSETS.md (single source)
  scenes/        # BootScene, PreloadScene, TitleScene, GameScene, UIScene, ActCardScene, EndScene
  objects/       # things that exist in the world: Player, Crate, Moth, Door, Gate, Switch, WaxDrop
  systems/       # rules that run over time: Candle (wax), FireGrid, Draft, LevelLoader, SaveProgress, AudioManager
  states/        # player size states: TinyState, NormalState, HugeState (see pattern 6.4)
  levels/        # act1.js … act5.js + index.js (pure data, no logic)
  ui/            # HUD pieces drawn in UIScene: WaxCandle, SizeDots
  core/          # EventBus.js, events.js (event-name constants), constants.js (tile size, depths, scene keys)
  fx/            # Transitions.js, UIAnim.js, Juice.js, Particles.js (reusable animation helpers, see PRD 5.1)
```

| Folder | Allowed to contain | Never contains |
| --- | --- | --- |
| `scenes/` | Creating objects, wiring events, scene changes | Physics numbers, game rules |
| `objects/` | One world thing's behaviour and visuals | Level layout, HUD drawing |
| `systems/` | Rules over time or across many objects | Direct HUD drawing |
| `levels/` | Map strings, titles, story text | Any functions or logic |
| `ui/` | Drawing HUD elements from data they receive | Game rules |
| `core/` | Shared infrastructure | Game content |
| `fx/` | Reusable animations, transitions, particle pools | Game rules |

## 4. Reuse before writing

*(Web rule: "Check if something exists, extend at 80%".)*

- Before writing a new class or helper, search the codebase for something equivalent. If an existing one covers 80% or more of the need, extend it.
- **No duplicated logic.** Shared helpers go in `src/core/` (e.g. `tileToWorld()`, `clamp()`).
- Similar objects share a base: e.g. `Crate`, `Gate` and `Door` can extend a small `StaticProp` base if they share setup.

## 5. No magic numbers or inline styling

*(Web rule: "Never style Buttons inline, use variants and globals.css".)*

- **Every number that affects feel lives in `config.js`**: speeds, jump, gravity, wax drain, timers, scales, colours. Code reads `CONFIG.player.sizes[1].speed`, never `220`.
- **Every colour comes from `CONFIG.palette`** (paper, shadow, flame…). Change it there and the whole game updates.
- Scene keys, event names, tile size and render depths are constants in `core/constants.js` and `core/events.js`. Never type `'GameScene'` or `'wax-changed'` as raw strings in two places.

```js
// ❌ Never
this.player.setVelocityX(220);
this.events.emit('waxChanged', wax);

// ✅ Always
this.player.setVelocityX(CONFIG.player.sizes[this.sizeIndex].speed);
EventBus.emit(EVENTS.WAX_CHANGED, wax);
```

## 6. Design principles and patterns (SDA)

### 6.1 SOLID, the game version

- **S (Single responsibility):** see section 2. `Candle` handles wax only, and `UIScene` only draws it.
- **O (Open/closed):** adding a new hazard means adding a new class and a new map symbol in `LevelLoader`'s table, not editing `Player`.
- **L (Liskov substitution):** every size state can replace another without `Player` caring (6.4).
- **I (Interface segregation):** objects expose small methods (`update(dt)`, `onPlayerTouch(player)`) rather than one giant API.
- **D (Dependency inversion):** objects talk through `EventBus` and get settings from `CONFIG`, not by reaching into scenes.

### 6.2 Observer: `EventBus` (`core/EventBus.js`)

- Systems **announce** things and others **listen**. Example: `Candle` emits `WAX_CHANGED` and `WAX_OUT`; `UIScene` listens to redraw the HUD; `GameScene` listens to `WAX_OUT` to restart.
- **Objects never call methods on the HUD or on other scenes directly.**
- Always remove listeners on scene shutdown (`this.events.once('shutdown', () => EventBus.off(...))`) to avoid duplicate handlers after a restart.

### 6.3 Factory: `LevelLoader`

- One **symbol → class table** maps map characters to object factories: `{ 'C': (x, y) => new Crate(...), 'm': ... }`.
- Adding an object means adding one line to the table. **No growing `if/else` chains.**

### 6.4 State: player sizes

- `TinyState`, `NormalState` and `HugeState` each define `scale`, `speed`, `jump`, `waxMultiplier`, `canPushCrates`, `canSwatMoths`, plus `enter(player)` / `exit(player)`. Their numbers come from `CONFIG`.
- `Player` holds `this.state` and asks it questions (`this.state.canPushCrates`) instead of `if (sizeIndex === 2)` checks scattered everywhere.

### 6.5 Singleton (only these three)

- `config.js`, `assets.js` and `EventBus.js` are **module singletons**: one instance, imported wherever needed, never re-created.
- **No other globals or singletons.** No `window.something`. Game state belongs to its scene or system.

### 6.6 Composition over inheritance

- Keep inheritance to **one level** below Phaser classes (`Player extends Arcade.Sprite`). Add abilities by giving an object a helper (for example a `Flicker` helper used by both the candle and torches), not by building deep class trees.

## 7. Data stays data

- Levels are **pure data** in `levels/` (map strings, title, story). No logic inside level files.
- The asset list is **pure data** in `assets.js`, mirroring `ASSETS.md`.
- `localStorage` access happens only in `systems/SaveProgress.js` (see `SECURITY.md` rule 12).

## 8. Loading strategy

*(Web rule: "Lazy-load heavy things".)*

- `PreloadScene` loads only what the title screen and Act 1 need. Each act's backdrop (`bg_actN`) and `music_finale` load just before that act, in `ActCardScene`, while the curtain is closed.
- Placeholder textures are generated once in `BootScene`, never per frame.

## 9. Performance rules for the game loop

- `update()` must not create objects, textures or arrays every frame. Create them once and reuse them; use groups/pools for particles and moths.
- Timers (`this.time.addEvent`) for anything periodic (fire spread, drafts), not frame counters.
- Scene restart must fully clean up: timers, tweens and EventBus listeners.

## 10. Package manager and dependencies

- **Use npm** (the Phaser template ships with it). Commit `package-lock.json`. Don't mix in pnpm or yarn on this project; mixing lockfiles breaks Vercel builds.
- Allowed dependencies are `phaser` and `vite` only (see `SECURITY.md` rule 4).

## 11. Code style

- Plain JavaScript, ES modules (`import`/`export`), `const` by default, `let` when reassigned, never `var`.
- **Comment the "why" for beginners** above each class and each non-obvious block.
- Named exports for classes and constants; `main.js` is the only entry point.
- Run the game after every change; the browser console must have no red errors before committing.

## Quick checklist for every change

- [ ] Used a Phaser feature where one exists
- [ ] New code is in the right folder, one class per file
- [ ] No magic numbers or colours, all in `config.js`
- [ ] Objects talk through `EventBus`, no direct calls into other scenes
- [ ] New map symbol added to the `LevelLoader` table, no `if/else` chain
- [ ] Listeners and timers are cleaned up on scene shutdown
- [ ] No red errors in the console
