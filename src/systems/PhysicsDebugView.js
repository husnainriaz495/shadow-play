import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';

/** How strongly solid tiles are tinted in the F1 view (0-255). */
const TILE_TINT_ALPHA = 60;

/**
 * The developer view behind F1: physics hitboxes, the tiles that collide,
 * and the puppet's joint dots, all switched on and off together.
 *
 * WHY it is separate from GameScene: it is a development tool, not part of
 * the game. Keeping it out means the scene stays about the act itself, and
 * this file can be ignored entirely by anyone working on gameplay.
 */
export class PhysicsDebugView {
    constructor(scene, layer, rig) {
        this.scene = scene;
        this.layer = layer;
        this.rig = rig;

        // One reusable Graphics for the tile overlay, created on first use.
        this.tileGraphics = null;
    }

    setEnabled(enabled) {
        const world = this.scene.physics.world;

        // The body outlines only exist if physics started in debug mode, so
        // they are created the first time someone presses F1.
        if (enabled && !world.debugGraphic) {
            world.createDebugGraphic();
        }

        world.drawDebug = enabled;

        if (world.debugGraphic) {
            world.debugGraphic.setVisible(enabled).clear();
        }

        this.rig.setDebugVisible(enabled);
        this.drawTiles(enabled);
    }

    /** Tint every colliding tile, so solid ground is obvious. */
    drawTiles(enabled) {
        if (!this.tileGraphics) {
            this.tileGraphics = this.scene.add.graphics().setDepth(DEPTHS.HUD);
        }

        this.tileGraphics.clear().setVisible(enabled);
        if (!enabled) return;

        const tint = Phaser.Display.Color.IntegerToColor(CONFIG.palette.accent);
        tint.alpha = TILE_TINT_ALPHA;

        this.layer.renderDebug(this.tileGraphics, {
            tileColor: null,
            collidingTileColor: tint,
            faceColor: null
        });
    }
}
