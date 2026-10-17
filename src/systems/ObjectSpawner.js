import { SYMBOLS } from '../core/constants.js';
import { Door } from '../objects/Door.js';
import { WaxDrop } from '../objects/WaxDrop.js';
import { Crate } from '../objects/Crate.js';
import { Switch } from '../objects/Switch.js';
import { Gate } from '../objects/Gate.js';
import { Hint } from '../objects/Hint.js';
import { Moth } from '../objects/Moth.js';
import { Shelter } from '../objects/Shelter.js';
import { Lantern } from '../objects/Lantern.js';

/**
 * Map symbol -> how to build that object (Factory pattern, CODE_RULES 6.3).
 *
 * Adding a new kind of object is ONE line here, never another branch in an
 * if/else chain. Every symbol in PRD 4.4 now has a line here.
 */
const FACTORIES = {
    [SYMBOLS.DOOR]: (scene, spot) => new Door(scene, spot.x, spot.y),
    [SYMBOLS.WAX]: (scene, spot) => new WaxDrop(scene, spot.x, spot.y),
    [SYMBOLS.CRATE]: (scene, spot) => new Crate(scene, spot.x, spot.y),
    [SYMBOLS.SWITCH]: (scene, spot) => new Switch(scene, spot.x, spot.y),
    [SYMBOLS.GATE]: (scene, spot) => new Gate(scene, spot.x, spot.y, `${spot.col},${spot.row}`),
    [SYMBOLS.HINT]: (scene, spot) => new Hint(scene, spot.x, spot.y, spot.text),
    [SYMBOLS.MOTH]: (scene, spot) => new Moth(scene, spot.x, spot.y),
    [SYMBOLS.SHELTER]: (scene, spot) => new Shelter(scene, spot.x, spot.y),
    [SYMBOLS.CHECKPOINT]: (scene, spot) => new Lantern(scene, spot.x, spot.y),
    [SYMBOLS.LANTERN]: (scene, spot) => new Lantern(scene, spot.x, spot.y, { checkpoint: false })
};

/**
 * Builds the objects LevelLoader found on the map and connects each one to
 * the player and the stage.
 *
 * Objects describe themselves with a few small flags instead of the
 * spawner knowing every class (CODE_RULES 6.1, interface segregation):
 *  - `onPlayerTouch(player)`: called when the player overlaps it (door, wax)
 *  - `isSolid`: the player collides with it instead (crate, gate)
 *  - `isMovable`: it moves, so it collides with the tiles and with every
 *    solid object (crate)
 *  - `link({ objects, player, listeners })`: called once everything exists,
 *    for objects that need to find each other (a switch finds its gate)
 */
export class ObjectSpawner {
    /**
     * @param {Phaser.Scene} scene
     * @param {object[]} spawns the `spawns` list from LevelLoader.load()
     * @param {Phaser.GameObjects.GameObject} player
     * @param {Phaser.Tilemaps.TilemapLayer} layer the act's tiles
     * @param {import('../core/Listeners.js').Listeners} listeners the scene's
     * @returns {object[]} every object created
     */
    static spawnAll(scene, spawns, player, layer, listeners) {
        const objects = spawns
            .filter((spot) => FACTORIES[spot.symbol])
            .map((spot) => FACTORIES[spot.symbol](scene, spot));

        const solids = objects.filter((object) => object.isSolid);
        const movers = objects.filter((object) => object.isMovable);

        objects.forEach((object) => {
            if (object.isSolid) {
                scene.physics.add.collider(player, object);
            } else if (object.onPlayerTouch) {
                scene.physics.add.overlap(player, object, () => object.onPlayerTouch(player));
            }
        });

        // A crate rests on the floor, stops at walls, and stacks against
        // other crates and closed gates.
        if (movers.length > 0) {
            scene.physics.add.collider(movers, layer);
            scene.physics.add.collider(movers, solids);
        }

        objects.forEach((object) => object.link?.({ objects, player, listeners }));

        return objects;
    }
}
