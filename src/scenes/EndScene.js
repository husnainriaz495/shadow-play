import Phaser from 'phaser';
import { fitCamera } from '../core/camera.js';
import { CONFIG } from '../config.js';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, DEPTHS } from '../core/constants.js';
import { leaveTo } from '../core/transition.js';
import { PaperScreen } from '../objects/PaperScreen.js';
import { BowingPuppet } from '../ui/BowingPuppet.js';
import { Curtain } from '../ui/Curtain.js';
import { InkText } from '../fx/UIAnim.js';
import { CreditsScroll } from '../ui/CreditsScroll.js';
import { AudioManager } from '../systems/AudioManager.js';

/**
 * The ending (PRD 4.7, 5.1): the show is over, so the puppet steps forward
 * and bows while the camera creeps in; the candle it has been carrying all
 * game burns out by itself and the stage goes dark; the curtain closes and
 * the last words are written on it.
 *
 * WHY no act is loaded underneath: the ending is a curtain call, not a
 * level. It is the empty stage, one puppet and the dying light -- the last
 * shot of the trailer (PRD 12).
 *
 * It runs as a short chain of PHASES, and Space always means "get to the
 * end of this phase now". That matters: the first version simply killed
 * every tween in the scene, so a second press killed the curtain's own
 * closing tween, its `onComplete` never ran, and the ending stopped dead
 * with no curtain and no last words and no way out. One phase at a time, and
 * each skip lands on a known state rather than cancelling one.
 */
export class EndScene extends Phaser.Scene {
    constructor() {
        super(SCENES.END);
    }

    init(data) {
        // The last act hands over with its curtain shut (ActFlow.goToAct),
        // so the ending opens ON it rather than cutting to a lit stage.
        this.curtainClosed = Boolean(data?.curtainClosed);
    }

    create() {
        fitCamera(this, { clipToStage: true });

        const { groundY } = CONFIG.ending;

        this.lightLevel = 1;
        this.curtain = null;
        this.ink = null;

        /**
         * 'opening' -> 'bow' -> 'closing' -> 'writing' -> 'credits' ->
         * 'done'. Space always means "finish THIS phase now".
         */
        this.phase = this.curtainClosed ? 'opening' : 'bow';

        this.puppet = new BowingPuppet(this, GAME_WIDTH / 2, groundY);
        this.paperScreen = new PaperScreen(this, this.puppet.lightSource);
        this.paperScreen.setLightSource(this.puppet.lightSource.x, this.puppet.lightSource.y, true);

        if (this.phase === 'opening') {
            // Hold the stage dark behind the shut curtain, draw it back,
            // and only then let the puppet step forward to bow.
            this.curtain = new Curtain(this, { closedAmount: 1 });
            this.curtain.open(() => this.beginBow());
        } else {
            this.beginBow();
        }

        this.input.keyboard.on('keydown-SPACE', () => this.skip());
    }

    /** The curtain is out of the way: take the bow, and start the clock. */
    beginBow() {
        if (this.phase !== 'opening' && this.phase !== 'bow') return;
        this.phase = 'bow';

        this.curtain?.destroy();
        this.curtain = null;

        this.bowTween = this.puppet.bow(() => this.closeCurtain());

        const { zoomTo, zoomMs, dimStartMs, dimMs } = CONFIG.ending;

        // The camera creeps in on the bow, and the candle dies at the same
        // time, so the stage is dark by the time the curtain moves.
        //
        // A plain tween on `zoom`, not camera.zoomTo: the camera's own
        // effects take Phaser's internal easing names ('Sine.easeInOut'),
        // and everything else here eases by CONFIG.anim (CODE_RULES rule 5).
        this.zoomTween = this.tweens.add({
            targets: this.cameras.main,
            zoom: CONFIG.render.scale * zoomTo,
            duration: zoomMs,
            ease: CONFIG.anim.easeLoop
        });

        this.dimTween = this.tweens.add({
            targets: this,
            lightLevel: 0,
            delay: dimStartMs,
            duration: dimMs,
            ease: CONFIG.anim.easeInSoft
        });
    }

    /** The bow is over (or was skipped): draw the curtain across. */
    closeCurtain() {
        if (this.phase !== 'bow') return;
        this.phase = 'closing';

        this.time.delayedCall(CONFIG.ending.curtainDelayMs, () => {
            if (this.phase !== 'closing') return;   // already snapped shut
            this.curtain = new Curtain(this);
            this.curtain.close(() => this.writeFin());
        });
    }

    /** The last words in ink on the closed curtain, then the way out. */
    writeFin() {
        if (this.phase !== 'closing') return;
        this.phase = 'writing';

        this.fin = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', CONFIG.text.title)
            .setOrigin(0.5)
            .setDepth(DEPTHS.CURTAIN + 1);

        // Waiting just under the middle, where the last words are: it
        // rises into their place once the programme has gone by.
        this.prompt = this.add.text(GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + CONFIG.ending.promptRisePx,
            'Press Space for the main menu', CONFIG.text.prompt)
            .setOrigin(0.5)
            .setDepth(DEPTHS.CURTAIN + 1)
            .setAlpha(0);

        this.time.delayedCall(CONFIG.ending.finDelayMs, () => {
            if (this.phase !== 'writing') return;
            this.ink = new InkText(this, this.fin, CONFIG.ending.finalWords,
                () => this.applaudAndRollCredits());
        });
    }

    /**
     * The last words are written, so the house applauds -- and then the
     * programme
     * rolls, the way it would at the end of a real show. Nothing waits
     * for a key here: the ending plays itself out to the end.
     */
    applaudAndRollCredits() {
        this.phase = 'credits';

        AudioManager.playSfx(this, 'sfx_applause');

        // The last words hand over to the programme rather than sitting
        // behind it: two sets of words on one curtain read as a mistake.
        this.tweens.add({
            targets: this.fin,
            alpha: 0,
            duration: CONFIG.ending.credits.startDelayMs,
            ease: CONFIG.anim.easeOut
        });

        this.time.delayedCall(CONFIG.ending.credits.startDelayMs, () => {
            if (this.phase !== 'credits') return;

            this.credits = new CreditsScroll(this, CONFIG.ending.programme);
            this.credits.roll(() => this.offerTheWayOut());
        });
    }

    /** The programme has rolled by: back to the menu, by key or by itself. */
    offerTheWayOut() {
        if (this.phase === 'done') return;
        this.phase = 'done';

        this.tweens.add({
            targets: this.prompt,
            alpha: 1,
            y: GAME_HEIGHT / 2,
            duration: CONFIG.ending.promptFadeMs,
            ease: CONFIG.anim.easeInSoft
        });

        // It returns on its own if nobody presses anything, so the show
        // never just sits there at the end (PRD 5.1: "nothing cuts off").
        this.time.delayedCall(CONFIG.ending.credits.holdMs,
            () => leaveTo(this, SCENES.TITLE));
    }

    /**
     * Space: finish whatever is happening now. Nobody should be held on an
     * ending they have already seen -- but pressing it again must never
     * cancel the step it just started.
     */
    skip() {
        if (this.phase === 'opening') return this.beginBow();   // draw it back now
        if (this.phase === 'bow') return this.cutTheBowShort();
        if (this.phase === 'closing') return this.snapCurtainShut();
        if (this.phase === 'writing') return this.finishWriting();
        if (this.phase === 'credits') return this.runCreditsToTheEnd();

        leaveTo(this, SCENES.TITLE);   // 'done', and the latch makes it once
    }

    /** Stop the bow, the zoom and the dimming where they are, and move on. */
    cutTheBowShort() {
        this.bowTween?.stop();
        this.zoomTween?.stop();
        this.dimTween?.stop();
        this.lightLevel = 0;
        this.closeCurtain();
    }

    /** The curtain is half across: put it the rest of the way, now. */
    snapCurtainShut() {
        if (!this.curtain) {
            // Still inside curtainDelayMs: make it and shut it immediately.
            this.curtain = new Curtain(this, { closedAmount: 1 });
        } else {
            this.tweens.killTweensOf([this.curtain.left, this.curtain.right]);
            this.curtain.setClosedAmount(1);
        }

        this.writeFin();
    }

    /** Space during the programme: run it to the end now. */
    runCreditsToTheEnd() {
        if (this.credits) this.credits.finish();
        else this.offerTheWayOut();   // still inside startDelayMs
    }

    /** Land the last letters at once. */
    finishWriting() {
        if (this.ink) {
            this.ink.finish();   // its own callback offers the way out
            return;
        }

        this.fin?.setText(CONFIG.ending.finalWords);   // inside finDelayMs: no ink
        this.applaudAndRollCredits();
    }

    update(time, delta) {
        this.puppet.update();
        this.paperScreen.setLightLevel(this.lightLevel);
        this.paperScreen.update(time, delta);
    }
}
