import path from 'node:path';
import { defineConfig } from 'vite';
import { createLocalizedHtmlPlugin } from './build/localization/plugin';

export default defineConfig({
  plugins: [createLocalizedHtmlPlugin()],
  build: {
    rollupOptions: {
      input: {
        home: path.resolve(process.cwd(), 'index.html'),
        contact: path.resolve(process.cwd(), 'contact/index.html'),
        privacy: path.resolve(process.cwd(), 'privacy/index.html'),
      },
    },
  },
});
