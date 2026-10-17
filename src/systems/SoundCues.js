import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { ACT_COUNT } from '../levels/index.js';
import { AudioManager } from './AudioManager.js';

/**
 * Which sound plays for which moment, in ONE table (ASSETS.md "Plays when").
 *
 * WHY a table listening to events: the objects that cause these moments
 * (Player, WaxDrop, SizeChanger...) already ANNOUNCE them on the EventBus.
 * Hanging the sounds off those announcements means no game object ever
 * needs to know about audio, and adding a sound is one line here
 * (CODE_RULES 6.2, 6.3).
 *
 * Each entry turns the event's payload into a sound key, or into nothing
 * when that particular moment does not deserve a sound. A key whose file
 * does not exist yet still makes a noise: AudioManager stands a
 * browser-made one in for it (systems/SynthSounds.js).
 */
const CUES = {
    [EVENTS.SIZE_CHANGED]: ({ sizeIndex, previousIndex }) =>
        (sizeIndex > previousIndex ? 'sfx_grow' : 'sfx_shrink'),
    [EVENTS.GROW_BLOCKED]: () => 'sfx_squeeze',
    [EVENTS.PLAYER_JUMPED]: () => 'sfx_jump',
    [EVENTS.WAX_PICKED_UP]: () => 'sfx_wax',
    [EVENTS.SWITCH_PRESSED]: () => 'sfx_switch',
    [EVENTS.SWITCH_TICK]: () => 'sfx_tick',
    [EVENTS.LANTERN_LIT]: () => 'sfx_checkpoint',
    [EVENTS.HINT_SHOWN]: () => 'sfx_paper',
    [EVENTS.GATE_OPENED]: () => 'sfx_gate',
    [EVENTS.GATE_CLOSED]: () => 'sfx_gate',
    [EVENTS.PLAYER_HURT]: () => 'sfx_hurt',
    [EVENTS.ACT_COMPLETE]: () => 'sfx_door',
    [EVENTS.WAX_OUT]: () => 'sfx_candle_out',
    [EVENTS.MOTH_SWATTED]: () => 'sfx_swat',
    [EVENTS.DRAFT_TELEGRAPH]: () => 'sfx_gust',

    // Only a real drop thuds. Every small hop making a noise turns a walk
    // into a drum solo, so this uses the same line DustPuff draws for its
    // camera nudge (CONFIG.land.nudgeSpeed).
    [EVENTS.PLAYER_LANDED]: ({ fallSpeed }) =>
        (fallSpeed > CONFIG.land.nudgeSpeed ? 'sfx_land' : null)
};

/**
 * The act's sound: the one-shot cues above, the act's music, and the
 * candle's crackle, a quiet loop that fades with the wax (ASSETS.md).
 * Lives in GameScene, so an R restart tears it down and builds it afresh.
 */
export class SoundCues {
    /**
     * @param {Phaser.Scene} scene GameScene
     * @param {import('../core/Listeners.js').Listeners} listeners the scene's
     * @param {number} actNumber 1-5, to pick the music
     */
    constructor(scene, listeners, actNumber) {
        this.scene = scene;

        Object.entries(CUES).forEach(([event, keyFor]) => {
            listeners.on(event, (payload) => {
                const key = keyFor(payload ?? {});

                // A cue may decide this particular moment is not worth a
                // sound (a small hop, say) by returning nothing.
                if (key) AudioManager.playSfx(scene, key);
            }, this);
        });

        // Act 5 has its own, tenser track once that file exists.
        // The finale is the LAST act, however many were cut before it.
        const finale = actNumber === ACT_COUNT && AudioManager.isLoaded(scene, 'music_finale');
        AudioManager.playMusic(scene, finale ? 'music_finale' : 'music_theme');

        this.startCrackle(listeners);
    }

    /**
     * The candle's crackle: always on while the act runs, paused with the
     * pause menu, quieter as the wax runs out, silent once the candle dies.
     */
    startCrackle(listeners) {
        const crackle = AudioManager.startLoop(this.scene, 'sfx_crackle');
        if (!crackle) return;

        const fullVolume = AudioManager.sfxVolume('sfx_crackle');

        listeners
            .on(EVENTS.WAX_CHANGED, ({ wax }) => {
                // Full until the low-wax line, then fading with the light.
                crackle.setVolume(fullVolume * Math.min(1, wax / CONFIG.wax.lowThreshold));
            }, this)
            .on(EVENTS.WAX_OUT, () => crackle.stop(), this);

        // The sound manager outlives scenes, so the loop must be told about
        // pausing, and destroyed on restart, or crackles would pile up.
        // scene.events ALSO outlives an R restart, so these two handlers
        // are removed by hand on shutdown (same pattern as GameScene).
        const events = this.scene.events;
        const pause = () => crackle.pause();
        const resume = () => crackle.resume();

        events.on('pause', pause);
        events.on('resume', resume);
        events.once('shutdown', () => {
            events.off('pause', pause);
            events.off('resume', resume);
            crackle.destroy();
        });
    }
}
