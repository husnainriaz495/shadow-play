import { TinyState } from './TinyState.js';
import { NormalState } from './NormalState.js';
import { HugeState } from './HugeState.js';

/**
 * The three sizes in order, so Q/E can simply step along this list and
 * keys 1/2/3 can index straight into it.
 *
 * Pure wiring, no logic -- this file exists so Player imports one thing
 * instead of three, and so the order lives in exactly one place.
 */
export const SIZE_STATES = [TinyState, NormalState, HugeState];

/** Build a fresh state object for a size index. */
export function createSizeState(index) {
    const StateClass = SIZE_STATES[index];

    return new StateClass();
}
