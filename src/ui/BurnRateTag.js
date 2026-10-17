import { CONFIG } from '../config.js';
import { toCssColor } from '../core/helpers.js';

/**
 * A few words next to the HUD candle saying how fast it is burning
 * (PRD 4.3.1): "BURNING FAST" while Huge, "BURNING SLOW" while Tiny, nothing
 * at Normal. It pops every time the rate changes and throbs while Huge,
 * so a size change is impossible to miss in the trailer. (It used to say
 * "x2"; playtesters could not tell what "x1" meant.)
 *
 * It only draws: UIScene hands it the rate from WAX_CHANGED.
 */
export class BurnRateTag {
    /**
     * @param {Phaser.Scene} scene the UI scene
     * @param {number} x left edge of the text
     * @param {number} y vertical centre of the text
     */
    constructor(scene, x, y) {
        this.scene = scene;
        this.rate = null;
        this.pulse = null;

        this.text = scene.add.text(x, y, '', CONFIG.text.hud).setOrigin(0, 0.5);
    }

    /** @param {number} rate 0.75 Tiny, 1 Normal, 2 Huge */
    setRate(rate) {
        if (rate === this.rate) return;   // called every frame; only act on a change

        const isFirst = this.rate === null;
        this.rate = rate;

        this.text.setText(BurnRateTag.wordsFor(rate));
        this.text.setColor(toCssColor(BurnRateTag.colorFor(rate)));

        // No pop when the HUD first appears, only on a real change.
        if (!isFirst) this.pop();
        this.setPulsing(rate > 1);
    }

    /** Plain words for the rate; empty at Normal, where there is nothing to say. */
    static wordsFor(rate) {
        if (rate > 1) return CONFIG.hud.burnFastText;
        if (rate < 1) return CONFIG.hud.burnSlowText;
        return '';
    }

    /** Hot accent when burning fast, quiet grey when slow, plain otherwise. */
    static colorFor(rate) {
        if (rate > 1) return CONFIG.palette.accent;
        if (rate < 1) return CONFIG.palette.textMuted;
        return CONFIG.palette.title;
    }

    pop() {
        this.scene.tweens.killTweensOf(this.text);
        this.pulse = null;
        this.text.setScale(CONFIG.hud.tagPopScale);
        this.scene.tweens.add({
            targets: this.text,
            scale: 1,
            duration: CONFIG.hud.tagPopMs,
            ease: CONFIG.anim.easeIn
        });
    }

    /** A slow throb of the alpha while Huge: "this is costing you". */
    setPulsing(on) {
        this.pulse?.stop();
        this.pulse = null;
        this.text.setAlpha(1);
        if (!on) return;

        this.pulse = this.scene.tweens.add({
            targets: this.text,
            alpha: CONFIG.hud.tagPulseAlpha,
            duration: CONFIG.hud.tagPulseMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });
    }
}
