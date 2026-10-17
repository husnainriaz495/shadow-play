import { act1 } from './act1.js';
import { act2 } from './act2.js';
import { act3 } from './act3.js';
import { act4 } from './act4.js';
import { act5 } from './act5.js';

/**
 * The acts, in the order they are played.
 *
 * This list IS the running order: GameScene asks for ACTS[index] and the
 * "next act" is always ACTS[index + 1], so adding an act here is all it
 * takes to put it in the show. Act numbers shown to the player (the act
 * cards, "ACT III OF V") are positions in this list, not file names --
 * which is why the fire finale is simply the last entry.
 */
export const ACTS = [
    act1,
    act2,
    act3,
    act4,
    act5        // the fire finale
];

/** How many acts there are, for progress saving and the ending. */
export const ACT_COUNT = ACTS.length;
