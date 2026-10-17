import { CONFIG } from '../config.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';

/**
 * The loading screen: a candle burning down to a progress bar.
 *
 * WHY it is all drawn with Graphics: this runs BEFORE the real art is
 * loaded, so it cannot use a single texture -- not even the placeholder
 * ones, since BootScene may still be generating them. Everything here is
 * rectangles and triangles from the palette.
 *
 * The bar fills as the files arrive, and the candle's flame breathes, so
 * a slow connection still has something alive to look at.
 */
export class LoadingCandle {
    constructor(scene) {
        const l = CONFIG.loading;

        this.scene = scene;
        this.progress = 0;

        this.centreX = GAME_WIDTH / 2;
        this.candleBottom = GAME_HEIGHT / 2 - l.gap;

        this.graphics = scene.add.graphics();
        this.flame = scene.add.graphics();

        scene.add.text(this.centreX, GAME_HEIGHT / 2 + l.labelGap,
            'Lighting the candle...', CONFIG.text.prompt).setOrigin(0.5);

        this.draw();
    }

    /** 0 to 1, from Phaser's loader. */
    setProgress(progress) {
        this.progress = progress;
        this.draw();
    }

    /** The candle, its dish, and the bar underneath it. */
    draw() {
        const l = CONFIG.loading;
        const g = this.graphics;
        const left = this.centreX - l.candleWidth / 2;
        const top = this.candleBottom - l.candleHeight;

        g.clear();

        // The wax, with a brighter lit side so it reads as round.
        g.fillStyle(CONFIG.palette.wax, 1);
        g.fillRect(left, top, l.candleWidth, l.candleHeight);
        g.fillStyle(CONFIG.palette.title, 0.45);
        g.fillRect(left, top, l.candleWidth * l.litSide, l.candleHeight);

        // The dish it stands in.
        g.fillStyle(CONFIG.palette.panelEdge, 1);
        g.fillEllipse(this.centreX, this.candleBottom + l.dishHeight / 2, l.dishWidth, l.dishHeight);

        // The wick.
        g.fillStyle(CONFIG.palette.shadow, 1);
        g.fillRect(this.centreX - 1, top - l.wickHeight, 2, l.wickHeight);

        this.drawBar();
    }

    drawBar() {
        const l = CONFIG.loading;
        const g = this.graphics;
        const x = this.centreX - l.barWidth / 2;
        const y = GAME_HEIGHT / 2 + l.barGap;

        g.lineStyle(CONFIG.ui.panelEdgePx, CONFIG.palette.panelEdge, 1);
        g.strokeRect(x, y, l.barWidth, l.barHeight);

        g.fillStyle(CONFIG.palette.accent, 1);
        g.fillRect(x + l.barInset, y + l.barInset,
            (l.barWidth - l.barInset * 2) * this.progress, l.barHeight - l.barInset * 2);
    }

    /**
     * The flame, redrawn every frame so it can breathe. One Graphics
     * object, cleared and refilled -- never a new object per frame
     * (CODE_RULES.md rule 9).
     */
    update(time) {
        const l = CONFIG.loading;
        const top = this.candleBottom - l.candleHeight - l.wickHeight;
        const wander = 1 + Math.sin(time / l.flickerMs) * l.flicker;
        const height = l.flameHeight * wander;
        const half = l.flameWidth / 2 * wander;
        const g = this.flame;

        g.clear();
        g.fillStyle(CONFIG.palette.flameOuter, 1);
        g.fillTriangle(this.centreX, top - height, this.centreX - half, top, this.centreX + half, top);
        g.fillStyle(CONFIG.palette.flameCore, 1);
        g.fillTriangle(this.centreX, top - height * l.coreHeight,
            this.centreX - half / 2, top, this.centreX + half / 2, top);
    }
}
