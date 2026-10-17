import { launch, sleep, URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
try {
    await b.goto(URL); await sleep(5000);
    const reports = b.logs.filter((l) => /sound files are still missing/.test(l)).length;
    console.log('report printed', reports, 'time(s)');
    console.log('preload scene created:', await b.evaluate(`document.querySelectorAll('canvas').length`), 'canvas');
} finally { b.close(); }
