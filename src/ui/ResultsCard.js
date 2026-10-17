import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { DEPTHS } from '../core/constants.js';
import { romanNumeral } from '../core/helpers.js';
import { PaperPanel } from './PaperPanel.js';

/**
 * The card shown on the closed curtain when an act is finished (PRD 4.10,
 * 5.1): how long it took, how much candle is left, how many restarts, and
 * one to three candles for how well it went.
 *
 * WHY it counts up instead of simply printing: the numbers ARE the act's
 * story, and a number that climbs is read, while a number that is already
 * there is skipped. The candles then light one at a time, so the rating
 * lands last.
 *
 * WHY it waits for a key: it used to fold away on a timer while the next
 * act's title was already fading in behind it, which read as two cards
 * fighting. Nothing about the next act exists until this one is gone.
 *
 * It only draws. scenes/ActCardScene.js decides when it appears and what
 * comes after it.
 */
export class ResultsCard {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x, y the CENTRE of the card
     * @param {{act: number, seconds: number, waxLeft: number, waxMax: number,
     *          restarts: number}} stats the act that was just finished
     */
    constructor(scene, x, y, stats) {
        const r = CONFIG.results;

        this.scene = scene;
        this.stats = stats;
        this.earned = ResultsCard.rate(stats);

        /** Tweened from 0 to 1; every number on the card reads from it. */
        this.shown = 0;

        // Laid out top to bottom, each block clear of the last, so the
        // candles can never land on top of the RESTARTS row again.
        const top = -r.height / 2;
        const headingY = top + r.padY;
        const rowsY = headingY + r.headingGap;

        this.candlesY = rowsY + r.rowGap * 3 + r.candlesGap;
        this.promptY = this.candlesY + r.promptGap;

        this.panel = new PaperPanel(scene, x, y, r.width, r.height,
            { theatre: true, heading: headingY + CONFIG.ui.ornament.drop });
        this.panel.container.setDepth(DEPTHS.CURTAIN + 1);

        this.panel.add(scene.add.text(0, headingY,
            `ACT ${romanNumeral(stats.act)} COMPLETE`, CONFIG.text.heading).setOrigin(0.5));

        this.rows = this.buildRows(rowsY);
        this.candles = this.buildCandles();
        this.prompt = this.buildPrompt();
    }

    /**
     * One to three candles. It starts from how much wax is left -- the
     * whole game is about spending it well -- and a player who had to
     * restart more than a couple of times loses one, however tidy the run
     * they finally managed. Never below one: finishing is worth something.
     */
    static rate({ waxLeft, waxMax, restarts }) {
        const { three, two, restartsForPenalty } = CONFIG.results.rating;
        const left = waxLeft / waxMax;

        let candles = 1;
        if (left >= three) candles = 3;
        else if (left >= two) candles = 2;

        if (restarts >= restartsForPenalty) candles -= 1;

        return Phaser.Math.Clamp(candles, 1, 3);
    }

    /** "0:42" from seconds, the way a stopwatch shows it. */
    static clock(seconds) {
        const whole = Math.max(0, Math.round(seconds));

        return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
    }

    /** The three labelled numbers, each counting up as `shown` rises. */
    buildRows(rowsY) {
        const r = CONFIG.results;
        const { seconds, waxLeft, waxMax, restarts } = this.stats;

        const rows = [
            { label: 'TIME', value: () => ResultsCard.clock(seconds * this.shown) },
            { label: 'WAX LEFT', value: () => `${Math.round(waxLeft / waxMax * 100 * this.shown)}%` },
            { label: 'RESTARTS', value: () => `${Math.round(restarts * this.shown)}` }
        ];

        return rows.map((row, index) => {
            const y = rowsY + index * r.rowGap;

            this.panel.add(this.scene.add.text(-r.width / 2 + r.padX, y, row.label, CONFIG.text.muted)
                .setOrigin(0, 0.5));

            const value = this.scene.add.text(r.width / 2 - r.padX, y, '', CONFIG.text.prompt)
                .setOrigin(1, 0.5);

            this.panel.add(value);

            return { ...row, text: value };
        });
    }

    /**
     * Three little candles in a row of their own, well under the numbers.
     * An unearned one is a dark stub with no flame, so the row always
     * reads "two out of three" at a glance.
     */
    buildCandles() {
        const r = CONFIG.results;
        const firstX = -((r.candleCount - 1) * r.candleGap) / 2;

        return Array.from({ length: r.candleCount }, (_, index) => {
            const lit = index < this.earned;
            const x = firstX + index * r.candleGap;

            const body = this.scene.add.rectangle(x, this.candlesY, r.candleWidth,
                lit ? r.candleTall : r.candleShort,
                lit ? CONFIG.palette.wax : CONFIG.palette.dotOff).setOrigin(0.5, 1);

            const flame = this.scene.add.image(x, this.candlesY - (lit ? r.candleTall : r.candleShort),
                'flame').setOrigin(0.5, 1).setScale(r.flameScale).setVisible(lit);

            this.panel.add(body).add(flame);

            // They light later, one at a time.
            [body, flame].forEach((part) => part.setScale(part.scaleX, 0));

            return { body, flame, lit };
        });
    }

    /** The way on. Hidden until the rating has landed. */
    buildPrompt() {
        const prompt = this.scene.add.text(0, this.promptY, 'Continue ▸', CONFIG.text.prompt)
            .setOrigin(0.5)
            .setAlpha(0);

        this.panel.add(prompt);

        return prompt;
    }

    /**
     * Unfold, run the numbers up, light the candles one at a time, then
     * offer the way on.
     * @param {Function} [onReady] called once the card is waiting on a key
     */
    open(onReady) {
        const r = CONFIG.results;

        this.panel.open();

        this.countTween = this.scene.tweens.add({
            targets: this,
            shown: 1,
            duration: r.countMs,
            ease: CONFIG.anim.easeInSoft,
            onUpdate: () => this.redraw(),
            onComplete: () => this.lightCandles(onReady)
        });
    }

    redraw() {
        this.rows.forEach((row) => row.text.setText(row.value()));
    }

    lightCandles(onReady) {
        const r = CONFIG.results;

        this.candles.forEach(({ body, flame }, index) => {
            this.scene.tweens.add({
                targets: [body, flame],
                scaleY: 1,
                delay: index * r.candlePopGapMs,
                duration: r.candlePopMs,
                ease: CONFIG.anim.easeIn,
                onComplete: index === this.candles.length - 1
                    ? () => this.offerTheWayOn(onReady)
                    : undefined
            });
        });
    }

    /** A gentle pulse on the prompt, so it reads as "your move". */
    offerTheWayOn(onReady) {
        this.ready = true;
        this.scene.tweens.add({
            targets: this.prompt,
            alpha: 1,
            duration: CONFIG.results.promptFadeMs,
            ease: CONFIG.anim.easeInSoft,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.prompt,
                    alpha: CONFIG.results.promptPulseAlpha,
                    duration: CONFIG.results.promptPulseMs,
                    ease: CONFIG.anim.easeLoop,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        onReady?.();
    }

    /** Space while it is still counting: land every number and candle now. */
    finish() {
        if (this.ready) return false;

        this.countTween?.stop();
        this.shown = 1;
        this.redraw();
        this.scene.tweens.killTweensOf(this.candles.flatMap((c) => [c.body, c.flame]));
        this.candles.forEach(({ body, flame }) => {
            body.setScale(body.scaleX, 1);
            flame.setScale(flame.scaleX, 1);
        });
        this.offerTheWayOn();

        return true;
    }

    /** Fold away completely, then hand over. */
    close(onDone) {
        this.scene.tweens.killTweensOf(this.prompt);
        this.panel.close(() => {
            this.panel.container.destroy();
            onDone?.();
        });
    }
}
