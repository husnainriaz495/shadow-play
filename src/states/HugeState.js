import { SizeState } from './SizeState.js';
import { SIZE } from '../core/constants.js';

/**
 * The candle held close: a towering, slow shadow.
 * Pushes crates, reaches high ledges, swats moths and presses heavy
 * switches -- but burns wax twice as fast, so being Huge costs TIME.
 * That trade is the heart of the game (PRD 3).
 */
export class HugeState extends SizeState {
    constructor() {
        super(SIZE.HUGE);
    }
}
