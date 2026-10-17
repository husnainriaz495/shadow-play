/**
 * The M6 acceptance item: a FULL playthrough, title -> the last words,
 * with no
 * scene jumps and no dev keys. Every act is reached through its own door
 * and every act card and curtain is played, exactly as a judge will see
 * it. Saved progress is cleared first, so it starts at Act 1 like a
 * first-time player.
 */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
const out = process.argv[3];
const G = `__g.scene.getScene('GameScene')`;
const st = () => b.evaluate(`(() => { const scenes = __g.scene.getScenes(true).map(s => s.scene.key).join(','); const g = ${G};
  if (!g?.player?.body || !g.scene.isActive()) return { scenes };
  const p = g.player, c = (g.objects ?? []).find(o => o.constructor.name === 'Crate');
  return { act: g.actNumber, x: Math.round(p.x), feet: Math.round(p.feetY), size: p.state.name,
           onGround: p.body.blocked.down, wax: Math.round(g.candle.wax),
           crateBottom: c ? Math.round(c.body.bottom) : null, scenes }; })()`);
const until = async (cond, ms, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const s = await st(); if (s && cond(s)) return s; await sleep(35); }
    throw new Error('timed out: ' + label + ' | last ' + JSON.stringify(await st()));
};
/**
 * Between acts there are now TWO cards: the results for the act just
 * finished, which waits on a key, and then the next act's own card.
 * Press through both rather than counting presses.
 */
const throughCards = async (act) => {
    const start = Date.now();

    while (Date.now() - start < 25000) {
        const q = await st();

        if (q.act === act && q.onGround) return q;
        await b.tap('Space');
        await sleep(650);
    }

    throw new Error('never got through the cards to act ' + act);
};
let t0;
const log = (step, s) => (s?.wax !== undefined && (lastLive = s), console.log(`  ${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s  ${step.padEnd(40)}` +
    (s?.x === undefined ? s?.scenes ?? '' : `x=${s.x} feet=${s.feet} ${s.size} wax=${s.wax}`)));

/**
 * The difficulty curve, measured rather than asserted: how long each act
 * took and how much candle was left at its door. It should get harder.
 */
const scores = [];
let actStartedAt = 0;
let lastLive = null;      // the last reading taken while the act was still up

const finished = (act) => {
    scores.push({ act, seconds: (Date.now() - actStartedAt) / 1000, wax: lastLive?.wax ?? NaN });
    actStartedAt = Date.now();
};

try {
    // A FIRST-TIME player: no saved record at all, so the menu offers
    // only "Start the Show" and Space begins Act 1. (Deliberately not
    // seeded -- this run is the whole game from nothing.)
    await b.goto(URL); await sleep(1000);
    await b.evaluate(`localStorage.clear()`);
    await b.goto(URL); await sleep(3500); await b.attachGame();
    t0 = Date.now();
    actStartedAt = Date.now();

    console.log('\n--- the title screen ---');
    if (out) await b.screenshot(`${out}/play-0-title.png`);
    await b.tap('Space');
    let s = await until((q) => q.act === 1 && q.onGround, 6000, 'Act 1 starts');
    log('Space: the curtain opens on Act 1', s);
    if (out) await b.screenshot(`${out}/play-1-act1.png`);

    console.log('\n--- Act I: the pillar ---');
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 480, 6000, 'reach the pillar'); log('walked to the pillar', s);
    await b.tap('Digit1'); s = await until((q) => q.size === 'Tiny', 2000, 'shrink'); log('shrank to Tiny', s);
    s = await until((q) => q.x >= 620, 6000, 'crawl through'); log('crawled under the pillar', s);
    await b.tap('Digit2'); s = await until((q) => q.size === 'Normal', 2000, 'back to Normal'); log('grew back to Normal', s);
    s = await until((q) => q.x >= 840, 6000, 'reach the step');
    await b.down('Space'); await sleep(340); await b.up('Space');
    s = await until((q) => q.feet === 600 && q.onGround, 4000, 'clear the 2-tile step'); log('jumped the two-tile step', s);
    s = await until((q) => q.scenes.includes('ActCardScene'), 8000, 'reach the Act 1 door');
    await b.up('ArrowRight');
    finished(1);
    log('reached the door -> act card', s);
    if (out) await b.screenshot(`${out}/play-2-card2.png`);

    console.log('\n--- Act II: the giant ---');
    s = await throughCards(2); log('the curtain opens on Act 2', s);
    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 2000, 'grow'); log('grew Huge', s);
    await b.down('ArrowRight');
    await until((q) => q.x >= 225, 5000, 'reach the ledge');
    await b.down('Space'); await sleep(350); await b.up('Space');
    s = await until((q) => q.feet === 560 && q.onGround, 4000, 'onto the ledge'); log('climbed the three-tile ledge', s);
    s = await until((q) => q.crateBottom === 600, 12000, 'crate into the notch'); log('pushed the crate onto the switch', s);
    for (let i = 0; i < 6 && (await st()).x < 760; i++) { await b.down('Space'); await sleep(300); await b.up('Space'); await sleep(500); }
    s = await until((q) => q.x >= 760 && q.onGround, 7000, 'past the crate'); log('hopped over the crate', s);
    await b.up('ArrowRight');
    await b.tap('Digit2'); s = await until((q) => q.size === 'Normal', 2000, 'shrink'); log('shrank for the gate doorway', s);
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 975, 8000, 'through the gate'); log('walked through the open gate', s);
    await b.up('ArrowRight'); await sleep(200);
    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 2000, 'grow'); log('grew Huge again', s);
    await b.down('ArrowRight'); await sleep(150);
    await b.down('Space'); await sleep(350); await b.up('Space');
    s = await until((q) => q.feet === 440 && q.onGround, 4000, 'the door ledge'); log('climbed to the door', s);
    s = await until((q) => q.scenes.includes('ActCardScene'), 8000, 'reach the Act 2 door');
    await b.up('ArrowRight');
    finished(2);
    log('reached the door -> act card', s);
    if (out) await b.screenshot(`${out}/play-3-card3.png`);

    console.log('\n--- Act III: moths to the flame ---');
    s = await throughCards(3); log('the curtain opens on Act 3', s);
    if (out) await b.screenshot(`${out}/play-3b-act3.png`);
    // Small through the corridor: Huge (4 tiles) does not fit in 3.
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 980, 16000, 'through the corridor'); log('ran the moth corridor small', s);
    await b.up('ArrowRight');
    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 2500, 'grow'); log('grew Huge for the climb', s);
    await b.down('ArrowRight'); await sleep(150);
    await b.down('Space'); await sleep(350); await b.up('Space');
    s = await until((q) => q.feet === 560 && q.onGround, 5000, 'onto the ledge'); log('climbed the three-tile ledge', s);
    s = await until((q) => q.scenes.includes('ActCardScene'), 9000, 'reach the Act 3 door');
    await b.up('ArrowRight');
    finished(3);
    log('reached the door -> act card', s);

    console.log('\n--- Act IV: the draft ---');
    s = await throughCards(4); log('the curtain opens on Act 4', s);
    if (out) await b.screenshot(`${out}/play-3c-act4.png`);

    // Run to the lip of the gap and stop there.
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 630, 16000, 'the lip of the gap'); log('ran to the edge of the gap', s);
    await b.up('ArrowRight');
    await sleep(500);

    // THE PUZZLE: the gap is wider than any jump. Wait out a gust, then
    // jump INTO the next one -- the wind carries a tiny shadow across.
    const gusting = async (want) => {
        const t0 = Date.now();
        while (Date.now() - t0 < 16000) {
            if (await b.evaluate(`${G}.wind.blowing`) === want) return;
            await sleep(60);
        }
        throw new Error(want ? 'no gust came' : 'the gust never passed');
    };
    await gusting(false);
    log('waited at the edge for still air', await st());
    await gusting(true);
    await b.down('ArrowRight'); await sleep(60);
    await b.down('Space'); await sleep(320); await b.up('Space');
    s = await until((q) => q.x >= 900 && q.onGround, 7000, 'across the gap');
    await b.up('ArrowRight');
    log('rode the gust across the gap', s);

    // The climb needs Huge, and a gust would take it straight back.
    await gusting(false);
    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 2500, 'grow'); log('grew Huge between gusts', s);
    await b.down('ArrowRight'); await sleep(150);
    await b.down('Space'); await sleep(350); await b.up('Space');
    s = await until((q) => q.feet === 560 && q.onGround, 5000, 'onto the ledge'); log('climbed to the door ledge', s);
    s = await until((q) => q.scenes.includes('ActCardScene'), 9000, 'reach the Act 4 door');
    await b.up('ArrowRight');
    finished(4);
    log('reached the door -> act card', s);

    console.log('\n--- Finale: the stage is on fire ---');
    s = await throughCards(5); log('the curtain opens on the finale', s);
    if (out) await b.screenshot(`${out}/play-4-finale.png`);
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 300, 4000, 'run to the wall'); log('ran from the fire', s);
    await b.tap('Digit1'); s = await until((q) => q.size === 'Tiny', 2000, 'shrink'); log('shrank to crawl', s);
    s = await until((q) => q.x >= 440, 4000, 'crawl'); log('crawled through the gap', s);
    await b.up('ArrowRight');
    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 2000, 'grow'); log('grew Huge', s);
    await b.down('ArrowRight'); await sleep(120);
    await b.down('Space'); await sleep(350); await b.up('Space');
    s = await until((q) => q.feet === 560 && q.onGround, 4000, 'onto the block'); log('climbed onto the stone block', s);
    await b.up('ArrowRight');
    // Shrink ON the block: the hanging slab starts a tile past its right
    // edge, so Huge cannot walk off that way.
    await b.tap('Digit2'); s = await until((q) => q.size === 'Normal', 2000, 'Normal'); log('back to Normal for the passage', s);
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 740 && q.feet === 680 && q.onGround, 5000, 'off the block'); log('dropped off, past the shelter', s);
    s = await until((q) => q.x >= 880, 5000, 'the passage'); log('through the low passage', s);
    await b.up('ArrowRight'); await sleep(150);

    // The final exam: Huge to shove the crate flush against the last
    // ledge, which is FOUR tiles -- one more than any jump in the game.
    await b.tap('Digit3'); s = await until((q) => q.size === 'Huge', 2000, 'grow'); log('grew Huge to push the crate', s);
    await b.down('ArrowRight');
    s = await until((q) => q.x >= 920, 6000, 'push the crate'); await sleep(900);
    await b.up('ArrowRight'); log('pushed the crate against the ledge', s);
    await b.tap('Digit2'); await until((q) => q.size === 'Normal', 2000, 'Normal');
    await b.down('ArrowRight'); await sleep(100);
    await b.down('Space'); await sleep(320); await b.up('Space');
    s = await until((q) => q.feet === 600 && q.onGround, 4000, 'onto the crate'); log('stepped up onto the crate', s);
    await b.down('Space'); await sleep(320); await b.up('Space');
    s = await until((q) => q.feet === 520 && q.onGround, 4000, 'the door ledge'); log('climbed the last ledge', s);
    s = await until((q) => q.scenes.includes('EndScene'), 6000, 'reach the last door');
    await b.up('ArrowRight');
    finished(5);
    log('reached the last door -> the ending', s);

    console.log('\n--- the ending ---');
    await sleep(2500);
    if (out) await b.screenshot(`${out}/play-5-bow.png`);
    const words = await b.config('ending.finalWords');
    const fin = await (async () => {
        for (let i = 0; i < 60; i++) {
            const texts = await b.evaluate(`JSON.stringify(__g.scene.getScene('EndScene')
                .children.list.filter(o => o.type === 'Text').map(o => o.text))`);
            if (texts.includes(words)) return texts;
            await sleep(300);
        }
        throw new Error(`the last words (${words}) never appeared`);
    })();
    log('the candle went out, the curtain closed', { scenes: fin });
    if (out) await b.screenshot(`${out}/play-6-fin.png`);

    console.log('');
    console.log('  --- the difficulty curve, as played ---');
    console.log('  act       time     wax left at the door');
    scores.forEach(({ act, seconds, wax }) => {
        console.log(`  ${String(act).padEnd(9)} ${seconds.toFixed(1).padStart(5)}s   ${String(Math.round(wax)).padStart(4)}%`);
    });

    console.log(`\n  COMPLETE: title -> "${words}" in ${((Date.now() - t0) / 1000).toFixed(1)} s, no scene jumps, no dev keys.`);
} catch (e) {
    console.log('\n  STOPPED: ' + e.message);
    process.exitCode = 1;
} finally {
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    console.log('  console errors:', errors.length ? errors.join(' | ') : 'none');
    b.close();
}
