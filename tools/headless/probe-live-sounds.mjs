/**
 * "What is actually making a noise?"
 *
 * Lists every sound Phaser is holding, at the title, during an act and
 * across restarts, with its volume -- so a background hum can be traced
 * to a track that is playing twice, a loop that was never stopped, or
 * (as on 2026-10-18) a leaked test browser playing its own copy.
 *
 * A probe, not a test: it asserts nothing and just prints.
 */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';

const b = await launch(process.argv[2] ?? PROFILE);

const list = async (where) => {
    const sounds = JSON.parse(await b.evaluate(
        `JSON.stringify(__g.sound.sounds.map(s => ({ key: s.key, playing: s.isPlaying, loop: s.loop, vol: +s.volume.toFixed(3) })))`));

    console.log('\n' + where + (sounds.length ? '' : '   (nothing)'));
    sounds.forEach((s) => console.log(`    ${s.playing ? 'PLAYING' : 'stopped'}  ${s.key}${s.loop ? ' (loop)' : ''}  vol ${s.vol}`));
};

try {
    await b.goto(URL); await sleep(3500); await b.attachGame();
    await list('title screen');
    await b.tap('Space'); await sleep(2500);
    await list('act 1');
    await b.tap('KeyR'); await sleep(2500);
    await list('after an R restart');
    await b.tap('KeyR'); await sleep(2500);
    await list('after a second R restart');
    console.log(`\n  muted: ${await b.evaluate('__g.sound.mute')}`);
} finally { b.close(); }
