import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, TILE_SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';
import { EventBus } from '../core/EventBus.js';

/**
 * A portcullis gate (map symbol `G`): solid until its switch is pressed
 * (PRD 4.4). The `G` marks the gate's BOTTOM tile; it is 3 tiles tall.
 *
 * It never looks at switches. A Switch ANNOUNCES SWITCH_PRESSED with this
 * gate's id and the gate listens (CODE_RULES 6.2). While at least one of
 * its switches is held down it stays open.
 *
 * WHY it waits before closing: dropping a solid gate onto the puppet or a
 * crate would trap them inside it. So a released switch only closes the
 * gate once its doorway is empty.
 *
 * It is drawn just BEHIND the walls, so when it rises it slides up into
 * the stonework above the doorway instead of floating over it.
 */
export class Gate extends Phaser.Physics.Arcade.Image {
    /**
     * @param {number} x, y the CENTRE of the map tile marked `G`
     * @param {string} id which gate this is, so switches can name it
     */
    constructor(scene, x, y, id) {
        // Stands ON the floor of its tile, reaching up three tiles.
        super(scene, x, y + TILE_SIZE / 2, 'gate');

        scene.add.existing(this);
        scene.physics.add.existing(this, true);   // static: the body never moves

        this.setOrigin(0.5, 1).setDepth(DEPTHS.TILES - 1);
        this.refreshBody();

        this.id = id;
        this.closedY = this.y;

        /** How many switches are holding it open right now. */
        this.heldBy = 0;
        this.isOpen = false;
        this.tween = null;

        /** Read by ObjectSpawner and SizeChanger (see Crate for the same flags). */
        this.isSolid = true;
        this.isGate = true;
        this.blocksGrowth = true;

        /** Things that must be out of the doorway before it closes. Set by link(). */
        this.blockers = [];
    }

    /** Called once every object exists (ObjectSpawner). */
    link({ objects, player, listeners }) {
        this.blockers = [player, ...objects.filter((object) => object.isMovable)];

        listeners
            .on(EVENTS.SWITCH_PRESSED, ({ gateId }) => { if (gateId === this.id) this.heldBy++; }, this)
            .on(EVENTS.SWITCH_RELEASED, ({ gateId }) => { if (gateId === this.id) this.heldBy--; }, this);
    }

    preUpdate() {
        const wantOpen = this.heldBy > 0;

        if (wantOpen && !this.isOpen) this.open();
        if (!wantOpen && this.isOpen && !this.isDoorwayBusy()) this.close();
    }

    /** Is the puppet or a crate standing where the closed gate would be? */
    isDoorwayBusy() {
        const door = this.body;

        return this.blockers.some(({ body }) => body
            && body.right > door.left && body.left < door.right
            && body.bottom > door.top && body.top < door.bottom);
    }

    /** Rise into the wall with a short shake (PRD 5.1). */
    open() {
        const { openMs, stubPx, shakeMs, shakeIntensity } = CONFIG.switchGate;

        this.isOpen = true;
        this.body.enable = false;   // passable at once; the picture catches up
        this.slideTo(this.closedY - (this.displayHeight - stubPx), openMs, CONFIG.anim.easeInSoft);
        this.scene.cameras.main.shake(shakeMs, shakeIntensity);

        EventBus.emit(EVENTS.GATE_OPENED);
    }

    /** Drop back down. Solid again at once, so nothing can slip through. */
    close() {
        this.isOpen = false;
        this.body.enable = true;
        this.slideTo(this.closedY, CONFIG.switchGate.closeMs, CONFIG.anim.easeOut);

        EventBus.emit(EVENTS.GATE_CLOSED);
    }

    /** Only the picture moves; the static body stays where the doorway is. */
    slideTo(y, duration, ease) {
        this.tween?.stop();
        this.tween = this.scene.tweens.add({ targets: this, y, duration, ease });
    }
}
