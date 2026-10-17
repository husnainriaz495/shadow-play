import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, TILE_SIZE } from '../core/constants.js';

/**
 * How burning paper LOOKS: a soft orange glow on every burning tile that
 * flares big and bright the moment the tile catches and settles as it
 * burns (so the leading edge of the fire always glows most), a burst of
 * embers from each new ignition, embers rising steadily from every burning
 * tile, and a puff when a tile burns through.
 *
 * WHY it is separate from systems/FireGrid.js: FireGrid decides where fire
 * goes and what it does; this only draws it (CODE_RULES.md rule 2, and the
 * fx/ folder is for particle pools and animation). One particle emitter is
 * made once and reused for every ember (CODE_RULES 9).
 */
export class FireEffects {
    constructor(scene) {
        this.scene = scene;

        /** "col,row" -> that tile's glow image. */
        this.glows = new Map();

        this.embers = scene.add.particles(0, 0, 'ember', {
            emitting: false,
            speedY: { min: -70, max: -25 },
            speedX: { min: -18, max: 18 },
            lifespan: CONFIG.fire.emberLifeMs,
            scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            maxParticles: CONFIG.fire.maxEmbers
        }).setDepth(DEPTHS.PARTICLES);

        // One timer for the embers of every burning tile, not one per tile.
        scene.time.addEvent({ delay: CONFIG.fire.emberEveryMs, loop: true, callback: this.puffAll, callbackScope: this });
    }

    /**
     * A tile caught fire: its glow flares, then settles over its burn.
     * @param {number} delaySeconds a starting fire waits this long first
     */
    tileCaught(col, row, delaySeconds) {
        const { glowRadius, glowAlpha, frontGlowRadius, frontGlowAlpha, burnToHoleSeconds } = CONFIG.fire;

        const glow = this.scene.add.image((col + 0.5) * TILE_SIZE, (row + 0.5) * TILE_SIZE, 'soft_glow')
            .setTint(CONFIG.palette.flameOuter)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTHS.TILES + 1)
            .setAlpha(frontGlowAlpha);
        const scaleFor = (radius) => (radius * 2) / glow.width;

        glow.setScale(scaleFor(frontGlowRadius));
        this.scene.tweens.add({
            targets: glow,
            scale: scaleFor(glowRadius),
            alpha: glowAlpha,
            delay: delaySeconds * 1000,
            duration: burnToHoleSeconds * 1000,
            ease: CONFIG.anim.easeInSoft
        });

        this.glows.set(`${col},${row}`, glow);
    }

    /** Embers leap up from a tile the fire has just reached. */
    ignitionBurst(col, row) {
        this.embers.emitParticleAt((col + 0.5) * TILE_SIZE, row * TILE_SIZE, CONFIG.fire.frontEmbers);
    }

    /** A tile burnt through: its glow goes out with a last puff. */
    tileGone(col, row) {
        const key = `${col},${row}`;
        const glow = this.glows.get(key);

        if (glow) {
            this.scene.tweens.killTweensOf(glow);
            glow.destroy();
            this.glows.delete(key);
        }

        this.embers.emitParticleAt((col + 0.5) * TILE_SIZE, (row + 0.5) * TILE_SIZE, CONFIG.fire.holeEmbers);
    }

    /** A few embers rise from every burning tile. */
    puffAll() {
        this.glows.forEach((glow) => this.embers.emitParticleAt(glow.x, glow.y - TILE_SIZE / 2, 1));
    }
}
