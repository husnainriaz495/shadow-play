/**
 * The finale -- "The Last Act" (PRD 4.5 Act 5; the Fire theme's showcase).
 *
 * Teaches nothing new: it combines everything under a chase.
 *  - RUN: the paper floor is lit at the far left (`f`). After a head start
 *    (CONFIG.fire.startDelaySeconds) the fire creeps right one tile per
 *    second, and the floor it passes burns into holes.
 *  - CRAWL: a wall with a one-tile gap at the floor. Only Tiny fits.
 *  - CLIMB: grow Huge and jump onto the 3-high stone block. That is safety:
 *    the floor is STONE from the block onwards, so the fire stops there and
 *    can never burn away the route ahead (NOTES open question 7).
 *  - SQUEEZE: a low passage under a hanging slab, too short for Huge -- back
 *    to Normal.
 *
 * ...and then THE FINAL EXAM, with everything the show has taught in one
 * stretch of eight tiles (PRD 4.5):
 *  - SHELTER: a lit screen `|` just before the passage, and one open
 *    window `^` high on the left wall. A gust sweeps the stage every
 *    CONFIG.acts[4].draftIntervalSeconds (14 s -- far rarer than Act IV's
 *    6, because this act already has a fire in it). Caught in the open it
 *    flattens you to Tiny, so you cannot push or climb anything until it
 *    passes: step into the screen, let it blow through, carry on.
 *  - PUSH: a crate `C` waiting past the slab. Only Huge moves it, and it
 *    has one tile to travel before it is flush against the last ledge.
 *  - CLIMB: that ledge is FOUR tiles. Huge jumps three. So the crate is
 *    not a shortcut, it is the step -- push it, stand on it, and the door
 *    is two tiles up.
 * All the while Huge burns wax twice as fast, so lingering big costs time,
 * and a gust that catches you mid-push costs more.
 *
 * Numbered as the THIRD act because Acts 3 and 4 are cut; the title says
 * "Finale" so no act number looks missing. Its backdrop is the theatre
 * (bg_act5: the stage edge and the audience), standing on the floor.
 *
 * PURE DATA -- no logic in level files (CODE_RULES.md rule 7).
 *
 * NO HINTS. The act card's own story line sets the scene ("the stage
 * itself is burning"); after that the fire speaks for itself.
 */
export const act5 = {
    title: 'Finale — The Last Act',
    story: 'The candle is nearly spent.\nAnd now the stage itself is burning.',
    backdrop: 'bg_act5',
    backdropRestsOnRow: 17,   // the theatre stands on the floor, not behind it

    map: [
        '################################',
        '#^.......#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##..........#',
        '#........#.........##........D.#',
        '#........#.........##......#####',
        '#........#....####.........#####',
        '#........#....####.........#####',
        '#..P..w.....w.####|..w..C..#####',
        '#f~~~~~~~~~~~~##################'
    ]
};
