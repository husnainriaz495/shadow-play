import { CONFIG } from '../config.js';
import { AudioManager } from './AudioManager.js';

/**
 * Keys that work everywhere, whatever is on screen: M mutes, F toggles
 * fullscreen (PRD 4.6).
 *
 * WHY a helper: each Phaser scene has its own keyboard, so "everywhere"
 * means binding them in every scene that can have focus. Writing the
 * bindings once here keeps them identical. TitleScene uses it, and so does
 * UIScene, which runs throughout play AND while the pause menu is open --
 * so it covers every moment of the act. Bind it in only ONE scene that is
 * running at a time, or a single press would toggle twice.
 */
export class GlobalKeys {
    constructor(scene) {
        const keyboard = scene.input.keyboard;

        CONFIG.controls.mute.forEach((key) => {
            keyboard.on(`keydown-${key}`, () => AudioManager.toggleMute(scene.game));
        });

        // Browsers only allow fullscreen in direct response to a key press
        // or click, which is exactly what this is.
        CONFIG.controls.fullscreen.forEach((key) => {
            keyboard.on(`keydown-${key}`, () => scene.scale.toggleFullscreen());
        });
    }
}
