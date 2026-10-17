import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS, TILE_SIZE } from '../core/constants.js';
import { EVENTS } from '../core/events.js';

/**
 * A shelter (map symbol `|`): a lit paper screen standing out from the
 * wall, with the still air of its lee behind it. It is the only place
 * the draft does not reach (PRD 4.4, 6.4).
 *
 * WHY it is LIT rather than another dark recess: a dark alcove on a dark
 * stage reads as scenery, and players walked past them. A warm panel
 * with a calm glow behind it reads as somewhere to stand -- the player
 * should be able to see safety from across the room while the wind is
 * rising.
 *
 * It is scenery with an opinion: it draws itself and answers "is the
 * puppet inside me?". systems/DraftWind.js asks; the shelter never needs
 * to know what a draft is.
 */
export class Shelter {
    /** @param {number} x, y the CENTRE of the map tile marked `|` */
    constructor(scene, x, y) {
        const { width, height } = CONFIG.shelter;

        this.scene = scene;
        this.isShelter = true;

        // The screen stands ON its tile, like the door does.
        this.bounds = new Phaser.Geom.Rectangle(
            x - width / 2, y + TILE_SIZE / 2 - height, width, height);

        this.calm = this.buildCalmGlow();
        this.draw();
        this.curtain = this.buildCurtain();
    }

    /**
     * The still air behind the screen: a soft warm pool that says "the
     * wind does not come in here" before the player has to find out.
     */
    buildCalmGlow() {
        const s = CONFIG.shelter;
        const glow = this.scene.add.image(this.bounds.centerX,
            this.bounds.bottom - s.height / 2, 'soft_glow')
            .setTint(CONFIG.palette.accent)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(DEPTHS.PROPS - 2)
            .setAlpha(s.glowMinAlpha);

        glow.setScale((s.glowRadius * 2) / glow.width);

        // A slow breath, so it is alive without being a blinking sign.
        this.scene.tweens.add({
            targets: glow,
            alpha: s.glowMaxAlpha,
            duration: s.glowPulseMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: -1
        });

        return glow;
    }

    /** The screen itself: a lit panel with a bright rim and a frame. */
    draw() {
        const { x, y, width, height } = this.bounds;
        const s = CONFIG.shelter;
        const g = this.scene.add.graphics().setDepth(DEPTHS.PROPS - 1);

        // Paper, lit from behind.
        g.fillStyle(CONFIG.palette.panel, s.screenAlpha);
        g.fillRoundedRect(x, y, width, height,
            { tl: s.archRadius, tr: s.archRadius, bl: 0, br: 0 });

        // Two uprights and a lintel: a frame, so it reads as built.
        g.fillStyle(CONFIG.palette.shadow, 1);
        g.fillRect(x, y, s.postWidth, height);
        g.fillRect(x + width - s.postWidth, y, s.postWidth, height);

        g.lineStyle(CONFIG.ui.panelEdgePx, CONFIG.palette.accent, s.rimAlpha);
        g.strokeRoundedRect(x, y, width, height,
            { tl: s.archRadius, tr: s.archRadius, bl: 0, br: 0 });
    }

    /**
     * A short curtain across the top. It hangs still, and waves a second
     * before a gust -- the player's cue to get in (PRD 5.1).
     */
    buildCurtain() {
        const { x, y, width } = this.bounds;
        const s = CONFIG.shelter;

        return this.scene.add.rectangle(x + width / 2, y + s.curtainDrop,
            width - s.postWidth * 2, s.curtainHeight, CONFIG.palette.curtain[0])
            .setOrigin(0.5, 0)
            .setDepth(DEPTHS.PROPS)
            .setAlpha(s.curtainAlpha);
    }

    /** Called once everything exists: listen for the gust warning. */
    link({ listeners }) {
        listeners.on(EVENTS.DRAFT_TELEGRAPH, this.flutter, this);
    }

    /** The warning: the curtain waves for as long as the telegraph lasts. */
    flutter() {
        const { flutterDeg, flutterMs } = CONFIG.shelter;

        this.scene.tweens.killTweensOf(this.curtain);
        this.curtain.setAngle(0);
        this.scene.tweens.add({
            targets: this.curtain,
            angle: { from: -flutterDeg, to: flutterDeg },
            duration: flutterMs,
            ease: CONFIG.anim.easeLoop,
            yoyo: true,
            repeat: Math.ceil(CONFIG.draft.telegraphSeconds * 1000 / (flutterMs * 2)),
            onComplete: () => this.curtain.setAngle(0)
        });
    }

    /** Is the puppet standing in here? Its feet are what count. */
    holds(player) {
        return this.bounds.contains(player.x, player.feetY - 1);
    }
}
