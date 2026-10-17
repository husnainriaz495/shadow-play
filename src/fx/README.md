# `src/fx/` — reusable animation helpers

This folder is listed in `CODE_RULES.md` section 3 and `PRD.md` 5.1. It is
empty on purpose: the animations belong to milestone **M5**, and nothing
should be written here until then.

When M5 starts, these four files go here — and **only** these. They hold
reusable animation helpers, never game rules.

| File | Job |
| --- | --- |
| `Transitions.js` | Curtain open/close, the quick-restart "curtain flick", scene fades |
| `UIAnim.js` | Paper panels unfolding, the typewriter text reveal, button hover/press |
| `Juice.js` | Camera shake, hit-stop, squash-and-stretch, zoom punches |
| `Particles.js` | Pre-made pools: embers, ash, dust puffs, paper flakes |

Two rules that apply to everything in here:

- Every duration and easing comes from `CONFIG.anim` — never a number typed
  into an animation call (`CODE_RULES.md` rule 5).
- Nothing may create objects every frame. Particles come from pools made
  once (`CODE_RULES.md` rule 9).

Also remember the **"Reduce motion & flicker"** setting (`PRD` 5.1): with it
on, every animation here becomes a simple fade and the flicker calms down.

*This file can be deleted once the four real files exist.*
