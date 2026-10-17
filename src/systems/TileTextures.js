import { CONFIG } from '../config.js';
import { TILE_SIZE } from '../core/constants.js';
import { mixColors } from '../core/helpers.js';

/**
 * Draws the tileset every level is built from: one strip of 40 x 40 tiles
 * in TILE_INDEX order -- wall, paper, burning, platform.
 *
 * WHY one strip: the fire grid turns paper into burning into a hole just by
 * changing a tile's index, so all the tiles must live in one texture.
 * Split out of StageTextures.js when that file passed ~200 lines.
 *
 * Runs ONCE in BootScene (CODE_RULES.md rule 8).
 */
export class TileTextures {
    constructor(scene) {
        this.scene = scene;
    }

    generate() {
        this.tileset();
    }

    /**
     * The tileset: one strip of 40x40 tiles in the order of TILE_INDEX
     * (wall, paper, burning, platform). Levels are built from this single
     * texture so the fire grid can swap a tile's index with one call.
     */
    tileset() {
        const g = this.scene.make.graphics({ add: false });
        const t = TILE_SIZE;
        const { shadow, paperStops, flameOuter, flameCore } = CONFIG.palette;

        // 0 WALL -- solid painted scenery.
        g.fillStyle(shadow, 1);
        g.fillRect(0, 0, t, t);

        // 1 PAPER -- cream paper with darker, scorched edges, so it reads as
        // something that WILL burn, not as stone. Everything stays inside
        // this 40 px cell (Graphics has no clipping).
        this.paperTile(g, t);

        // 2 BURNING -- a charred tile with a hot, ragged edge.
        g.fillStyle(shadow, 1);
        g.fillRect(t * 2, 0, t, t);
        g.fillStyle(flameOuter, 1);
        g.fillRect(t * 2, 0, t, 7);
        g.fillStyle(flameCore, 1);
        for (let i = 0; i < t; i += 8) {
            g.fillRect(t * 2 + i, 5, 5, 6 + (i % 3) * 4);
        }

        // 3 PLATFORM -- a thin one-way shelf you can jump up through. Drawn
        // only across the top of its cell so it reads as a ledge.
        g.fillStyle(shadow, 1);
        g.fillRect(t * 3, 0, t, 9);
        g.fillStyle(paperStops[0], 0.35);
        g.fillRect(t * 3 + 2, 2, t - 4, 2);

        g.generateTexture('tileset', t * 4, t);
        g.destroy();
    }

    /**
     * One burnable paper tile, drawn at x = t in the strip: a cream sheet
     * whose rim darkens towards the edge (rings of rising opacity), a few
     * burnt notches along it, and faint fibres. Colours are mixes of the
     * palette's lit paper and shadow (PALETTE.md).
     */
    paperTile(g, t) {
        const { paperStops, shadow } = CONFIG.palette;
        const { scorchRings, scorchMix, scorchMaxAlpha, notches } = CONFIG.fire.paperTile;
        const cream = paperStops[0];
        const scorch = mixColors(paperStops[1], shadow, scorchMix);

        g.fillStyle(cream, 1);
        g.fillRect(t, 0, t, t);

        // Scorched rim: darkest at the very edge, fading inwards.
        for (let i = 0; i < scorchRings; i++) {
            g.lineStyle(1, scorch, scorchMaxAlpha * (1 - i / scorchRings));
            g.strokeRect(t + i + 0.5, i + 0.5, t - i * 2 - 1, t - i * 2 - 1);
        }

        // A few burnt notches eating in from the edges (fixed spots, so
        // every paper tile matches).
        g.fillStyle(scorch, scorchMaxAlpha);
        notches.forEach(([x, y, r]) => g.fillCircle(t + x, y, r));

        // Faint fibres, like the paper screen itself.
        g.lineStyle(1, paperStops[1], 0.18);
        g.lineBetween(t + 8, 15, t + 26, 15);
        g.lineBetween(t + 14, 26, t + 32, 26);
    }
}
