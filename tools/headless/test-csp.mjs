import { launch, sleep, DIST_URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok ? '' : '  -> ' + d)); ok ? pass++ : fail++; };
const out = process.argv[3];
try {
    // The PRODUCTION build, served with the exact headers from vercel.json.
    // No __g here: the minified bundle is not the dev module graph, so this
    // drives the game the way a player does -- keys and pictures only.
    await b.goto(DIST_URL); await sleep(4500);

    check('the header is actually applied', await b.evaluate(
        `!!document.querySelector('meta[name=theme-color]')`));
    check('the built game put a canvas on the page',
        await b.evaluate(`document.querySelector('canvas') !== null`));
    check('...and it is the full stage',
        await b.evaluate(`document.querySelector('canvas').width`) === 2816,
        await b.evaluate(`document.querySelector('canvas').width + 'px'`));

    if (out) await b.screenshot(`${out}/csp-title.png`);
    await b.tap('Space'); await sleep(2800);
    await b.hold('ArrowRight', 900);
    await b.tap('KeyW'); await sleep(500);
    await b.tap('KeyE'); await sleep(600);     // grow: afterimage + light breath
    await b.tap('KeyQ'); await sleep(600);
    if (out) await b.screenshot(`${out}/csp-act.png`);
    await b.tap('KeyR'); await sleep(1200);    // the curtain flick
    if (out) await b.screenshot(`${out}/csp-after-restart.png`);

    const blocked = b.logs.filter((l) => /Content-Security-Policy|Refused to/i.test(l));
    check('nothing is blocked by the Content-Security-Policy', blocked.length === 0, blocked.join(' | '));
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors on the built game', errors.length === 0, errors.join(' | '));
} finally { b.close(); }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
