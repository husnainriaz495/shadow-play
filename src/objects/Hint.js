import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, GAME_WIDTH, TILE_SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { clamp } from '../core/helpers.js';
import { PaperPanel } from '../ui/PaperPanel.js';

/**
 * A hint painted on the stage (map symbol `?`), e.g. "Q / E: move the
 * candle" (PRD 4.10). The text comes from the act's `hints` list.
 *
 * It is a PaperPanel that unfolds when the puppet walks near and folds
 * away when it leaves (PRD 5.1), so hints are there when needed and the
 * stage is clean for the trailer the rest of the time.
 *
 * ONLY ACT I HAS THESE, and they name the keys rather than the answer.
 * The warning variant that act V used ("The stage is on fire!") is gone
 * with the hints themselves; the one thing that still needs to shout --
 * an incoming gust -- is ui/GustWarning.js, which is a HUD warning
 * rather than something painted on the stage.
 *
 * WHY a Zone: it has a position and an update but draws nothing itself;
 * the panel does the drawing.
 */
export class Hint extends Phaser.GameObjects.Zone {
    /**
     * @param {number} x, y the CENTRE of the map tile marked `?`
     * @param {string} hint '\n' starts a new line
     */
    constructor(scene, x, y, hint) {
        super(scene, x, y, 1, 1);
        scene.add.existing(this);

        this.panel = this.buildNormal(scene, x, y, hint);
        this.shown = false;
        this.isHint = true;
        this.player = null;
    }

    /** A normal hint: painted on the stage at its `?`, in the body style. */
    buildNormal(scene, x, y, text) {
        const { paddingX, paddingY } = CONFIG.hint;
        const label = scene.add.text(0, 0, text, CONFIG.text.body).setOrigin(0.5);
        const width = label.width + paddingX * 2;
        const height = label.height + paddingY * 2;

        // Keep the whole panel inside the stage's outer walls.
        const half = width / 2;
        const panelX = clamp(x, TILE_SIZE + half, GAME_WIDTH - TILE_SIZE - half);

        const panel = new PaperPanel(scene, panelX, y, width, height).add(label);
        // Over the walls (a panel may overlap one) but behind the puppet.
        panel.container.setDepth(DEPTHS.PLAYER - 1);
        return panel;
    }

    /** Called once every object exists (ObjectSpawner). */
    link({ player, listeners }) {
        this.player = player;

        // A curtain is closing: this act is over, so the hint goes with
        // it rather than sitting on the velvet.
        listeners?.on(EVENTS.HIDE_IN_LEVEL_UI, () => this.retire(), this);
    }

    /** Fold away and stay away for the rest of the act. */
    retire() {
        this.retired = true;
        if (this.shown) {
            this.shown = false;
            this.panel.close();
        }
    }

    preUpdate() {
        // Wait while a closed curtain covers the stage (GameScene.
        // revealStage), or a hint plays its entrance where nobody can see.
        if (!this.player || this.scene.stageHidden || this.retired) return;

        // Sideways distance only: a hint above the floor should still open
        // for a puppet walking underneath it.
        const tiles = Math.abs(this.player.x - this.x) / TILE_SIZE;

        if (!this.shown && tiles <= CONFIG.hint.showTiles) {
            this.shown = true;
            this.panel.open();
            EventBus.emit(EVENTS.HINT_SHOWN);
        } else if (this.shown && tiles > CONFIG.hint.hideTiles) {
            this.shown = false;
            this.panel.close();
        }
    }
}
