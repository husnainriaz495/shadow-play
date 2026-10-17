import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SIZE } from '../core/constants.js';
import { clamp } from '../core/helpers.js';

/**
 * Turns key presses into the questions movement actually asks: which way,
 * jump just pressed, jump held, down held, which size.
 *
 * WHY it is separate from Player: reading keys and moving a body are two
 * different jobs (CODE_RULES.md rule 2). It is also the seed of the
 * remappable controls in PRD 7.1 -- bindings come from CONFIG.controls, so
 * a saved custom mapping only ever has to change this file. Gamepad input
 * (M3) slots in here too, without Player changing at all.
 */
export class PlayerInput {
    constructor(scene) {
        const bind = (names) => names.map((name) => scene.input.keyboard.addKey(name));

        this.keys = {
            left: bind(CONFIG.controls.left),
            right: bind(CONFIG.controls.right),
            jump: bind(CONFIG.controls.jump),
            down: bind(CONFIG.controls.down),
            grow: bind(CONFIG.controls.grow),
            shrink: bind(CONFIG.controls.shrink),
            sizeTiny: bind(CONFIG.controls.sizeTiny),
            sizeNormal: bind(CONFIG.controls.sizeNormal),
            sizeHuge: bind(CONFIG.controls.sizeHuge)
        };

        /**
         * False once the candle is out (or, later, during cutscenes): every
         * question below then answers "nothing pressed".
         */
        this.enabled = true;

        this.listenToWheel(scene);
    }

    /**
     * The mouse wheel moves the candle: up brings it closer (grow), down
     * moves it away (shrink) (PRD 4.6).
     *
     * One flick of a wheel -- and especially a trackpad -- fires a burst of
     * events, so after each step the wheel is ignored for a moment;
     * otherwise one flick would jump straight from Tiny to Huge.
     * The scene's input plugin drops this listener on shutdown by itself.
     */
    listenToWheel(scene) {
        this.wheelStep = 0;
        this.wheelReadyAt = 0;

        scene.input.on('wheel', (_pointer, _over, _dx, dy) => {
            const now = scene.time.now;

            if (dy === 0 || now < this.wheelReadyAt) return;

            this.wheelStep = dy < 0 ? 1 : -1;
            this.wheelReadyAt = now + CONFIG.controls.wheelCooldownMs;
        });
    }

    static anyDown(keys) {
        return keys.some((key) => key.isDown);
    }

    /**
     * True if ANY of these keys went down this frame. Every key is read
     * (map, not some): JustDown "uses up" a press, and a key left unread
     * would fire a frame late.
     */
    static anyJustDown(keys) {
        return keys.map((key) => Phaser.Input.Keyboard.JustDown(key)).some(Boolean);
    }

    /** -1 left, 1 right, 0 for neither or both. */
    get direction() {
        if (!this.enabled) return 0;

        const left = PlayerInput.anyDown(this.keys.left);
        const right = PlayerInput.anyDown(this.keys.right);

        return (right ? 1 : 0) - (left ? 1 : 0);
    }

    /**
     * True only on the frame a jump key goes down. Phaser's JustDown
     * "uses up" the press, so read this ONCE per frame.
     */
    get jumpPressed() {
        return PlayerInput.anyJustDown(this.keys.jump) && this.enabled;
    }

    get jumpHeld() {
        return this.enabled && PlayerInput.anyDown(this.keys.jump);
    }

    get downHeld() {
        return this.enabled && PlayerInput.anyDown(this.keys.down);
    }

    /**
     * The size the player asked for this frame, or null for no request.
     * 1/2/3 pick a size directly; Q/E and the wheel step from the current
     * one. Read ONCE per frame, like jumpPressed.
     *
     * @param {number} current the size index the player is now
     */
    sizeRequest(current) {
        // Read every group first, so no press is left unread (see anyJustDown).
        const direct = [
            PlayerInput.anyJustDown(this.keys.sizeTiny) ? SIZE.TINY : null,
            PlayerInput.anyJustDown(this.keys.sizeNormal) ? SIZE.NORMAL : null,
            PlayerInput.anyJustDown(this.keys.sizeHuge) ? SIZE.HUGE : null
        ].find((index) => index !== null);

        const step = (PlayerInput.anyJustDown(this.keys.grow) ? 1 : 0)
            - (PlayerInput.anyJustDown(this.keys.shrink) ? 1 : 0)
            + this.wheelStep;

        this.wheelStep = 0;

        if (!this.enabled) return null;
        if (direct !== undefined) return direct;
        if (step === 0) return null;

        return clamp(current + Math.sign(step), SIZE.TINY, SIZE.HUGE);
    }
}
