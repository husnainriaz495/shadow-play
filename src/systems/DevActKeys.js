import { CONFIG } from '../config.js';

/**
 * Developer keys: N jumps to the next act, B back to the previous one
 * (PRD 4.6). They exist so the trailer can be recorded act by act without
 * replaying the whole show for every take.
 *
 * They only work when CONFIG.DEBUG is true, which the shipped game never
 * is, so a player cannot skip acts by accident.
 *
 * WHY its own file: it is a development tool, like PhysicsDebugView, and
 * keeps GameScene about the act itself.
 */
export class DevActKeys {
    /**
     * @param {Phaser.Scene} scene the running act
     * @param {number} actNumber the act being played (1-based)
     * @param {(act: number) => void} goToAct how the scene moves to an act
     */
    constructor(scene, actNumber, goToAct) {
        if (!CONFIG.DEBUG) return;

        const keyboard = scene.input.keyboard;

        // Past the last act, goToAct shows the ending, which is useful too.
        CONFIG.controls.devNextAct.forEach((key) => {
            keyboard.on(`keydown-${key}`, () => goToAct(actNumber + 1));
        });

        CONFIG.controls.devPrevAct.forEach((key) => {
            keyboard.on(`keydown-${key}`, () => goToAct(Math.max(1, actNumber - 1)));
        });
    }
}
