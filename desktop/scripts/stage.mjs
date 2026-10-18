// Builds the game and lays out the app folder Electron runs:
//
//   desktop/build/app/
//     package.json   name, version, entry point
//     main.js        the window (desktop/main.js)
//     game/          the Vite production build (dist/)
//
// Run by `npm start` and by build.mjs. Never changes anything in src/.
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DESKTOP = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = join(DESKTOP, '..');
export const BUILD = join(DESKTOP, 'build');
export const APP = join(BUILD, 'app');

export function stage() {
    console.log('> npm run build (the game, into dist/)');
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

    rmSync(APP, { recursive: true, force: true });
    mkdirSync(APP, { recursive: true });

    cpSync(join(ROOT, 'dist'), join(APP, 'game'), { recursive: true });
    cpSync(join(DESKTOP, 'main.js'), join(APP, 'main.js'));

    // The version comes from the game's own package.json, so there is one.
    const game = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    writeFileSync(join(APP, 'package.json'), JSON.stringify({
        name: 'shadow-play',
        productName: 'Shadow Play',
        version: game.version,
        description: game.description,
        license: game.license,
        type: 'module',
        main: 'main.js'
    }, null, 2));

    console.log('> staged ' + APP);
}

// `node scripts/stage.mjs` on its own just stages.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) stage();
