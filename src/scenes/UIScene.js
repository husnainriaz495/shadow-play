import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_HEIGHT, GAME_WIDTH, SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { Listeners } from '../core/Listeners.js';
import { WaxCandle } from '../ui/WaxCandle.js';
import { SizeDots } from '../ui/SizeDots.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { GlobalKeys } from '../systems/GlobalKeys.js';
import { AudioManager } from '../systems/AudioManager.js';

/** Where the HUD sits, in pixels from the edges of the screen. */
const MARGIN = { x: 60, y: 40 };

/** The act title's height from the top of the screen. */
const TITLE_Y = 64;

/**
 * The HUD, running as its own scene on top of GameScene (PRD 6.3).
 *
 * WHY a separate scene: restarting an act rebuilds GameScene from scratch.
 * If the HUD lived inside it, the wax candle would be destroyed and rebuilt
 * on every death. Here it simply keeps listening.
 *
 * This scene DRAWS and nothing else. It never reads the player or the
 * candle: it waits to be told (CODE_RULES.md 6.2) and hands the numbers to
 * the ui/ pieces, which know how to render them.
 */
export class UIScene extends Phaser.Scene {
    constructor() {
        super(SCENES.UI);
    }

    /** The first act's title arrives as scene data from GameScene. */
    init(data) {
        this.startingTitle = data?.title ?? '';
    }

    create() {
        fitCamera(this);

        this.listeners = new Listeners(this);

        // The act title lives HERE, on the UI layer, so no wall or pillar
        // can ever be drawn over it (PALETTE.md "Text"). Titles are
        // uppercase; the letter spacing and shadow come from the style.
        this.actTitle = this.add.text(GAME_WIDTH / 2, TITLE_Y, '', CONFIG.text.heading)
            .setOrigin(0.5);
        this.showTitle(this.startingTitle);

        this.waxCandle = new WaxCandle(this, MARGIN.x, GAME_HEIGHT - MARGIN.y);
        this.sizeDots = new SizeDots(this, GAME_WIDTH - MARGIN.x - 34, GAME_HEIGHT - MARGIN.y - 60);
        this.debugOverlay = new DebugOverlay(this);

        // Shown only while the sound is off, so a muted player knows why.
        this.mutedLabel = this.add.text(MARGIN.x / 2, MARGIN.y / 2, 'SOUND OFF', CONFIG.text.muted)
            .setVisible(AudioManager.isMuted(this.game));

        // M and F work all through the act and the pause menu from here.
        new GlobalKeys(this);

        // A full candle until systems/Candle.js sends its first WAX_CHANGED
        // (on GameScene's first frame).
        this.waxCandle.setWax(CONFIG.wax.start, CONFIG.wax.max);
        this.sizeDots.setSize(SIZE.NORMAL);

        this.listeners
            .on(EVENTS.WAX_CHANGED, this.onWaxChanged, this)
            .on(EVENTS.SIZE_CHANGED, this.onSizeChanged, this)
            .on(EVENTS.LEVEL_READY, this.onLevelReady, this)
            .on(EVENTS.MUTE_CHANGED, ({ muted }) => this.mutedLabel.setVisible(muted), this);

        this.bindDebugKey();
    }

    showTitle(title) {
        this.actTitle.setText(title.toUpperCase());
    }

    /** A new act, or the same one restarted: new title, starting size. */
    onLevelReady({ title, sizeIndex }) {
        this.showTitle(title);
        this.sizeDots.setSize(sizeIndex ?? SIZE.NORMAL);
    }

    onWaxChanged({ wax, max }) {
        this.waxCandle.setWax(wax, max);
    }

    onSizeChanged({ sizeIndex }) {
        this.sizeDots.setSize(sizeIndex);
    }

    /**
     * F1 toggles developer mode for the whole game. This scene owns the key
     * and ANNOUNCES the change; GameScene listens and shows the physics
     * bodies. Neither scene calls into the other (CODE_RULES.md 6.2).
     */
    bindDebugKey() {
        this.input.keyboard.on('keydown-F1', (event) => {
            // Stop the browser opening its own help window.
            event.preventDefault();

            const enabled = !this.debugOverlay.visible;

            this.debugOverlay.setVisible(enabled);
            EventBus.emit(EVENTS.DEBUG_TOGGLED, { enabled });
        });
    }

    update(time) {
        this.waxCandle.update(time);
        this.debugOverlay.update(time);
    }
}
