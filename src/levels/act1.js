/**
 * Act 1 -- "The Lighting of the Candle"
 *
 * Teaches: move, jump, the wax timer, Normal <-> Tiny, and that there is
 * a reason to try HUGE even when nothing forces you to.
 *
 * This is the ONLY act with painted hints, and they name the keys and
 * stop there. No act tells the player its own answer.
 *
 * The gentlest act in the show: CONFIG.acts gives it a full candle and
 * the slowest drain in the game, so a new player can wander and read.
 *
 * The shape of the lesson:
 *  - a LEDGE just past the start with a wax drop hanging over it. Only
 *    Huge can climb onto the ledge, and the drop hangs high enough that
 *    Normal cannot even brush it at the top of a jump -- which is the
 *    real measure, because a drop is taken by TOUCHING it, not by
 *    landing. So the first thing the act teaches is "try the other
 *    sizes", and it is a bonus rather than a gate: missing it costs
 *    nothing but the wax. It sits clear of the first hint's panel on
 *    purpose: a reward nobody can see is not a reward
 *  - two checkpoint LANTERNS, one either side of the pillar. Walking
 *    past one lights it and the act restarts from there, with the wax
 *    you had when you reached it
 *  - the wall down the middle has a ONE-tile gap at floor level, so the
 *    player must shrink to Tiny to crawl through (Normal is two tiles tall)
 *  - on the far side, a two-tile step can only be cleared with Normal's
 *    jump, so they must grow back again
 *  - three wax drops along the way teach that wax can be topped up
 *
 * PURE DATA -- no logic ever goes in a level file (CODE_RULES.md rule 7).
 * Every row must be exactly 32 characters; LevelLoader checks this, plus
 * that only known symbols are used and that there is exactly one P and one
 * D, and names the act and row if anything is wrong.
 *
 * Symbols (full table in PRD 4.4):
 *   # wall   . empty   P start   D exit door   w wax drop   C crate
 *   S switch   G gate   ~ paper   f fire   m moth   ^ draft   | shelter
 *   = one-way platform   k checkpoint lantern   ? hint (text from `hints`)
 */
export const act1 = {
    title: 'Act I — The Lighting of the Candle',
    story: 'The old puppeteer has one candle left.\nOne last show.',

    /**
     * Text for each `?` symbol on the map, in reading order: left to right,
     * top to bottom. There is no separate tutorial (cut 2026-10-17), so
     * these teach the controls.
     */
    hints: [
        'A / D to walk\nW or Space to jump',
        'Too tall for the gap?\nQ: move the candle away',
        'E: grow back to climb\nBig shadows burn wax faster'
    ],

    map: [
        '################################',
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.......w.....#................#',
        '#.............#................#',
        '#..?.......?..#....?...........#',
        '#.............#................#',
        '#......###....#..............D.#',
        '#.............#.......##########',
        '#.P.....w..k.....kw...##########',
        '################################'
    ]
};
