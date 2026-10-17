import { CONFIG } from '../config.js';
import { DEPTHS, GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';
import { PaperPanel } from './PaperPanel.js';
import { MenuList } from './MenuList.js';

/**
 * One page of the main menu: a paper card with a heading and a list of
 * choices (the root menu, act select, settings).
 *
 * WHY a page class rather than a scene each: these all sit on the same
 * title screen, over the same curtain and logo, and only one is up at a
 * time. Swapping a card is a fold out and a fold in; swapping a scene
 * would tear down the logo and the music with it.
 *
 * scenes/TitleScene.js owns which page is showing.
 */
export class MenuPage {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} options
     * @param {string} [options.heading] shown above the list
     * @param {{label: string|function, onSelect: function}[]} options.items
     * @param {number} [options.width], [options.height], [options.y]
     * @param {Function} [options.onBack] what the pad's B button does
     */
    constructor(scene, { heading = '', note = '', items, width, height, y, onBack }) {
        const m = CONFIG.title.menu;
        const cardWidth = width ?? m.width;

        this.scene = scene;

        // The title screen sits its cards low, under the logo; the pause
        // menu has the whole stage, so it centres on it.
        const span = (items.length - 1) * CONFIG.ui.menuSpacing;
        const extra = (heading ? m.headingGap : 0) + (note ? m.noteGap : 0);
        const top = -span / 2 + extra / 2;
        const headingY = heading ? top - extra : false;

        this.panel = new PaperPanel(scene, GAME_WIDTH / 2, y ?? m.y,
            cardWidth, height ?? MenuPage.heightFor(items.length, Boolean(heading), Boolean(note)),
            { theatre: true, heading: headingY === false ? false : headingY + CONFIG.ui.ornament.drop });

        // Over the lit paper: the panel would otherwise sit under the glow
        // and the vignette, which draw at DEPTHS.DIM.
        this.panel.container.setDepth(DEPTHS.HUD);

        // The list is centred in the card, shifted down to leave room for
        // a heading. Working it out rather than using a fixed `top` is
        // what stops a long list falling off the bottom.
        if (heading) {
            this.panel.add(scene.add.text(0, headingY, heading, CONFIG.text.heading)
                .setOrigin(0.5));
        }

        // A line of plain text between the heading and the choices --
        // what happened, before what to do about it.
        if (note) {
            this.panel.add(scene.add.text(0, headingY + m.noteGap, note, CONFIG.text.body)
                .setOrigin(0.5));
        }

        // The width goes through so a dial row can place its - and +
        // against the card's edges.
        this.menu = new MenuList(scene, this.panel, top, items, { width: cardWidth });
        this.menu.onBack = onBack;
    }

    /** Tall enough for its own contents, so no page needs a magic number. */
    static heightFor(count, hasHeading, hasNote = false) {
        const m = CONFIG.title.menu;
        const span = (count - 1) * CONFIG.ui.menuSpacing;

        return span + m.padY * 2 + (hasHeading ? m.headingGap : 0) + (hasNote ? m.noteGap : 0);
    }

    open() {
        this.panel.open();

        return this;
    }

    /** Fold away and destroy: a page is never reused once it is closed. */
    close(onDone) {
        this.panel.close(() => {
            // The list has to let go of its keys BEFORE its text objects
            // go, or the next press reaches a destroyed card.
            this.menu.destroy();
            this.panel.container.destroy();
            onDone?.();
        });
    }

    /** Re-read every label, for items whose text shows a setting's value. */
    refresh() {
        this.menu.refresh();
    }
}

/** Where a page sits when it is the only thing on the screen. */
MenuPage.CENTRE_Y = GAME_HEIGHT / 2;
