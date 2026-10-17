import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Flicker } from '../systems/Flicker.js';
import { WaxDrips } from './WaxDrips.js';
import { clamp, mixColors } from '../core/helpers.js';

/**
 * The wax meter's candle: it physically gets shorter as the wax runs out,
 * with a live flame on top (PRD 5). The flame grows and flickers faster,
 * and wax drips run down the sides, with the BURN RATE: that is how a
 * viewer sees "bigger shadow = faster burn" (PRD 4.3.1).
 *
 * It sits inside ui/WaxPanel.js, which owns the panel and the "WAX 87%"
 * label. Its shape and shading are CONFIG.hud.candle / candleShade.
 *
 * WHY it is in ui/ : it DRAWS, it does not decide. It knows nothing about
 * draining, sizes or hazards -- it is handed a wax value and renders that.
 * The rules live in systems/Candle.js (CODE_RULES.md rule 3 table).
 */
export class WaxCandle {
    /**
     * @param {Phaser.Scene} scene the UI scene
     * @param {number} x bottom-centre of the candle
     * @param {number} y bottom of the wax, where it stands in its dish
     */
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.shape = CONFIG.hud.candle;

        /** 0 to 1. Set by setWax(), read by draw(). */
        this.fraction = 1;

        /** The burn rate being SHOWN; eases towards the real one. */
        this.shownRate = 1;
        this.targetRate = 1;
        this.rateTween = null;

        /** When the last wax news came in. No news = paused, so no drips. */
        this.lastWaxAt = 0;

        /** The flame's own flicker clock in ms; runs faster when burning fast. */
        this.flickerClock = 0;

        /** 0 calm, 1 full gust: the HUD flame leans with the draft too. */
        this.windLean = 0;

        this.colours = WaxCandle.shades();

        // ONE Graphics object, cleared and redrawn. Never a new one per frame
        // (CODE_RULES.md rule 9).
        this.graphics = scene.add.graphics();

        // A soft additive halo behind the flame (PALETTE.md "Flame"), then
        // the bright flame shape on top of it.
        this.halo = scene.add.image(x, y, 'soft_glow')
            .setTint(CONFIG.palette.flameOuter)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(this.shape.haloScale);
        this.flame = scene.add.image(x, y, 'flame').setOrigin(0.5, 1).setScale(this.shape.flameScale);
        this.flameFlicker = new Flicker(0.18, 0.02, 1.7);
        this.drips = new WaxDrips(scene);
    }

    /**
     * @param {number} wax current wax
     * @param {number} max full candle
     */
    setWax(wax, max) {
        this.fraction = clamp(wax / max, 0, 1);
        this.lastWaxAt = this.scene.time.now;
        this.draw();
        if (this.fraction <= 0) this.drips.clear();
    }

    /**
     * A draft is blowing on the candle, 0 to 1. The flame bends with it,
     * so the HUD shows the same weather the stage does.
     */
    setWindLean(lean) {
        this.windLean = clamp(lean, 0, 1);
    }

    /**
     * @param {number} rate how many times faster than Normal the wax melts
     */
    setBurnRate(rate) {
        if (rate === this.targetRate) return;   // arrives every frame

        this.targetRate = rate;
        this.rateTween?.stop();
        this.rateTween = this.scene.tweens.add({
            targets: this,
            shownRate: rate,
            duration: CONFIG.hud.burnTweenMs,
            ease: CONFIG.anim.easeInSoft
        });
    }

    /** The edges of the wax that is left, for the drips. */
    get body() {
        const half = this.shape.width / 2;

        return {
            left: this.x - half,
            right: this.x + half,
            top: this.y - this.shape.maxHeight * this.fraction,
            bottom: this.y
        };
    }

    /** Every colour the candle uses, mixed once from the palette (PALETTE.md). */
    static shades() {
        const { wax, frame, flameOuter, flameCore, shadow } = CONFIG.palette;
        const s = CONFIG.hud.candleShade;

        return {
            lightTop: wax,
            edgeTop: mixColors(wax, flameOuter, s.edgeWarmth),
            lightBottom: mixColors(wax, frame, s.baseDim),
            edgeBottom: mixColors(wax, frame, s.edgeDim),
            pool: mixColors(wax, flameCore, s.poolGlow),
            dish: mixColors(shadow, flameOuter, s.dishLit),
            dishShine: mixColors(shadow, flameCore, s.dishShine),
            base: mixColors(shadow, flameOuter, s.baseLit)
        };
    }

    /** Redraw the candle body at its current height. */
    draw() {
        const shape = this.shape;
        const height = shape.maxHeight * this.fraction;
        const left = this.x - shape.width / 2;
        const top = this.y - height;
        const g = this.graphics;
        const c = this.colours;

        g.clear();

        if (height > 0) {
            // The wax, in two shaded halves meeting at the brightest stripe,
            // so it reads as round. (Gradients are WebGL-only; a Canvas
            // fallback simply draws them flat.)
            const lit = Math.round(shape.width * shape.lightSide);

            g.fillGradientStyle(c.edgeTop, c.lightTop, c.edgeBottom, c.lightBottom, 1);
            g.fillRect(left, top, lit, height);
            g.fillGradientStyle(c.lightTop, c.edgeTop, c.lightBottom, c.edgeBottom, 1);
            g.fillRect(left + lit, top, shape.width - lit, height);

            // The melted pool on top, glowing in the flame's light.
            g.fillStyle(c.pool, 1);
            g.fillEllipse(this.x, top, shape.width, shape.poolHeight);
        }

        // The dish the candle stands in: dark metal whose top and front rim
        // catch the flame.
        g.fillStyle(c.base, 1);
        g.fillEllipse(this.x, this.y + shape.dishHeight, shape.baseWidth, shape.baseHeight);
        g.fillStyle(c.dish, 1);
        g.fillEllipse(this.x, this.y + shape.dishHeight / 4, shape.dishWidth, shape.dishHeight);
        g.fillStyle(c.dishShine, 1);
        g.fillEllipse(this.x, this.y + shape.dishHeight / 2, shape.dishWidth * 0.8, shape.dishHeight / 3);

        // The wick, and the flame sitting on the shrinking candle top.
        g.fillStyle(CONFIG.palette.shadow, 1);
        g.fillRect(this.x - 1, top - shape.wickHeight, 2, shape.wickHeight);
        this.flame.setY(top - shape.flameLift);
        this.flame.setVisible(this.fraction > 0);
        this.halo.setY(top - shape.haloLift);
        this.halo.setVisible(this.fraction > 0);
    }

    /**
     * Called every frame: the flame breathes, and panics when the wax is low
     * (PRD 4.3 -- the flicker is the player's warning that time is short).
     * The faster the burn, the bigger and wilder the flame (PRD 4.3.1).
     */
    update(time, delta) {
        if (this.fraction <= 0) return;

        const { flameScalePerRate, flickerSpeedPerRate, idleMs } = CONFIG.hud;
        const low = this.fraction <= CONFIG.wax.lowThreshold / CONFIG.wax.max;
        const extra = this.shownRate - 1;          // -0.25 Tiny, 0 Normal, +1 Huge
        const size = 1 + extra * flameScalePerRate;
        const speed = (1 + extra * flickerSpeedPerRate) * (low ? 2.5 : 1);
        // Advance the flicker's OWN clock at the current speed. Multiplying
        // `time` instead would make the flame jump whenever the speed changes.
        this.flickerClock += delta * speed;
        const wander = this.flameFlicker.valueAt(this.flickerClock) * size;

        this.flame.setScale(this.shape.flameScale * wander, this.shape.flameScale * wander * (low ? 0.8 : 1));
        this.halo.setScale(this.shape.haloScale * wander);

        // Bent over by the draft, and shorter for it.
        this.flame.setAngle(this.windLean * CONFIG.hud.windLeanDeg);
        this.halo.setAlpha(1 - this.windLean * CONFIG.hud.windHaloDim);

        // Paused (no WAX_CHANGED lately): the wax is not melting, so no drips.
        const burning = time - this.lastWaxAt < idleMs;
        this.drips.update(delta, burning ? this.shownRate : 0, this.body);
        this.flame.setAlpha(low ? 0.65 + Math.random() * 0.35 : 1);
    }
}
