# `src/fx/` — reusable animation helpers

This folder is listed in `CODE_RULES.md` section 3 and `PRD.md` 5.1. It holds
reusable animation helpers and particle pools, never game rules.

**In use:** `FireEffects.js` (M4): the burning-paper glows that flare at
the fire front, and the ember pool. `systems/FireGrid.js` decides where
fire goes; this only draws it. `UIAnim.js` (M5): `InkText`, the letter-by
-letter reveal used by the act cards and the ending's "FIN.".

**Planned for M5:**

| File | Job |
| --- | --- |
| `Transitions.js` | The quick-restart "curtain flick" and scene fades. NOTE: the curtain itself open/closes from `ui/Curtain.js`, which draws it — nothing was moved here |
| ~~`UIAnim.js`~~ | **Built.** The typewriter reveal is in it; panel unfolding stayed in `ui/PaperPanel.js`, which owns the panel |
| ~~`Juice.js`~~ | Each piece of juice sits with the thing it reacts to instead: shake in `systems/HitFeedback.js`, the landing nudge in `DustPuff.js`, squash in the rig's `land` pose |
| ~~`Particles.js`~~ | **Built as two pools** — `FireEffects.js` (embers) and `DustPuff.js` (landing dust). `Afterimage.js` pools RenderTexture stamps for the size change |

Two rules that apply to everything in here:

- Every duration and easing comes from `CONFIG.anim` — never a number typed
  into an animation call (`CODE_RULES.md` rule 5).
- Nothing may create objects every frame. Particles come from pools made
  once (`CODE_RULES.md` rule 9).

Also remember the **"Reduce motion & flicker"** setting (`PRD` 5.1): with it
on, every animation here becomes a simple fade and the flicker calms down.

*This file can be deleted once the M5 files exist.*
