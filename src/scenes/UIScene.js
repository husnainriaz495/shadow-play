import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, SIZE, HUD_BAND } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { Listeners } from '../core/Listeners.js';
import { romanNumeral } from '../core/helpers.js';
import { ACT_COUNT } from '../levels/index.js';
import { WaxPanel } from '../ui/WaxPanel.js';
import { SizeDots } from '../ui/SizeDots.js';
import { BurnRateTag } from '../ui/BurnRateTag.js';
import { ActTitle } from '../ui/ActTitle.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { GustWarning } from '../ui/GustWarning.js';
import { GlobalKeys } from '../systems/GlobalKeys.js';
import { AudioManager } from '../systems/AudioManager.js';

/** Where the HUD sits, in pixels from the edges of the screen. */
/** Gap between the HUD band's edges and what sits in it. */
const BAND_INSET = 8;

/** The burn-rate tag sits just right of the wax panel, in the band. */
const TAG_GAP = 14;

/** The act title's centre, from the top: its plate hangs from the top edge. */
const TITLE_Y = 42;

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

        // The act title lives HERE, on the UI layer, on its own plate, so no
        // wall or pillar can be drawn over it or show through it.
        this.actTitle = new ActTitle(this, GAME_WIDTH / 2, TITLE_Y);
        this.showTitle(this.startingTitle);

        // Everything below lives in the HUD band under the stage (the dark
        // frame), so it is never drawn over the level.
        const bandMiddle = (HUD_BAND.top + HUD_BAND.bottom) / 2;
        const panelLeft = HUD_BAND.left + BAND_INSET;
        const panelTop = bandMiddle - CONFIG.hud.waxPanel.height / 2;

        this.waxPanel = new WaxPanel(this, panelLeft, panelTop);
        this.burnRateTag = new BurnRateTag(this, panelLeft + CONFIG.hud.waxPanel.width + TAG_GAP, bandMiddle);
        this.sizeDots = new SizeDots(this, HUD_BAND.right - BAND_INSET * 6, bandMiddle, { labelBeside: true });
        this.debugOverlay = new DebugOverlay(this);

        // The draft's countdown bar and "GUST!" card. Hidden until an act
        // actually has weather (systems/DraftWind.js announces it).
        this.gustWarning = new GustWarning(this);
        this.gustWarning.setVisible(false);

        // Which act this is, in the band beside the burn-rate tag, so the
        // player can feel the show progressing without opening a menu.
        this.actTag = this.add.text(CONFIG.hud.actTagX, bandMiddle, '', CONFIG.text.muted)
            .setOrigin(0, 0.5);

        // Shown only while the sound is off, so a muted player knows why.
        this.mutedLabel = this.add.text(GAME_WIDTH / 2, bandMiddle, 'SOUND OFF', CONFIG.text.muted).setOrigin(0.5)
            .setVisible(AudioManager.isMuted(this.game));

        // M and F work all through the act and the pause menu from here.
        new GlobalKeys(this);

        // A full candle until systems/Candle.js sends its first WAX_CHANGED
        // (on GameScene's first frame).
        this.waxPanel.setWax(CONFIG.wax.start, CONFIG.wax.max);
        this.burnRateTag.setRate(CONFIG.player.sizes[SIZE.NORMAL].waxMultiplier);
        this.sizeDots.setSize(SIZE.NORMAL);

        this.listeners
            .on(EVENTS.WAX_CHANGED, this.onWaxChanged, this)
            .on(EVENTS.SIZE_CHANGED, this.onSizeChanged, this)
            .on(EVENTS.LEVEL_READY, this.onLevelReady, this)
            .on(EVENTS.MUTE_CHANGED, ({ muted }) => this.mutedLabel.setVisible(muted), this)
            .on(EVENTS.DRAFT_SCHEDULED, ({ seconds }) => this.onDraftScheduled(seconds), this)
            .on(EVENTS.DRAFT_TELEGRAPH, () => {
                // Belt and braces: if the act's first countdown was sent
                // before this scene existed, the warning reveals the bar.
                this.gustWarning.setVisible(true);
                this.gustWarning.warn();
            }, this)
            .on(EVENTS.DRAFT_START, () => {
                this.gustWarning.clear();
                this.gustWarning.setBlowing(true);
            }, this)
            .on(EVENTS.DRAFT_END, () => this.gustWarning.setBlowing(false), this)
            .on(EVENTS.DRAFT_STRENGTH, ({ strength }) => this.waxPanel.setWindLean(strength), this)
            .on(EVENTS.HIDE_IN_LEVEL_UI, () => this.hideInLevelUi(), this);

        this.bindDebugKey();
        this.bindHideHudKey();
    }

    /**
     * H hides the whole HUD for clean trailer shots (PRD 4.6) by hiding this
     * scene's camera, so anything added to the HUD later hides too. It
     * comes back with the next act, because this scene restarts with it.
     */
    bindHideHudKey() {
        CONFIG.controls.hideHud.forEach((key) => {
            this.input.keyboard.on(`keydown-${key}`, () => {
                this.cameras.main.setVisible(!this.cameras.main.visible);
            });
        });
    }

    showTitle(title) {
        this.actTitle.setTitle(title);
    }

    /**
     * A curtain is coming across: everything that belongs to the LEVEL
     * goes now. A "GUST!" card or a countdown bar left sitting on a
     * closing curtain belongs to an act that is already over.
     */
    hideInLevelUi() {
        this.gustWarning.setVisible(false);
    }

    /**
     * The first time a gust is scheduled, this act has weather -- so the
     * bar appears. Acts without a draft never send the event and never
     * show it.
     */
    onDraftScheduled(seconds) {
        this.gustWarning.setVisible(true);
        this.gustWarning.countDown(seconds);
    }

    /** A new act, or the same one restarted: new title, number, size. */
    onLevelReady({ act, title, sizeIndex }) {
        // A restart may land in an act with no weather at all.
        this.gustWarning.setVisible(false);
        this.showTitle(title);
        this.actTag.setText(`ACT ${romanNumeral(act ?? 1)} / ${romanNumeral(ACT_COUNT)}`);
        this.sizeDots.setSize(sizeIndex ?? SIZE.NORMAL);
    }

    onWaxChanged({ wax, max, rate }) {
        this.waxPanel.setWax(wax, max);
        this.waxPanel.setBurnRate(rate);
        this.burnRateTag.setRate(rate);
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

    update(time, delta) {
        this.waxPanel.update(time, delta);
        this.debugOverlay.update(time);
    }
}
