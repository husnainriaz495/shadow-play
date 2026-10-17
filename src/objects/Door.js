import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, TILE_SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * The stage door: the goal of every act. Touching it ends the act
 * (PRD 4.4).
 *
 * WHY it glows (PALETTE.md "The goal glows"): the candle's light follows
 * the puppet, so the far side of the stage sits in darkness -- exactly
 * where the door usually is. A soft, slowly pulsing accent glow behind it
 * means players can always see where they are going.
 *
 * The glow sits UNDER the walls (just above the paper's own light), so it
 * reads as light spilling round the doorway rather than paint on the stone.
 */
export class Door extends Phaser.Physics.Arcade.Image {
    /** @param {number} x, y the CENTRE of the map tile marked `D` */
    constructor(scene, x, y) {
        // The door stands ON the floor of its tile, growing upwards.
        super(scene, x, y + TILE_SIZE / 2, 'door');

        scene.add.existing(this);
        scene.physics.add.existing(this, true);   // static: it never moves

        this.setOrigin(0.5, 1).setDepth(DEPTHS.PROPS);
        this.refreshBody();                       // static bodies must be told about the new origin

        this.glow = this.createGlow(scene);
        this.reached = false;
    }

    createGlow(scene) {
        const { glowRadius, glowMinAlpha, glowMaxAlpha, pulseMs } = CONFIG.door;

        const glow = scene.add.image(this.x, this.y - this.displayHeight / 2, 'soft_glow')
            .setTint(CONFIG.palette.accent)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTHS.GLOW + 1)
            .setAlpha(glowMinAlpha);

        glow.setScale((glowRadius * 2) / glow.width);

        // A slow breath, never a blink (PRD 5.1 "Door available").
        scene.tweens.add({
            targets: glow,
            alpha: { from: glowMinAlpha, to: glowMaxAlpha },
            duration: pulseMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });

        return glow;
    }

    /** Called by GameScene when the player overlaps the door. Fires once. */
    onPlayerTouch() {
        if (this.reached) return;

        this.reached = true;
        EventBus.emit(EVENTS.ACT_COMPLETE);
    }
}
