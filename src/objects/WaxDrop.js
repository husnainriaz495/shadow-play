import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * A wax drop (map symbol `w`): touch it for CONFIG.wax.dropAmount
 * back on the candle (PRD 4.4) -- a breath, not a refill.
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
        this.glow = this.createGlow(scene, x, y);

        // A gentle bob, so it reads as a pickup and not as scenery. Only the
        // pictures move (the drop and its halo together); the body stays put.
        this.bob = scene.tweens.add({
            targets: [this, this.glow],
            y: y - CONFIG.waxDrop.bobPx,
            duration: CONFIG.waxDrop.bobMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * A soft warm halo just behind the drop, twinkling slowly. One shared
     * soft_glow texture, tinted -- the same one the door and the HUD flame
     * use -- so it costs no new art.
     */
    createGlow(scene, x, y) {
        const { glowRadius, glowMinAlpha, glowMaxAlpha, glowPulseMs } = CONFIG.waxDrop;

        const glow = scene.add.image(x, y, 'soft_glow')
            .setTint(CONFIG.palette.flameCore)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTHS.PROPS - 1)
            .setAlpha(glowMinAlpha);

        glow.setScale((glowRadius * 2) / glow.width);

        scene.tweens.add({
            targets: glow,
            alpha: glowMaxAlpha,
            duration: glowPulseMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });

        return glow;
    }

    /** Called when the player overlaps the drop. Fires once. */
    onPlayerTouch() {
        if (this.taken) return;

        this.taken = true;
        this.disableBody(false, false);

        EventBus.emit(EVENTS.WAX_PICKED_UP, { amount: CONFIG.wax.dropAmount });

        // Float up and fade: the exit is faster than any entrance (PRD 5.1).
        this.bob.stop();
        this.scene.tweens.killTweensOf(this.glow);
        this.scene.tweens.add({
            targets: [this, this.glow],
            y: this.y - CONFIG.waxDrop.pickupRisePx,
            alpha: 0,
            duration: CONFIG.waxDrop.pickupMs,
            ease: CONFIG.anim.easeOut,
            onComplete: () => {
                this.setVisible(false);
                this.glow.setVisible(false);
            }
        });
    }
}
