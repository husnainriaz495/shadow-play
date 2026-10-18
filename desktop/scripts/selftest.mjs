// Launches the packaged Windows game in self-test mode (see runSelfTest in
// main.js): it waits on the title screen, saves a screenshot and a report
// of whether any sound came out, then quits. Run after `npm run build:win`.
import { spawn } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DESKTOP } from './stage.mjs';

const exe = join(DESKTOP, 'out', 'Shadow Play-win32-x64', 'Shadow Play.exe');
const report = join(DESKTOP, 'out', 'selftest');
rmSync(report, { recursive: true, force: true });

console.log('> launching ' + exe);
const child = spawn(exe, [], { env: { ...process.env, SHADOW_PLAY_SELFTEST: report }, stdio: 'inherit' });
const code = await new Promise((resolve) => child.on('exit', resolve));

const result = JSON.parse(readFileSync(join(report, 'report.json'), 'utf8'));
console.log(JSON.stringify(result, null, 2));
console.log('> screenshot: ' + join(report, 'title.png'));

const ok = code === 0 && result.audible && result.errors.length === 0;
console.log(ok ? 'PASS: launched, drew the title, made sound, no errors' : 'FAIL');
process.exit(ok ? 0 : 1);
