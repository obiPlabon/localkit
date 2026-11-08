// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  vite: {
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
