// Makes the desktop builds, all into desktop/out/ (git-ignored):
//
//   ShadowPlay-win-x64.zip     Windows: unzip, run "Shadow Play.exe"
//   Shadow Play-win32-x64/     the same thing unzipped, for testing
//   ShadowPlay-mac-arm64.zip   macOS on Apple Silicon (M1 and newer)
//   ShadowPlay-mac-x64.zip     macOS on Intel
//
//   node scripts/build.mjs          everything
//   node scripts/build.mjs --win    Windows only
//   node scripts/build.mjs --mac    macOS only
//
// Windows is made with @electron/packager. macOS is made by hand, because
// packager cannot make a working .app on Windows: an .app is full of
// symlinks, which Windows cannot create on disk. So for macOS we never
// unzip anything: we read Electron's official macOS zip entry by entry and
// write a new zip, copying every entry (symlinks included) as it is and
// adding the game. The .app is unsigned; README.md says how to open it.
import { downloadArtifact } from '@electron/get';
import { packager } from '@electron/packager';
import { createWriteStream, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import yauzl from 'yauzl';
import yazl from 'yazl';
import { APP, BUILD, DESKTOP, ROOT, stage } from './stage.mjs';

const OUT = join(DESKTOP, 'out');
const NAME = 'Shadow Play';
const BUNDLE_ID = 'com.shadowplay.game';
const ELECTRON_VERSION = JSON.parse(
    readFileSync(join(DESKTOP, 'node_modules', 'electron', 'package.json'), 'utf8')).version;

const args = process.argv.slice(2);
const doWin = args.length === 0 || args.includes('--win');
const doMac = args.length === 0 || args.includes('--mac');

// ---------------------------------------------------------------- icons ----

// The only square art is the 64 x 64 candle favicon. Both icon formats can
// simply hold a PNG, so no image library is needed.
const FAVICON = readFileSync(join(ROOT, 'public', 'favicon.png'));

/** A Windows .ico holding one 64 x 64 PNG. */
function makeIco(png) {
    const header = Buffer.alloc(6 + 16);
    header.writeUInt16LE(0, 0);          // reserved
    header.writeUInt16LE(1, 2);          // type: icon
    header.writeUInt16LE(1, 4);          // one image
    header.writeUInt8(64, 6);            // width
    header.writeUInt8(64, 7);            // height
    header.writeUInt16LE(1, 10);         // colour planes
    header.writeUInt16LE(32, 12);        // bits per pixel
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(22, 18);        // the PNG starts right after this header
    return Buffer.concat([header, png]);
}

/** A macOS .icns holding one 64 x 64 PNG ('icp6'). */
function makeIcns(png) {
    const entry = Buffer.alloc(8);
    entry.write('icp6', 0, 'ascii');
    entry.writeUInt32BE(8 + png.length, 4);
    const header = Buffer.alloc(8);
    header.write('icns', 0, 'ascii');
    header.writeUInt32BE(8 + 8 + png.length, 4);
    return Buffer.concat([header, entry, png]);
}

// ---------------------------------------------------------------- zips -----

/** Every file under a folder, as paths relative to it, with / separators. */
function listFiles(dir) {
    return readdirSync(dir, { recursive: true })
        .filter((p) => statSync(join(dir, p)).isFile())
        .map((p) => p.split('\\').join('/'));
}

/** Starts a zip; returns it and a promise that settles when it is on disk. */
function newZip(path) {
    const zip = new yazl.ZipFile();
    const done = new Promise((resolve, reject) => {
        zip.outputStream.pipe(createWriteStream(path)).on('close', resolve).on('error', reject);
    });
    return { zip, done };
}

const openZip = (path) => new Promise((resolve, reject) =>
    yauzl.open(path, { lazyEntries: true }, (err, zip) => (err ? reject(err) : resolve(zip))));

const openEntry = (zip, entry) => new Promise((resolve, reject) =>
    zip.openReadStream(entry, (err, stream) => (err ? reject(err) : resolve(stream))));

async function readAll(stream) {
    const parts = [];
    for await (const part of stream) parts.push(part);
    return Buffer.concat(parts);
}

// -------------------------------------------------------------- Windows ----

async function buildWindows() {
    console.log('\n> Windows x64');
    const icon = join(BUILD, 'icon.ico');
    writeFileSync(icon, makeIco(FAVICON));

    const [folder] = await packager({
        dir: APP,
        out: OUT,
        name: NAME,
        platform: 'win32',
        arch: 'x64',
        electronVersion: ELECTRON_VERSION,
        icon,
        asar: false,          // the game is plain files in resources/app
        prune: false,         // the staged app has no node_modules at all
        overwrite: true,
        appCopyright: 'MIT licence. See README.md and CREDITS.md.',
        win32metadata: { ProductName: NAME, FileDescription: NAME, CompanyName: 'Shadow Play team' }
    });

    // Zip the folder, inside a "Shadow Play" folder so unzipping is tidy.
    const zipPath = join(OUT, 'ShadowPlay-win-x64.zip');
    const { zip, done } = newZip(zipPath);
    for (const file of listFiles(folder)) {
        zip.addFile(join(folder, file), `${NAME}/${file}`);
    }
    zip.end();
    await done;
    console.log('> wrote ' + zipPath);
}

// ---------------------------------------------------------------- macOS ----

async function buildMac(arch) {
    console.log(`\n> macOS ${arch}`);
    const source = await downloadArtifact({
        version: ELECTRON_VERSION, platform: 'darwin', arch, artifactName: 'electron'
    });

    const zipPath = join(OUT, `ShadowPlay-mac-${arch}.zip`);
    const { zip: out, done } = newZip(zipPath);
    const appRoot = `${NAME}/${NAME}.app/`;
    const icns = makeIcns(FAVICON);

    const input = await openZip(source);
    await new Promise((resolve, reject) => {
        input.on('error', reject);
        input.on('end', resolve);
        input.on('entry', async (entry) => {
            try {
                await copyMacEntry(input, entry, out, appRoot, icns);
                input.readEntry();
            } catch (err) {
                reject(err);
            }
        });
        input.readEntry();
    });

    // The game itself goes where Electron looks for an app: Resources/app.
    for (const file of listFiles(APP)) {
        out.addFile(join(APP, file), `${appRoot}Contents/Resources/app/${file}`, { mode: 0o100644 });
    }
    out.addBuffer(Buffer.from(MAC_README), `${NAME}/READ ME FIRST.txt`, { mode: 0o100644 });

    out.end();
    await done;
    console.log('> wrote ' + zipPath);
}

/** Copies one entry of Electron's macOS zip into ours, renamed for the game. */
async function copyMacEntry(input, entry, out, appRoot, icns) {
    const name = entry.fileName;
    const mode = entry.externalFileAttributes >>> 16;
    const options = { mode, mtime: entry.getLastModDate() };

    // Electron's own sample app is replaced by the game.
    if (name.endsWith('default_app.asar')) return;

    // Outside the app there are only Electron's licence files; keep them.
    if (!name.startsWith('Electron.app/')) {
        if (name.endsWith('/')) return;
        out.addBuffer(await readAll(await openEntry(input, entry)), `${NAME}/${name}`, options);
        return;
    }

    const target = appRoot + name.slice('Electron.app/'.length);

    if (name.endsWith('/')) {
        out.addEmptyDirectory(target, options);
        return;
    }

    let data = await readAll(await openEntry(input, entry));

    // Name the app and give it the candle icon. The executable inside keeps
    // the name "Electron"; nobody sees it.
    if (name === 'Electron.app/Contents/Info.plist') data = Buffer.from(renamePlist(data.toString('utf8')));
    if (name === 'Electron.app/Contents/Resources/electron.icns') data = icns;

    // Symlinks are stored as a tiny entry holding the link target, with the
    // symlink bit in `mode`. Copying data and mode as they are keeps them.
    out.addBuffer(data, target, { ...options, compress: (mode & 0o170000) !== 0o120000 });
}

function renamePlist(plist) {
    const set = (text, key, value) => {
        const pattern = new RegExp(`(<key>${key}</key>\\s*<string>)[^<]*(</string>)`);
        if (!pattern.test(text)) throw new Error(`Info.plist has no ${key}`);
        return text.replace(pattern, `$1${value}$2`);
    };
    let text = set(plist, 'CFBundleName', NAME);
    text = set(text, 'CFBundleDisplayName', NAME);
    text = set(text, 'CFBundleIdentifier', BUNDLE_ID);
    return text;
}

const MAC_README = `Shadow Play for macOS
=====================

1. Drag "Shadow Play.app" into Applications (or anywhere you like).
2. The app is NOT signed by Apple (a jam game has no developer account), so
   macOS will refuse to open it the first time. Do this once:
     - Right-click (or Control-click) the app, choose Open, then Open again.
   If macOS says the app "is damaged and can't be opened", open Terminal
   and run this, then open the app normally:
     xattr -cr "/Applications/Shadow Play.app"

Use the -arm64 zip on Apple Silicon Macs (M1 and newer) and the -x64 zip on
Intel Macs. Keys: see README.md, or HOW TO PLAY on the title screen.
`;

// ----------------------------------------------------------------- main ----

mkdirSync(OUT, { recursive: true });
stage();
if (doWin) await buildWindows();
if (doMac) {
    await buildMac('arm64');
    await buildMac('x64');
}

console.log('\nDone. Sizes:');
for (const file of readdirSync(OUT).filter((f) => f.endsWith('.zip'))) {
    console.log(`  ${file}  ${(statSync(join(OUT, file)).size / 1024 / 1024).toFixed(1)} MB`);
}
console.log('(' + relative(ROOT, OUT) + ' is git-ignored: never commit these.)');
