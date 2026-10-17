I # Shadow Play — Colour Palette

> **Single source of truth for every colour in the game.** `PRD.md` = what the game does, `ASSETS.md` = which files, `CODE_RULES.md` = how code is organised, this file = which colours. `src/config.js` holds these values as `CONFIG.palette`, and code never types a colour anywhere else (`CODE_RULES.md` rule 5). To change the look, change this file first, then `CONFIG.palette`.

**Chosen palette: Midnight Teal.** Warm candlelight fading into cold teal darkness. It shows Fire (warm light) against Shadow (the dark) at a glance and reads as modern and cinematic. Previews: `palette/compare.png`.

## Colour tokens

| Token (`CONFIG.palette.*`) | Hex | Used for |
| --- | --- | --- |
| `frame` | `#061014` | Border around the stage, letterbox, loading screen |
| `paperStops` | `#ffe9c2` → `#f0a25a` → `#2f5a63` → `#0b1c22` | Paper glow, radial gradient from the candle (centre) to the edge |
| `shadow` | `#05090b` | Everything drawn in code as silhouette: walls, floor, placeholders, rig rods' base |
| `rod` | 60% `shadow` + 40% `#f0a25a` | Puppet rods: visible but quiet |
| `flameCore` | `#ffd27a` | Bright centre of the candle flame, lit lantern, wax pickup sparkle |
| `flameOuter` | `#ff6a2b` | Flame glow (additive), embers, burning paper edge |
| `wax` | `#fff1c9` | Candle body, HUD candle, wax drops |
| `title` | `#f5e6c8` | Act titles, menu text, dialogue text |
| `textMuted` | `#9fb3b8` | Hints, secondary menu text, disabled options |
| `accent` | `#ffb35c` | Exit door glow, selected menu item, active size dot, tutorial highlights |
| `panel` | `#0b1c22` at 85% opacity | Cards, dialogue boxes, pause menu background |
| `panelEdge` | `#2f5a63` | 1–2 px border on cards and dialogue boxes |
| `danger` | `#ff4d4d` | Hurt flash, wax-low warning pulse |
| `dotOff` | `#3a4a4f` | Inactive size dots and empty UI slots |
| `curtain` | `#7a1424` → `#3a0610` | Curtain placeholder (the real curtain image is in colour) |
| `gold` | `#e8b65a` | Logo placeholder text, results-card candles, every panel border |
| `stagePanel` | `#2b0910` at 90% opacity | **Every pop-up in the show**: results card, death panel, pause menu, settings, act select. A dark wine red taken from the curtain's own shade, so a card looks like it belongs to the theatre rather than to the stage behind it |
| `stagePanelEdge` | `#e8b65a` | The thin gold border and the ornament line under a panel's heading |
| `buttonRest` | `#3d121c` | A button's own plate inside a panel, unselected |
| `buttonSelected` | `#5e1d2a` | ...and selected, under the gold text |

## How the look is built

1. **Glow from the candle.** The paper is a radial gradient through `paperStops`, centred on the candle, not the top of the screen. It grows when the candle is close (Huge) and shrinks and dims as wax runs low. Keep a slow flicker.
2. **Vignette and grain.** A soft dark vignette at the edges and a very light film grain, both baked into a texture once at boot (never per frame).
3. **Flame.** A bright `flameCore` shape on top of a soft additive `flameOuter` glow.
4. **The goal glows.** The exit door has a soft `accent` glow behind it so players always see where to go.
5. **Text.** Titles use `title`, uppercase, letter-spaced, with a soft dark shadow, and are drawn on the UI layer above walls so nothing cuts through them.
6. **Contrast first.** Gameplay silhouettes must stay near-black on every part of the gradient. If something is hard to see near the dark edge, add a thin `accent` rim light rather than lightening the silhouette.

## Images

- AI-made silhouettes stay `#0b0806` as in `ASSETS.md`; it's close enough to `shadow` that no recolouring is needed.
- The curtain, logo and favicon are in colour; keep them warm (reds, golds, orange flame) so they sit well on the teal.
- **Pop-ups belong to the theatre, not the stage.** Anything that stops
  play -- the results card, a death panel, the pause menu, settings --
  uses `stagePanel` with a `gold` border and a gold ornament under its
  heading, with cream (`title`) headings and real buttons. The teal
  `panel` is kept for things drawn ON the stage that must not pull the
  eye: the `?` hints and the HUD's wax card.

## Other options (not chosen)

To switch, replace the token values in `CONFIG.palette`; everything else stays the same.

| Token | Ember Night (warm, fiery) | Rose Dusk (soft, dreamy) |
| --- | --- | --- |
| `frame` | `#0d0a12` | `#140a14` |
| `paperStops` | `#fff4dc` → `#f2b866` → `#b4532a` → `#2a1420` | `#ffe6d0` → `#f4a98c` → `#8a3b5c` → `#2a1026` |
| `shadow` | `#0b0806` | `#120610` |
| `flameCore` / `flameOuter` | `#ffd27a` / `#ff5a1f` | `#ffe08a` / `#ff5f6d` |
| `title` | `#fff1d6` | `#ffe9dc` |
| `accent` | `#ff8a3d` | `#ff8f8f` |
