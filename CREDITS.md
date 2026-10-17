# Credits

Shadow Play was created for the **NASCON Vibe Coding Game Dev Competition** by

- **Ayesha Muzammil**
- **Husnain Riaz**
- **Haziq Haroon**
- **Aiza Kashif**

Jam rules require every asset to be credited, and `SECURITY.md` rules 16–17
make this part of our score: **all code is written by us** (with AI help) and
**every asset is listed below**. Nothing is copied from another game.

---

## How to use this file

When you add a real asset file:

1. put it at the exact path in `ASSETS.md`
2. tick its `[ ]` box there
3. flip its `ready` flag to `true` in `src/assets.js`
4. **add a row to the right table below** — asset, source link, licence

For AI-generated files, write `AI-generated (ChatGPT)` or
`AI-generated (Gemini)` as the source and `Self-made` as the licence.

**Sounds with no file yet are not silent.** `src/systems/SynthSounds.js`
builds a stand-in for each one in the browser out of oscillators and
filtered noise. They are ours, nothing is downloaded, and the moment a
real recording is added (and its `ready` flag set) it replaces the
stand-in. The console lists which ones are still missing at every boot.

---

## Code

| What | Who |
| --- | --- |
| All game code | Written by the team with Claude Code. No code copied from any existing game. |
| [Phaser 3](https://phaser.io) | Phaser Studio Inc. — MIT licence |
| [Vite](https://vitejs.dev) | VoidZero / Vite contributors — MIT licence |

## Images

The puppet parts, crate, door, gate, moth, switch, the logo, both curtain
halves and all five backdrops are real art. Everything else is still a
placeholder drawn in code. Add a row here for each real PNG.

| Asset | Source link | Licence |
| --- | --- | --- |
| `puppet_body` | AI-generated (ChatGPT) | Self-made |
| `puppet_arm` | AI-generated (ChatGPT) | Self-made |
| `puppet_leg` | AI-generated (ChatGPT) | Self-made |
| `crate` | AI-generated (ChatGPT) | Self-made |
| `door` | AI-generated (ChatGPT) | Self-made |
| `gate` | AI-generated (ChatGPT) | Self-made |
| `moth` | AI-generated (ChatGPT) | Self-made |
| `switch` | AI-generated (ChatGPT) | Self-made |
| `bg_act1` | AI-generated (ChatGPT) | Self-made |
| `bg_act2` | AI-generated (ChatGPT) | Self-made |
| `bg_act3` | AI-generated (ChatGPT) | Self-made |
| `bg_act4` | AI-generated (ChatGPT) | Self-made |
| `bg_act5` | AI-generated (ChatGPT) | Self-made |
| `logo` | AI-generated (ChatGPT) | Self-made |
| `curtain_left` | AI-generated (ChatGPT) | Self-made |
| `curtain_right` | AI-generated (ChatGPT) | Self-made |
| `pointer_hand` | AI-generated (ChatGPT) | Self-made |
| `gamepad_icons` | AI-generated (ChatGPT) | Self-made |
| `lantern` | AI-generated (ChatGPT) | Self-made |
| `favicon` | Drawn in code by the team (Python/Pillow) from the game palette | Self-made |
| `og_image` | A screenshot of the game with its title added | Self-made |

## Sound effects

| Asset | Source link | Licence |
| --- | --- | --- |
| `sfx_crackle` | [Pixabay](https://pixabay.com/sound-effects/) (title and author not recorded) | Pixabay Content License |
| `sfx_grow` | "Cinematic Whoosh Reverse 2" by floraphonic, [Pixabay](https://pixabay.com/sound-effects/) | Pixabay Content License |
| `sfx_shrink` | [Pixabay](https://pixabay.com/sound-effects/) (title and author not recorded) | Pixabay Content License |
| `sfx_jump` | [Pixabay](https://pixabay.com/sound-effects/) (title and author not recorded) | Pixabay Content License |
| `sfx_hurt` | [Pixabay](https://pixabay.com/sound-effects/) (title and author not recorded) | Pixabay Content License |
| `sfx_wax` | Self-generated with [jsfxr](https://sfxr.me) | Self-made |
| _every other `sfx_` key_ | **Made by the game itself at runtime** — `src/systems/SynthSounds.js` builds them from Web Audio oscillators and filtered noise. No file, no third party. | Self-made |

## Music

| Asset | Source link | Licence |
| --- | --- | --- |
| `music_theme` | [Pixabay](https://pixabay.com/music/) (**title and author still to be filled in** — whoever downloaded it, please add them) | Pixabay Content License |
| `music_finale` | _not made yet_ — the finale plays `music_theme` until it exists | — |

## Font

| Asset | Source link | Licence |
| --- | --- | --- |
| _none yet — the game falls back to Georgia_ | | |
