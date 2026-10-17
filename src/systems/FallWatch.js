import { GAME_HEIGHT } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * Falling off the bottom of the stage -- through a hole the fire burnt,
 * or the gap in Act 4 -- ends the act (PRD 4.4).
 *
 * The world's edges are walls on three sides; this opens the BOTTOM only,
 * watches for the puppet dropping out of sight, and announces
 * PLAYER_DIED once.
 *
 * It does not decide what happens next. systems/Death.js hears that
 * announcement and brings the curtain down on it, exactly as it does for
 * the candle going out -- so every death looks the same to the player.
 */
export class FallWatch {
    /**
     * @param {Phaser.Scene} scene
     * @param {Player} player
     */
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.fallen = false;

        // Left, right and top stay solid; the bottom is open.
        scene.physics.world.setBoundsCollision(true, true, true, false);

        scene.events.on('update', this.check, this);
        scene.events.once('shutdown', () => scene.events.off('update', this.check, this));
    }

    check() {
        if (this.fallen || !this.player.body) return;
        if (this.player.body.top <= GAME_HEIGHT) return;

        this.fallen = true;
        EventBus.emit(EVENTS.PLAYER_DIED);
    }
}
