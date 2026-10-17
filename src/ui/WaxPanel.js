import { CONFIG } from '../config.js';
import { toCssColor } from '../core/helpers.js';
import { WaxCandle } from './WaxCandle.js';

/**
 * The wax meter as one small panel in the HUD band under the stage: the
 * candle and "WAX 87%", on a rounded card in the panel colour at 85% with
 * a panelEdge border (PALETTE.md "panel", "panelEdge"). It lives in the
 * dark frame, so it is never drawn over the level's floor.
 *
 * Below CONFIG.hud.dangerFraction of the wax, the text and the border turn
 * the danger colour and pulse: time is nearly up.
 *
 * It only draws: UIScene hands it the wax and the burn rate.
 */
export class WaxPanel {
    /**
     * @param {Phaser.Scene} scene the UI scene
     * @param {number} left the panel's left edge (world x)
     * @param {number} top the panel's top edge (world y)
     */
    constructor(scene, left, top) {
        const p = CONFIG.hud.waxPanel;

        this.scene = scene;
        this.box = { left, top, width: p.width, height: p.height };

        this.background = scene.add.graphics();
        this.border = scene.add.graphics();
        this.drawBackground();

        this.candle = new WaxCandle(scene, left + p.candleX, top + p.candleBottom);
        this.label = scene.add.text(left + p.labelX, top + p.height / 2, '', CONFIG.text.hud)
            .setOrigin(0, 0.5);

        this.shownPercent = null;
        this.inDanger = null;
        this.pulse = null;
        this.setDanger(false);
    }

    drawBackground() {
        const { left, top, width, height } = this.box;

        this.background.clear()
            .fillStyle(CONFIG.palette.panel, CONFIG.palette.panelAlpha)
            .fillRoundedRect(left, top, width, height, CONFIG.ui.panelRadius);
    }

    drawBorder(colour) {
        const { left, top, width, height } = this.box;

        this.border.clear()
            .lineStyle(CONFIG.ui.panelEdgePx, colour, 1)
            .strokeRoundedRect(left, top, width, height, CONFIG.ui.panelRadius);
    }

    /**
     * @param {number} wax current wax
     * @param {number} max full candle
     */
    setWax(wax, max) {
        const fraction = Math.max(0, wax / max);

        this.candle.setWax(wax, max);

        // Only rewrite the text when the number changes (setText redraws).
        // Rounded UP, so it reads 1% until the wax is truly gone.
        const percent = Math.ceil(fraction * 100);
        if (percent !== this.shownPercent) {
            this.shownPercent = percent;
            this.label.setText(`WAX ${percent}%`);
        }

        this.setDanger(fraction < CONFIG.hud.dangerFraction);
    }

    setBurnRate(rate) {
        this.candle.setBurnRate(rate);
    }

    /** A draft is blowing on the stage: the HUD flame leans with it. */
    setWindLean(lean) {
        this.candle.setWindLean(lean);
    }

    /** Danger: text and border go the danger colour and pulse. */
    setDanger(on) {
        if (on === this.inDanger) return;   // setWax arrives every frame
        this.inDanger = on;

        const { danger, panelEdge, title } = CONFIG.palette;

        this.pulse?.stop();
        this.pulse = null;
        this.border.setAlpha(1);
        this.label.setAlpha(1);
        this.drawBorder(on ? danger : panelEdge);
        this.label.setColor(toCssColor(on ? danger : title));

        if (!on) return;

        this.pulse = this.scene.tweens.add({
            targets: [this.border, this.label],
            alpha: CONFIG.hud.dangerPulseAlpha,
            duration: CONFIG.hud.dangerPulseMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });
    }

    update(time, delta) {
        this.candle.update(time, delta);
    }
}
