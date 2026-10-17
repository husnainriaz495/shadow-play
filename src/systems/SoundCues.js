import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
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
 * Each entry turns the event's payload into a sound key. Keys whose file
 * does not exist yet are silent until it arrives (AudioManager.isLoaded).
 */
const CUES = {
    [EVENTS.SIZE_CHANGED]: ({ sizeIndex, previousIndex }) =>
        (sizeIndex > previousIndex ? 'sfx_grow' : 'sfx_shrink'),
    [EVENTS.GROW_BLOCKED]: () => 'sfx_squeeze',
    [EVENTS.PLAYER_JUMPED]: () => 'sfx_jump',
    [EVENTS.WAX_PICKED_UP]: () => 'sfx_wax',
    [EVENTS.PLAYER_HURT]: () => 'sfx_hurt',
    [EVENTS.ACT_COMPLETE]: () => 'sfx_door',
    [EVENTS.WAX_OUT]: () => 'sfx_candle_out'
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
            listeners.on(event, (payload) => AudioManager.playSfx(scene, keyFor(payload ?? {})), this);
        });

        // Act 5 has its own, tenser track once that file exists.
        const finale = actNumber === 5 && AudioManager.isLoaded(scene, 'music_finale');
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
