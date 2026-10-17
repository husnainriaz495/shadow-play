import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';

/**
 * A coloured dot on each of the puppet's four joints, drawn only while
 * DEBUG is on (F1).
 *
 * WHY it exists (ASSETS.md, PRD 4.2.1): the mount points in
 * CONFIG.rig.mounts are pixel positions in the body artwork, and no one can
 * guess them correctly from a drawing. The workflow is: run the game, press
 * F1, and nudge each mount until its dot sits exactly on the shoulder or
 * hip. Different colours mean you always know which number to change.
 *
 * Its own file because it is a development tool, not part of the puppet --
 * it can be deleted entirely and the game would look identical.
 */
export class RigDebugDots {
    /** Which mount each dot belongs to, and the colour that identifies it. */
    static LEGEND = [
        { part: 'nearArm', mount: 'shoulderRight', colour: 0xff4444, name: 'shoulderRight (red)' },
        { part: 'farArm', mount: 'shoulderLeft', colour: 0xff9944, name: 'shoulderLeft (orange)' },
        { part: 'nearLeg', mount: 'hipRight', colour: 0x44ff88, name: 'hipRight (green)' },
        { part: 'farLeg', mount: 'hipLeft', colour: 0x44ccff, name: 'hipLeft (blue)' }
    ];

    constructor(scene, rig) {
        this.rig = rig;
        this.graphics = scene.add.graphics()
            .setDepth(DEPTHS.PLAYER + 1)
            .setVisible(false);
    }

    setVisible(visible) {
        this.graphics.setVisible(visible).clear();

        if (visible) {
            console.info(
                '[Shadow Play] Joint dots on. Nudge CONFIG.rig.mounts until each dot sits on its ' +
                'joint: ' + RigDebugDots.LEGEND.map((d) => d.name).join(', ') + '.'
            );
        }
    }

    /** Redraw the dots at wherever the joints have swung to this frame. */
    draw() {
        if (!this.graphics.visible) return;

        const { container, parts, facing } = this.rig;
        const scale = this.rig.displayScale;

        this.graphics.clear();

        RigDebugDots.LEGEND.forEach(({ part, colour }) => {
            const sprite = parts[part];

            this.graphics.fillStyle(colour, 1);
            this.graphics.fillCircle(
                container.x + sprite.x * facing * scale,
                container.y + sprite.y * scale,
                4
            );
        });

        // A cross on the feet, so footOffsetY can be checked at a glance.
        this.graphics.lineStyle(1, CONFIG.palette.flameCore, 0.9);
        this.graphics.lineBetween(container.x - 10, container.y, container.x + 10, container.y);
    }

    destroy() {
        this.graphics.destroy();
    }
}
