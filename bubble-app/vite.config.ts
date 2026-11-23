import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// The built page is served from https://<user>.github.io/Techshop/bubble/
export default defineConfig({
  plugins: [react()],
  base: '/Techshop/bubble/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Build straight into the folder GitHub Pages publishes.
    outDir: '../bubble',
    emptyOutDir: true,
  },
});
