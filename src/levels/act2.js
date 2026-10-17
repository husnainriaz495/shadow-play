/**
 * Act 2 -- "The Giant"
 *
 * Teaches: Huge. A huge shadow jumps higher and pushes crates, but it
 * burns wax twice as fast and does not fit everywhere (PRD 4.5).
 *
 * The shape of the lesson:
 *  - a 3-tile ledge right at the start: Normal's jump falls short, so the
 *    player must grow Huge to climb it (the "high ledge")
 *  - on top, a crate. Only a Huge puppet can push it. Pushed right, it
 *    drops into a 3-wide notch in the floor and lands on the heavy switch
 *    there. It cannot be pushed out again, so the switch stays pressed
 *  - the switch opens the gate. The doorway behind it is 3 tiles tall:
 *    Huge (4 tiles) does not fit, so the player must shrink to pass
 *  - the door waits on another 3-tile ledge: grow Huge once more to reach it
 *  - three wax drops, because Huge burns the candle twice as fast
 *
 * THE GATE IS ON A CLOCK. Step off the switch and it does not slam: a ring
 * of light on the plate shrinks away over a few seconds, ticking, before
 * the gate drops (objects/Switch.js, CONFIG.switchGate.holdSeconds). So
 * the act has two answers instead of one -- park the crate on the switch
 * and the gate is held open for good, or stand on it as Huge, jump out of
 * the notch, shrink for the doorway and run the gap in the time you have.
 * The dash is about twice as fast as the clock, which is the point: tight
 * and fair.
 *
 * PURE DATA -- no logic ever goes in a level file (CODE_RULES.md rule 7).
 * Every row must be exactly 32 characters. A `C` marks the crate's
 * BOTTOM-LEFT tile (it is 2 x 2 tiles). A `G` marks the gate's BOTTOM tile
 * (it is 3 tiles tall). Each switch `S` opens the nearest gate.
 *
 * NO HINTS. Act I names the keys; every act after it is left to the
 * player. Being told that a crate needs Huge is being handed the act.
 */
export const act2 = {
    title: 'Act II — The Giant',
    story: 'The puppeteer leans closer.\nThe shadow grows, and so does its hunger.',

    map: [
        '################################',
        '#....................##........#',
        '#....................##........#',
        '#....................##........#',
        '#....................##........#',
        '#....................##........#',
        '#....................##........#',
        '#....................##........#',
        '#....................##........#',
        '#....................##........#',
        '#....................##......D.#',
        '#..........................#####',
        '#..........................#####',
        '#..........C..w......G..w..#####',
        '#.......########.S.#############',
        '#.......########################',
        '#.P..w..########################',
        '################################'
    ]
};
