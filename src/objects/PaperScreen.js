import { CONFIG } from '../config.js';
import { DEPTHS, GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';
import { Flicker } from '../systems/Flicker.js';
import { clamp } from '../core/helpers.js';

/** One 60 Hz frame, in ms -- the unit CONFIG.glow.followPerFrame is given in. */
const FRAME_MS = 1000 / 60;

/**
 * The stage itself: the paper screen lit by the candle, the vignette and
 * grain over it, and the darkening that creeps in as the wax runs out.
 *
 * WHY the light MOVES (PALETTE.md "Glow from the candle"): the candle is
 * held behind the puppet, so the bright pool is wherever the candle is,
 * not pinned to the top of the screen. The scene tells this object where
 * the candle is each frame with setLightSource(); the light glides after
 * it with a little lag, the way a hand-held flame would.
 *
 * Layers, back to front: dark teal base, the light, (the stage and puppet
 * are drawn here by other objects), then vignette and dimming on top.
 * Silhouettes stay near-black at every point of the gradient (PALETTE.md
 * "Contrast first").
 */
export class PaperScreen {
    /**
     * @param {Phaser.Scene} scene
     * @param {{x:number, y:number}} source where the candle starts
     */
    constructor(scene, source = CONFIG.glow.titleSource) {
        const darkest = CONFIG.palette.paperStops[CONFIG.palette.paperStops.length - 1];

        // Everything the light does not reach is this dark teal, which is
        // also the last colour of the glow gradient, so there is no seam.
        this.base = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, darkest)
            .setOrigin(0, 0)
            .setDepth(DEPTHS.PAPER);

        this.glow = scene.add.image(source.x, source.y, 'glow').setDepth(DEPTHS.GLOW);

        this.vignette = scene.add.image(0, 0, 'vignette')
            .setOrigin(0, 0)
            .setDepth(DEPTHS.DIM);

        // A flat dark layer we fade in as the light dies.
        this.dimmer = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, CONFIG.palette.frame)
            .setOrigin(0, 0)
            .setDepth(DEPTHS.DIM)
            .setAlpha(0);

        // Two flickers at different speeds, so brightness and size never
        // wander in step -- that is what makes it read as a real flame.
        this.brightFlicker = new Flicker(CONFIG.glow.flickerAlpha, CONFIG.glow.flickerSpeed);
        this.sizeFlicker = new Flicker(CONFIG.glow.flickerScale, CONFIG.glow.flickerSpeed * 0.7, 3.1);

        /** Where the light is heading; update() eases the glow towards it. */
        this.target = { x: source.x, y: source.y };

        /** 1 = full candle, 0 = out. Drives both brightness and dimming. */
        this.lightLevel = 1;

        /** Bigger when the candle is close (Huge), smaller when far (Tiny). */
        this.glowScale = CONFIG.glow.scaleNormal;
    }

    /**
     * Where the candle is now. Call every frame from the scene.
     * @param {boolean} immediate jump straight there (on spawn or restart)
     */
    setLightSource(x, y, immediate = false) {
        this.target.x = x;
        this.target.y = y;

        if (immediate) {
            this.glow.setPosition(x, y);
        }
    }

    /** How much light is left, from the wax: 0 to 1. */
    setLightLevel(level) {
        this.lightLevel = clamp(level, 0, 1);
    }

    /** How close the candle is held -- see CONFIG.glow.scaleTiny/Normal/Huge. */
    setGlowScale(scale) {
        this.glowScale = scale;
    }

    /**
     * Called every frame by the scene. It only moves and fades existing
     * objects -- it never creates anything (CODE_RULES.md rule 9).
     */
    update(time, delta = FRAME_MS) {
        // Ease towards the candle. Raising to the power of elapsed frames
        // keeps the lag identical at 60 Hz and 144 Hz (PRD 4.8).
        const step = 1 - Math.pow(1 - CONFIG.glow.followPerFrame, delta / FRAME_MS);

        this.glow.x += (this.target.x - this.glow.x) * step;
        this.glow.y += (this.target.y - this.glow.y) * step;

        // The texture is small; this stretches it to the configured radius.
        const fullSize = (CONFIG.glow.radius * 2) / CONFIG.glow.textureSize;
        this.glow.setScale(fullSize * this.glowScale * this.sizeFlicker.valueAt(time));

        // As the wax runs low the light fades towards the dark base.
        const brightness = CONFIG.glow.lowWaxDimming +
            (1 - CONFIG.glow.lowWaxDimming) * this.lightLevel;

        this.glow.setAlpha(clamp(brightness * this.brightFlicker.valueAt(time), 0, 1));
        this.dimmer.setAlpha((1 - this.lightLevel) * CONFIG.glow.maxDim);
    }
}
