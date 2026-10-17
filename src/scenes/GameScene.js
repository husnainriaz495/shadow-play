import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTHS, SYMBOLS } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { Listeners } from '../core/Listeners.js';
import { PaperScreen } from '../objects/PaperScreen.js';
import { Player } from '../objects/Player.js';
import { PuppetRig } from '../objects/PuppetRig.js';
import { LevelLoader } from '../systems/LevelLoader.js';
import { ObjectSpawner } from '../systems/ObjectSpawner.js';
import { PhysicsDebugView } from '../systems/PhysicsDebugView.js';
import { FireGrid } from '../systems/FireGrid.js';
import { FallWatch } from '../systems/FallWatch.js';
import { HitFeedback } from '../systems/HitFeedback.js';
import { ActFlow } from '../systems/ActFlow.js';
import { SizeEffects } from '../systems/SizeEffects.js';
import { Candle } from '../systems/Candle.js';
import { Death } from '../systems/Death.js';
import { SoundCues } from '../systems/SoundCues.js';
import { DustPuff } from '../fx/DustPuff.js';
import { MothEffects } from '../fx/MothEffects.js';
import { DraftWind } from '../systems/DraftWind.js';
import { Curtain } from '../ui/Curtain.js';
import { SaveProgress } from '../systems/SaveProgress.js';
import { ACTS, ACT_COUNT } from '../levels/index.js';

/**
 * Runs one act: it builds the level, creates the objects and wires the
 * events. The RULES of how things behave live in objects/ and systems/,
 * never here (CODE_RULES.md rule 2).
 *
 * M2 STATUS: stage, puppet, sizes, wax timer and game over all run here.
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super(SCENES.GAME);
    }

    /** Scene data arrives here: `this.scene.start(SCENES.GAME, { act: 1 })`. */
    /** Load this act's backdrop if it is not loaded yet (PaperScreen). */
    preload() {
        PaperScreen.queueBackdrop(this, this.actNumber);
    }

    init(data) {
        this.actNumber = data?.act ?? 1;

        // The act card hands over with the curtain still shut (PRD 5.1), so
        // this act is built out of sight and then revealed. R restarts
        // without it, which is why it is scene data and not a constant.
        this.curtainClosed = Boolean(data?.curtainClosed);

        // ...and a quick restart hands over half-way through the "curtain
        // flick" (ActFlow.restart), so this act finishes drawing it back.
        this.flick = Boolean(data?.flick);

        /**
         * Where the act restarts from, once a lantern has been lit, and
         * the wax that was in hand at the time. Carried through the
         * restart itself, since the scene is rebuilt (objects/Lantern.js).
         */
        this.checkpoint = data?.checkpoint ?? null;

        /** Why this act is starting, for the dev log below. */
        this.startReason = data?.reason ?? 'started directly';

        /**
         * How many times this act has been restarted, carried through the
         * restart itself (the scene is rebuilt, so it cannot be a field).
         * The results card reports it.
         */
        this.restarts = data?.restarts ?? 0;
    }

    /**
     * Which act loaded and why, so a progression bug can be read off the
     * console instead of guessed at. DEBUG only (PRD 4.6) -- it must never
     * chatter in the build the judges play.
     */
    logAct() {
        if (!CONFIG.DEBUG) return;

        console.log(`[Shadow Play] Act ${this.actNumber} of ${ACT_COUNT} ` +
            `"${this.currentAct.title}" - ${this.startReason}. ` +
            `Highest unlocked: ${SaveProgress.getHighestAct()}.`);
    }

    create() {
        fitCamera(this, { clipToStage: true });

        // The canvas is bigger than the stage (render scale), so the physics
        // world has to be told the stage's real size or the puppet could
        // walk off the edge into empty space.
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

        /** True while a closed curtain covers the stage (revealStage). */
        this.stageHidden = false;

        /** When this attempt began, for the results card's clock. */
        this.startedAt = this.time.now;

        /**
         * "Reduce motion & flicker" (PRD 5.1 accessibility): read ONCE
         * here rather than per hit, so nothing touches storage mid-act.
         * Effects that move the CAMERA check it.
         */
        this.reduceMotion = SaveProgress.getSettings().reduceMotion;

        this.listeners = new Listeners(this);
        this.paperScreen = new PaperScreen(this);
        this.paperScreen.showBackdrop(this.actNumber);

        // The HUD is a SEPARATE scene running on top, so restarting the act
        // does not tear down and rebuild the HUD (PRD 6.3). The check matters:
        // R restarts this scene, and launching an already-running UIScene
        // would reset the very HUD we are trying to keep.
        if (!this.scene.isActive(SCENES.UI)) {
            // Scene data, not a method call: UIScene is not listening yet on
            // its very first frame, so it is handed the title to start with.
            this.scene.launch(SCENES.UI, { title: this.currentAct.title });
        }

        // R, pause, the door and dev keys: moving between acts (ActFlow).
        this.flow = new ActFlow(this, this.actNumber, this.listeners);

        this.buildLevel();

        // F1 is owned by UIScene; this scene just reacts to the announcement.
        this.listeners
            .on(EVENTS.DEBUG_TOGGLED, ({ enabled }) => this.debugView.setEnabled(enabled), this);

        EventBus.emit(EVENTS.LEVEL_READY, {
            act: this.actNumber,
            title: this.currentAct.title,
            sizeIndex: this.player.state.index   // R resets the size; the HUD must too
        });

        this.logAct();

        if (this.curtainClosed) this.revealStage();
        else if (this.flick) this.finishFlick();
    }

    /**
     * The second half of the quick-restart flick: the halves are already
     * 40% across and the act behind them is brand new, so sweep them back.
     */
    finishFlick() {
        const curtain = new Curtain(this, { closedAmount: CONFIG.anim.flickAmount });

        curtain.tweenTo(0, CONFIG.anim.quickRestartMs / 2, () => curtain.destroy());
    }

    /**
     * Came in from the act card: the stage is built behind a shut curtain,
     * so draw it back. The curtain is destroyed afterwards -- nothing in
     * the act needs it, and leaving it parked would cover the first and
     * last tiles of the stage.
     */
    revealStage() {
        const curtain = new Curtain(this, { closedAmount: 1 });

        // Nothing on the stage should PLAY while it is hidden: the finale's
        // "The stage is on fire!" warning spawns next to the puppet, and
        // without this it drops in and settles behind the curtain, so the
        // player only ever sees it already there.
        this.stageHidden = true;

        this.time.delayedCall(CONFIG.actCard.openDelayMs, () => curtain.open(() => {
            curtain.destroy();
            this.stageHidden = false;
        }));
    }

    /** How this attempt went, for the results card (ui/ResultsCard.js). */
    get stats() {
        return {
            act: this.actNumber,
            seconds: (this.time.now - this.startedAt) / 1000,
            waxLeft: Math.max(0, this.candle.wax),
            waxMax: CONFIG.wax.max,
            restarts: this.restarts
        };
    }

    /** The act being played, falling back to Act 1 if the index is out of range. */
    get currentAct() {
        return ACTS[this.actNumber - 1] ?? ACTS[0];
    }

    /**
     * Turn the act's map strings into the stage.
     *
     * The loader reports any problem with the map to the console and still
     * returns a usable grid, so a typo shows up as something visibly wrong
     * on screen next to a clear error, rather than a blank page.
     */
    buildLevel() {
        const level = new LevelLoader(this).load(this.currentAct, this.actNumber);

        this.layer = level.layer;
        this.playerStart = level.playerStart;
        this.spawns = level.spawns;

        if (level.problems.length > 0) {
            this.warnOnScreen(level.problems.length);
        }

        // A lit lantern moves where the act begins again.
        const start = this.checkpoint ?? this.playerStart;

        this.player = new Player(this, start.x, start.y, this.layer);

        // The last argument lets a one-way shelf release the player while
        // they are dropping down through it (systems/PlatformDrop.js).
        this.physics.add.collider(this.player, this.layer, null,
            (player, tile) => !player.letsThrough(tile));

        // The player body is invisible; this is what you actually see.
        this.rig = new PuppetRig(this, this.player);

        // The light and the limbs react to every size change.
        new SizeEffects(this, this.listeners, this.paperScreen, this.rig);

        // The wax timer (PRD 4.3), and the curtain when it runs out.
        this.candle = new Candle(this.listeners, this.player, this.paperScreen, this.actNumber);

        // Restarting from a lantern gives back the wax you reached it
        // with, not a full candle and not the last drop you arrived on.
        if (this.checkpoint?.wax !== undefined) this.candle.wax = this.checkpoint.wax;

        // Lighting one moves the restart point for the rest of the act.
        this.listeners.on(EVENTS.CHECKPOINT_LIT, (spot) => { this.checkpoint = spot; }, this);
        this.death = new Death(this, this.listeners, this.player, this.rig, this.actNumber);

        // Burning paper, and falling through the holes it leaves (PRD 4.4).
        new FireGrid(this, this.layer, this.player, this.paperScreen);
        // Falling announces PLAYER_DIED; systems/Death.js brings the
        // curtain down on it, the same as any other death.
        new FallWatch(this, this.player);
        new HitFeedback(this, this.listeners, this.rig);

        // Dust from the feet on landing, and a camera nudge after a drop.
        this.dust = new DustPuff(this, this.player);

        // Paper flakes and embers for every moth in the act, pooled once.
        // The moths find it on the scene rather than being handed it, the
        // same way they find the paper screen's light.
        this.mothEffects = new MothEffects(this);

        // Every sound effect, the music and the candle's crackle.
        new SoundCues(this, this.listeners, this.actNumber);

        // F1: hitboxes, solid tiles and joint dots (a dev tool, not the game).
        this.debugView = new PhysicsDebugView(this, this.layer, this.rig);

        // Door, wax drops, crates... everything the map marked for spawning.
        this.objects = ObjectSpawner.spawnAll(this, this.spawns, this.player, this.layer, this.listeners);

        // Weather, but only in an act that asked for it. One wind for the
        // whole stage; the `^` marks say where it blows FROM.
        this.wind = this.spawns.some((spot) => spot.symbol === SYMBOLS.DRAFT)
            ? new DraftWind(this, this.player, this.spawns, this.objects, this.candle,
                CONFIG.acts[this.actNumber - 1]?.draftIntervalSeconds)
            : null;

        // The candle starts behind the puppet, with no glide on the first frame.
        this.paperScreen.setLightSource(this.player.x, this.player.feetY + CONFIG.glow.sourceOffsetY, true);
    }

    /**
     * A broken map is easy to miss if you are not watching the console, so
     * it is said on screen too.
     */
    warnOnScreen(count) {
        this.add.text(GAME_WIDTH / 2, 130,
            `${count} problem${count === 1 ? '' : 's'} with this map — see the console (F12)`,
            CONFIG.text.body)
            .setOrigin(0.5)
            .setDepth(DEPTHS.HUD);
    }

    update(time, delta) {
        // The candle is held behind the puppet, so the light follows it
        // (PALETTE.md "Glow from the candle").
        this.paperScreen.setLightSource(this.player.x, this.player.feetY + CONFIG.glow.sourceOffsetY);
        this.paperScreen.update(time, delta);
        this.rig.update(time, delta);
        this.dust.update();
        this.wind?.update(delta);
        this.candle.update(delta);
    }
}
