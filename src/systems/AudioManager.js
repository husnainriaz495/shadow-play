import { ASSETS } from '../assets.js';
import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/** Find a sound's entry in assets.js, for its volume. */
const entryFor = (key) => [...ASSETS.sfx, ...ASSETS.music].find((sound) => sound.key === key);

/**
 * The one place that decides whether the game makes sound.
 *
 * WHY a system and not a line in each scene: the M key, the pause menu and
 * (in M5) the settings page all change the same thing. Routing them through
 * here means they can never disagree, and the HUD hears about every change
 * through EVENTS.MUTE_CHANGED without anyone calling into it.
 *
 * Phaser's sound manager belongs to the whole game, not to a scene, so
 * muting it here silences every scene at once.
 *
 * Every play goes through `isLoaded` first: a sound whose file does not
 * exist yet (`ready: false`) is simply silent, and Phaser never logs an
 * error for a key it never loaded. When the file arrives, the call sites
 * start making noise with no code change.
 */
export class AudioManager {
    /** @param {Phaser.Game} game */
    static isMuted(game) {
        return game.sound.mute;
    }

    /** Flip sound on or off, and announce it. */
    static toggleMute(game) {
        game.sound.mute = !game.sound.mute;
        EventBus.emit(EVENTS.MUTE_CHANGED, { muted: game.sound.mute });

        return game.sound.mute;
    }

    static isLoaded(scene, key) {
        return scene.cache.audio.exists(key);
    }

    /** Volume for an sfx key: its assets.js volume times the sfx level. */
    static sfxVolume(key) {
        return (entryFor(key)?.volume ?? 1) * CONFIG.audio.sfxVolume;
    }

    /** Play a one-shot sound effect by its ASSETS.md key. */
    static playSfx(scene, key) {
        if (!AudioManager.isLoaded(scene, key)) return;

        const volume = AudioManager.sfxVolume(key);
        const { maxMs, fadeMs = 0 } = entryFor(key) ?? {};

        if (!maxMs) {
            scene.sound.play(key, { volume });
            return;
        }

        AudioManager.playCapped(scene, key, volume, maxMs, fadeMs);
    }

    /**
     * Play only the first `maxMs` of a sound, fading out over the last
     * `fadeMs` -- for files that run longer than the moment they mark.
     *
     * WHY a marker: Web Audio itself stops a marker at its duration, so the
     * cut happens even if the scene ends mid-sound. The fade is a tween on
     * top; if the scene goes away first, the sound still stops on time.
     */
    static playCapped(scene, key, volume, maxMs, fadeMs) {
        const sound = scene.sound.add(key);

        sound.addMarker({ name: 'capped', start: 0, duration: maxMs / 1000, config: { volume } });
        sound.play('capped');

        const fade = scene.tweens.add({
            targets: sound,
            volume: 0,
            delay: maxMs - fadeMs,
            duration: fadeMs
        });

        // Whichever ends first (the marker or the fade) tidies up, once:
        // a tween must never set the volume of a destroyed sound.
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            fade.stop();
            sound.destroy();
        };

        sound.once('complete', finish);
        fade.setCallback('onComplete', finish);
    }

    /**
     * Start a looping effect (the candle crackle, later moths and crates).
     * The caller owns the returned sound and must stop and destroy it.
     *
     * @returns {Phaser.Sound.BaseSound|null} null while the file is missing
     */
    static startLoop(scene, key) {
        if (!AudioManager.isLoaded(scene, key)) return null;

        const sound = scene.sound.add(key, { loop: true, volume: AudioManager.sfxVolume(key) });
        sound.play();

        return sound;
    }

    /**
     * Play a music track on a loop, unless it is already playing.
     *
     * WHY "unless": music should flow on from the title into the act and
     * through every R restart, not start again from the top each time. The
     * sound manager belongs to the game, so the track outlives scenes.
     * A different track replaces the old one (crossfades are M5).
     */
    static playMusic(scene, key) {
        if (!AudioManager.isLoaded(scene, key)) return;

        const sound = scene.sound;
        const current = AudioManager.music;

        if (current?.key === key && current.isPlaying) return;

        current?.stop();
        current?.destroy();

        const volume = (entryFor(key)?.volume ?? 1) * CONFIG.audio.musicVolume;

        AudioManager.music = sound.add(key, { loop: true, volume });
        AudioManager.music.play();
    }
}

/** The track playing now, shared by every scene (see playMusic). */
AudioManager.music = null;
