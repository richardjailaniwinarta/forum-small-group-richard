import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Halaman forum untuk website laptop: dibangun ke ../forum/ (dilayani di smallgrouprichard.my.id/forum/).
export default defineConfig({
  root: 'forum-site',
  envDir: '..',
  base: './',
  plugins: [react()],
  build: { outDir: '../../forum', emptyOutDir: true }
});
