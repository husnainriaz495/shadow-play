import { defineConfig } from 'vite';

/**
 * Production build config: `npm run build` writes to dist/, which is what
 * Vercel deploys.
 *
 * Minified with ESBUILD rather than Terser. Terser is a little smaller but
 * it is an extra dependency, and SECURITY.md rule 4 allows only `phaser`
 * and `vite`. Esbuild ships inside Vite, so this keeps the dependency list
 * at exactly two.
 */
export default defineConfig({
    base: './',
    logLevel: 'warn',

    build: {
        minify: 'esbuild',

        rollupOptions: {
            output: {
                // Phaser is big and never changes, so it goes in its own
                // chunk and stays cached between our deploys.
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    },

    server: {
        port: 8080
    }
});
