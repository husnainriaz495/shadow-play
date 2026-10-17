import { act1 } from './act1.js';

/**
 * The acts, in the order they are played.
 *
 * Acts 2 to 5 are added here as they are built (milestones M3 and M4 in
 * PRD.md section 9). Keeping the order in one list means GameScene can just
 * ask for ACTS[index] and the "next act" is always ACTS[index + 1].
 */
export const ACTS = [
    act1
];

/** How many acts there are, for progress saving and the ending. */
export const ACT_COUNT = ACTS.length;
