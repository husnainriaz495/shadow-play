import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';

/**
 * What a moth throws off, pooled once for the whole act (PRD 5.1, 6.4):
 *
 *  - **flakes**: a swatted moth bursts into pale paper scraps
 *  - **sparks**: a moth that strays very close to the candle catches a few
 *    embers off it, which is the warning that it is drawn to the flame
 *
 * WHY one class for both: they are the same idea seen twice -- bits coming
 * off a moth -- and an act may have several moths, so each effect must be
 * ONE emitter shared between them rather than one per moth
 * (CODE_RULES.md rule 9). GameScene makes it; the moths ask it for bursts.
 */
export class MothEffects {
    constructor(scene) {
        const { flake, spark } = CONFIG.moth;

        this.scene = scene;

        this.flakes = scene.add.particles(0, 0, 'dust', {
            emitting: false,
            speed: { min: flake.speedMin, max: flake.speedMax },
            lifespan: flake.lifeMs,
            scale: { start: flake.scale, end: flake.scale * 0.3 },
            alpha: { start: 0.9, end: 0 },
            rotate: { start: 0, end: 360 },
            gravityY: flake.gravityY,
            tint: CONFIG.palette.title,
            maxParticles: flake.maxFlakes
        }).setDepth(DEPTHS.PARTICLES);

        this.sparks = scene.add.particles(0, 0, 'ember', {
            emitting: false,
            speedY: { min: -spark.rise, max: -spark.rise / 3 },
            speedX: { min: -spark.drift, max: spark.drift },
            lifespan: spark.lifeMs,
            scale: { start: spark.scale, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            maxParticles: spark.maxSparks
        }).setDepth(DEPTHS.PARTICLES);
    }

    /** A moth was swatted: it comes apart into paper. */
    burst(x, y) {
        this.flakes.emitParticleAt(x, y, CONFIG.moth.flake.perBurst);
    }

    /** A moth is flying too near the flame: it catches a few embers. */
    spark(x, y) {
        this.sparks.emitParticleAt(x, y, CONFIG.moth.spark.perPuff);
    }
}
