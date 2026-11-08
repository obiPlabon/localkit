// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';

// Set SITE_URL at build time (e.g. https://example.com) to enable canonical URLs, the sitemap and social image URLs.
const site = process.env.SITE_URL?.replace(/\/+$/, '');

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [svelte(), ...(site ? [sitemap()] : [])],
  vite: {
    // jSquash resolves its .wasm files relative to its own modules; keep it out of dep pre-bundling.
    optimizeDeps: { exclude: ['@jsquash/jpeg', '@jsquash/webp', '@jsquash/png', '@jsquash/oxipng', '@jsquash/avif'] },
    worker: { format: 'es' },
    resolve: {
      alias: {
        // Browser-safe Buffer for iconv-lite (used by the .msg reader).
        'safer-buffer': fileURLToPath(new URL('./src/lib/shims/safer-buffer.ts', import.meta.url)),
        buffer: 'buffer/',
        string_decoder: 'string_decoder/',
      },
    },
  },
});
