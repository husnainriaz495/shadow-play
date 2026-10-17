import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { leaveTo } from '../core/transition.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, DEPTHS } from '../core/constants.js';
import { romanNumeral } from '../core/helpers.js';
import { PaperScreen } from '../objects/PaperScreen.js';
import { MenuPage } from '../ui/MenuPage.js';
import { TextPage } from '../ui/TextPage.js';
import { SettingsPage } from '../ui/SettingsPage.js';
import { SaveProgress } from '../systems/SaveProgress.js';
import { GlobalKeys } from '../systems/GlobalKeys.js';
import { AudioManager } from '../systems/AudioManager.js';
import { ACTS, ACT_COUNT } from '../levels/index.js';

/**
 * The main menu (PRD 4.7, 4.10): the logo on the lit paper, framed by the
 * curtain, with one card of choices at a time.
 *
 * WHY every page lives in this one scene: they all sit on the same
 * background and the same music, and only one is up at a time. Swapping a
 * card is a fold out and a fold in; swapping a scene would tear down the
 * logo and restart the theme underneath it.
 *
 * Keyboard, mouse and gamepad all drive it, and the pointing hand marks
 * the selection the same way for all three (ui/MenuList.js).
 */
export class TitleScene extends Phaser.Scene {
    constructor() {
        super(SCENES.TITLE);
    }

    init(data) {
        /**
         * Coming straight from the loading screen: the show starts with
         * the curtain SHUT and the logo on it, and opens onto the menu.
         * Coming back from an act or the ending, it is simply there.
         */
        this.curtainClosed = Boolean(data?.curtainClosed);

        /** Which card to open on: the death panel can ask for act select. */
        this.openPage = data?.page ?? null;

        // Consume it. Phaser hands a scene its PREVIOUS data when start()
        // is called with none, so leaving the flag set would replay the
        // curtain-up on every return to the menu. core/transition.js
        // guards this too; both together mean no caller has to remember.
        if (data) {
            data.curtainClosed = false;
            data.page = null;
        }
    }

    create() {
        fitCamera(this, { clipToStage: true });

        this.paperScreen = new PaperScreen(this);
        this.page = null;
        this.swapping = false;

        this.buildFrame();

        if (this.curtainClosed) this.raiseTheCurtain();
        else if (this.openPage === 'actSelect') this.showActSelect();
        else this.showRoot();

        new GlobalKeys(this);

        // The theme starts here and carries on into the act (ASSETS.md).
        // Browsers hold sound until the first key press; Phaser then lets
        // it through by itself.
        AudioManager.playMusic(this, 'music_theme');
    }

    /**
     * The logo, with the curtain drawn back at each side so the menu sits
     * on a stage rather than on a blank screen. The halves are parked
     * open -- this is the show waiting to begin, not a scene change.
     */
    buildFrame() {
        const t = CONFIG.title;

        this.left = this.add.image(0, 0, 'curtain_left').setOrigin(1, 0)
            .setScale(t.frameScale).setDepth(DEPTHS.CURTAIN).setX(t.frameWidth);
        this.right = this.add.image(GAME_WIDTH, 0, 'curtain_right').setOrigin(0, 0)
            .setScale(t.frameScale).setDepth(DEPTHS.CURTAIN).setX(GAME_WIDTH - t.frameWidth);

        // Kept together: a full page of reading hides them, so the card
        // is not laid over its own title.
        this.header = [
            this.add.image(GAME_WIDTH / 2, t.logoY, 'logo')
                .setScale(t.logoScale)
                .setDepth(DEPTHS.HUD),
            this.add.text(GAME_WIDTH / 2, t.taglineY,
                'The fire gives you shape. Time takes it away.', CONFIG.text.body)
                .setOrigin(0.5)
                .setDepth(DEPTHS.HUD)
        ];
    }

    /**
     * The show begins: the two halves start meeting in the middle, with
     * the logo already lit on the velvet, and then draw back to the sides
     * where they stay for the rest of the menu.
     *
     * WHY the FRAME halves move rather than a separate Curtain: they are
     * the same two pictures. Laying another curtain over them would show
     * two layers of velvet sliding past each other.
     */
    raiseTheCurtain() {
        const t = CONFIG.title;

        // Each half is wider than half the stage, so they overlap in the
        // middle and no seam of paper shows between them.
        this.left.setX(this.left.displayWidth);
        this.right.setX(GAME_WIDTH - this.right.displayWidth);

        this.time.delayedCall(t.openDelayMs, () => {
            this.tweens.add({
                targets: this.left,
                x: t.frameWidth,
                duration: CONFIG.anim.curtainOpenMs,
                ease: CONFIG.anim.easeSweep
            });
            this.tweens.add({
                targets: this.right,
                x: GAME_WIDTH - t.frameWidth,
                duration: CONFIG.anim.curtainOpenMs,
                ease: CONFIG.anim.easeSweep,
                onComplete: () => this.showRoot()
            });
        });
    }

    /**
     * Fold the page that is up away, then open the next one.
     * @param {boolean} [showHeader] false for a full page of reading,
     *        which needs the whole screen
     */
    goToPage(build, showHeader = true) {
        if (this.swapping) return;
        this.swapping = true;

        const open = () => {
            this.header.forEach((part) => part.setVisible(showHeader));
            this.page = build().open();
            this.swapping = false;
        };

        if (this.page) this.page.close(open);
        else open();
    }

    /**
     * The root menu. CONTINUE only appears once an act past the first has
     * been reached, and it is listed FIRST so Space still does the obvious
     * thing for someone coming back.
     */
    showRoot() {
        const highest = SaveProgress.getHighestAct();
        const done = SaveProgress.isCompleted();
        const items = [];

        // Nothing to continue TO once the show has been watched to the
        // end: "Start the Show" becomes the first and selected item, and
        // every act is open in Act Select.
        if (highest > 1 && !done) {
            items.push({
                label: `CONTINUE - ACT ${romanNumeral(highest)}`,
                onSelect: () => this.begin(highest, 'continued from the menu')
            });
        }

        items.push(
            { label: 'START THE SHOW', onSelect: () => this.startTheShow(highest, done) },
            { label: 'ACT SELECT', onSelect: () => this.showActSelect() },
            { label: 'SETTINGS', onSelect: () => this.showSettings() },
            { label: 'HOW TO PLAY', onSelect: () => this.showHowToPlay() },
            { label: 'CREDITS', onSelect: () => this.showCredits() },
            { label: 'QUIT', onSelect: () => this.quit() }
        );

        this.goToPage(() => new MenuPage(this, { items }));
    }

    /**
     * A new show. With progress saved this ASKS first and then wipes it
     * (PRD 4.10), because otherwise "CONTINUE - ACT V" sits on the menu
     * for ever after one play-through -- there was no way to clear it,
     * and it looks like the game is lying about where you got to.
     */
    startTheShow(highest, done = false) {
        if (highest <= 1 && !done) {
            this.begin(1, 'new show from the menu');
            return;
        }

        this.goToPage(() => new MenuPage(this, {
            heading: 'START OVER?',
            width: CONFIG.title.menu.wideWidth,
            items: [
                {
                    label: 'YES - FORGET MY PROGRESS',
                    onSelect: () => {
                        SaveProgress.clear();
                        this.begin(1, 'new show, progress cleared');
                    }
                },
                { label: 'NO - GO BACK', onSelect: () => this.showRoot() }
            ],
            onBack: () => this.showRoot()
        }));
    }

    /** Only the acts actually reached; the rest are not listed at all. */
    showActSelect() {
        const open = SaveProgress.isCompleted() ? ACT_COUNT : SaveProgress.getHighestAct();
        const items = ACTS.slice(0, open).map((act, index) => ({
            label: `${romanNumeral(index + 1)}.  ${TitleScene.shortTitle(act.title)}`,
            onSelect: () => this.begin(index + 1, 'chosen from act select')
        }));

        items.push({ label: 'BACK', onSelect: () => this.showRoot() });

        this.goToPage(() => new MenuPage(this, {
            heading: 'ACT SELECT',
            width: CONFIG.title.menu.wideWidth,
            items,
            onBack: () => this.showRoot()
        }));
    }

    /** "Act III — Moths to the Flame" -> "MOTHS TO THE FLAME". */
    static shortTitle(title) {
        return title.split('—').pop().trim().toUpperCase();
    }

    showSettings() {
        this.goToPage(() => new SettingsPage(this, { onBack: () => this.showRoot() }));
    }

    showHowToPlay() {
        this.goToPage(() => new TextPage(this, {
            heading: 'HOW TO PLAY',
            lines: CONFIG.title.howToPlay,
            onBack: () => this.showRoot()
        }), false);
    }

    showCredits() {
        this.goToPage(() => new TextPage(this, {
            heading: 'CREDITS',
            lines: CONFIG.title.credits,
            onBack: () => this.showRoot()
        }), false);
    }

    /**
     * A browser tab cannot close itself, so "quit" takes its bow instead:
     * the curtain comes across and thanks the audience, and the only way
     * on is back to the menu. Honest about what it can do, and in
     * character (PRD 4.7).
     */
    quit() {
        leaveTo(this, SCENES.CURTAIN_CALL);
    }

    /**
     * `curtainClosed`: the act is built behind the curtain and revealed as
     * it draws back (PRD 5.1 "Title -> Act 1").
     */
    begin(act, reason) {
        leaveTo(this, SCENES.GAME, { act, curtainClosed: true, reason });
    }

    update(time, delta) {
        this.paperScreen.update(time, delta);
    }
}
