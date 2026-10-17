/**
 * The asset manifest: every file the game may load, with the KEY the code
 * uses for it. Mirrors the tables in ASSETS.md.
 *
 * WHY (ASSETS.md rules 1-3):
 *  - Code never writes a file path. It says this.add.image(x, y, 'puppet_body').
 *  - The game must run with ZERO asset files: BootScene draws a placeholder
 *    texture under every image key first, and PreloadScene only overwrites a
 *    key if the real file actually loads. A missing file is a warning, not a
 *    crash, and a missing sound is simply silence.
 *
 * THE `ready` FLAG mirrors the [ ] checkbox in ASSETS.md. It is false until
 * the real file is actually sitting at that path. PreloadScene only requests
 * files marked ready, which is why the console stays clean -- asking for 24
 * sounds that do not exist yet would print 24 red 404s, and CODE_RULES.md
 * rule 11 says the console must have no red errors.
 *
 * So the workflow from ASSETS.md rule 4 is:
 *   1. drop the file at the exact path below
 *   2. tick its box in ASSETS.md
 *   3. flip `ready` to true here
 *   4. add the source to CREDITS.md
 *
 * This is one of the three allowed singletons (CODE_RULES.md 6.5).
 * `frames` means the PNG is a horizontal strip of that many frames, and
 * `w`/`h` are then the size of ONE frame.
 */
export const ASSETS = {
    /**
     * The puppet is a jointed cut-out: a body plus ONE arm and ONE leg
     * image, reused for both sides and swung from their joints by the rig
     * (PRD 4.2.1). There are no walk or jump frames to draw. Sizes are 2x
     * Normal scale so the puppet stays crisp when Huge.
     */
    images: [
        { key: 'puppet_body',   path: 'assets/images/puppet_body.png',   ready: true , w: 80,  h: 120 },
        { key: 'puppet_arm',    path: 'assets/images/puppet_arm.png',    ready: true , w: 24,  h: 72 },
        { key: 'puppet_leg',    path: 'assets/images/puppet_leg.png',    ready: true , w: 28,  h: 64 },
        { key: 'moth',          path: 'assets/images/moth.png',          ready: true , w: 48,  h: 48,  frames: 2 },
        { key: 'crate',         path: 'assets/images/crate.png',         ready: true , w: 80,  h: 80 },
        { key: 'door',          path: 'assets/images/door.png',          ready: true , w: 40,  h: 80 },
        { key: 'gate',          path: 'assets/images/gate.png',          ready: true , w: 40,  h: 120 },
        { key: 'switch',        path: 'assets/images/switch.png',        ready: true , w: 40,  h: 40,  frames: 2 },
        { key: 'wax',           path: 'assets/images/wax.png',           ready: false, w: 24,  h: 32 },
        { key: 'lantern',       path: 'assets/images/lantern.png',       ready: true , w: 40,  h: 40,  frames: 2 },
        { key: 'curtain_left',  path: 'assets/images/curtain_left.png',  ready: true , w: 660, h: 720 },
        { key: 'curtain_right', path: 'assets/images/curtain_right.png', ready: true , w: 660, h: 720 },
        { key: 'logo',          path: 'assets/images/logo.png',          ready: true , w: 800, h: 240 },
        { key: 'pointer_hand',  path: 'assets/images/pointer_hand.png',  ready: true , w: 64,  h: 64 },
        { key: 'gamepad_icons', path: 'assets/images/gamepad_icons.png', ready: true , w: 64,  h: 64,  frames: 4 }
    ],

    /**
     * Act backdrops load one at a time, while the curtain is closed
     * (CODE_RULES.md rule 8 -- lazy-load heavy things). They are optional:
     * with no file the act simply plays on plain paper.
     */
    backdrops: [
        { key: 'bg_act1', path: 'assets/images/bg_act1.png', ready: true , w: 1280, h: 720 },
        { key: 'bg_act2', path: 'assets/images/bg_act2.png', ready: true , w: 1280, h: 720 },
        { key: 'bg_act3', path: 'assets/images/bg_act3.png', ready: true , w: 1280, h: 720 },
        { key: 'bg_act4', path: 'assets/images/bg_act4.png', ready: true , w: 1280, h: 720 },
        { key: 'bg_act5', path: 'assets/images/bg_act5.png', ready: true , w: 1280, h: 720 }
    ],

    /**
     * Short sound effects. `loop` ones are started and stopped by code.
     * `volume` is multiplied by CONFIG.audio.sfxVolume (0.8) when played,
     * so crackle's 0.25 is heard at 0.2.
     *
     * `maxMs` / `fadeMs` (optional) cut a file that runs too long: only the
     * first maxMs is played, fading out over the last fadeMs. The file
     * itself is untouched (AudioManager.playSfx).
     */
    sfx: [
        { key: 'sfx_crackle',    path: 'assets/audio/sfx/crackle.mp3',    ready: true,  loop: true,  volume: 0.25 },
        { key: 'sfx_grow',       path: 'assets/audio/sfx/grow.mp3',       ready: true,  loop: false, volume: 0.3, maxMs: 800, fadeMs: 150 },
        { key: 'sfx_shrink',     path: 'assets/audio/sfx/shrink.mp3',     ready: true,  loop: false, volume: 0.3 },
        { key: 'sfx_squeeze',    path: 'assets/audio/sfx/squeeze.mp3',    ready: false, loop: false, volume: 0.5 },
        { key: 'sfx_jump',       path: 'assets/audio/sfx/jump.mp3',       ready: true,  loop: false, volume: 0.4, maxMs: 400, fadeMs: 80 },
        { key: 'sfx_land',       path: 'assets/audio/sfx/land.mp3',       ready: false, loop: false, volume: 0.35 },
        { key: 'sfx_wax',        path: 'assets/audio/sfx/wax.wav',        ready: true,  loop: false, volume: 0.6 },
        { key: 'sfx_checkpoint', path: 'assets/audio/sfx/checkpoint.mp3', ready: false, loop: false, volume: 0.6 },
        { key: 'sfx_paper',      path: 'assets/audio/sfx/paper.mp3',      ready: false, loop: false, volume: 0.45 },
        { key: 'sfx_match',      path: 'assets/audio/sfx/match.mp3',      ready: false, loop: false, volume: 0.6 },
        { key: 'sfx_tick',       path: 'assets/audio/sfx/tick.mp3',       ready: false, loop: false, volume: 0.5 },
        { key: 'sfx_ui',         path: 'assets/audio/sfx/ui.mp3',         ready: false, loop: false, volume: 0.4 },
        { key: 'sfx_hurt',       path: 'assets/audio/sfx/hurt.mp3',       ready: true,  loop: false, volume: 0.6 },
        { key: 'sfx_gust',       path: 'assets/audio/sfx/gust.mp3',       ready: false, loop: false, volume: 0.6 },
        { key: 'sfx_moth',       path: 'assets/audio/sfx/moth.mp3',       ready: false, loop: true,  volume: 0.25 },
        { key: 'sfx_swat',       path: 'assets/audio/sfx/swat.mp3',       ready: false, loop: false, volume: 0.6 },
        { key: 'sfx_burn',       path: 'assets/audio/sfx/burn.mp3',       ready: false, loop: false, volume: 0.5 },
        { key: 'sfx_crate',      path: 'assets/audio/sfx/crate.mp3',      ready: false, loop: true,  volume: 0.4 },
        { key: 'sfx_switch',     path: 'assets/audio/sfx/switch.mp3',     ready: false, loop: false, volume: 0.6 },
        { key: 'sfx_gate',       path: 'assets/audio/sfx/gate.mp3',       ready: false, loop: false, volume: 0.6 },
        { key: 'sfx_door',       path: 'assets/audio/sfx/door.mp3',       ready: false, loop: false, volume: 0.7 },
        { key: 'sfx_curtain',    path: 'assets/audio/sfx/curtain.mp3',    ready: false, loop: false, volume: 0.5 },
        { key: 'sfx_candle_out', path: 'assets/audio/sfx/candle_out.mp3', ready: false, loop: false, volume: 0.7 },
        { key: 'sfx_applause',   path: 'assets/audio/sfx/applause.mp3',   ready: false, loop: false, volume: 0.7 }
    ],

    music: [
        { key: 'music_theme',  path: 'assets/audio/music/theme.mp3',  ready: true,  loop: true, volume: 0.6 },
        { key: 'music_finale', path: 'assets/audio/music/finale.mp3', ready: false, loop: true, volume: 0.4 }
    ],

    /**
     * Files the BROWSER uses, not Phaser: the tab icon and the link-preview
     * image. They are listed here only so ASSETS.md has one mirror in code.
     * Nothing ever loads these through Phaser; index.html references them.
     */
    page: {
        favicon: 'favicon.png',
        ogImage: 'og-image.png'
    },

    /**
     * The theatre font is loaded by a CSS @font-face in index.html, not by
     * Phaser. `fallback` is what text uses until/unless the file exists.
     */
    font: {
        family: 'Theatre',
        fallback: 'Georgia, serif',
        path: 'assets/fonts/theatre.woff2'
    }
};

/** Keep only the entries whose real file is actually in place. */
const ready = (list) => list.filter((entry) => entry.ready);

/**
 * What PreloadScene loads: the title screen and Act 1 only.
 * Act backdrops and the finale music load later, in ActCardScene, while the
 * curtain is closed (CODE_RULES.md rule 8).
 */
export const PRELOAD_LIST = {
    images: ready(ASSETS.images),
    audio: ready([...ASSETS.sfx, ASSETS.music[0]]),

    // Act 1's backdrop comes with the first load; later acts load theirs
    // just before they start (objects/PaperScreen.js queueBackdrop).
    backdrops: [backdropForAct(1)].filter(Boolean)
};

/** Look up one backdrop by act number (1-5), or undefined if there is none. */
export function backdropForAct(actNumber) {
    return ASSETS.backdrops.find((entry) => entry.key === 'bg_act' + actNumber && entry.ready);
}
