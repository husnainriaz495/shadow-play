import { EventBus } from './EventBus.js';

/**
 * Keeps track of EventBus listeners for one scene and removes them all
 * when that scene shuts down.
 *
 * WHY: CODE_RULES.md 6.2 and 9 -- the EventBus outlives scenes, so a
 * listener added in GameScene.create() is STILL there after a restart, and
 * the new scene adds a second copy. Then every event fires twice and the
 * player takes double damage. This class makes "add + auto-remove" one step
 * so nobody can forget the cleanup.
 *
 * Usage inside a scene:
 *     this.listeners = new Listeners(this);
 *     this.listeners.on(EVENTS.WAX_OUT, this.onWaxOut, this);
 */
export class Listeners {
    /** @param {Phaser.Scene} scene the scene whose lifetime we follow */
    constructor(scene) {
        this.registered = [];

        // 'shutdown' fires on restart AND on scene change, so it covers both.
        scene.events.once('shutdown', () => this.removeAll());
    }

    /** Listen to an EventBus event; it will be removed automatically. */
    on(event, handler, context) {
        EventBus.on(event, handler, context);
        this.registered.push({ event, handler, context });
        return this;
    }

    /** Listen once. Still tracked, in case the scene dies before it fires. */
    once(event, handler, context) {
        EventBus.once(event, handler, context);
        this.registered.push({ event, handler, context });
        return this;
    }

    /** Remove every listener this scene registered. */
    removeAll() {
        this.registered.forEach(({ event, handler, context }) => {
            EventBus.off(event, handler, context);
        });
        this.registered.length = 0;
    }
}
