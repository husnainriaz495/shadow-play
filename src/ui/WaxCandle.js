import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { Flicker } from '../systems/Flicker.js';
import { clamp } from '../core/helpers.js';

/** Size of the flame's soft halo, relative to the 128 px soft_glow texture. */
const HALO_SCALE = 0.6;

/** How the HUD candle is drawn. Shapes only -- no game rules live here. */
const CANDLE = {
    width: 26,
    maxHeight: 150,
    holderWidth: 46,
    holderHeight: 10
};

/**
 * The wax meter, bottom-left: a candle that physically gets shorter as the
 * wax runs out, with a live flame on top (PRD 5).
 *
 * WHY it is in ui/ : it DRAWS, it does not decide. It knows nothing about
 * draining, sizes or hazards -- UIScene hands it a wax value and it renders
 * that. The rules live in systems/Candle.js (CODE_RULES.md rule 3 table).
 */
export class WaxCandle {
    /**
     * @param {Phaser.Scene} scene the UI scene
     * @param {number} x bottom-centre of the candle
     * @param {number} y bottom of the holder
     */
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        /** 0 to 1. Set by setWax(), read by draw(). */
        this.fraction = 1;

        // ONE Graphics object, cleared and redrawn. Never a new one per frame
        // (CODE_RULES.md rule 9).
        this.graphics = scene.add.graphics();

        // A soft additive halo behind the flame (PALETTE.md "Flame"), then
        // the bright flame shape on top of it.
        this.halo = scene.add.image(x, y, 'soft_glow')
            .setTint(CONFIG.palette.flameOuter)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setScale(HALO_SCALE);
        this.flame = scene.add.image(x, y, 'flame').setOrigin(0.5, 1);
        this.flameFlicker = new Flicker(0.18, 0.02, 1.7);

        this.label = scene.add.text(x, y + 14, 'WAX', CONFIG.text.hud).setOrigin(0.5, 0);
    }

    /**
     * @param {number} wax current wax
     * @param {number} max full candle
     */
    setWax(wax, max) {
        this.fraction = clamp(wax / max, 0, 1);
        this.draw();
    }

    /** Redraw the candle body at its current height. */
    draw() {
        const height = CANDLE.maxHeight * this.fraction;
        const left = this.x - CANDLE.width / 2;
        const top = this.y - height;
        const g = this.graphics;

        g.clear();

        // The holder, which never changes size.
        g.fillStyle(CONFIG.palette.shadow, 1);
        g.fillRect(this.x - CANDLE.holderWidth / 2, this.y, CANDLE.holderWidth, CANDLE.holderHeight);

        // A faint full-height outline, so you can see how much is GONE.
        g.lineStyle(2, CONFIG.palette.textMuted, 0.4);
        g.strokeRect(left, this.y - CANDLE.maxHeight, CANDLE.width, CANDLE.maxHeight);

        // The wax that is left.
        g.fillStyle(CONFIG.palette.wax, 1);
        g.fillRect(left, top, CANDLE.width, height);

        // The wick, and the flame sitting on the shrinking candle top.
        g.fillStyle(CONFIG.palette.shadow, 1);
        g.fillRect(this.x - 1.5, top - 6, 3, 6);
        this.flame.setY(top - 4);
        this.flame.setVisible(this.fraction > 0);
        this.halo.setY(top - 14);
        this.halo.setVisible(this.fraction > 0);
    }

    /**
     * Called every frame: the flame breathes, and panics when the wax is low
     * (PRD 4.3 -- the flicker is the player's warning that time is short).
     */
    update(time) {
        if (this.fraction <= 0) return;

        const low = this.fraction <= CONFIG.wax.lowThreshold / CONFIG.wax.max;
        const wander = this.flameFlicker.valueAt(time * (low ? 2.5 : 1));

        this.flame.setScale(wander, wander * (low ? 0.8 : 1));
        this.halo.setScale(HALO_SCALE * wander);
        this.flame.setAlpha(low ? 0.65 + Math.random() * 0.35 : 1);
    }
}
