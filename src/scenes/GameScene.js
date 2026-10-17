import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTHS } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { Listeners } from '../core/Listeners.js';
import { PaperScreen } from '../objects/PaperScreen.js';
import { Player } from '../objects/Player.js';
import { PuppetRig } from '../objects/PuppetRig.js';
import { LevelLoader } from '../systems/LevelLoader.js';
import { ObjectSpawner } from '../systems/ObjectSpawner.js';
import { PhysicsDebugView } from '../systems/PhysicsDebugView.js';
import { SaveProgress } from '../systems/SaveProgress.js';
import { SizeEffects } from '../systems/SizeEffects.js';
import { Candle } from '../systems/Candle.js';
import { CandleOut } from '../systems/CandleOut.js';
import { SoundCues } from '../systems/SoundCues.js';
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
    init(data) {
        this.actNumber = data?.act ?? 1;
    }

    create() {
        fitCamera(this);

        // The canvas is bigger than the stage (render scale), so the physics
        // world has to be told the stage's real size or the puppet could
        // walk off the edge into empty space.
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.listeners = new Listeners(this);
        this.paperScreen = new PaperScreen(this);

        // The HUD is a SEPARATE scene running on top, so restarting the act
        // does not tear down and rebuild the HUD (PRD 6.3). The check matters:
        // R restarts this scene, and launching an already-running UIScene
        // would reset the very HUD we are trying to keep.
        if (!this.scene.isActive(SCENES.UI)) {
            // Scene data, not a method call: UIScene is not listening yet on
            // its very first frame, so it is handed the title to start with.
            this.scene.launch(SCENES.UI, { title: this.currentAct.title });
        }

        this.buildLevel();
        this.bindKeys();

        // F1 is owned by UIScene; this scene just reacts to the announcement.
        this.listeners
            .on(EVENTS.DEBUG_TOGGLED, ({ enabled }) => this.debugView.setEnabled(enabled), this)
            .on(EVENTS.ACT_COMPLETE, this.onActComplete, this);

        EventBus.emit(EVENTS.LEVEL_READY, {
            act: this.actNumber,
            title: this.currentAct.title,
            sizeIndex: this.player.state.index   // R resets the size; the HUD must too
        });
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

        this.player = new Player(this, this.playerStart.x, this.playerStart.y, this.layer);

        // The last argument lets a one-way shelf release the player while
        // they are dropping down through it (systems/PlatformDrop.js).
        this.physics.add.collider(this.player, this.layer, null,
            (player, tile) => !player.letsThrough(tile));

        // The player body is invisible; this is what you actually see.
        this.rig = new PuppetRig(this, this.player);

        // The light and the limbs react to every size change.
        new SizeEffects(this, this.listeners, this.paperScreen, this.rig);

        // The wax timer (PRD 4.3), and the curtain when it runs out.
        this.candle = new Candle(this.listeners, this.player, this.paperScreen);
        new CandleOut(this, this.listeners, this.player, this.rig);

        // Every sound effect, the music and the candle's crackle.
        new SoundCues(this, this.listeners, this.actNumber);

        // F1: hitboxes, solid tiles and joint dots (a dev tool, not the game).
        this.debugView = new PhysicsDebugView(this, this.layer, this.rig);

        // Door, wax drops, crates... everything the map marked for spawning.
        this.objects = ObjectSpawner.spawnAll(this, this.spawns, this.player);

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

    /**
     * R restarts the act; Esc or P opens the pause menu (PRD 4.6). Keys come
     * from CONFIG.controls, so remapping them later touches no scene code.
     *
     * The menu also opens by itself when the tab is hidden or the window
     * loses focus (PRD M1), so an alt-tab never costs the player wax.
     * Those are GAME-wide events that outlive this scene, so they are
     * removed by hand on shutdown or a restart would stack duplicates.
     */
    bindKeys() {
        CONFIG.controls.restart.forEach((key) => {
            this.input.keyboard.on(`keydown-${key}`, () => {
                EventBus.emit(EVENTS.ACT_RESTARTED, { act: this.actNumber });
                this.scene.restart({ act: this.actNumber });
            });
        });

        CONFIG.controls.pause.forEach((key) => {
            this.input.keyboard.on(`keydown-${key}`, () => this.openPause());
        });

        const pauseOnLeave = () => this.openPause();
        this.game.events.on(Phaser.Core.Events.BLUR, pauseOnLeave);
        this.game.events.on(Phaser.Core.Events.HIDDEN, pauseOnLeave);

        this.events.once('shutdown', () => {
            this.game.events.off(Phaser.Core.Events.BLUR, pauseOnLeave);
            this.game.events.off(Phaser.Core.Events.HIDDEN, pauseOnLeave);
        });
    }

    /** Freeze the act and lay the pause menu over it. */
    openPause() {
        if (!this.scene.isActive()) return;   // already paused, or leaving

        this.scene.launch(SCENES.PAUSE, { act: this.actNumber });
        this.scene.pause();
    }

    /**
     * The door was reached: unlock the next act and move on to it, or to
     * the ending after the last one. The curtain and results card that wrap
     * this are M5 (PRD 5.1).
     */
    onActComplete() {
        const next = this.actNumber + 1;

        SaveProgress.unlockAct(next);
        this.scene.stop(SCENES.UI);

        if (next <= ACT_COUNT) {
            this.scene.start(SCENES.ACT_CARD, { act: next });
        } else {
            this.scene.start(SCENES.END);
        }
    }

    update(time, delta) {
        // The candle is held behind the puppet, so the light follows it
        // (PALETTE.md "Glow from the candle").
        this.paperScreen.setLightSource(this.player.x, this.player.feetY + CONFIG.glow.sourceOffsetY);
        this.paperScreen.update(time, delta);
        this.rig.update(time, delta);
        this.candle.update(delta);
    }
}
