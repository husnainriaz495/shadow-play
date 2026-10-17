import { CONFIG } from '../config.js';
import { GAME_WIDTH, GAME_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT, STAGE_X, STAGE_Y } from './constants.js';

/**
 * Make a scene's camera show the stage inside its frame.
 *
 * WHY: the canvas is drawn at CONFIG.render.scale times its size (so text
 * and art stay sharp on big screens), and it is bigger than the stage: the
 * 1280x720 stage sits inside a dark frame (core/constants.js VIEW_*). The
 * camera zooms by the render scale and positions the stage in the frame,
 * so every scene keeps working in plain 1280x720 stage coordinates.
 *
 * @param {Phaser.Scene} scene
 * @param {object} [options]
 * @param {boolean} [options.clipToStage] draw ONLY inside the stage. Used by
 *        the scenes that are the stage itself (the act, the title), so
 *        anything outside it -- a puppet falling through a hole -- vanishes
 *        at the stage's edge instead of drawing over the HUD band.
 */
export function fitCamera(scene, { clipToStage = false } = {}) {
    const scale = CONFIG.render.scale;
    const camera = scene.cameras.main.setZoom(scale);

    if (clipToStage) {
        camera.setViewport(STAGE_X * scale, STAGE_Y * scale, GAME_WIDTH * scale, GAME_HEIGHT * scale);
        camera.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    } else {
        // The whole canvas: centre on the point that puts the stage's
        // top-left corner at (STAGE_X, STAGE_Y) of the frame.
        camera.centerOn(VIEW_WIDTH / 2 - STAGE_X, VIEW_HEIGHT / 2 - STAGE_Y);
    }

    return camera;
}
