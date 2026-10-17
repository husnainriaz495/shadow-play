/**
 * The two reading pages on the menu, HOW TO PLAY and CREDITS.
 *
 * It exists for ONE reason: their two-column rows must really be two
 * columns. They used to be single strings padded with spaces, and the
 * theatre font is proportional, so "walk", "jump" and "pause" each landed
 * somewhere different. The same trap caught the settings bars twice.
 *
 * So this measures the actual x of every body line and insists the second
 * column is a single column -- on each page, and between them.
 */
import { launch, sleep, URL, PROFILE } from './cdp.mjs';

const b = await launch(process.argv[2] ?? PROFILE);
let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
    console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (ok ? '' : '  -> ' + detail));
    ok ? pass++ : fail++;
};

const T = `__g.scene.getScene('TitleScene')`;

/** Open a menu entry by its label, from a freshly built title screen. */
const open = async (label) => {
    await b.evaluate(`__g.scene.stop('TitleScene'); __g.scene.start('TitleScene', {})`);
    await sleep(1800);

    for (let i = 0; i < 12; i++) {
        const texts = JSON.parse(await b.evaluate(`JSON.stringify(${T}.page.menu.texts.map(t => t.text))`));
        if (texts[await b.evaluate(`${T}.page.menu.selected`)] === label) {
            await b.tap('Enter');
            await sleep(900);
            return;
        }
        await b.tap('ArrowDown');
        await sleep(140);
    }
    throw new Error('never reached ' + label);
};

/**
 * The left-aligned body lines of the open page, as { x, text }. The
 * heading and BACK are centred, so filtering on originX leaves exactly
 * the lines that are supposed to sit on a margin.
 */
const bodyLines = async () => JSON.parse(await b.evaluate(`JSON.stringify(
    ${T}.page.panel.container.list
        .filter(o => o.type === 'Text' && o.originX === 0)
        .map(o => ({ x: Math.round(o.x), y: Math.round(o.y), w: Math.round(o.width), text: o.text })))`));

const columnsOf = (lines) => [...new Set(lines.map((l) => l.x))].sort((a, c) => a - c);

try {
    await b.goto(URL); await sleep(3800); await b.attachGame();
    const columnX = await b.config('title.textPage.columnX');
    console.log('  CONFIG.title.textPage.columnX =', columnX);

    const pages = {};

    for (const label of ['HOW TO PLAY', 'CREDITS']) {
        await open(label);
        const lines = await bodyLines();
        const columns = columnsOf(lines);
        pages[label] = { lines, columns };

        console.log(`\n--- ${label}: ${lines.length} lines on x = ${columns.join(', ')} ---`);

        check(`${label} sits on exactly two columns`, columns.length === 2,
            `found ${columns.length}: ${columns.join(', ')}`);
        check(`${label}'s second column is columnX past the first`,
            columns.length === 2 && columns[1] - columns[0] === columnX,
            `${columns[1] - columns[0]} px apart, expected ${columnX}`);

        // Every value in a row must start on the column, not wherever the
        // label happened to end.
        const strays = lines.filter((l) => !columns.includes(l.x));
        check(`${label} has no line off both columns`, strays.length === 0, JSON.stringify(strays));
    }

    console.log('\n--- the two pages agree with each other ---');
    const how = pages['HOW TO PLAY'].columns;
    const credits = pages.CREDITS.columns;
    check('both pages share the same left margin', how[0] === credits[0], `${how[0]} vs ${credits[0]}`);
    check('...and the same second column', how[1] === credits[1], `${how[1]} vs ${credits[1]}`);

    console.log('\n--- and a value never collides with its label ---');
    // Only the labels that HAVE a value beside them: a paragraph line is
    // allowed to run past the column, because nothing sits there.
    Object.entries(pages).forEach(([label, { lines, columns }]) => {
        const rows = lines
            .filter((l) => l.x === columns[1])
            .map((value) => ({ value, label: lines.find((l) => l.x === columns[0] && l.y === value.y) }))
            .filter((row) => row.label);

        const tightest = rows.reduce((worst, row) => {
            const gap = columnX - row.label.w;

            return worst === null || gap < worst.gap ? { gap, text: row.label.text } : worst;
        }, null);

        console.log(`  ${label}: ${rows.length} label/value rows` +
            (tightest ? `, tightest "${tightest.text}" with ${tightest.gap} px to spare` : ''));
        check(`${label} never runs a label into its value`,
            rows.length === 0 || tightest.gap > 0, JSON.stringify(tightest));
    });

    const errors = b.logs.filter((l) => /error|EXCEPTION/i.test(l));
    check('no console errors', errors.length === 0, errors.join(' | '));
} finally { b.close(); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
