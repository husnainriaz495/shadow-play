/**
 * Act 3 -- "Moths to the Flame"
 *
 * Teaches: moths, and the choice they force.
 *
 * The shape of the lesson:
 *  - a moth drifts at you in the open, where there is room to learn that
 *    touching one costs wax, and that growing HUGE swats it
 *  - but Huge burns the candle twice as fast, so every moth you kill costs
 *    you seconds. Ducking past one costs nothing but nerve
 *  - the middle is a 3-tile corridor, too low for Huge (4 tiles) to even
 *    enter. Two moths wait inside and a wax drop sits at the far end, so
 *    running the gauntlet SMALL is what pays
 *  - the last climb is 3 tiles, so it needs Huge anyway, and a moth hangs
 *    over the ledge: the one place where swatting is simply the answer
 *
 * THE LURE LANTERNS (`l`) are the act's other answer. One stands at each
 * mouth of the corridor, dark until the puppet walks into it. Lit, it
 * pulls every moth within CONFIG.moth.lureRadius onto ITSELF for
 * CONFIG.lantern.lureSeconds -- they stop hunting you and go to the
 * light, because that is what moths do -- and then it gutters out and
 * they come back. So each gauntlet has two ways through: spend the lure
 * and walk it, or go Huge and swat, which costs wax. Standing still
 * wastes the lure, which is the point of giving it a clock.
 *
 * The themes meet here more tightly than anywhere else in the game: the
 * only weapon is the thing that spends your clock (PRD 4.5 act 3).
 *
 * PURE DATA -- no logic ever goes in a level file (CODE_RULES.md rule 7).
 * Every row is exactly 32 characters.
 *
 * NO HINTS. Act I names the keys; every act after it is left to the
 * player. Finding out what a moth costs is the lesson.
 */
export const act3 = {
    title: 'Act III — Moths to the Flame',
    story: 'They come for the light.\nSo does everything else.',
    backdrop: 'bg_act3',

    map: [
        '################################',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#.........###########..........#',
        '#.....m...###########......m...#',
        '#.........###########........D.#',
        '#........................#######',
        '#..............m..m......#######',
        '#.P....w.l.........w.l.w.#######',
        '################################'
    ]
};
