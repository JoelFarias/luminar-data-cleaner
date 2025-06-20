import { defineConfig } from 'vite';

export default defineConfig({
  base: '/luminar-data-cleaner/',
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname,
    }
  },
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
