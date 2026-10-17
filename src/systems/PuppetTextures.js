import { CONFIG } from '../config.js';

/**
 * Draws the placeholder cut-out parts of the puppet: body, one arm, one leg.
 *
 * WHY only three parts (ASSETS.md, PRD 4.2.1): the puppet is a JOINTED
 * cut-out like a real shadow puppet. The rig pins the arm at the shoulder
 * and the leg at the hip and swings them with springs, so there are no walk
 * or jump frames anywhere in this game. The same arm image is used for both
 * arms and the same leg for both legs.
 *
 * Each limb is drawn HANGING STRAIGHT DOWN with its joint at the top centre,
 * because the rig rotates it around that point (`setOrigin(0.5, 0.06)`).
 * Sizes are 2x Normal scale so the puppet stays crisp when Huge.
 *
 * Runs ONCE in BootScene (CODE_RULES.md rule 8).
 */
export class PuppetTextures {
    constructor(scene) {
        this.scene = scene;
        this.shadow = CONFIG.palette.shadow;
    }

    generate() {
        this.body();
        this.arm();
        this.leg();
    }

    /** A fresh off-screen pen. `add: false` keeps it out of the scene. */
    canvas() {
        return this.scene.make.graphics({ add: false });
    }

    bake(graphics, key, width, height) {
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    /**
     * Body: head + torso only, facing right, 80x120.
     * The shoulders and hips must be clearly visible, because the real art
     * will be lined up to them using CONFIG.rig.mounts.
     */
    body() {
        const g = this.canvas();
        g.fillStyle(this.shadow, 1);

        g.fillCircle(42, 28, 24);               // head
        g.fillRoundedRect(20, 44, 40, 68, 10);  // torso
        g.fillRoundedRect(14, 46, 52, 16, 8);   // shoulder line
        g.fillTriangle(60, 50, 76, 70, 58, 74); // a little cape, facing right

        this.bake(g, 'puppet_body', 80, 120);
    }

    /**
     * Arm: 24x72, hanging down, joint at the top centre.
     * The hand end is slightly wider so the rod attachment reads clearly.
     */
    arm() {
        const g = this.canvas();
        g.fillStyle(this.shadow, 1);

        g.fillRoundedRect(5, 0, 14, 60, 7);   // upper + lower arm as one piece
        g.fillCircle(12, 63, 8);              // hand

        this.bake(g, 'puppet_arm', 24, 72);
    }

    /** Leg: 28x64, hanging down, joint at the top centre, boot at the foot. */
    leg() {
        const g = this.canvas();
        g.fillStyle(this.shadow, 1);

        g.fillRoundedRect(7, 0, 14, 52, 7);   // leg
        g.fillRoundedRect(4, 50, 22, 12, 4);  // boot

        this.bake(g, 'puppet_leg', 28, 64);
    }
}
