import { ASSETS } from '../assets.js';
import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { SaveProgress } from './SaveProgress.js';
import { SynthSounds } from './SynthSounds.js';

/** Find a sound's entry in assets.js, for its volume. */
const entryFor = (key) => [...ASSETS.sfx, ...ASSETS.music].find((sound) => sound.key === key);

/**
 * A player slider (0-10) as a multiplier. The sliders multiply the design
 * mix in CONFIG.audio rather than replacing it, so music turned up to 10
 * still sits under the effects where it belongs.
 */
const level = (name) => SaveProgress.getSettings()[name] / CONFIG.audio.maxLevel;

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
 * Every play goes through `isLoaded` first. A sound whose file does not
 * exist yet (`ready: false`) is never requested from the server, so the
 * console stays clean -- instead systems/SynthSounds.js makes a stand-in
 * for it in the browser, so no action in the game is silent. The moment
 * the real file is added and its `ready` flag set, THAT plays and the
 * stand-in is never reached again. No call site changes either way.
 */
export class AudioManager {
    /**
     * Say once, at boot, which sound files are still missing and what is
     * standing in for them. Without this the stand-ins are TOO good a
     * disguise -- the game sounds finished and nobody remembers that half
     * the recordings were never made.
     */
    static reportMissingFiles() {
        const missing = [...ASSETS.sfx, ...ASSETS.music].filter((sound) => !sound.ready);

        if (missing.length === 0) {
            console.log('[Shadow Play] Every sound in ASSETS.md has a real file.');
            return;
        }

        const stood = missing.filter((sound) => SynthSounds.has(sound.key));
        const silent = missing.filter((sound) => !SynthSounds.has(sound.key));

        console.log(`[Shadow Play] ${missing.length} of ` +
            `${ASSETS.sfx.length + ASSETS.music.length} sound files are still missing. ` +
            'To use a real one: drop it at the path below and set `ready: true` in src/assets.js.');

        const list = (sounds) => sounds
            .map((sound) => `\n    ${sound.key}  ->  ${sound.path}`)
            .join('');

        if (stood.length > 0) {
            console.log('  Standing in for now (made in the browser):' + list(stood));
        }

        if (silent.length > 0) {
            console.log('  Still SILENT (no stand-in):' + list(silent));
        }
    }

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

    /**
     * Volume for an sfx key: its own level in assets.js, times the design
     * mix, times the player's effects and master sliders.
     */
    static sfxVolume(key) {
        return (entryFor(key)?.volume ?? 1) * CONFIG.audio.sfxVolume
            * level('sfx') * level('master');
    }

    /** The same for the music track. */
    static musicVolume(key) {
        return (entryFor(key)?.volume ?? 1) * CONFIG.audio.musicVolume
            * level('music') * level('master');
    }

    /**
     * A slider moved: the track playing right now has to follow, or the
     * change is only heard after the next act.
     */
    static refreshMusicVolume() {
        const music = AudioManager.music;

        if (music?.isPlaying) music.setVolume(AudioManager.musicVolume(music.key));
    }

    /** Play a one-shot sound effect by its ASSETS.md key. */
    /**
     * Play a one-shot. The real file if there is one, a stand-in made in
     * the browser if there is not, and silence only if neither exists.
     */
    static playSfx(scene, key) {
        const volume = AudioManager.sfxVolume(key);

        if (!AudioManager.isLoaded(scene, key)) {
            // No file: make the sound instead. Muting is Phaser's job for
            // loaded sounds, so the stand-in has to check it by hand.
            if (!AudioManager.isMuted(scene.game)) SynthSounds.play(scene, key, volume);
            return;
        }

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
        if (!CONFIG.audio.musicOn) return;    // switched off in config.js
        if (!AudioManager.isLoaded(scene, key)) return;

        const sound = scene.sound;
        const current = AudioManager.music;

        if (current?.key === key && current.isPlaying) return;

        current?.stop();
        current?.destroy();

        AudioManager.music = sound.add(key, { loop: true, volume: AudioManager.musicVolume(key) });
        AudioManager.music.play();
    }
}

/** The track playing now, shared by every scene (see playMusic). */
AudioManager.music = null;
