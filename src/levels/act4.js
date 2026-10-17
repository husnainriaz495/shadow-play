/**
 * Act 4 -- "The Draft"
 *
 * Teaches: the gust, and that the wind is a TOOL as well as a hazard.
 *
 * Every six seconds a draft sweeps the stage. It gives a second of
 * warning -- the shelter curtains wave, "GUST!" drops into the HUD, the
 * first streaks cross the screen -- and then for a second and a half it
 * flattens anything in the open to Tiny, shoves it to the right, and
 * burns wax faster while the flame struggles. The lit screens `|` are the
 * only places it does not reach.
 *
 * The shape of the lesson:
 *  - a screen right next to the start, so the first gust teaches rather
 *    than punishes: stand behind it and watch what happens outside
 *  - a second screen part-way along, so the open run between them has to
 *    be timed against the countdown bar
 *  - THE GAP: five tiles of nothing, wider than any jump in the game.
 *    The only way over is to be out in the open when the gust hits --
 *    which means Tiny, because the gust allows nothing else -- and to
 *    jump INTO it. The wind carries you across. This is the act's puzzle
 *    and the thing to point a camera at
 *  - a screen on the far side to recover in, and then a 3-tile climb that
 *    needs HUGE: growing in the open means the next gust takes it
 *    straight back, so the climb has to start the moment a gust ends
 *
 * The theme is Time read a second way: not the wax draining, but a rhythm
 * you have to move with (PRD 4.4, 4.5).
 *
 * PURE DATA -- no logic ever goes in a level file (CODE_RULES.md rule 7).
 * `^` marks where the draft blows from (scenery for the scraps, not a
 * hazard in itself); `|` marks a shelter screen, which stands ON its tile.
 * Every row is exactly 32 characters.
 *
 * NO HINTS. The countdown bar and the "GUST!" card say when the wind is
 * coming -- that is a warning, not a walkthrough -- and the rest is the
 * player's to work out.
 */
export const act4 = {
    title: 'Act IV — The Draft',
    story: 'A window is open somewhere.\nThe candle leans with every breath.',
    backdrop: 'bg_act4',

    map: [
        '################################',
        '#..............................#',
        '#..............................#',
        '#^............................^#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#............................D.#',
        '#.........................######',
        '#........w....w...........######',
        '#.P.|.........|........|..######',
        '#################.....##########'
    ]
};
