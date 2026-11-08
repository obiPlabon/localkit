// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';

// Canonical URLs, the sitemap and social image URLs are built from this. Override with SITE_URL once a custom domain is live.
const site = (process.env.SITE_URL || 'https://localkit-3gv.pages.dev').replace(/\/+$/, '');

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
