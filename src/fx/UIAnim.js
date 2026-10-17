import { CONFIG } from '../config.js';

/**
 * Reusable UI animations (PRD 5.1, `src/fx/` in CODE_RULES.md section 3).
 *
 * So far: the ink-written text reveal used by the act cards and the
 * ending's last words -- letters appear one at a time, the way a nib writes
 * them, instead of a whole line popping in.
 *
 * WHY a class and not a tween: Phaser can tween numbers, not strings. This
 * is a timer that re-cuts the same string, which costs one timed event and
 * no new objects per frame (CODE_RULES.md rule 9).
 */
export class InkText {
    /**
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Text} label the (empty) text object to fill
     * @param {string} full what it will say once it is written
     * @param {Function} [onDone] called when the last letter lands
     */
    constructor(scene, label, full, onDone) {
        this.scene = scene;
        this.label = label;
        this.full = full;
        this.onDone = onDone;
        this.written = 0;

        label.setText('');

        this.timer = scene.time.addEvent({
            delay: 1000 / CONFIG.anim.textCps,
            repeat: full.length - 1,
            callback: () => this.writeOne()
        });
    }

    writeOne() {
        this.written += 1;
        this.label.setText(this.full.slice(0, this.written));

        if (this.written >= this.full.length) this.done();
    }

    /** Space was pressed: show the whole line now (PRD 5.1 "skippable"). */
    finish() {
        if (!this.timer) return false;   // already written

        this.written = this.full.length;
        this.label.setText(this.full);
        this.done();
        return true;
    }

    done() {
        this.timer?.remove();
        this.timer = null;
        this.onDone?.();
    }
}
