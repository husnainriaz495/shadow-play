import { CONFIG } from '../config.js';
import { DEPTHS, GAME_WIDTH } from '../core/constants.js';
import { PaperPanel } from './PaperPanel.js';
import { MenuList } from './MenuList.js';

/**
 * A page of reading with one way out: How to Play, and the credits.
 *
 * It is the same paper card as ui/MenuPage.js, but its body is text
 * rather than choices, so there is nothing to move between -- only BACK.
 * Keeping it separate means neither class has to ask "am I a list or a
 * page?" every time it draws (CODE_RULES.md rule 2).
 */
export class TextPage {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} options
     * @param {string} options.heading
     * @param {(string|string[])[]} options.lines the body, one entry per
     *        line. A plain string runs the width of the card; a pair
     *        ['R', 'start the act again'] is a two-column row.
     * @param {Function} options.onBack
     */
    constructor(scene, { heading, lines, onBack }) {
        const t = CONFIG.title.textPage;

        this.scene = scene;

        // Everything is measured from the card's own height rather than
        // from fixed offsets: a page with more lines grows downwards from
        // its heading, and BACK always lands inside the card instead of
        // under it.
        const height = t.padY * 2 + t.headingBlock + lines.length * t.lineGap + t.backGap;
        const top = -height / 2;
        const headingY = top + t.padY + t.headingBlock / 2;
        const linesY = headingY + t.headingBlock / 2 + t.lineGap;

        this.panel = new PaperPanel(scene, GAME_WIDTH / 2, t.y, t.width, height,
            { theatre: true, heading: headingY + CONFIG.ui.ornament.drop });
        this.panel.container.setDepth(DEPTHS.HUD);

        this.panel.add(scene.add.text(0, headingY, heading, CONFIG.text.heading).setOrigin(0.5));

        // One text object per column, each left-aligned on a fixed x.
        //
        // WHY a second text object instead of padding the string with
        // spaces: the theatre font is PROPORTIONAL, so a space is not the
        // width of a letter and no amount of padding lines anything up --
        // "walk", "jump" and "pause" all landed in different places. The
        // same trap as the settings bars (NOTES gotchas).
        const left = -t.width / 2 + t.padX;

        lines.forEach((line, index) => {
            const y = linesY + index * t.lineGap;
            const [first, second] = Array.isArray(line) ? line : [line, null];

            this.panel.add(scene.add.text(left, y, first, CONFIG.text.body).setOrigin(0, 0.5));

            if (second) {
                this.panel.add(scene.add.text(left + t.columnX, y, second, CONFIG.text.body)
                    .setOrigin(0, 0.5));
            }
        });

        const backY = linesY + lines.length * t.lineGap + t.backGap / 2;

        this.menu = new MenuList(scene, this.panel, backY, [{ label: 'BACK', onSelect: onBack }]);
        this.menu.onBack = onBack;
    }

    open() {
        this.panel.open();

        return this;
    }

    close(onDone) {
        this.panel.close(() => {
            // The list has to let go of its keys BEFORE its text objects
            // go, or the next press reaches a destroyed card.
            this.menu.destroy();
            this.panel.container.destroy();
            onDone?.();
        });
    }
}
