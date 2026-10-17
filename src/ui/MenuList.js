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
 * An item with an `adjust(direction)` instead of an `onSelect` is a DIAL
 * rather than a button -- a volume, say. It gets a - and a + either side
 * of the row, both clickable, and Left/Right (or A/D, or the pad) turn it
 * either way. Without those a slider could only ever go up and wrap round
 * to nothing, which is no way to turn a sound down.
 *
 * Built for the pause menu, and reused by the title screen, act select
 * and settings -- which is why it knows nothing about pausing. Set
 * `onBack` for what the pad's B button should do.
 */
export class MenuList {
    /**
     * @param {Phaser.Scene} scene
     * @param {PaperPanel} panel the panel to place the items in
     * @param {number} top y of the first item, relative to the panel centre
     * @param {{label: string|function, onSelect?: function,
     *          adjust?: function}[]} items a label may be a function, for
     *        text that changes ("SOUND: ON"); `adjust` makes it a dial
     * @param {object} [options]
     * @param {number} [options.width] the card's width, for placing - and +
     */
    constructor(scene, panel, top, items, { width = 0 } = {}) {
        this.scene = scene;
        this.items = items;
        this.panel = panel;
        this.width = width;
        this.selected = 0;

        // A little hand pointing at whatever is selected (ASSETS.md
        // `pointer_hand`), so keyboard, mouse and pad all show the same
        // thing in the same place.
        this.hand = scene.add.image(0, 0, 'pointer_hand')
            .setOrigin(1, 0.5)
            .setScale(CONFIG.ui.handScale)
            // The art is a near-black silhouette, which disappears on a
            // dark card. setTintFill REPLACES the colour (a plain tint
            // multiplies, so black stays black), giving a solid hand in
            // the same accent as the selected item.
            .setTintFill(CONFIG.palette.accent);
        panel.add(this.hand);

        this.texts = items.map((item, index) => {
            const y = top + index * CONFIG.ui.menuSpacing;
            const text = scene.add.text(0, y, '', CONFIG.text.prompt)
                .setInteractive({ useHandCursor: true });

            // A dial's LABEL is left-aligned on a fixed column and its
            // bar starts on another, so every row lines up down the card
            // whatever the labels are called. An ordinary item is centred.
            if (item.adjust) text.setOrigin(0, 0.5).setX(this.dialLabelX());
            else text.setOrigin(0.5);

            text.on('pointerover', () => this.select(index));
            text.on('pointerdown', () => this.choose(index));
            panel.add(text);

            if (item.adjust) {
                this.addDialBar(index, y);
                this.addDialArrows(index, y);
            } else {
                this.addButtonPlate(index, y, text);
            }

            return text;
        });

        this.bindKeys();
        this.bindPad();
        this.refresh();
        this.select(0);
    }

    /**
     * The plate behind an ordinary choice, so it reads as a BUTTON
     * rather than a line of text, plus the ink underline that draws
     * itself left to right when it is selected (PRD 5.1).
     *
     * A dial has no plate: it is a control, and a plate behind its bar
     * would fight the - and +.
     */
    addButtonPlate(index, y, text) {
        const btn = CONFIG.ui.button;
        const plate = this.scene.add.rectangle(0, y, this.plateWidth(), btn.height,
            CONFIG.palette.buttonRest).setAlpha(btn.restAlpha);

        // Grown with scaleX, not width: tweening a Rectangle's width
        // does not re-anchor it to its origin, so the line crept off the
        // side of the card instead of drawing under the label.
        const underline = this.scene.add.rectangle(0, y + btn.underlineDrop,
            1, btn.underlineThickness, CONFIG.palette.gold)
            .setOrigin(0, 0.5)
            .setAlpha(0);

        // Behind the label, which was added first.
        this.panel.add(plate);
        this.panel.add(underline);
        this.panel.container.sendToBack(plate);

        plate.setInteractive({ useHandCursor: true });
        plate.on('pointerover', () => this.select(index));
        plate.on('pointerdown', () => this.choose(index));

        this.plates = this.plates ?? [];
        this.plates[index] = { plate, underline, text };
    }

    /** A plate is as wide as the card allows, or its default. */
    plateWidth() {
        const btn = CONFIG.ui.button;

        return this.width > 0 ? Math.min(btn.width, this.width - CONFIG.ui.button.radius * 6) : btn.width;
    }

    /** The column a dial's label starts on. */
    dialLabelX() {
        return -this.width / 2 + CONFIG.ui.dialLabelX;
    }

    /** The column every dial's bar starts on, so they are all parallel. */
    dialBarX() {
        return -this.width / 2 + CONFIG.ui.dialBarX;
    }

    /**
     * The bar itself, drawn as NOTCHES rather than written as "||||....".
     * The theatre font is proportional, so a bar made of characters is a
     * different width for every value and no two rows ever line up.
     * Rectangles are identical by construction.
     */
    addDialBar(index, y) {
        const d = CONFIG.ui;
        const notches = [];

        for (let i = 0; i < CONFIG.audio.maxLevel; i++) {
            const notch = this.scene.add.rectangle(
                this.dialBarX() + i * (d.notchWidth + d.notchGap), y,
                d.notchWidth, d.notchHeight, CONFIG.palette.gold).setOrigin(0, 0.5);

            this.panel.add(notch);
            notches.push(notch);
        }

        this.bars = this.bars ?? [];
        this.bars[index] = notches;
    }

    /**
     * The - and + for a dial, sitting together at the right-hand end of
     * the row rather than one at each edge: a pair of buttons reads as a
     * control, while one on either side reads as decoration. They are
     * real, clickable targets, so a player using only the mouse can turn
     * a volume DOWN as well as up.
     */
    addDialArrows(index, y) {
        const d = CONFIG.ui;
        const plusX = this.width / 2 - d.dialInset;

        [[plusX - d.dialArrowGap, '−', -1], [plusX, '+', 1]].forEach(([x, glyph, direction]) => {
            const arrow = this.scene.add.text(x, y, glyph, CONFIG.text.prompt)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            arrow.on('pointerover', () => this.select(index));
            arrow.on('pointerdown', () => this.turn(index, direction));
            this.panel.add(arrow);
        });
    }

    /** Turn a dial, then redraw its label so the change is visible. */
    turn(index, direction) {
        const item = this.items[index];
        if (!item.adjust) return;

        this.select(index);
        item.adjust(direction);
        this.refresh();
    }

    /**
     * A gamepad drives the menu exactly like the keyboard: the stick or
     * d-pad moves, A chooses, B goes back. Phaser only reports a pad once
     * the player touches it, so this listens for the pad arriving too.
     *
     * Held directions are ignored until released (`padWasIdle`), or one
     * nudge of the stick runs the whole list.
     */
    bindPad() {
        this.padWasIdle = true;
        this.scene.events.on('update', this.readPad, this);
        this.scene.events.once('shutdown', () => this.destroy());
    }

    readPad() {
        const pad = this.scene.input.gamepad?.getPad(0);
        if (!pad) return;

        const { x, y } = pad.leftStick;
        const deadzone = CONFIG.ui.padDeadzone;
        const down = pad.down || y > deadzone;
        const up = pad.up || y < -deadzone;
        const right = pad.right || x > deadzone;
        const left = pad.left || x < -deadzone;

        if (!down && !up && !left && !right && !pad.A && !pad.B) {
            this.padWasIdle = true;
            return;
        }

        if (!this.padWasIdle) return;
        this.padWasIdle = false;

        if (down) this.move(1);
        else if (up) this.move(-1);
        else if (left) this.turn(this.selected, -1);
        else if (right) this.turn(this.selected, 1);
        else if (pad.A) this.choose(this.selected);
        else if (pad.B) this.onBack?.();
    }

    /**
     * Keys are remembered so they can be UNBOUND again. A scene that
     * swaps cards (the menu, the pause menu) would otherwise leave a live
     * listener behind for every page ever opened: one press would then
     * move several invisible cursors at once, and the ones belonging to
     * destroyed cards throw as they try to redraw themselves.
     */
    bindKeys() {
        const keyboard = this.scene.input.keyboard;

        this.keyHandlers = [
            [['UP', 'W'], () => this.move(-1)],
            [['DOWN', 'S'], () => this.move(1)],
            [['ENTER', 'SPACE'], () => this.choose(this.selected)],
            [['LEFT', 'A'], () => this.turn(this.selected, -1)],
            [['RIGHT', 'D'], () => this.turn(this.selected, 1)]
        ].flatMap(([keys, handler]) => keys.map((key) => {
            keyboard.on(`keydown-${key}`, handler);

            return [`keydown-${key}`, handler];
        }));
    }

    /**
     * Let go of everything this list listens to. Called when its card
     * folds away (ui/MenuPage.js) and again on the scene's shutdown,
     * which is harmless: removing a handler twice is a no-op.
     */
    destroy() {
        this.keyHandlers?.forEach(([event, handler]) => {
            this.scene.input.keyboard?.off(event, handler);
        });
        this.keyHandlers = null;

        this.scene.events.off('update', this.readPad, this);
        this.scene.tweens.killTweensOf([this.hand, ...this.texts]);
        (this.plates ?? []).forEach((parts) => {
            if (parts) this.scene.tweens.killTweensOf([parts.plate, parts.underline]);
        });
        (this.bars ?? []).forEach((notches) => {
            if (notches) this.scene.tweens.killTweensOf(notches);
        });
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

        this.lightPlates(index);
        this.moveHand(this.texts[index]);
    }

    /** The selected button's plate lights and its underline draws in. */
    lightPlates(index) {
        const btn = CONFIG.ui.button;

        (this.plates ?? []).forEach((parts, i) => {
            if (!parts) return;

            const active = i === index;

            this.scene.tweens.killTweensOf([parts.plate, parts.underline]);
            parts.plate.setFillStyle(active ? CONFIG.palette.buttonSelected : CONFIG.palette.buttonRest);
            this.scene.tweens.add({
                targets: parts.plate,
                alpha: active ? btn.selectedAlpha : btn.restAlpha,
                duration: CONFIG.ui.hoverMs,
                ease: CONFIG.anim.easeInSoft
            });
            if (!active) {
                parts.underline.setAlpha(0);
                return;
            }

            // Sized to the label and drawn in from its left edge.
            const width = parts.text.displayWidth;

            parts.underline.setSize(width, btn.underlineThickness);
            parts.underline.setX(-width / 2);
            parts.underline.setScale(0, 1).setAlpha(1);
            this.scene.tweens.add({
                targets: parts.underline,
                scaleX: 1,
                duration: btn.underlineMs,
                ease: CONFIG.anim.easeInSoft
            });
        });
    }

    /**
     * Slide the hand to the item, rather than snapping it there. It aims
     * at the text's LEFT edge, worked out from its origin, because a
     * dial's row is right-aligned and an ordinary one is centred.
     */
    moveHand(text) {
        const x = text.x - text.displayWidth * text.originX - CONFIG.ui.handGap;

        this.scene.tweens.killTweensOf(this.hand);
        this.scene.tweens.add({
            targets: this.hand,
            x,
            y: text.y,
            duration: CONFIG.ui.hoverMs,
            ease: CONFIG.anim.easeInSoft
        });
    }

    /** Enter, Space or a click. On a dial that means "turn it up one". */
    choose(index) {
        const item = this.items[index];

        this.select(index);
        this.pressFeedback(index);

        if (item.onSelect) item.onSelect();
        else this.turn(index, 1);
    }

    /** A quick squash and back, so a press is felt (PRD 5.1). */
    pressFeedback(index) {
        const btn = CONFIG.ui.button;
        const text = this.texts[index];

        this.scene.tweens.killTweensOf(text);
        this.scene.tweens.add({
            targets: text,
            scale: btn.pressScale,
            duration: btn.pressMs,
            ease: CONFIG.anim.easeOut,
            yoyo: true
        });
    }

    /** Re-read every label and bar, for rows that show a setting. */
    refresh() {
        this.texts.forEach((text, i) => {
            const { label } = this.items[i];

            text.setText(typeof label === 'function' ? label() : label);
        });

        (this.bars ?? []).forEach((notches, i) => {
            if (!notches) return;

            const filled = this.items[i].level?.() ?? 0;

            notches.forEach((notch, n) => {
                notch.setFillStyle(n < filled ? CONFIG.palette.gold : CONFIG.palette.dotOff);
                notch.setAlpha(n < filled ? 1 : CONFIG.ui.notchEmptyAlpha);
            });
        });
    }
}
