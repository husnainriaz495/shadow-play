import { CONFIG } from '../config.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

/**
 * Make a scene's camera show the 1280x720 stage at the game's render scale.
 *
 * WHY: the canvas is drawn at CONFIG.render.scale times the stage size
 * (2560x1440 by default) so that text and art stay sharp when the window
 * stretches the game across a big or high-DPI screen. Drawing at only
 * 1280x720 and stretching it made everything -- text most of all -- look
 * blurry.
 *
 * Zooming the camera by the same amount means every scene keeps working in
 * the familiar 1280x720 coordinates: tiles, physics, HUD positions and
 * level maps are unchanged. Call this first thing in every scene that
 * draws something.
 */
export function fitCamera(scene) {
    scene.cameras.main
        .setZoom(CONFIG.render.scale)
        .centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
}
