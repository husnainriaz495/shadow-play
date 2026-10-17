import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { Afterimage } from '../fx/Afterimage.js';

/**
 * What a size change looks like, apart from the puppet itself scaling:
 * the candle's pool of light widens or narrows, and the limbs get a kick
 * so they overshoot and wobble (PRD 4.2.1, PALETTE.md "grows when Huge").
 * A REFUSED grow shivers the puppet. (The sounds for both are in SoundCues.)
 *
 * WHY its own system: SizeChanger only announces SIZE_CHANGED. Everything
 * that REACTS to it visually -- light, wobble, and later the afterimage
 * (PRD 5.1) -- lands here instead of growing GameScene.
 */
export class SizeEffects {
    /**
     * @param {Phaser.Scene} scene
     * @param {import('../core/Listeners.js').Listeners} listeners the scene's
     * @param {import('../objects/PaperScreen.js').PaperScreen} paperScreen
     * @param {import('../objects/PuppetRig.js').PuppetRig} rig
     */
    constructor(scene, listeners, paperScreen, rig) {
        this.scene = scene;
        this.paperScreen = paperScreen;
        this.rig = rig;
        this.tween = null;

        this.shakeTween = null;
        this.breathTween = null;
        this.afterimage = new Afterimage(scene);

        listeners
            .on(EVENTS.SIZE_CHANGED, this.onSizeChanged, this)
            .on(EVENTS.GROW_BLOCKED, this.onGrowBlocked, this);
    }

    /**
     * No room to grow (PRD 4.2): the puppet shivers with its arms pulled
     * in. SoundCues plays sfx_squeeze for the same event.
     */
    onGrowBlocked() {
        this.shakeTween?.stop();
        this.rig.shake = 1;
        this.shakeTween = this.scene.tweens.add({
            targets: this.rig,
            shake: 0,
            duration: CONFIG.player.blockedShakeMs,
            ease: CONFIG.anim.easeInSoft
        });

        this.rig.poser.squeeze(this.scene.time.now);
    }

    /** Light pool size for each size index, from CONFIG.glow. */
    static glowScaleFor(sizeIndex) {
        const { scaleTiny, scaleNormal, scaleHuge } = CONFIG.glow;

        return [scaleTiny, scaleNormal, scaleHuge][sizeIndex];
    }

    onSizeChanged({ sizeIndex, previousIndex }) {
        // The light eases with the puppet, over the same time.
        this.tween?.stop();
        this.tween = this.scene.tweens.add({
            targets: this.paperScreen,
            glowScale: SizeEffects.glowScaleFor(sizeIndex),
            duration: CONFIG.player.sizeTweenMs,
            ease: CONFIG.anim.easeInSoft
        });

        // Growing throws the limbs out, shrinking pulls them in.
        this.rig.poser.wobble(sizeIndex > previousIndex ? 1 : -1);

        // The shape it just was, left hanging for a moment.
        this.afterimage.trail(this.rig.container);
        this.breathe();
    }

    /**
     * The light "breath" (PRD 5.1): the candle's pool swells and settles
     * as the puppet changes size, so the change is felt on the paper and
     * not only on the silhouette. It multiplies the light rather than
     * setting it, so it works at any wax level or glow scale.
     */
    breathe() {
        const { breathScale, breathInMs, breathOutMs } = CONFIG.glow;

        this.breathTween?.stop();
        this.paperScreen.breath = 1;
        this.breathTween = this.scene.tweens.chain({
            targets: this.paperScreen,
            tweens: [
                { breath: breathScale, duration: breathInMs, ease: CONFIG.anim.easeInSoft },
                { breath: 1, duration: breathOutMs, ease: CONFIG.anim.easeLoop }
            ]
        });
    }
}
