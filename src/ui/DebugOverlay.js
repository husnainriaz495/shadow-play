import { CONFIG } from '../config.js';
import { GAME_WIDTH } from '../core/constants.js';

/**
 * The developer readout: frames per second and the current scene, shown in
 * the top-right corner. F1 turns it on and off (PRD 6.2, milestone M0).
 *
 * WHY it is in ui/ : like the other HUD pieces it only draws what it is
 * given. It does not toggle itself -- UIScene owns the F1 key and announces
 * EVENTS.DEBUG_TOGGLED, which is also how GameScene knows to show the
 * physics bodies. One key press, two independent listeners, no cross-scene
 * method calls (CODE_RULES.md 6.2).
 */
export class DebugOverlay {
    constructor(scene) {
        this.scene = scene;

        this.text = scene.add.text(GAME_WIDTH - 12, 10, '', CONFIG.text.debug)
            .setOrigin(1, 0)
            .setVisible(CONFIG.DEBUG);

        /** Only rebuild the string a few times a second, not every frame. */
        this.nextUpdateAt = 0;
    }

    setVisible(visible) {
        this.text.setVisible(visible);
    }

    get visible() {
        return this.text.visible;
    }

    /**
     * Refresh the readout. Guarded by a timer because building a string 60
     * times a second allocates for no benefit (CODE_RULES.md rule 9).
     */
    update(time) {
        if (!this.text.visible || time < this.nextUpdateAt) return;

        this.nextUpdateAt = time + 250;

        const fps = Math.round(this.scene.game.loop.actualFps);
        this.text.setText(`DEBUG  F1  |  ${fps} fps`);
    }
}
