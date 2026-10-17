import { defineConfig } from 'vite';

/**
 * Development server config: `npm run dev` on http://localhost:8080.
 *
 * `base: './'` keeps every asset path relative, so the built game works
 * whether it is served from the domain root or a sub-folder.
 */
export default defineConfig({
    base: './',

    build: {
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
