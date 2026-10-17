import { CONFIG } from '../config.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/constants.js';
import { toCssColor } from '../core/helpers.js';

/**
 * Draws the textures for the *stage itself*: the candle's light, the
 * vignette and grain, a soft glow sprite, and the little sprites used for
 * embers, the HUD flame and its drips. The level tiles are TileTextures.js.
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
        this.ember();
        this.dust();
        this.windStreak();
        this.flame();
        this.waxDrip();
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
     * One run of melted wax for the HUD candle: a thin trickle with a round
     * bulb at the bottom, the shape real drips make. Drawn once; the drips
     * are a pool of images using it (ui/WaxDrips.js).
     */
    waxDrip() {
        const { dripWidth, dripHeight } = CONFIG.hud;
        const bulb = dripWidth / 2;
        const g = this.scene.make.graphics({ add: false });

        g.fillStyle(CONFIG.palette.wax, 1);
        g.fillRoundedRect(bulb - bulb * 0.55, 0, bulb * 1.1, dripHeight - bulb, bulb * 0.5);
        g.fillCircle(bulb, dripHeight - bulb, bulb);

        g.generateTexture('wax_drip', dripWidth, dripHeight);
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
     * A soft pale mote for the dust kicked up by a landing (fx/DustPuff.js).
     * Muted, never bright: dust catches the candlelight, it does not glow
     * (PALETTE.md -- `textMuted` is the palette's quiet pale tone).
     */
    dust() {
        const g = this.scene.make.graphics({ add: false });
        g.fillStyle(CONFIG.palette.textMuted, 0.5);
        g.fillCircle(4, 4, 4);
        g.fillStyle(CONFIG.palette.textMuted, 0.8);
        g.fillCircle(4, 4, 2);
        g.generateTexture('dust', 8, 8);
        g.destroy();
    }

    /**
     * A wind streak: a thin horizontal smear, brightest in the middle and
     * fading at both ends, so a line of them reads as moving air rather
     * than as scratches on the screen (systems/DraftWind.js).
     */
    windStreak() {
        const { streakWidth, streakHeight } = CONFIG.draft;
        const g = this.scene.make.graphics({ add: false });
        const middle = streakHeight / 2;

        // Drawn as a run of short bars whose alpha rises then falls.
        for (let x = 0; x < streakWidth; x++) {
            const along = x / (streakWidth - 1);
            const fade = Math.sin(along * Math.PI);

            g.fillStyle(CONFIG.palette.title, fade);
            g.fillRect(x, middle - streakHeight / 2, 1, streakHeight);
        }

        g.generateTexture('wind_streak', streakWidth, streakHeight);
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
