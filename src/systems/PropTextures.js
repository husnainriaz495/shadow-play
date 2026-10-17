import { CONFIG } from '../config.js';
import { sliceFrames } from '../core/helpers.js';

/**
 * Draws the placeholder texture for every *thing in the world*: moth, crate,
 * door, gate, switch, wax drop, checkpoint lantern and the curtains.
 *
 * WHY (ASSETS.md rule 1): the game must be playable before anyone draws a
 * single PNG. Each texture here uses the SAME key as the real file, so when
 * a real PNG lands in public/assets/images/ it simply replaces this drawing
 * and no gameplay code changes.
 *
 * The puppet's own parts are in PuppetTextures.js, and the paper, glow and
 * tileset are in StageTextures.js -- one job per file (CODE_RULES.md rule 2).
 *
 * Runs ONCE in BootScene (CODE_RULES.md rule 8) -- never per frame.
 */
export class PropTextures {
    constructor(scene) {
        this.scene = scene;
        this.shadow = CONFIG.palette.shadow;
    }

    generate() {
        this.moth();
        this.crate();
        this.door();
        this.gate();
        this.switchPlate();
        this.waxDrop();
        this.lantern();
        this.curtains();
    }

    /** A fresh off-screen pen. `add: false` keeps it out of the scene. */
    canvas() {
        return this.scene.make.graphics({ add: false });
    }

    /** Bake the drawing into a texture under `key`, then throw the pen away. */
    bake(graphics, key, width, height) {
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    /** Moth: a 2-frame strip, wings open then wings closed. */
    moth() {
        const g = this.canvas();
        g.fillStyle(this.shadow, 1);

        // Frame 0 (x 0-48): wings spread wide.
        g.fillTriangle(24, 24, 2, 8, 6, 34);
        g.fillTriangle(24, 24, 46, 8, 42, 34);
        g.fillEllipse(24, 24, 10, 22);

        // Frame 1 (x 48-96): wings folded up, so it reads as a wing-beat.
        g.fillTriangle(72, 24, 56, 4, 66, 28);
        g.fillTriangle(72, 24, 88, 4, 78, 28);
        g.fillEllipse(72, 24, 10, 22);

        this.bake(g, 'moth', 96, 48);
        sliceFrames(this.scene, 'moth', 48, 48, 2);
    }

    /** Crate: 2x2 tiles, a filled square with a cut-out X so it reads as wood. */
    crate() {
        const g = this.canvas();
        g.fillStyle(this.shadow, 1);
        g.fillRect(0, 0, 80, 80);

        // Cut the X back out in the paper colour, for a plank look.
        g.lineStyle(5, CONFIG.palette.paperStops[1], 1);
        g.lineBetween(6, 6, 74, 74);
        g.lineBetween(74, 6, 6, 74);
        g.strokeRect(5, 5, 70, 70);

        this.bake(g, 'crate', 80, 80);
    }

    /** Stage door: 1x2 tiles, a doorway with an arched top and light behind. */
    door() {
        const g = this.canvas();
        g.fillStyle(this.shadow, 1);
        g.fillRect(2, 24, 36, 56);
        g.fillCircle(20, 26, 18);        // the arch

        g.fillStyle(CONFIG.palette.accent, 1);
        g.fillRect(8, 34, 24, 46);       // the open gap: the goal's light spills through
        g.fillCircle(20, 34, 12);

        this.bake(g, 'door', 40, 80);
    }

    /** Gate: 1x3 tiles of portcullis bars with rails top and bottom. */
    gate() {
        const g = this.canvas();
        g.fillStyle(this.shadow, 1);
        g.fillRect(0, 0, 40, 7);         // top rail
        g.fillRect(0, 113, 40, 7);       // bottom rail
        [4, 18, 32].forEach((x) => g.fillRect(x, 0, 5, 120));

        this.bake(g, 'gate', 40, 120);
    }

    /** Heavy switch: a 2-frame strip -- frame 0 up, frame 1 pressed down. */
    switchPlate() {
        const g = this.canvas();
        g.fillStyle(this.shadow, 1);

        g.fillRect(0, 33, 40, 7);        // frame 0 base
        g.fillRect(4, 18, 32, 14);       // frame 0: plate sits proud
        g.fillRect(44, 33, 40, 7);       // frame 1 base
        g.fillRect(48, 26, 32, 7);       // frame 1: plate squashed down

        this.bake(g, 'switch', 80, 40);
        sliceFrames(this.scene, 'switch', 40, 40, 2);
    }

    /** Wax drop: cream, not black, so players read it as a pickup not a wall. */
    waxDrop() {
        const g = this.canvas();
        g.fillStyle(CONFIG.palette.wax, 1);
        g.fillCircle(12, 21, 11);
        g.fillTriangle(12, 0, 3, 18, 21, 18);

        this.bake(g, 'wax', 24, 32);
    }

    /**
     * Checkpoint lantern: a 2-frame strip -- frame 0 unlit, frame 1 lit.
     * Lighting one saves your position AND the wax you had (PRD 4.8).
     */
    lantern() {
        const g = this.canvas();

        // Frame 0 (x 0-40): a dark, empty lantern.
        g.fillStyle(this.shadow, 1);
        g.fillRect(12, 2, 16, 6);        // hanging hook
        g.fillRect(6, 8, 28, 28);        // body
        g.fillStyle(CONFIG.palette.dotOff, 1);
        g.fillRect(11, 13, 18, 18);      // the empty glass

        // Frame 1 (x 40-80): the same lantern with a flame inside.
        g.fillStyle(this.shadow, 1);
        g.fillRect(52, 2, 16, 6);
        g.fillRect(46, 8, 28, 28);
        g.fillStyle(CONFIG.palette.flameOuter, 1);
        g.fillRect(51, 13, 18, 18);
        g.fillStyle(CONFIG.palette.flameCore, 1);
        g.fillCircle(60, 23, 5);

        this.bake(g, 'lantern', 80, 40);
        sliceFrames(this.scene, 'lantern', 40, 40, 2);
    }

    /** The two curtain halves: red velvet with darker vertical folds. */
    curtains() {
        ['curtain_left', 'curtain_right'].forEach((key) => {
            const g = this.canvas();
            g.fillStyle(CONFIG.palette.curtain[0], 1);
            g.fillRect(0, 0, 660, 720);

            // Folds: alternating darker bands give the cloth some depth.
            g.fillStyle(CONFIG.palette.curtain[1], 1);
            for (let x = 0; x < 660; x += 110) {
                g.fillRect(x, 0, 36, 720);
            }

            this.bake(g, key, 660, 720);
        });
    }
}
