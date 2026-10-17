import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, TILE_SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';
import { CountdownRing } from '../fx/CountdownRing.js';

/** Frames in the switch strip (ASSETS.md): up, and pressed down. */
const FRAME = { UP: 0, PRESSED: 1 };

/**
 * A heavy floor switch (map symbol `S`). It is pressed only by a Huge
 * puppet standing on it, or by a crate resting on it (PRD 4.4), and while
 * it is pressed the NEAREST gate stays open (PRD 6.4).
 *
 * It is not solid: things stand on the floor beneath it. Every frame it
 * checks whether something heavy enough is resting on its tile, and when
 * that changes it ANNOUNCES SWITCH_PRESSED / SWITCH_RELEASED with its
 * gate's id (CODE_RULES 6.2). The gate does the rest.
 *
 * IT IS A TIMED SWITCH. Taking the weight off does not slam the gate: the
 * plate springs up, a ring of light starts shrinking on it and a tick
 * counts away CONFIG.switchGate.holdSeconds before the gate is let go.
 *
 * WHY: without that there is only one answer -- park the crate on it. The
 * borrowed time makes a second one, which is the better story to watch:
 * stand on the switch as Huge, jump clear, shrink (Huge does not fit
 * through the doorway) and run the gap before the ring empties. Standing
 * back on the plate stops the clock, and the crate stops it for ever.
 *
 * On a press, a thin line of light joins the switch to its gate for a
 * second, so the player sees which gate it opened (PRD 5.1).
 */
export class Switch extends Phaser.GameObjects.Sprite {
    /** @param {number} x, y the CENTRE of the map tile marked `S` */
    constructor(scene, x, y) {
        // The plate sits on the floor of its tile.
        super(scene, x, y + TILE_SIZE / 2, 'switch', FRAME.UP);

        scene.add.existing(this);
        this.setOrigin(0.5, 1).setDepth(DEPTHS.PROPS);

        /** The tile it watches. Anything resting on its floor presses it. */
        this.zone = new Phaser.Geom.Rectangle(x - TILE_SIZE / 2, y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);

        /** Is something standing on the plate RIGHT NOW? */
        this.pressed = false;

        /**
         * Are we holding the gate open? This outlives `pressed` by the
         * borrowed seconds, and is what SWITCH_PRESSED / SWITCH_RELEASED
         * are actually announcing -- so the gate's count can never drift,
         * however often the player hops on and off the plate.
         */
        this.holding = false;
        this.isSwitch = true;

        this.ring = new CountdownRing(scene, x, y - CONFIG.countdownRing.radiusPx);

        /** Set by link(). */
        this.player = null;
        this.heavyThings = [];
        this.gate = null;
        this.linkLine = null;
    }

    /** Called once every object exists: find the gate and the crates. */
    link({ objects, player }) {
        this.player = player;
        this.heavyThings = objects.filter((object) => object.pressesSwitches);
        this.gate = Switch.nearest(this, objects.filter((object) => object.isGate));

        if (this.gate) {
            this.linkLine = this.scene.add.graphics().setDepth(DEPTHS.PROPS).setAlpha(0);
        }
    }

    /** The gate closest to the switch (PRD 6.4: "keep it simple first"). */
    static nearest(from, gates) {
        const distance = (gate) => Phaser.Math.Distance.Between(from.x, from.y, gate.x, gate.y);

        return gates.reduce((best, gate) => (!best || distance(gate) < distance(best) ? gate : best), null);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        const pressed = this.isPressedNow();

        // The plate itself follows the weight exactly: down under it, up
        // the moment it leaves. The GATE is what gets the extra seconds.
        if (pressed !== this.pressed) {
            this.pressed = pressed;
            this.setFrame(pressed ? FRAME.PRESSED : FRAME.UP);
        }

        if (pressed) {
            if (this.ring.running) this.ring.stop();   // weight back on: the clock stops
            if (!this.holding) this.hold();
        } else if (this.holding && !this.ring.running) {
            this.startCountdown();
        }
    }

    /** Take hold of the gate and show which one it is. */
    hold() {
        this.holding = true;
        EventBus.emit(EVENTS.SWITCH_PRESSED, { gateId: this.gate?.id });
        this.flashLink();
    }

    /** Nothing is on the plate: a few borrowed seconds, then let go. */
    startCountdown() {
        this.ring.start(CONFIG.switchGate.holdSeconds * 1000, {
            onTick: () => EventBus.emit(EVENTS.SWITCH_TICK),
            onDone: () => {
                this.holding = false;
                EventBus.emit(EVENTS.SWITCH_RELEASED, { gateId: this.gate?.id });
            }
        });
    }

    /** The ring is a scene object of ours, so it goes when we do. */
    preDestroy() {
        this.ring.destroy();
    }

    /** A Huge puppet standing on it, or any crate resting on it. */
    isPressedNow() {
        const player = this.player;
        const playerOnIt = player?.state.canPressSwitches
            && (player.body.blocked.down || player.body.touching.down)
            && this.isRestingOnMe(player.body);

        return Boolean(playerOnIt) || this.heavyThings.some((thing) => this.isRestingOnMe(thing.body));
    }

    /** Overlapping the tile sideways, with its bottom on the tile's floor. */
    isRestingOnMe(body) {
        const zone = this.zone;
        const tolerance = CONFIG.switchGate.pressTolerancePx;

        return body.right > zone.left + tolerance
            && body.left < zone.right - tolerance
            && Math.abs(body.bottom - zone.bottom) <= tolerance;
    }

    /** The light line from switch to gate, fading over a second. */
    flashLink() {
        if (!this.linkLine) return;

        const { linkMs, linkWidth } = CONFIG.switchGate;
        const gate = this.gate;

        this.linkLine.clear()
            .lineStyle(linkWidth, CONFIG.palette.accent, 1)
            .lineBetween(this.x, this.y - this.displayHeight, gate.x, gate.closedY - gate.displayHeight / 2)
            .setAlpha(1);

        this.scene.tweens.killTweensOf(this.linkLine);
        this.scene.tweens.add({
            targets: this.linkLine,
            alpha: 0,
            duration: linkMs,
            ease: CONFIG.anim.easeOut
        });
    }
}
