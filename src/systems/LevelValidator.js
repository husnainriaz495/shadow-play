import { GRID_COLS, GRID_ROWS, KNOWN_SYMBOLS, SYMBOLS } from '../core/constants.js';

/**
 * Checks a level's map strings BEFORE anything tries to build them.
 *
 * WHY this is worth its own file (PRD M1): a single row that is 31
 * characters instead of 32 shifts every tile after it, and the bug shows up
 * as "the physics is broken" or "the door is in the wall" -- somewhere far
 * away from the typo. Catching it here, with the act and row number in the
 * message, turns a lost hour into a five-second fix.
 *
 * It only reports; it never throws and never draws. LevelLoader decides
 * what to do with the problems.
 */
export class LevelValidator {
    /**
     * @param {object} act a level from src/levels/ ({ title, story, map })
     * @param {number} actNumber which act it is, for the error message
     * @returns {string[]} one readable sentence per problem; empty means fine
     */
    static validate(act, actNumber) {
        const problems = [];
        const where = `Act ${actNumber} ("${act?.title ?? 'untitled'}")`;

        if (!act || !Array.isArray(act.map)) {
            return [`${where}: the level has no map array at all.`];
        }

        LevelValidator.checkShape(act.map, where, problems);
        LevelValidator.checkSymbols(act.map, where, problems);
        LevelValidator.checkSingletons(act.map, where, problems);
        LevelValidator.checkHints(act, where, problems);

        return problems;
    }

    /** Every row must be exactly GRID_COLS long, and there must be GRID_ROWS. */
    static checkShape(map, where, problems) {
        if (map.length !== GRID_ROWS) {
            problems.push(`${where}: has ${map.length} rows, but a level must have exactly ${GRID_ROWS}.`);
        }

        map.forEach((row, index) => {
            if (typeof row !== 'string') {
                problems.push(`${where}, row ${index}: is not a string.`);
                return;
            }

            if (row.length !== GRID_COLS) {
                problems.push(
                    `${where}, row ${index}: is ${row.length} characters, but every row must be ` +
                    `exactly ${GRID_COLS}. The row reads: "${row}"`
                );
            }
        });
    }

    /** Flag any character that is not in the PRD 4.4 table. */
    static checkSymbols(map, where, problems) {
        map.forEach((row, rowIndex) => {
            if (typeof row !== 'string') return;

            [...row].forEach((symbol, colIndex) => {
                if (!KNOWN_SYMBOLS.has(symbol)) {
                    problems.push(
                        `${where}, row ${rowIndex}, column ${colIndex}: "${symbol}" is not a known ` +
                        'map symbol. The full list is in PRD.md section 4.4.'
                    );
                }
            });
        });
    }

    /** Exactly one start and one exit, or the act is unplayable. */
    static checkSingletons(map, where, problems) {
        const required = [
            { symbol: SYMBOLS.PLAYER, name: 'player start' },
            { symbol: SYMBOLS.DOOR, name: 'exit door' }
        ];

        required.forEach(({ symbol, name }) => {
            const count = map.reduce(
                (total, row) => total + (typeof row === 'string' ? [...row].filter((c) => c === symbol).length : 0),
                0
            );

            if (count !== 1) {
                problems.push(`${where}: found ${count} "${symbol}" (${name}), but there must be exactly 1.`);
            }
        });
    }

    /** Every `?` on the map needs a line of text in the act's hints list. */
    static checkHints(act, where, problems) {
        const hintCount = act.map.reduce(
            (total, row) => total + (typeof row === 'string' ? [...row].filter((c) => c === SYMBOLS.HINT).length : 0),
            0
        );
        const textCount = Array.isArray(act.hints) ? act.hints.length : 0;

        if (hintCount !== textCount) {
            problems.push(
                `${where}: the map has ${hintCount} "?" hint markers but the hints list has ` +
                `${textCount} lines of text. They must match, in reading order.`
            );
        }
    }
}
