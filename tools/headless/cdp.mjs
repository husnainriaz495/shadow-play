// Minimal Chrome DevTools Protocol harness: Node built-ins + local Chrome only.
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Where Chrome is, and what to point it at. Every one of these can be
 * overridden with an environment variable, because the two machines this
 * was written on do not agree about any of them:
 *
 *   CHROME=/usr/bin/google-chrome  GAME_URL=http://localhost:8080/  node test-flow.mjs
 */
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT ?? 9333);

/** The dev server (npm run dev), and the built game (serve-dist.mjs). */
export const URL = process.env.GAME_URL ?? 'http://localhost:5199/';
export const DIST_URL = process.env.DIST_URL ?? 'http://localhost:5311/';

/**
 * Chrome's scratch profile; it is only ever used by these scripts, and it
 * lives OUTSIDE the repo on purpose. Chrome keeps a locked
 * `CrashpadMetrics.pma` in there, and Vite's file watcher dies on it
 * (EBUSY) the moment a profile appears anywhere under the project.
 */
export const PROFILE = process.env.CHROME_PROFILE ?? join(tmpdir(), 'shadow-play-chrome');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Where Chrome keeps the scratch profile for a run.
 *
 * Two traps, both of which cost an evening on 2026-10-18:
 *  - Chrome 155 REFUSES a relative `--user-data-dir`. It exits 21 with no
 *    message, the debugging port never opens, and the only symptom is
 *    `targets` being undefined further down. So: always absolute.
 *  - Every script passes `.` as its first argument, which would hand
 *    Chrome the harness folder itself to scribble a profile into. That
 *    argument is a leftover; `.` means "the default", which is in the
 *    system temp folder, well away from Vite's watcher.
 */
const profilePath = (dir) => resolve(!dir || dir === '.' ? PROFILE : dir);

/**
 * If a browser is already on the debugging port it is a LEAK from an
 * earlier run, not something to reuse: attaching to it quietly is how one
 * browser survived from one evening to the next, playing the game's music
 * out of the speakers the whole time. Ask it to quit first.
 */
async function closeAnyLeftover() {
    try {
        const info = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
        const ws = new WebSocket(info.webSocketDebuggerUrl);

        console.log('  [cdp] a browser from an earlier run was still on port ' + PORT + '; closing it');
        await new Promise((r) => ws.addEventListener('open', r));
        ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
        ws.close();
    } catch { /* nothing there, which is the normal case */ }

    // WAIT for the port to actually go quiet. A fixed sleep is not enough:
    // Chrome answers /json/version for a second or two while it is dying,
    // and a new run that connects in that window gets a websocket to the
    // corpse -- which looks like a test hanging on an unsettled await.
    for (let i = 0; i < 40; i++) {
        try {
            await fetch(`http://127.0.0.1:${PORT}/json/version`);
        } catch {
            return;                       // nothing answering: the port is free
        }
        await sleep(250);
    }

    console.log('  [cdp] WARNING: port ' + PORT + ' is still answering; the run may attach to it');
}

export async function launch(profileDir) {
    await closeAnyLeftover();

    const proc = spawn(CHROME, [
        '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profilePath(profileDir)}`,
        '--window-size=1280,720', '--autoplay-policy=no-user-gesture-required',
        // The test browser must never be HEARD. Autoplay is allowed above
        // so the sound code really runs and can be inspected, which means
        // without this the game's music plays out of the speakers of
        // whoever is sitting there -- a second copy of the track, out of
        // phase with the one they are actually playing, and deaf to the
        // volume sliders because it is a different browser.
        '--mute-audio',
        '--no-first-run', '--no-default-browser-check', 'about:blank'
    ], { stdio: 'ignore' });
    let targets;
    for (let i = 0; i < 50; i++) {
        try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.some((t) => t.type === 'page')) break; } catch { /* not up yet */ }
        await sleep(200);
    }
    if (!targets) {
        throw new Error(`Chrome never opened the debugging port ${PORT}. It exits 21 and says nothing ` +
            'when --user-data-dir is relative or unwritable; check CHROME and CHROME_PROFILE.');
    }

    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0; const pending = new Map(); const logs = [];
    ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
        if (msg.method === 'Runtime.consoleAPICalled') logs.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
        if (msg.method === 'Runtime.exceptionThrown') logs.push(`EXCEPTION: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
    });
    const send = (method, params = {}) => new Promise((resolve) => { const mid = ++id; pending.set(mid, resolve); ws.send(JSON.stringify({ id: mid, method, params })); });
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

    const evaluate = async (expression) => {
        const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? JSON.stringify(r.result.exceptionDetails));
        return r.result?.result?.value;
    };

    const KEYS = {
        ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, Space: 32, Escape: 27,
        Digit1: 49, Digit2: 50, Digit3: 51, KeyQ: 81, KeyE: 69, KeyR: 82, KeyW: 87, KeyA: 65,
        KeyD: 68, KeyN: 78, KeyP: 80, KeyH: 72, KeyM: 77, KeyF: 70, KeyS: 83, KeyB: 66, Enter: 13
        // A key missing from here gets no virtual key code, so Phaser
        // never sees the press and the test "proves" the game ignores it.
    };
    const key = async (code, type) => {
        const vk = KEYS[code];
        const k = code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Digit') ? code.slice(5) : code === 'Space' ? ' ' : code;
        await send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    };
    const down = (c) => key(c, 'keyDown');
    const up = (c) => key(c, 'keyUp');
    const tap = async (c, ms = 60) => { await down(c); await sleep(ms); await up(c); };
    const hold = async (c, ms) => { await down(c); await sleep(ms); await up(c); };

    /** Find the running Phaser.Game without any hook in the game code: queryObjects on its prototype. */
    const attachGame = async () => {
        // Wait for Phaser to have been FETCHED rather than guessing with a
        // sleep: on a cold profile the first load is slow, and "Failed to
        // resolve module specifier 'undefined'" is only ever this, asked
        // too early.
        for (let i = 0; i < 60; i++) {
            const got = await evaluate(`(() => {
                const names = performance.getEntriesByType('resource').map((e) => e.name);
                // Vite dev serves /deps/phaser.js; the production build emits
                // assets/phaser-<hash>.js (its own manualChunks entry).
                return names.find((n) => n.includes('/deps/phaser.js'))
                    ?? names.find((n) => n.includes('/phaser') && n.endsWith('.js'))
                    ?? null;
            })()`);

            if (got) break;
            if (i === 59) throw new Error('Phaser was never loaded by the page -- is the dev server running?');
            await sleep(250);
        }

        await evaluate(`(async () => {
            const names = performance.getEntriesByType('resource').map((e) => e.name);
            const url = names.find((n) => n.includes('/deps/phaser.js'))
                ?? names.find((n) => n.includes('/phaser') && n.endsWith('.js'));
            window.__phaserMod = await import(url);
        })()`);
        const proto = await send('Runtime.evaluate', { expression: '(window.__phaserMod.default || window.__phaserMod).Game.prototype' });
        const found = await send('Runtime.queryObjects', { prototypeObjectId: proto.result.result.objectId });
        await send('Runtime.callFunctionOn', { objectId: found.result.objects.objectId, functionDeclaration: 'function () { window.__g = this[0]; }' });
        return evaluate('!!window.__g');
    };

    /**
     * Put a KNOWN saved record in place and reload, so a test never
     * inherits whatever the last one left behind. The default leaves an
     * unfinished run with every act reached, which is the state where
     * Space on the title goes straight into the game.
     */
    const seedSave = async (record = {}) => {
        const base = { version: 1, highestAct: 5, completed: false,
            settings: { master: 8, music: 5, sfx: 8, reduceMotion: false } };

        await evaluate(`localStorage.setItem('shadow-play.save', `
            + `'${JSON.stringify({ ...base, ...record })}')`);
    };

    /**
     * How many acts the game has, read from the running build. Tests must
     * never hard-code "the finale is act 3": adding an act renumbers it.
     * The finale is actCount(); the ending is actCount() + 1.
     */
    const actCount = async () => {
        await evaluate(`window.__mod = (path) => import(performance.getEntriesByType('resource')`
            + `.map((e) => e.name).filter((n) => n.includes(path)).pop())`);
        return evaluate(`(async () => (await __mod('/src/levels/index.js')).ACT_COUNT)()`);
    };

    /** PNG of the page; clip {x,y,width,height} in CSS px, scale enlarges it. */
    const screenshot = async (file, clip) => {
        const params = { format: 'png' };
        if (clip) params.clip = { ...clip, scale: clip.scale ?? 1 };
        const r = await send('Page.captureScreenshot', params);
        (await import('node:fs')).writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    };

    /**
     * Shut the browser down for real.
     *
     * WHY it is not just `proc.kill()`: on Windows the chrome.exe we spawn
     * hands over to a separate browser process and exits, so killing our
     * child leaves the actual browser running -- for days, with the game
     * still open and its music still looping. `Browser.close` asks Chrome
     * itself to quit, which it does; the kill is only the backstop.
     */
    const close = () => {
        try { ws.send(JSON.stringify({ id: ++id, method: 'Browser.close' })); } catch { /* already gone */ }
        try { ws.close(); } catch { /* already closed */ }
        proc.kill();
    };

    // A test that throws, times out or is interrupted must not leak a
    // browser either, so the exits that Node lets us see also close it.
    process.once('exit', close);
    process.once('SIGINT', () => { close(); process.exit(130); });

    /**
     * A value out of the game's own CONFIG, by dotted path -- so a test
     * never hardcodes a number or a word that config.js owns. Changing
     * CONFIG.ending.finalWords should not break three test files.
     */
    const config = async (dotted) => {
        await evaluate(`window.__mod = window.__mod ?? ((path) => import(` +
            `performance.getEntriesByType('resource').map((e) => e.name)` +
            `.filter((n) => n.includes(path)).pop()))`);

        return evaluate(`(async () => ${JSON.stringify(dotted)}.split('.')` +
            `.reduce((v, k) => v[k], (await __mod('/src/config.js')).CONFIG))()`);
    };

    return { send, evaluate, screenshot, down, up, tap, hold, attachGame, actCount, seedSave, config, logs, close,
        goto: async (url) => { await send('Page.navigate', { url }); } };
}
