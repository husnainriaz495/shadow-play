import { CONFIG } from '../config.js';
import { DEPTHS, GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';
import { toCssColor } from '../core/helpers.js';

/**
 * The credits, scrolling up the shut curtain like a theatre programme
 * (PRD 5.1 "Ending"): a column of names that rises from below the stage
 * and climbs off the top, then hands back to the menu.
 *
 * WHY a programme rather than a list: this is the last thing anyone sees
 * of the show, so it is laid out the way the paper one in your hand
 * would be -- the title, then roles in small capitals with the names
 * under them.
 *
 * It only draws and moves. scenes/EndScene.js decides when it runs and
 * what happens after.
 */
export class CreditsScroll {
    /**
     * @param {Phaser.Scene} scene
     * @param {{role?: string, name?: string, gap?: boolean}[]} entries
     */
    constructor(scene, entries) {
        const c = CONFIG.ending.credits;

        this.scene = scene;
        this.tween = null;

        // One container holding the whole column, so the scroll is a
        // single tween rather than one per line (CODE_RULES.md rule 9).
        this.column = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT + c.startBelow)
            .setDepth(DEPTHS.CURTAIN + 2);

        let y = 0;

        entries.forEach((entry) => {
            if (entry.gap) {
                y += c.gapHeight;
                return;
            }

            if (entry.role) {
                // Gold, not muted: the muted grey-teal is for text on the
                // dark stage and it sinks into red velvet. Gold matches
                // the curtain's own trim and keeps roles under names in
                // the hierarchy a programme wants.
                this.column.add(scene.add.text(0, y, entry.role, CONFIG.text.muted)
                    .setOrigin(0.5)
                    .setColor(toCssColor(CONFIG.palette.gold)));
                y += c.roleGap;
            }

            if (entry.name) {
                this.column.add(scene.add.text(0, y, entry.name, CONFIG.text.prompt).setOrigin(0.5));
                y += c.nameGap;
            }
        });

        /** How far the column must travel to clear the top of the stage. */
        this.endY = -(y + c.endAbove);
    }

    /**
     * Rise slowly and evenly -- a programme does not ease. The duration
     * follows the LENGTH of the column, so adding a name makes the scroll
     * longer rather than faster.
     *
     * @param {Function} [onDone] called when the last line is off the top
     */
    roll(onDone) {
        const c = CONFIG.ending.credits;
        const distance = this.column.y - this.endY;

        this.onDone = onDone;
        this.tween = this.scene.tweens.add({
            targets: this.column,
            y: this.endY,
            duration: (distance / c.speed) * 1000,
            ease: 'Linear',
            onComplete: () => this.onDone?.()
        });
    }

    /** Space: run it to the end now. */
    finish() {
        if (!this.tween) return;

        this.tween.stop();
        this.tween = null;
        this.column.setY(this.endY);
        this.onDone?.();
    }
}
