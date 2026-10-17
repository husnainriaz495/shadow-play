import { CONFIG } from '../config.js';
import { GAME_WIDTH } from '../core/constants.js';
import { PaperPanel } from './PaperPanel.js';

/**
 * The draft's two warnings in the HUD (PRD 4.4): a thin bar under the act
 * title counting down to the next gust, and a "GUST!" card that drops in
 * for the second before it hits.
 *
 * WHY both: the bar answers "when", which lets a player plan the run
 * between two shelters; the card answers "NOW", which is what makes them
 * move. With only the card the act is a reaction test; with only the bar
 * it is easy to miss while watching your feet.
 *
 * The card borrows the danger-hint look (CONFIG.hint.danger) so a warning
 * always looks the same wherever it comes from.
 */
export class GustWarning {
    constructor(scene) {
        const g = CONFIG.draft.warning;

        this.scene = scene;

        this.bar = this.buildBar();
        this.panel = this.buildPanel(g);
        this.panel.container.setVisible(false);
    }

    /**
     * The countdown bar, drawn from the middle outwards so it empties
     * evenly on both sides and never looks like a loading bar.
     */
    buildBar() {
        const g = CONFIG.draft.warning;
        const bar = this.scene.add.rectangle(GAME_WIDTH / 2, g.barY, g.barWidth, g.barHeight,
            CONFIG.palette.accent).setAlpha(g.barAlpha);

        this.track = this.scene.add.rectangle(GAME_WIDTH / 2, g.barY, g.barWidth, g.barHeight,
            CONFIG.palette.panelEdge).setAlpha(g.trackAlpha);
        this.track.setDepth(bar.depth - 1);

        return bar;
    }

    buildPanel(g) {
        const label = this.scene.add.text(0, 0, 'GUST!', CONFIG.text.hintDanger).setOrigin(0.5);
        const icon = this.scene.add.image(0, 0, 'wind_icon').setScale(g.iconScale);
        const room = icon.displayWidth + CONFIG.hint.danger.iconGap;
        const width = label.width + room + CONFIG.hint.paddingX * 2;
        const height = Math.max(label.height, icon.displayHeight) + CONFIG.hint.paddingY * 2;

        icon.setX(-width / 2 + CONFIG.hint.paddingX + icon.displayWidth / 2);
        label.setX(room / 2);

        return new PaperPanel(this.scene, GAME_WIDTH / 2, g.panelY, width, height,
            { edgeColour: CONFIG.palette.danger }).add(icon).add(label);
    }

    /**
     * Calm again, and this much time until the next gust: run the bar
     * down over exactly that long, so what it shows is the truth rather
     * than an animation that happens to look similar.
     */
    countDown(seconds) {
        this.scene.tweens.killTweensOf(this.bar);
        this.bar.setScale(1, 1).setAlpha(CONFIG.draft.warning.barAlpha);
        this.scene.tweens.add({
            targets: this.bar,
            scaleX: 0,
            duration: seconds * 1000,
            ease: 'Linear'
        });
    }

    /** One second to go: the card drops in and pulses until the gust. */
    warn() {
        this.panel.container.setVisible(true);
        this.panel.dropIn();
    }

    /** The gust has arrived (or passed): the card folds away. */
    clear() {
        this.panel.close(() => this.panel.container.setVisible(false));
    }

    /** The bar flashes while the wind is actually blowing. */
    setBlowing(blowing) {
        this.scene.tweens.killTweensOf(this.bar);
        this.bar.setScale(blowing ? 1 : 0, 1);
        this.bar.setAlpha(blowing ? 1 : CONFIG.draft.warning.barAlpha);
    }

    /** Acts with no draft do not show any of this. */
    setVisible(visible) {
        this.bar.setVisible(visible);
        this.track.setVisible(visible);
        if (!visible) this.panel.container.setVisible(false);
    }
}
