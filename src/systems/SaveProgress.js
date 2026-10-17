import { clamp } from '../core/helpers.js';
import { ACT_COUNT } from '../levels/index.js';

/** The one and only localStorage key this game uses. */
const STORAGE_KEY = 'shadow-play.highest-act';

/**
 * Remembers the highest act the player has unlocked. That is ALL it stores.
 *
 * WHY it is the only file allowed near localStorage (SECURITY.md rule 12):
 *  - localStorage is editable by anyone with the browser console, so what
 *    comes back can be any text at all -- "banana", "999", or nothing
 *  - every read is therefore wrapped in try/catch, forced to a number, and
 *    clamped to a real act. Anything odd falls back to act 1
 *  - storage can also be switched off entirely (private windows, strict
 *    settings), in which case writing THROWS. The game must shrug that off
 *    and keep playing, so failures here are never passed on to the caller
 *  - no personal data is stored, ever
 */
export class SaveProgress {
    /**
     * The highest unlocked act, always a usable number between 1 and the
     * number of acts that exist.
     */
    static getHighestAct() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            const parsed = Number.parseInt(raw, 10);

            // Number.isNaN catches null, '', 'banana' -- anything not a number.
            if (Number.isNaN(parsed)) return 1;

            return clamp(parsed, 1, ACT_COUNT);
        } catch (error) {
            console.warn('[Shadow Play] Could not read saved progress; starting at Act 1.', error);

            return 1;
        }
    }

    /** Record an unlocked act, but only ever move forwards. */
    static unlockAct(actNumber) {
        const safe = clamp(Number(actNumber) || 1, 1, ACT_COUNT);

        if (safe <= SaveProgress.getHighestAct()) return;

        try {
            window.localStorage.setItem(STORAGE_KEY, String(safe));
        } catch (error) {
            // Storage being unavailable must never interrupt the show.
            console.warn('[Shadow Play] Could not save progress. Play continues.', error);
        }
    }

    /** Wipe progress (used by a "start over" option, and when testing). */
    static clear() {
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('[Shadow Play] Could not clear saved progress.', error);
        }
    }
}
