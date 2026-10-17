import { CONFIG } from '../config.js';
import { toCssColor } from '../core/helpers.js';

/**
 * A vertical list of menu items that works the same with keyboard and
 * mouse (PRD 5.1: "keyboard/gamepad focus looks the same as mouse hover").
 *
 * Up/Down (or W/S) moves, Enter or Space chooses; hovering selects and
 * clicking chooses. The selected item turns the accent colour and grows a
 * little (PALETTE.md: "selected menu item: accent").
 *
 * Built for the pause menu, and reused later by the title screen, act
 * select and settings -- which is why it knows nothing about pausing.
 */
export class MenuList {
    /**
     * @param {Phaser.Scene} scene
     * @param {PaperPanel} panel the panel to place the items in
     * @param {number} top y of the first item, relative to the panel centre
     * @param {{label: string|function, onSelect: function}[]} items
     *        a label may be a function, for text that changes ("SOUND: ON")
     */
    constructor(scene, panel, top, items) {
        this.scene = scene;
        this.items = items;
        this.selected = 0;

        this.texts = items.map((item, index) => {
            const text = scene.add.text(0, top + index * CONFIG.ui.menuSpacing, '', CONFIG.text.prompt)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            text.on('pointerover', () => this.select(index));
            text.on('pointerdown', () => this.choose(index));
            panel.add(text);

            return text;
        });

        this.bindKeys();
        this.refresh();
        this.select(0);
    }

    bindKeys() {
        const keyboard = this.scene.input.keyboard;

        ['UP', 'W'].forEach((key) => keyboard.on(`keydown-${key}`, () => this.move(-1)));
        ['DOWN', 'S'].forEach((key) => keyboard.on(`keydown-${key}`, () => this.move(1)));
        ['ENTER', 'SPACE'].forEach((key) => keyboard.on(`keydown-${key}`, () => this.choose(this.selected)));
    }

    /** Step up or down, wrapping round at the ends. */
    move(step) {
        const count = this.items.length;
        this.select((this.selected + step + count) % count);
    }

    /** Highlight one item and dim the rest. */
    select(index) {
        this.selected = index;

        this.texts.forEach((text, i) => {
            const active = i === index;

            text.setColor(toCssColor(active ? CONFIG.palette.accent : CONFIG.palette.title));
            this.scene.tweens.add({
                targets: text,
                scale: active ? CONFIG.ui.hoverScale : 1,
                duration: CONFIG.ui.hoverMs,
                ease: CONFIG.anim.easeInSoft
            });
        });
    }

    choose(index) {
        this.select(index);
        this.items[index].onSelect();
    }

    /** Re-read every label, for items whose text depends on a setting. */
    refresh() {
        this.texts.forEach((text, i) => {
            const { label } = this.items[i];
            text.setText(typeof label === 'function' ? label() : label);
        });
    }
}
