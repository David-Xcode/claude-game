import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@games': path.resolve(__dirname, 'src/games'),
      '@hub': path.resolve(__dirname, 'src/hub'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
