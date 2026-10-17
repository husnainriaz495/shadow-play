import { launch, sleep, DIST_URL, PROFILE } from './cdp.mjs';
const b = await launch(process.argv[2] ?? PROFILE);
try {
    await b.goto(DIST_URL); await sleep(5000);
    console.log('report printed', b.logs.filter((l) => /sound files are still missing/.test(l)).length, 'time(s)');
    b.logs.filter((l) => /Standing in|SILENT/.test(l)).slice(0, 2).forEach((l) => console.log(l.slice(0, 90) + '...'));
    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    console.log('console errors:', errors.length ? errors.join(' | ') : 'none');
} finally { b.close(); }
