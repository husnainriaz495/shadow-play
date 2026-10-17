import { CONFIG } from '../config.js';
import { SaveProgress } from '../systems/SaveProgress.js';
import { AudioManager } from '../systems/AudioManager.js';
import { MenuPage } from './MenuPage.js';

/**
 * The settings card: three volume dials and "reduce motion".
 *
 * WHY it is its own class rather than a method on the title screen: the
 * pause menu needs exactly the same page. Somebody turning the music
 * down mid-act should not have to quit to the menu to do it, and two
 * copies of these rows would drift apart the first time one changed
 * (CODE_RULES.md rule 4).
 *
 * Every change is saved the moment it is made -- there is no "apply" --
 * and the music that is playing right now follows the dial, so the
 * change is heard while the dial is still under the hand.
 */
export class SettingsPage extends MenuPage {
    /**
     * @param {Phaser.Scene} scene
     * @param {{onBack: function}} options
     */
    constructor(scene, { onBack, y }) {
        // `page` is filled in straight after super(). The rows need a way
        // to repaint themselves and cannot reach `this` before then.
        let page = null;
        const redraw = () => page?.refresh();

        super(scene, {
            heading: 'SETTINGS',
            width: CONFIG.title.menu.wideWidth,
            items: [...SettingsPage.rows(redraw), { label: 'BACK', onSelect: onBack }],
            y,
            onBack
        });

        page = this;
    }

    /**
     * The rows themselves. `redraw` is called after every change so the
     * bars repaint; it is passed in because the page does not exist yet
     * when this runs.
     */
    static rows(redraw) {
        // The label is just the name now: the bar beside it is drawn as
        // notches by the list, so every row lines up on the same columns.
        const dial = (name) => ({
            label: name.toUpperCase(),
            level: () => SaveProgress.getSettings()[name],
            adjust: (direction) => {
                SettingsPage.turn(name, direction);
                redraw();
            }
        });

        return [
            dial('master'),
            dial('music'),
            dial('sfx'),
            {
                label: () => `REDUCE MOTION: ${SaveProgress.getSettings().reduceMotion ? 'ON' : 'OFF'}`,
                onSelect: () => {
                    SaveProgress.setSetting('reduceMotion', !SaveProgress.getSettings().reduceMotion);
                    redraw();
                }
            }
        ];
    }

    /**
     * Turn one dial. It CLAMPS at each end rather than wrapping: a volume
     * that jumps from silent back to full when you press once more is the
     * bug this replaced.
     */
    static turn(name, direction) {
        const current = SaveProgress.getSettings()[name];
        const next = Math.max(0, Math.min(CONFIG.audio.maxLevel, current + direction));

        if (next === current) return;

        SaveProgress.setSetting(name, next);
        AudioManager.refreshMusicVolume();
    }
}
