import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { PRELOAD_LIST } from '../assets.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';

/**
 * Keys are loaded under this prefix first, then swapped onto the real key.
 * See useRealArtWhereItLoaded() for why.
 */
const PENDING_PREFIX = 'pending:';

/**
 * Loads the real asset files -- but only the ones that actually exist.
 *
 * WHY (ASSETS.md rules 1 and 3): an entry in assets.js is only requested
 * when its `ready` flag is true, so the game never asks the server for a
 * file we have not made yet. If a ready file is missing or broken anyway
 * (a typo in a path), 'loaderror' logs one clear warning and the game
 * carries on with the placeholder texture from BootScene. Missing sounds
 * simply mean silence -- never a crash.
 */
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super(SCENES.PRELOAD);
    }

    preload() {
        fitCamera(this);

        this.showLoadingBar();

        // One warning per bad file, instead of an exception that kills the game.
        this.load.on('loaderror', (file) => {
            const key = file.key.replace(PENDING_PREFIX, '');

            console.warn(`[Shadow Play] Asset "${key}" failed to load from ${file.url}. ` +
                'Keeping the placeholder drawn in BootScene. Check its path in src/assets.js.');
        });

        PRELOAD_LIST.images.forEach((image) => {
            const pendingKey = PENDING_PREFIX + image.key;

            // A strip of frames must load as a sprite sheet so setFrame() works.
            if (image.frames) {
                this.load.spritesheet(pendingKey, image.path, {
                    frameWidth: image.w,
                    frameHeight: image.h
                });
            } else {
                this.load.image(pendingKey, image.path);
            }
        });

        PRELOAD_LIST.audio.forEach((sound) => this.load.audio(sound.key, sound.path));
    }

    create() {
        this.useRealArtWhereItLoaded();

        this.scene.start(SCENES.TITLE);
    }

    /**
     * Swap each real file that loaded onto the key the game actually uses.
     *
     * WHY the detour through a temporary key: BootScene has already drawn a
     * placeholder under every image key, and Phaser REFUSES to overwrite a
     * key that is in use -- it prints a red "Texture key already in use"
     * error and throws the newly loaded file away. So loading straight onto
     * 'puppet_body' would silently keep the stand-in drawing and dirty the
     * console at the same time.
     *
     * Loading under 'pending:puppet_body' instead sidesteps that. If the
     * file arrived we drop the placeholder and rename the real texture onto
     * the proper key; if it did not, we simply never touch the placeholder,
     * which is exactly the promise ASSETS.md rule 3 makes.
     *
     * renameTexture only moves the key -- it destroys nothing -- so there is
     * no second copy of the image left in memory.
     */
    useRealArtWhereItLoaded() {
        PRELOAD_LIST.images.forEach((image) => {
            const pendingKey = PENDING_PREFIX + image.key;

            // Not there means the load failed; the placeholder stays put.
            if (!this.textures.exists(pendingKey)) return;

            this.textures.remove(image.key);
            this.textures.renameTexture(pendingKey, image.key);
        });
    }

    /**
     * A simple progress bar. It is drawn with Graphics rather than an image
     * because at this point no image is guaranteed to have loaded.
     */
    showLoadingBar() {
        const barWidth = 420;
        const x = (GAME_WIDTH - barWidth) / 2;
        const y = GAME_HEIGHT / 2;

        this.add.text(GAME_WIDTH / 2, y - 48, 'Lighting the candle...', CONFIG.text.prompt)
            .setOrigin(0.5);

        const outline = this.add.graphics();
        outline.lineStyle(2, CONFIG.palette.title, 0.8);
        outline.strokeRect(x, y, barWidth, 18);

        // One Graphics object, cleared and redrawn -- no new objects per frame.
        const fill = this.add.graphics();
        this.load.on('progress', (progress) => {
            fill.clear();
            fill.fillStyle(CONFIG.palette.accent, 1);
            fill.fillRect(x + 3, y + 3, (barWidth - 6) * progress, 12);
        });
    }
}
