import { SYMBOLS } from '../core/constants.js';
import { Door } from '../objects/Door.js';
import { WaxDrop } from '../objects/WaxDrop.js';

/**
 * Map symbol -> how to build that object (Factory pattern, CODE_RULES 6.3).
 *
 * Adding a new kind of object is ONE line here, never another branch in an
 * if/else chain. Symbols with no line yet are simply skipped: they belong
 * to later milestones (crates, switches and gates in M3;
 * moths, drafts and lanterns in M4).
 */
const FACTORIES = {
    [SYMBOLS.DOOR]: (scene, spot) => new Door(scene, spot.x, spot.y),
    [SYMBOLS.WAX]: (scene, spot) => new WaxDrop(scene, spot.x, spot.y)
};

/**
 * Builds the objects LevelLoader found on the map and connects each one to
 * the player.
 *
 * Every object answers the same small question -- onPlayerTouch(player) --
 * so one overlap rule covers them all and the scene never needs to know
 * what a door or a wax drop actually does (CODE_RULES 6.1, interface
 * segregation).
 */
export class ObjectSpawner {
    /**
     * @param {Phaser.Scene} scene
     * @param {object[]} spawns the `spawns` list from LevelLoader.load()
     * @param {Phaser.GameObjects.GameObject} player
     * @returns {object[]} every object created
     */
    static spawnAll(scene, spawns, player) {
        const objects = [];

        spawns.forEach((spot) => {
            const make = FACTORIES[spot.symbol];
            if (!make) return;

            const object = make(scene, spot);

            scene.physics.add.overlap(player, object, () => object.onPlayerTouch(player));
            objects.push(object);
        });

        return objects;
    }
}
