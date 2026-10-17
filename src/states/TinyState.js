import { SizeState } from './SizeState.js';
import { SIZE } from '../core/constants.js';

/**
 * The candle held far away: a small, quick shadow.
 * Fits through 1-tile gaps and under low walls, and sips wax (PRD 4.2).
 */
export class TinyState extends SizeState {
    constructor() {
        super(SIZE.TINY);
    }
}
