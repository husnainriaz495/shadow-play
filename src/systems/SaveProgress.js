import { clamp } from '../core/helpers.js';
import { CONFIG } from '../config.js';
import { ACT_COUNT } from '../levels/index.js';

/** The one and only localStorage key this game uses (SECURITY.md rule 12). */
const STORAGE_KEY = 'shadow-play.save';

/** Bumped if the shape below ever changes; an older record is discarded. */
const VERSION = 1;

/**
 * The game's single saved record: how far the player got, and their
 * settings (SECURITY.md rule 12, PRD 4.10).
 *
 * WHY it is the only file allowed near localStorage:
 *  - localStorage is editable by anyone with the browser console, so what
 *    comes back can be any text at all -- "banana", "999", or nothing
 *  - every read is therefore wrapped in try/catch and every field is
 *    forced to its type and clamped to a sane range. Anything odd means
 *    starting a fresh record rather than trusting it
 *  - storage can also be switched off entirely (private windows, strict
 *    settings), in which case writing THROWS. The game must shrug that off
 *    and keep playing, so failures here are never passed on to the caller
 *  - no personal data is stored, ever
 */
export class SaveProgress {
    /** A brand-new record. Also what a corrupt one falls back to. */
    static blank() {
        const { master, music, sfx } = CONFIG.audio.defaultLevels;

        return {
            version: VERSION,
            highestAct: 1,
            /** True once the show has been seen all the way to "Fin.". */
            completed: false,
            settings: { master, music, sfx, reduceMotion: false }
        };
    }

    /**
     * The whole record, always usable. Every field is re-checked on the
     * way out, because the file on disk is not ours to trust.
     */
    static read() {
        const blank = SaveProgress.blank();

        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return SaveProgress.readLegacy() ?? blank;

            const saved = JSON.parse(raw);
            if (!saved || saved.version !== VERSION) return blank;

            return {
                version: VERSION,
                highestAct: SaveProgress.cleanAct(saved.highestAct),
                completed: saved.completed === true,
                settings: SaveProgress.cleanSettings(saved.settings, blank.settings)
            };
        } catch (error) {
            console.warn('[Shadow Play] Saved record unreadable; starting fresh.', error);

            return blank;
        }
    }

    /**
     * The record this game used before settings existed: a bare number
     * under its own key. Read once so nobody loses their progress, then
     * left alone -- the next write replaces it with the new shape.
     */
    static readLegacy() {
        const raw = window.localStorage.getItem('shadow-play.highest-act');
        const parsed = Number.parseInt(raw, 10);

        if (Number.isNaN(parsed)) return null;

        return { ...SaveProgress.blank(), highestAct: SaveProgress.cleanAct(parsed) };
    }

    static cleanAct(value) {
        const parsed = Number.parseInt(value, 10);

        return Number.isNaN(parsed) ? 1 : clamp(parsed, 1, ACT_COUNT);
    }

    /** Volumes are numbers 0-10; reduceMotion is a boolean. Nothing else. */
    static cleanSettings(saved, fallback) {
        const level = (value, instead) => {
            const parsed = Number(value);

            return Number.isFinite(parsed) ? clamp(Math.round(parsed), 0, CONFIG.audio.maxLevel) : instead;
        };

        return {
            master: level(saved?.master, fallback.master),
            music: level(saved?.music, fallback.music),
            sfx: level(saved?.sfx, fallback.sfx),
            reduceMotion: saved?.reduceMotion === true
        };
    }

    static write(record) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        } catch (error) {
            // Storage being unavailable must never interrupt the show.
            console.warn('[Shadow Play] Could not save. Play continues.', error);
        }
    }

    /** The highest unlocked act, always between 1 and the acts that exist. */
    static getHighestAct() {
        return SaveProgress.read().highestAct;
    }

    /** Record an unlocked act, but only ever move forwards. */
    static unlockAct(actNumber) {
        const record = SaveProgress.read();
        const safe = SaveProgress.cleanAct(actNumber);

        if (safe <= record.highestAct) return;

        record.highestAct = safe;
        SaveProgress.write(record);
    }

    /**
     * The show has been watched to the end. From here the menu offers no
     * "continue" -- there is nothing left to continue to -- and every act
     * is open in Act Select.
     */
    static markCompleted() {
        const record = SaveProgress.read();

        if (record.completed) return;

        record.completed = true;
        record.highestAct = ACT_COUNT;
        SaveProgress.write(record);
    }

    static isCompleted() {
        return SaveProgress.read().completed;
    }

    /** Every setting, already validated. */
    static getSettings() {
        return SaveProgress.read().settings;
    }

    /**
     * Change one setting and save. Unknown names are ignored rather than
     * written, so a typo cannot grow the record.
     * @param {'master'|'music'|'sfx'|'reduceMotion'} name
     */
    static setSetting(name, value) {
        const record = SaveProgress.read();

        if (!(name in record.settings)) return record.settings;

        record.settings = SaveProgress.cleanSettings(
            { ...record.settings, [name]: value }, record.settings);
        SaveProgress.write(record);

        return record.settings;
    }

    /** Wipe everything (a "start over" option, and the tests). */
    static clear() {
        try {
            window.localStorage.removeItem(STORAGE_KEY);
            window.localStorage.removeItem('shadow-play.highest-act');
        } catch (error) {
            console.warn('[Shadow Play] Could not clear the saved record.', error);
        }
    }
}
