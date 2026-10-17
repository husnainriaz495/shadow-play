import { CONFIG } from '../config.js';

/**
 * Stand-in sound effects, made in the browser rather than loaded.
 *
 * WHY: most of the sound files in ASSETS.md do not exist yet, and a game
 * where half the actions are silent feels broken rather than unfinished.
 * Every cue the game fires now makes SOME noise, built out of two
 * primitives -- a tone that can slide, and filtered noise -- which is
 * enough for a thud, a click, a swish or a crackle.
 *
 * These are deliberately plain. They are a floor, not a finish: the
 * moment a real file is added to `public/assets/audio/` and its `ready`
 * flag is set, AudioManager plays THAT instead and never calls in here
 * for that key again. Nothing else has to change.
 *
 * It uses the Web Audio context Phaser already owns, so it is muted,
 * unlocked on first input and torn down with everything else.
 */

/**
 * One recipe per key: a list of layers played together. Each layer is a
 * tone (`wave`) or a burst of filtered noise (no `wave`).
 *
 *   dur    seconds
 *   from   starting frequency; `to` slides there over `dur`
 *   gain   loudness of this layer, 0-1, before every volume setting
 *   delay  seconds to wait before this layer starts
 *   q      noise only: how narrow the filter is (higher = more tuned)
 *
 * These live beside the code that plays them rather than in config.js:
 * they are the SHAPE of a sound, not a number anyone will tune while
 * play-testing. The volumes that are tuned live in CONFIG.audio.
 */
const RECIPES = {
    sfx_squeeze: [{ dur: 0.18, from: 1400, to: 260, gain: 0.5, q: 3 }],
    sfx_land: [
        { wave: 'sine', dur: 0.16, from: 150, to: 60, gain: 0.7 },
        { dur: 0.1, from: 500, to: 160, gain: 0.3, q: 1 }
    ],
    sfx_paper: [{ dur: 0.22, from: 2600, to: 1500, gain: 0.35, q: 1.2 }],
    sfx_match: [
        { dur: 0.16, from: 1800, to: 3200, gain: 0.4, q: 1 },
        { wave: 'triangle', dur: 0.2, from: 420, to: 700, gain: 0.3, delay: 0.1 }
    ],
    sfx_tick: [{ wave: 'square', dur: 0.03, from: 1600, to: 1200, gain: 0.25 }],
    sfx_ui: [{ wave: 'triangle', dur: 0.06, from: 900, to: 1300, gain: 0.3 }],
    sfx_gust: [{ dur: 1.1, from: 300, to: 1500, gain: 0.45, q: 0.8 }],
    sfx_moth: [{ wave: 'triangle', dur: 0.26, from: 220, to: 180, gain: 0.2 }],
    sfx_swat: [
        { dur: 0.12, from: 2200, to: 400, gain: 0.5, q: 1 },
        { wave: 'sine', dur: 0.1, from: 180, to: 70, gain: 0.4 }
    ],
    sfx_burn: [{ dur: 0.3, from: 1200, to: 2400, gain: 0.3, q: 2 }],
    sfx_crate: [{ dur: 0.26, from: 320, to: 180, gain: 0.35, q: 1.5 }],
    sfx_switch: [
        { wave: 'square', dur: 0.05, from: 420, to: 260, gain: 0.4 },
        { dur: 0.08, from: 900, to: 300, gain: 0.3, q: 1 }
    ],
    sfx_gate: [
        { dur: 0.6, from: 220, to: 620, gain: 0.35, q: 2.5 },
        { wave: 'sawtooth', dur: 0.6, from: 90, to: 150, gain: 0.18 }
    ],
    sfx_door: [
        { wave: 'sine', dur: 0.5, from: 320, to: 520, gain: 0.35 },
        { wave: 'sine', dur: 0.6, from: 480, to: 780, gain: 0.3, delay: 0.14 }
    ],
    sfx_curtain: [{ dur: 0.7, from: 1800, to: 500, gain: 0.4, q: 0.9 }],
    sfx_candle_out: [
        { dur: 0.3, from: 2200, to: 600, gain: 0.4, q: 1 },
        { wave: 'sine', dur: 0.5, from: 300, to: 90, gain: 0.3, delay: 0.08 }
    ],
    sfx_checkpoint: [
        { wave: 'sine', dur: 0.3, from: 660, to: 660, gain: 0.3 },
        { wave: 'sine', dur: 0.4, from: 990, to: 990, gain: 0.25, delay: 0.12 }
    ],
    // The house, rather than one pair of hands: a long noise swell.
    sfx_applause: [
        { dur: 1.8, from: 1100, to: 2600, gain: 0.5, q: 0.6 },
        { dur: 2.2, from: 2600, to: 900, gain: 0.4, q: 0.5, delay: 0.25 }
    ]
};

/** One noise buffer, made on first use and reused (CODE_RULES rule 9). */
let noiseBuffer = null;

export class SynthSounds {
    /** Is there a stand-in for this key? */
    static has(key) {
        return key in RECIPES;
    }

    /**
     * @param {Phaser.Scene} scene for Phaser's audio context
     * @param {string} key the sound that has no file
     * @param {number} volume 0-1, already scaled by the player's sliders
     */
    static play(scene, key, volume) {
        const recipe = RECIPES[key];
        const context = scene.sound?.context;

        // No Web Audio (an old browser, or Phaser fell back to HTML5
        // audio) simply means silence, exactly as a missing file does.
        if (!recipe || !context || context.state === 'closed') return;

        recipe.forEach((layer) => SynthSounds.playLayer(context, layer, volume));
    }

    static playLayer(context, layer, volume) {
        const now = context.currentTime + (layer.delay ?? 0);
        const level = layer.gain * volume * CONFIG.audio.synthVolume;
        const gain = context.createGain();

        // A short attack and a long tail: a hard start clicks, and a hard
        // stop clicks louder.
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(level, now + CONFIG.audio.synthAttack);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + layer.dur);
        gain.connect(context.destination);

        const source = layer.wave
            ? SynthSounds.tone(context, layer, now, gain)
            : SynthSounds.noise(context, layer, now, gain);

        source.start(now);
        source.stop(now + layer.dur);
    }

    /** A sliding oscillator: thuds, clunks, chimes. */
    static tone(context, layer, now, gain) {
        const oscillator = context.createOscillator();

        oscillator.type = layer.wave;
        oscillator.frequency.setValueAtTime(layer.from, now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, layer.to), now + layer.dur);
        oscillator.connect(gain);

        return oscillator;
    }

    /**
     * Filtered white noise, swept: swishes, rustles, crackles, applause.
     * The noise runs through a bandpass on its way to the gain, which is
     * what turns a flat hiss into something with a shape.
     */
    static noise(context, layer, now, gain) {
        if (!noiseBuffer) noiseBuffer = SynthSounds.makeNoise(context);

        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();

        source.buffer = noiseBuffer;
        source.loop = true;

        filter.type = 'bandpass';
        filter.Q.value = layer.q ?? 1;
        filter.frequency.setValueAtTime(layer.from, now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(1, layer.to), now + layer.dur);

        source.connect(filter);
        filter.connect(gain);

        return source;
    }

    static makeNoise(context) {
        const buffer = context.createBuffer(1, context.sampleRate * CONFIG.audio.synthNoiseSeconds,
            context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        return buffer;
    }
}
