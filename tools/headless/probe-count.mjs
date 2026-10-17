import { launch, sleep, DIST_URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
try {
    // Injected BEFORE any page script runs, so nothing can slip past it.
    await b.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `window.__calls = 0; const real = console.log.bind(console);
            console.log = (...a) => { if (String(a[0]).includes('sound files')) window.__calls++; real(...a); };`
    });
    await b.goto(DIST_URL); await sleep(5500);
    console.log('calls inside the page:', await b.evaluate(`window.__calls`));
    console.log('harness captured   :', b.logs.filter((l) => /sound files are still missing/.test(l)).length);
} finally { b.close(); }
