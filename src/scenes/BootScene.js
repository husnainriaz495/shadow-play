import Phaser from 'phaser';
import { SCENES } from '../core/constants.js';
import { StageTextures } from '../systems/StageTextures.js';
import { TileTextures } from '../systems/TileTextures.js';
import { PuppetTextures } from '../systems/PuppetTextures.js';
import { PropTextures } from '../systems/PropTextures.js';
import { UiTextures } from '../systems/UiTextures.js';

/**
 * The first scene. It draws every placeholder texture in code, then hands
 * over to PreloadScene.
 *
 * WHY it goes first (ASSETS.md rule 1): by the time anything else runs,
 * every texture key the game uses already exists. PreloadScene can then
 * replace a key with a real PNG if one is on disk -- or not, and the game
 * still looks and plays correctly. That is what lets us build the whole game
 * before a single piece of art exists.
 *
 * Scenes orchestrate, they do not contain rules (CODE_RULES.md rule 2): the
 * actual drawing lives in the four texture systems below, split by job --
 * the stage, the puppet's cut-out parts, world props and interface icons.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENES.BOOT);
    }

    create() {
        new StageTextures(this).generate();
        new TileTextures(this).generate();
        new PuppetTextures(this).generate();
        new PropTextures(this).generate();
        new UiTextures(this).generate();

        this.scene.start(SCENES.PRELOAD);
    }
}
