import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' + HashRouter => works on GitHub Pages under /<repo>/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'docs', emptyOutDir: true, chunkSizeWarningLimit: 1600 },
});
