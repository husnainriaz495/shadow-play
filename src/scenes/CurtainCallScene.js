import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { leaveTo } from '../core/transition.js';
import { CONFIG } from '../config.js';
import {
    SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTHS, HUD_BAND, STAGE_Y, VIEW_WIDTH, VIEW_HEIGHT
} from '../core/constants.js';
import { Curtain } from '../ui/Curtain.js';
import { MenuPage } from '../ui/MenuPage.js';

/**
 * "Quit", as a browser game can honestly do it.
 *
 * A tab cannot close itself -- `window.close()` is refused for any page
 * the script did not open -- so rather than a button that silently does
 * nothing, the show simply ends: the curtain comes across, the audience
 * is thanked, and the only way on is back to the menu (PRD 4.7).
 */
export class CurtainCallScene extends Phaser.Scene {
    constructor() {
        super(SCENES.CURTAIN_CALL);
    }

    create() {
        fitCamera(this);

        // The frame too, so no corner of the old screen shows at the edges.
        this.add.rectangle(HUD_BAND.left, -STAGE_Y, VIEW_WIDTH, VIEW_HEIGHT, CONFIG.palette.frame)
            .setOrigin(0, 0)
            .setDepth(DEPTHS.PAPER);

        this.thanks = this.add.text(GAME_WIDTH / 2, CONFIG.title.quit.thanksY,
            'Thanks for watching the show', CONFIG.text.heading)
            .setOrigin(0.5)
            .setDepth(DEPTHS.CURTAIN + 1)
            .setAlpha(0);

        new Curtain(this).close(() => this.thankTheAudience());
    }

    /** The words fade up on the shut curtain, then the way back appears. */
    thankTheAudience() {
        this.tweens.add({
            targets: this.thanks,
            alpha: 1,
            duration: CONFIG.title.quit.fadeMs,
            ease: CONFIG.anim.easeInSoft,
            onComplete: () => this.offerTheWayBack()
        });
    }

    offerTheWayBack() {
        this.page = new MenuPage(this, {
            items: [{ label: 'BACK TO THE MENU', onSelect: () => leaveTo(this, SCENES.TITLE) }],
            onBack: () => leaveTo(this, SCENES.TITLE)
        });

        this.page.panel.container.setY(CONFIG.title.quit.menuY);
        this.page.panel.restY = CONFIG.title.quit.menuY;
        this.page.panel.container.setDepth(DEPTHS.CURTAIN + 2);
        this.page.open();
    }
}

/** Where the card sits on the shut curtain. */
CurtainCallScene.CENTRE_Y = GAME_HEIGHT / 2;
