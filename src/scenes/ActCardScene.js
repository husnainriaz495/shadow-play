import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import {
    SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTHS, HUD_BAND, STAGE_Y, VIEW_WIDTH, VIEW_HEIGHT
} from '../core/constants.js';
import { PaperScreen } from '../objects/PaperScreen.js';
import { Curtain } from '../ui/Curtain.js';
import { leaveTo } from '../core/transition.js';
import { InkText } from '../fx/UIAnim.js';
import { ResultsCard } from '../ui/ResultsCard.js';
import { ACTS, ACT_COUNT } from '../levels/index.js';
import { romanNumeral } from '../core/helpers.js';

/**
 * The card between acts (PRD 5.1): the curtain is already shut, the act's
 * title is written on it letter by letter like ink, its story line fades
 * in underneath, and then GameScene takes over -- starting with the SAME
 * closed curtain, which it opens once the act is built behind it.
 *
 * WHY the handover works that way: the two scenes draw the curtain in the
 * same place, so swapping them is invisible, and the player never sees a
 * half-built act. It also keeps the scene order simple -- no scene has to
 * be brought to the top of another one mid-transition.
 *
 * Space skips: the first press finishes the writing, the second begins.
 */
export class ActCardScene extends Phaser.Scene {
    constructor() {
        super(SCENES.ACT_CARD);
    }

    init(data) {
        this.actNumber = data?.act ?? 1;
        this.reason = data?.reason ?? 'act card';

        /** How the act just FINISHED went, or null if none was played. */
        this.results = data?.results ?? null;
    }

    /**
     * Fetch the next act's backdrop while the card is up (CODE_RULES.md
     * rule 8): a backdrop is a big file, and this is the one moment when
     * nobody is waiting on the stage. GameScene asks for it again and finds
     * it already in the cache.
     */
    preload() {
        PaperScreen.queueBackdrop(this, this.actNumber);
    }

    create() {
        fitCamera(this);

        const act = ACTS[this.actNumber - 1] ?? ACTS[0];
        const { titleY, storyY } = CONFIG.actCard;

        // The frame around the stage, so nothing from the last act shows
        // through at the edges while the card is up.
        this.add.rectangle(HUD_BAND.left, -STAGE_Y, VIEW_WIDTH, VIEW_HEIGHT, CONFIG.palette.frame)
            .setOrigin(0, 0)
            .setDepth(DEPTHS.PAPER);

        this.curtain = new Curtain(this, { closedAmount: 1 });

        // Everything announcing the NEXT act is built now but held back,
        // so the results card for the LAST one can have the stage first.
        this.announcement = [];

        // Where the player is in the show. The finale's own title does not
        // say "Act V", so this is the only place the running order shows.
        this.ofLine = this.add.text(GAME_WIDTH / 2, CONFIG.actCard.ofY,
            `ACT ${romanNumeral(this.actNumber)} OF ${romanNumeral(ACT_COUNT)}`,
            // Light, not muted: the muted grey-teal is for text on the dark
            // stage, and it disappears against the red velvet curtain.
            CONFIG.text.prompt)
            .setOrigin(0.5)
            .setDepth(DEPTHS.CURTAIN + 1);

        this.title = this.add.text(GAME_WIDTH / 2, titleY, '', CONFIG.text.heading)
            .setOrigin(0.5)
            .setDepth(DEPTHS.CURTAIN + 1);

        this.story = this.add.text(GAME_WIDTH / 2, storyY, act.story, CONFIG.text.body)
            .setOrigin(0.5)
            .setDepth(DEPTHS.CURTAIN + 1)
            .setAlpha(0);

        this.announcement = [this.ofLine, this.title, this.story];
        this.actTitle = act.title.toUpperCase();

        this.input.keyboard.on('keydown-SPACE', () => this.skip());
        this.input.keyboard.on('keydown-ENTER', () => this.skip());
        this.input.on('pointerdown', () => this.skip());

        // One act ends before the next is announced (PRD 5.1): the
        // results card first, then the card for what is coming.
        if (this.results) this.showResults();
        else this.announce();
    }

    /**
     * How the act just finished went, on the shut curtain. The next act's
     * card is hidden until this folds away, so the two never overlap.
     */
    showResults() {
        // Nothing about the NEXT act is on screen while this one is being
        // scored. It waits on a key rather than a timer, so the two cards
        // can never be up at the same time.
        this.announcement.forEach((part) => part.setVisible(false));

        this.resultsCard = new ResultsCard(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, this.results);
        this.resultsCard.open();
    }

    /**
     * Clear the results away COMPLETELY, and only then announce the next
     * act -- the ink does not start until the card has folded and gone.
     */
    announce() {
        if (this.resultsCard && !this.resultsDone) {
            this.resultsDone = true;
            this.resultsCard.close(() => this.announce());
            return;
        }

        this.announcement.forEach((part) => part.setVisible(true));
        this.ink = new InkText(this, this.title, this.actTitle, () => this.showStory());
    }

    /** The story line fades in under the finished title, then the act starts. */
    showStory() {
        const { storyFadeMs, holdMs } = CONFIG.actCard;

        this.tweens.add({
            targets: this.story,
            alpha: 1,
            duration: storyFadeMs,
            ease: CONFIG.anim.easeInSoft
        });

        this.hold = this.time.delayedCall(storyFadeMs + holdMs, () => this.begin());
    }

    /**
     * Space always means "finish this step": land the results card, then
     * land the writing, then move on. One press, one step -- never a
     * cancel (the same rule the ending follows).
     */
    skip() {
        if (this.resultsCard && !this.resultsDone) {
            // One press lands the numbers; the next moves on.
            if (!this.resultsCard.finish()) this.announce();
            return;
        }

        if (!this.ink) return;                 // mid-fold, between the two
        if (!this.ink.finish()) this.begin();
    }

    begin() {
        // Space and the timer can both land here; the latch allows one.
        this.hold?.remove();
        leaveTo(this, SCENES.GAME,
            { act: this.actNumber, curtainClosed: true, reason: this.reason });
    }
}
