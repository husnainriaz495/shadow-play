import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';

/**
 * What a hit LOOKS like (PRD 4.8 "hit feedback", 5.1 "Hit"): the puppet
 * flashes warm white, the camera shakes, and the puppet blinks for as long
 * as it cannot be hurt again.
 *
 * WHY it only listens: anything that hurts the puppet (the fire now, moths
 * later) announces PLAYER_HURT through HurtState, and this reacts. No hazard
 * needs to know any of this exists (CODE_RULES 6.2).
 *
 * The push itself and the invulnerability are HurtState's job; this only
 * draws them. PRD 4.8's 80 ms hit-stop is left out: M4 says "only if Act 5
 * needs it", and freezing physics next to a fire front felt unfair.
 */
export class HitFeedback {
    constructor(scene, listeners, rig) {
        this.scene = scene;
        this.rig = rig;
        this.blink = null;

        listeners.on(EVENTS.PLAYER_HURT, this.onHurt, this);
    }

    onHurt({ invulnerableMs }) {
        const { flashMs, shakeMs, blinkAlpha, blinkMs } = CONFIG.hit;
        const parts = Object.values(this.rig.parts);

        // A white-hot flash: every part filled with the flame's bright core.
        parts.forEach((part) => part.setTintFill(CONFIG.palette.flameCore));
        this.scene.time.delayedCall(flashMs, () => parts.forEach((part) => part.clearTint()));

        // Shaking the camera is the first thing "reduce motion" turns off.
        if (!this.scene.reduceMotion) this.scene.cameras.main.shake(shakeMs, CONFIG.anim.shake.hit);

        // Blink until the invulnerability runs out, then solid again.
        this.blink?.stop();
        this.rig.container.setAlpha(1);
        this.blink = this.scene.tweens.add({
            targets: this.rig.container,
            alpha: blinkAlpha,
            duration: blinkMs,
            yoyo: true,
            repeat: Math.max(0, Math.floor(invulnerableMs / (blinkMs * 2)) - 1),
            onComplete: () => this.rig.container.setAlpha(1)
        });
    }
}
