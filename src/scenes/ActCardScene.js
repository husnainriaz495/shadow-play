import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTHS } from '../core/constants.js';
import { ACTS } from '../levels/index.js';

/**
 * The curtain between acts: it closes, shows "Act II — The Giant" and its
 * story line, loads that act's backdrop while nobody can see, then opens.
 *
 * WHY the loading happens here (CODE_RULES.md rule 8): a backdrop is a big
 * file. Loading it behind a closed curtain means the player never waits on
 * a blank screen.
 *
 * M0 STATUS: the card shows and moves on. The sliding curtain halves, the
 * ink-writing title, the results card and the backdrop loading are M5
 * (PRD 5.1).
 */
export class ActCardScene extends Phaser.Scene {
    constructor() {
        super(SCENES.ACT_CARD);
    }

    init(data) {
        this.actNumber = data?.act ?? 1;
    }

    create() {
        fitCamera(this);

        const act = ACTS[this.actNumber - 1] ?? ACTS[0];

        // A plain dark backing stands in for the closed curtain until M5.
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, CONFIG.palette.curtain[0])
            .setOrigin(0, 0)
            .setDepth(DEPTHS.CURTAIN);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, act.title.toUpperCase(), CONFIG.text.heading)
            .setOrigin(0.5)
            .setDepth(DEPTHS.HUD);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, act.story, CONFIG.text.body)
            .setOrigin(0.5)
            .setDepth(DEPTHS.HUD);

        // Move on by itself, but let an impatient player skip ahead.
        this.time.delayedCall(CONFIG.anim.actCardMs, () => this.begin());
        this.input.keyboard.once('keydown-SPACE', () => this.begin());
    }

    begin() {
        if (this.scene.isActive()) {
            this.scene.start(SCENES.GAME, { act: this.actNumber });
        }
    }
}
