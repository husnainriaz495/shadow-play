import { app, BrowserWindow, Menu, net, protocol } from 'electron';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Shadow Play as a desktop app.
 *
 * This file is the WHOLE desktop wrapper. It opens one window and shows the
 * normal Vite production build (`npm run build` -> dist/) inside it. It does
 * not touch src/: the game has no idea it is not in a browser.
 *
 * How the files are served: through a private `app://game/` address instead
 * of `file://`. A real origin means the Content-Security-Policy from
 * SECURITY.md rule 10 applies exactly as it does on Vercel, ES modules and
 * audio loading behave the same as on the web, and the page cannot read
 * any file outside the game folder.
 */

// The built game sits next to this file, in game/ (scripts/stage.mjs puts it there).
const GAME_DIR = join(app.getAppPath(), 'game');
const START_URL = 'app://game/index.html';

// The stage's 16:9 shape, and the `frame` colour from PALETTE.md so the
// window is never white while the game boots.
const WINDOW = { width: 1280, height: 720, minWidth: 640, minHeight: 360 };
const FRAME_COLOUR = '#061014';

// The same policy as vercel.json / SECURITY.md rule 10 (minus
// frame-ancestors, which means nothing outside a website).
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    + "img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self'; "
    + "connect-src 'self'; object-src 'none'; base-uri 'self'";

// Content types for every kind of file in dist/.
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
};

// Must happen before the app is ready. `stream` lets audio be read in parts.
protocol.registerSchemesAsPrivileged([{
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
}]);

/** Answers app://game/<path> with the file from GAME_DIR, and nothing else. */
async function serveGameFile(request) {
    const { pathname } = new URL(request.url);
    const file = normalize(join(GAME_DIR, decodeURIComponent(pathname)));

    // Refuse anything that climbs out of the game folder ("../").
    if (!file.startsWith(GAME_DIR + sep) || !existsSync(file)) {
        return new Response('Not found', { status: 404 });
    }

    const response = await net.fetch(pathToFileURL(file).toString());
    return new Response(response.body, {
        status: 200,
        headers: {
            'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
            'Content-Security-Policy': CSP,
            'X-Content-Type-Options': 'nosniff'
        }
    });
}

function createWindow() {
    const win = new BrowserWindow({
        ...WINDOW,
        useContentSize: true,
        backgroundColor: FRAME_COLOUR,
        title: 'Shadow Play',
        show: false,
        webPreferences: {
            // The page is a plain web page: no Node.js, fully sandboxed.
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            // A desktop game may start its music without a click first.
            autoplayPolicy: 'no-user-gesture-required',
            devTools: !app.isPackaged
        }
    });

    win.once('ready-to-show', () => win.show());

    // The game never leaves its own page or opens new windows.
    win.webContents.on('will-navigate', (event) => event.preventDefault());
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

    win.loadURL(START_URL);
    return win;
}

/**
 * Self-test, used only by `npm run selftest` (scripts/selftest.mjs).
 * Set SHADOW_PLAY_SELFTEST to a folder and the app saves a screenshot of the
 * title screen and a report saying whether the window made any sound, then
 * quits. Without that variable none of this runs.
 */
function runSelfTest(win, outDir) {
    mkdirSync(outDir, { recursive: true });
    const report = { audible: false, audibleAt: [], errors: [] };
    const started = Date.now();

    win.webContents.on('console-message', (details) => {
        if (details.level === 'error') report.errors.push(details.message);
    });
    win.webContents.on('audio-state-changed', (event) => {
        if (event.audible) {
            report.audible = true;
            report.audibleAt.push(Date.now() - started);
        }
    });

    win.webContents.once('did-finish-load', () => {
        setTimeout(async () => {
            const image = await win.webContents.capturePage();
            writeFileSync(join(outDir, 'title.png'), image.toPNG());
            report.audibleNow = win.webContents.isCurrentlyAudible();
            report.title = win.getTitle();
            report.size = win.getContentSize();
            writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
            app.quit();
        }, 8000);
    });
}

app.whenReady().then(() => {
    protocol.handle('app', serveGameFile);

    // No menu bar on Windows. macOS keeps the app menu so Cmd+Q works.
    Menu.setApplicationMenu(process.platform === 'darwin'
        ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'windowMenu' }])
        : null);

    const win = createWindow();

    // The game asks for nothing (no camera, no microphone...). Fullscreen is
    // the one thing it uses (the F key).
    win.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
        callback(permission === 'fullscreen');
    });

    if (process.env.SHADOW_PLAY_SELFTEST) runSelfTest(win, process.env.SHADOW_PLAY_SELFTEST);
});

// Closing the window ends the game, on every platform.
app.on('window-all-closed', () => app.quit());
