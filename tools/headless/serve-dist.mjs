// Serves dist/ with the EXACT headers from vercel.json, so the
// Content-Security-Policy can be tested before anything is deployed.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const root = process.argv[2];
const config = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
const dist = join(root, 'dist');

const TYPES = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ogg': 'audio/ogg'
};

createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    const file = join(dist, normalize(path === '/' ? '/index.html' : path));

    // Every rule whose `source` matches, in vercel.json order.
    for (const rule of config.headers) {
        const pattern = new RegExp(`^${rule.source}$`);
        if (pattern.test(path)) rule.headers.forEach((h) => res.setHeader(h.key, h.value));
    }

    try {
        const body = await readFile(file);
        res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
        res.end(body);
    } catch {
        res.statusCode = 404;
        res.end('not found');
    }
}).listen(5311, () => console.log('serving dist with vercel.json headers on http://localhost:5311/'));
