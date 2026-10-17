import { CONFIG } from '../config.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../core/constants.js';
import { toCssColor } from '../core/helpers.js';

/**
 * Draws the textures for the *stage itself*: the candle's light, the
 * vignette and grain, a soft glow sprite, the tileset used by every level,
 * and the little sprites used for embers and the HUD flame.
 *
 * WHY these are never files (ASSETS.md): a gradient and some grain are just
 * maths, and generating them means zero download and colours that come
 * straight from CONFIG.palette (PALETTE.md).
 *
 * Runs ONCE in BootScene (CODE_RULES.md rule 8) -- never per frame.
 */
export class StageTextures {
    constructor(scene) {
        this.scene = scene;
    }

    generate() {
        this.glow();
        this.vignette();
        this.softGlow();
        this.tileset();
        this.ember();
        this.flame();
    }

    /**
     * The candle's light: a radial gradient through palette.paperStops,
     * from the hot centre out to the dark teal edge (PALETTE.md step 1).
     *
     * It is OPAQUE, and its last colour is the same dark teal the stage is
     * filled with, so wherever the light stops there is no seam. Moving
     * this one image around is what moves the light; fading it fades the
     * stage towards darkness as the wax runs out.
     *
     * Drawn small and scaled up, because a soft gradient loses nothing by
     * being stretched and a full-size one would cost far more memory.
     */
    glow() {
        const size = CONFIG.glow.textureSize;
        const texture = this.scene.textures.createCanvas('glow', size, size);
        if (!texture) return;

        const ctx = texture.getContext();
        const centre = size / 2;
        const gradient = ctx.createRadialGradient(centre, centre, 0, centre, centre, centre);

        CONFIG.palette.paperStops.forEach((colour, index) => {
            gradient.addColorStop(CONFIG.glow.stops[index], toCssColor(colour));
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        texture.refresh();
    }

    /**
     * Soft dark edges plus a whisper of film grain, over the whole stage
     * (PALETTE.md step 2). Baked once; at runtime it is just one image.
     */
    vignette() {
        const texture = this.scene.textures.createCanvas('vignette', GAME_WIDTH, GAME_HEIGHT);
        if (!texture) return;

        const ctx = texture.getContext();
        const { innerRadius, edgeAlpha, grainAlpha } = CONFIG.vignette;
        const frame = toCssColor(CONFIG.palette.frame);
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const reach = Math.hypot(cx, cy);

        const gradient = ctx.createRadialGradient(cx, cy, reach * innerRadius, cx, cy, reach);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, frame);
        ctx.globalAlpha = edgeAlpha;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Grain: scattered single-pixel specks, half light and half dark.
        ctx.globalAlpha = grainAlpha;
        for (let i = 0; i < 14000; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
            ctx.fillRect(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 1, 1);
        }

        ctx.globalAlpha = 1;
        texture.refresh();
    }

    /**
     * A plain white blob that fades to nothing. It is TINTED at runtime --
     * the flame's orange halo, the door's accent glow, later the lanterns --
     * so one texture serves every glow in the game.
     */
    softGlow() {
        const size = 128;
        const texture = this.scene.textures.createCanvas('soft_glow', size, size);
        if (!texture) return;

        const ctx = texture.getContext();
        const centre = size / 2;
        const gradient = ctx.createRadialGradient(centre, centre, 0, centre, centre, centre);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.45)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        texture.refresh();
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

        // 1 PAPER -- solid, but you can see it is thin: a hatched square.
        // The hatch is two sets of diagonals that each stay INSIDE this
        // 40 px cell; Graphics has no clipping, so a long diagonal would
        // scribble over the neighbouring tiles in the strip.
        g.fillStyle(shadow, 1);
        g.fillRect(t, 0, t, t);
        g.lineStyle(2, paperStops[1], 0.5);
        const inset = 2;
        for (let o = 8; o < t - inset; o += 10) {
            g.lineBetween(t + inset, o, t + o, inset);
            g.lineBetween(t + o, t - inset, t + t - inset, o);
        }

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

    /** A soft dot for ember and smoke particles. */
    ember() {
        const g = this.scene.make.graphics({ add: false });
        g.fillStyle(CONFIG.palette.flameOuter, 1);
        g.fillCircle(5, 5, 5);
        g.fillStyle(CONFIG.palette.flameCore, 1);
        g.fillCircle(5, 5, 2.5);
        g.generateTexture('ember', 10, 10);
        g.destroy();
    }

    /**
     * The teardrop flame: a bright flameCore centre inside a flameOuter
     * body (PALETTE.md step 3). The soft halo around it is a separate,
     * additive soft_glow sprite.
     */
    flame() {
        const g = this.scene.make.graphics({ add: false });
        g.fillStyle(CONFIG.palette.flameOuter, 1);
        g.fillCircle(9, 17, 8);
        g.fillTriangle(9, 0, 1, 18, 17, 18);
        g.fillStyle(CONFIG.palette.flameCore, 1);
        g.fillCircle(9, 18, 5);
        g.fillTriangle(9, 6, 5, 17, 13, 17);
        g.generateTexture('flame', 18, 26);
        g.destroy();
    }
}
