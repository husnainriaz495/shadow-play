import { CONFIG } from '../config.js';
import { DEPTHS, GAME_HEIGHT } from '../core/constants.js';

/**
 * What a draft LOOKS like (PRD 4.4, 5.1): streaks of moving air and paper
 * scraps tearing across the stage left to right, and the curtains in the
 * windows it blows through fluttering a second before it lands.
 *
 * There is deliberately NO spinning windmill. bg_act4 has one painted
 * into it, and a baked image cannot turn -- blades drawn on top of it
 * never lined up with the hub and had a different sail count, so the act
 * showed two windmills at once. The wind is told by the streaks, the
 * scraps and the curtains instead.
 *
 * WHY the effects are their own class: systems/DraftWind.js decides WHEN
 * the wind blows and what it does to the puppet; this only draws it. The
 * act was unreadable before precisely because the wind was invisible --
 * the player was flattened by something they could not see coming.
 *
 * Both emitters and the windmill are made once for the act and reused
 * (CODE_RULES.md rule 9).
 */
export class WindEffects {
    /**
     * @param {Phaser.Scene} scene
     * @param {object[]} vents the `^` spots: where the draft comes IN
     */
    constructor(scene, vents = []) {
        this.scene = scene;

        this.streaks = this.buildStreaks();
        this.scraps = this.buildScraps();
        this.windows = vents.map((vent) => this.buildWindow(vent));
    }

    /**
     * The open window a draft blows through, drawn at each `^`. Without
     * one the wind came from nowhere: the player could see the effect and
     * never the cause.
     *
     * Its curtain is a separate object so it alone can flutter.
     */
    buildWindow(vent) {
        const w = CONFIG.draft.window;
        const frame = this.scene.add.graphics().setDepth(DEPTHS.BACKDROP + 1);
        const left = vent.x - w.width / 2;
        const top = vent.y - w.height / 2;

        // The night outside, then the frame around it.
        frame.fillStyle(CONFIG.palette.frame, w.openAlpha);
        frame.fillRect(left, top, w.width, w.height);
        frame.lineStyle(w.frameWidth, CONFIG.palette.shadow, 1);
        frame.strokeRect(left, top, w.width, w.height);
        frame.lineBetween(vent.x, top, vent.x, top + w.height);
        frame.lineBetween(left, vent.y, left + w.width, vent.y);

        const curtain = this.scene.add.rectangle(left + w.width / 2, top,
            w.width - w.frameWidth, w.curtainHeight, CONFIG.palette.curtain[0])
            .setOrigin(0.5, 0)
            .setDepth(DEPTHS.BACKDROP + 2)
            .setAlpha(w.curtainAlpha);

        return curtain;
    }

    /** A gust is a second away: every window's curtain waves. */
    flutterWindows() {
        const w = CONFIG.draft.window;

        this.windows.forEach((curtain) => {
            this.scene.tweens.killTweensOf(curtain);
            curtain.setAngle(0);
            this.scene.tweens.add({
                targets: curtain,
                angle: { from: -w.flutterDeg, to: w.flutterDeg },
                duration: w.flutterMs,
                ease: CONFIG.anim.easeLoop,
                yoyo: true,
                repeat: Math.ceil(CONFIG.draft.telegraphSeconds * 1000 / (w.flutterMs * 2)),
                onComplete: () => curtain.setAngle(0)
            });
        });
    }

    /**
     * Long thin smears of air. They start off the LEFT edge and cross the
     * whole stage, so the wind reads as weather passing through rather
     * than as something coming out of a vent.
     */
    buildStreaks() {
        const w = CONFIG.draft.streak;

        return this.scene.add.particles(0, 0, 'wind_streak', {
            emitting: false,
            x: -CONFIG.draft.streakWidth,
            y: { min: w.topY, max: w.bottomY },
            speedX: { min: w.speedMin, max: w.speedMax },
            speedY: { min: -w.drift, max: w.drift },
            lifespan: w.lifeMs,
            scaleX: { min: w.scaleMin, max: w.scaleMax },
            scaleY: { min: 0.6, max: 1.2 },
            alpha: { start: w.alpha, end: 0 },
            blendMode: 'ADD',
            maxParticles: w.maxStreaks
        }).setDepth(DEPTHS.PARTICLES);
    }

    /** Paper scraps, heavier and slower than the air itself. */
    buildScraps() {
        const s = CONFIG.draft.scrap;

        return this.scene.add.particles(0, 0, 'dust', {
            emitting: false,
            speedX: { min: s.speedMin, max: s.speedMax },
            speedY: { min: -s.lift, max: s.lift },
            lifespan: s.lifeMs,
            scale: { start: s.scale, end: s.scale * 0.6 },
            alpha: { start: 0.8, end: 0 },
            rotate: { start: 0, end: 540 },
            tint: CONFIG.palette.title,
            maxParticles: s.maxScraps
        }).setDepth(DEPTHS.PARTICLES);
    }

    /** A puff of scraps from a vent (or from the left edge if none). */
    blowScraps(vents, count) {
        if (vents.length === 0) {
            this.scraps.emitParticleAt(0, GAME_HEIGHT / 2, count);
            return;
        }

        vents.forEach((vent) => this.scraps.emitParticleAt(vent.x, vent.y, count));
    }

    /** Streaks start crossing the stage; `strong` is the gust proper. */
    setStreaming(on, strong = false) {
        const w = CONFIG.draft.streak;

        this.streaks.frequency = strong ? w.gustEveryMs : w.telegraphEveryMs;
        this.streaks.emitting = on;
    }

}
