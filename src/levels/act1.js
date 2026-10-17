/**
 * Act 1 -- "The Lighting of the Candle"
 *
 * Teaches: move, jump, the wax timer, and Normal <-> Tiny.
 *
 * The shape of the lesson:
 *  - the wall down the middle has a ONE-tile gap at floor level, so the
 *    player must shrink to Tiny to crawl through (Normal is two tiles tall)
 *  - on the far side, a two-tile step can only be cleared with Normal's
 *    jump, so they must grow back again
 *  - two wax drops along the way teach that wax can be topped up
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
     * top to bottom. Act 1 has no hint symbols yet -- they are added in M3
     * together with the PaperPanel animation.
     */
    hints: [],

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
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.............#................#',
        '#.............#..............D.#',
        '#.............#.......##########',
        '#.P.....w.........w...##########',
        '################################'
    ]
};
