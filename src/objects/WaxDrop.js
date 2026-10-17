import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * A wax drop (map symbol `w`): touch it for +20 wax (PRD 4.4).
 *
 * It only ANNOUNCES the pickup; the Candle does the adding. That way the
 * drop never needs to know the candle exists (CODE_RULES 6.2).
 *
 * WHY it is hidden, not destroyed, when taken: the physics overlap that
 * calls onPlayerTouch still holds on to it, and Phaser can trip over a
 * destroyed object there. A disabled body is simply skipped.
 */
export class WaxDrop extends Phaser.Physics.Arcade.Image {
    /** @param {number} x, y the CENTRE of the map tile marked `w` */
    constructor(scene, x, y) {
        super(scene, x, y, 'wax');

        scene.add.existing(this);
        scene.physics.add.existing(this, true);   // static: it never moves on its own

        this.setDepth(DEPTHS.PROPS);
        this.taken = false;

        // A gentle bob, so it reads as a pickup and not as scenery.
        // Only the picture moves; the static body stays put.
        this.bob = scene.tweens.add({
            targets: this,
            y: y - CONFIG.waxDrop.bobPx,
            duration: CONFIG.waxDrop.bobMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });
    }

    /** Called when the player overlaps the drop. Fires once. */
    onPlayerTouch() {
        if (this.taken) return;

        this.taken = true;
        this.disableBody(false, false);

        EventBus.emit(EVENTS.WAX_PICKED_UP, { amount: CONFIG.wax.dropAmount });

        // Float up and fade: the exit is faster than any entrance (PRD 5.1).
        this.bob.stop();
        this.scene.tweens.add({
            targets: this,
            y: this.y - CONFIG.waxDrop.pickupRisePx,
            alpha: 0,
            duration: CONFIG.waxDrop.pickupMs,
            ease: CONFIG.anim.easeOut,
            onComplete: () => this.setVisible(false)
        });
    }
}
