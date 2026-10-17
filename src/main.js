import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { GAME_WIDTH, GAME_HEIGHT } from './core/constants.js';
import { toCssColor } from './core/helpers.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { ActCardScene } from './scenes/ActCardScene.js';
import { EndScene } from './scenes/EndScene.js';

/**
 * Creates the Phaser game and lists the scenes. NOTHING ELSE belongs in this
 * file (CODE_RULES.md rule 3) -- no game rules, no numbers of its own.
 *
 * Scene order matters: the FIRST scene in the list starts automatically, so
 * BootScene (which draws every placeholder texture) must come first.
 * UIScene is in the list but is only ever launched by GameScene, on top.
 */
const gameConfig = {
    type: Phaser.AUTO,
    // Drawn at render scale for sharpness; every scene's camera zooms back
    // to the 1280x720 stage (core/camera.js).
    width: GAME_WIDTH * CONFIG.render.scale,
    height: GAME_HEIGHT * CONFIG.render.scale,
    parent: 'game-container',

    // The frame colour (PALETTE.md), so letterbox bars when the window is
    // a different shape read as part of the theatre.
    backgroundColor: toCssColor(CONFIG.palette.frame),

    // pixelArt is false: our silhouettes are smooth shapes, not pixels, and
    // the puppet is scaled up to 2x when Huge (PRD 6.2).
    pixelArt: false,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    // Arrow keys and Space would otherwise scroll the web page while you
    // play (PRD 4.10). Capturing them keeps every press inside the game.
    input: {
        keyboard: {
            capture: [
                Phaser.Input.Keyboard.KeyCodes.UP,
                Phaser.Input.Keyboard.KeyCodes.DOWN,
                Phaser.Input.Keyboard.KeyCodes.LEFT,
                Phaser.Input.Keyboard.KeyCodes.RIGHT,
                Phaser.Input.Keyboard.KeyCodes.SPACE
            ]
        }
    },

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: CONFIG.physics.gravity },
            debug: CONFIG.DEBUG
        }
    },

    scene: [
        BootScene,
        PreloadScene,
        TitleScene,
        ActCardScene,
        GameScene,
        UIScene,
        PauseScene,     // last, so it draws on top of the act and the HUD
        EndScene
    ]
};

new Phaser.Game(gameConfig);
