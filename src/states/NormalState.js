import { SizeState } from './SizeState.js';
import { SIZE } from '../core/constants.js';

/** The candle at arm's length: the balanced, default shadow (PRD 4.2). */
export class NormalState extends SizeState {
    constructor() {
        super(SIZE.NORMAL);
    }
}
