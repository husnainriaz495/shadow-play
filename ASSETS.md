# Shadow Play — Assets

> **Single source of truth for every image, sound, music and font file.** `PRD.md` says *what the game does*; this file says *which files exist, where they live, and what key the code uses for them*. If an asset changes, change it here first.

## Rules (for Claude Code and for us)

1. **The game must run with zero asset files.** Every image has a code-drawn placeholder (generated in `BootScene` with `Graphics.generateTexture`) under the same key. Every sound is optional: if the file is missing, the game stays silent instead of crashing.
2. **Code never uses file paths directly.** All files are listed once in `src/assets.js` (the manifest), which mirrors the tables below. Scenes use only the **key** (e.g. `this.add.image(x, y, 'puppet_body')`).
3. `PreloadScene` loads every entry in the manifest. If a file fails to load, it logs a warning and keeps the placeholder texture for that key. Silence for missing sounds.
4. When we add a real file, we: put it at the exact path below, tick its box here, add its source to `CREDITS.md`, then tell Claude Code *"The asset X is now in place; make sure it is used."*
5. Images are **PNG with a transparent background**. Gameplay art is **pure black silhouette** (`#0b0806`) unless the table says otherwise. Audio is **MP3** (one exception: `sfx_wax` is a small WAV, which every browser also plays).

## Folder layout

```
public/assets/
  images/       # PNG sprites and backgrounds
  audio/sfx/    # short sound effects
  audio/music/  # music loops
  fonts/        # one .woff2 font file
src/assets.js   # the manifest: { images: [{ key, path, w, h }], audio: [{ key, path, loop, volume }], fonts: [...] }
```

## Images

Sizes are given at **2× Normal scale** for the puppet parts so they stay crisp when Huge (the game scales them down for Normal and Tiny). Everything faces **right**; the game flips it for left (`flipX`).

**The puppet is a jointed cut-out, like a real shadow puppet:** body, one arm image and one leg image. The game pins the arm at the shoulder and the leg at the hip and swings them with springs (see PRD 4.2.1). So you never draw walk or jump frames. Draw arms and legs **hanging straight down**, with the joint at the **top centre** of the image. Draw the body so the shoulders and hips are clearly visible; after adding the art, adjust `CONFIG.rig.mounts` so the joints line up (turn on `DEBUG` to see the joint dots). Puppet rods are drawn in code, so they don't need an image.

| Done | Key | File path | Size (px) | What it is | Placeholder in code |
| --- | --- | --- | --- | --- | --- |
| [x] | `puppet_body` | `public/assets/images/puppet_body.png` | 80×120 | Torso + head of the puppet (a small knight with a little cape), **no arms or legs**, facing right | Rounded rectangle + circle |
| [x] | `puppet_arm` | `public/assets/images/puppet_arm.png` | 24×72 | One arm hanging straight down, with a thin puppet rod at the hand. Used for both arms | Thin rounded rectangle |
| [x] | `puppet_leg` | `public/assets/images/puppet_leg.png` | 28×64 | One leg with a boot, hanging straight down. Used for both legs | Thin rounded rectangle |
| [x] | `moth` | `public/assets/images/moth.png` | 96×48 (2 frames, 48×48 each) | Moth, wings open / wings closed | Two triangles |
| [x] | `crate` | `public/assets/images/crate.png` | 80×80 | Wooden crate silhouette (2×2 tiles) | Square with an X |
| [x] | `door` | `public/assets/images/door.png` | 40×80 | Stage door with arch | Rectangle with arch |
| [x] | `gate` | `public/assets/images/gate.png` | 40×120 | Portcullis bars | Vertical bars |
| [x] | `switch` | `public/assets/images/switch.png` | 80×40 (2 frames, 40×40: up / pressed) | Heavy floor lever/plate | Small block |
| [ ] | `wax` | `public/assets/images/wax.png` | 24×32 | A wax drop (this one may be cream `#fff1c9`, not black) | Teardrop shape |
| [ ] | `lantern` | `public/assets/images/lantern.png` | 80×80 (2 frames, 40×40: unlit / lit) | Small hanging lantern for checkpoints | Small box with a flame dot |
| [ ] | `bg_act1` | `public/assets/images/bg_act1.png` | 1280×720 | Act 1 backdrop: village rooftops and a church tower, silhouettes at ~30% opacity along the bottom | None (plain paper) |
| [ ] | `bg_act2` | `public/assets/images/bg_act2.png` | 1280×720 | Act 2: a giant's castle | None |
| [ ] | `bg_act3` | `public/assets/images/bg_act3.png` | 1280×720 | Act 3: forest with a big moon | None |
| [ ] | `bg_act4` | `public/assets/images/bg_act4.png` | 1280×720 | Act 4: windmill and tall windows | None |
| [ ] | `bg_act5` | `public/assets/images/bg_act5.png` | 1280×720 | Act 5: the theatre itself, stage and audience heads | None |
| [ ] | `curtain_left` | `public/assets/images/curtain_left.png` | 660×720 | Red velvet theatre curtain, left half (in colour) | Dark red rectangle with fold lines |
| [ ] | `curtain_right` | `public/assets/images/curtain_right.png` | 660×720 | Right half (mirror of left) | Same |
| [ ] | `logo` | `public/assets/images/logo.png` | 800×240 | "Shadow Play" title, gold on transparent | Text in the theatre font |
| [ ] | `pointer_hand` | `public/assets/images/pointer_hand.png` | 64×64 | Black silhouette of a pointing hand (puppeteer's glove), pointing down | Triangle arrow |
| [ ] | `favicon` | `public/favicon.png` | 64×64 | A lit candle icon (in colour), used as the browser tab icon. Not loaded by Phaser | Phaser default icon |
| [ ] | `og_image` | `public/og-image.png` | 1200×630 | Link-preview image: a screenshot of the puppet on glowing paper with the logo. Not loaded by Phaser | None |
| [ ] | `gamepad_icons` | `public/assets/images/gamepad_icons.png` | 256×64 (4 frames, 64×64: A, B, LB, RB) | Gamepad button icons for device-aware prompts (keyboard keys are drawn in code) | Circles with letters drawn in code |

The paper texture, glow, flame, HUD candle, walls, burning paper, particles, key icons, spotlight and the tutorial tick are **always drawn in code**: no files are needed.

## Sound effects

| Done | Key | File path | Plays when | Notes |
| --- | --- | --- | --- | --- |
| [x] | `sfx_crackle` | `public/assets/audio/sfx/crackle.mp3` | Always, looping | Candle fire loop; volume follows wax |
| [x] | `sfx_grow` | `public/assets/audio/sfx/grow.mp3` | Size goes up | Soft rising whoosh |
| [x] | `sfx_shrink` | `public/assets/audio/sfx/shrink.mp3` | Size goes down | Falling whoosh |
| [ ] | `sfx_squeeze` | `public/assets/audio/sfx/squeeze.mp3` | Growing is blocked | Short creak |
| [x] | `sfx_jump` | `public/assets/audio/sfx/jump.mp3` | Jump | Paper flap |
| [ ] | `sfx_land` | `public/assets/audio/sfx/land.mp3` | Landing | Soft thud |
| [x] | `sfx_wax` | `public/assets/audio/sfx/wax.wav` | Wax drop picked up | Gentle chime. **WAV, not MP3** (made in jsfxr; 7 KB, so left unconverted) |
| [ ] | `sfx_checkpoint` | `public/assets/audio/sfx/checkpoint.mp3` | Checkpoint lantern lit | Soft whoosh-chime |
| [ ] | `sfx_paper` | `public/assets/audio/sfx/paper.mp3` | Paper panels unfold/fold, hints appear | Soft paper rustle |
| [ ] | `sfx_match` | `public/assets/audio/sfx/match.mp3` | Game start, candle is lit | Match strike |
| [ ] | `sfx_tick` | `public/assets/audio/sfx/tick.mp3` | Tutorial step completed | Bright small chime |
| [ ] | `sfx_ui` | `public/assets/audio/sfx/ui.mp3` | Menu move/select | Soft paper tick |
| [x] | `sfx_hurt` | `public/assets/audio/sfx/hurt.mp3` | Losing wax to a hazard | Sizzle |
| [ ] | `sfx_gust` | `public/assets/audio/sfx/gust.mp3` | Draft blows | Wind |
| [ ] | `sfx_moth` | `public/assets/audio/sfx/moth.mp3` | Moth nearby, looping, quiet | Fluttering |
| [ ] | `sfx_swat` | `public/assets/audio/sfx/swat.mp3` | Moth destroyed | Paper slap |
| [ ] | `sfx_burn` | `public/assets/audio/sfx/burn.mp3` | Paper tile catches fire | Whoomp |
| [ ] | `sfx_crate` | `public/assets/audio/sfx/crate.mp3` | Crate pushed, looping while moving | Wood scrape |
| [ ] | `sfx_switch` | `public/assets/audio/sfx/switch.mp3` | Switch pressed | Clunk |
| [ ] | `sfx_gate` | `public/assets/audio/sfx/gate.mp3` | Gate opens | Chain rattle |
| [ ] | `sfx_door` | `public/assets/audio/sfx/door.mp3` | Act completed | Creak + small applause |
| [ ] | `sfx_curtain` | `public/assets/audio/sfx/curtain.mp3` | Curtain opens/closes | Fabric swish |
| [ ] | `sfx_candle_out` | `public/assets/audio/sfx/candle_out.mp3` | Wax hits 0 | Blow-out puff |
| [ ] | `sfx_applause` | `public/assets/audio/sfx/applause.mp3` | Ending | Theatre applause |

## Music

| Done | Key | File path | Plays | Notes |
| --- | --- | --- | --- | --- |
| [x] | `music_theme` | `public/assets/audio/music/theme.mp3` | Title, Acts 1 to 4, looping | Soft music box or solo violin, calm |
| [ ] | `music_finale` | `public/assets/audio/music/finale.mp3` | Act 5, looping | Same mood but faster and tense |

## Font

| Done | Key | File path | Notes |
| --- | --- | --- | --- |
| [ ] | `font_theatre` | `public/assets/fonts/theatre.woff2` | An old-theatre serif from Google Fonts (e.g. Cinzel or IM Fell English). Loaded with a CSS `@font-face` in `index.html`; until it exists, use `Georgia, serif` |

## Where to get them

- **Silhouette images:** ChatGPT or Gemini with this prompt, then remove the background with remove.bg or Photopea and resize:
  > Solid pure black silhouette of [a hand-made shadow puppet of a small knight, side view, standing], flat 2D, no details inside the shape, sharp clean edges, on a plain pure white background, centered, nothing else in the image.
- **Curtain and logo:** same tools, in colour: *"Red velvet theatre curtain, left half, front view, rich folds, transparent background"*.
- **Sound effects:** freesound.org, pixabay.com/sound-effects, sfxr.me.
- **Music:** pixabay.com/music.
- **Font:** fonts.google.com, download it and convert to `.woff2` if needed.

Every file goes in `CREDITS.md` with its source link (or "AI-generated with ChatGPT/Gemini").
