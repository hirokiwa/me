import { defineConfig } from 'vite';
import { createLocalizedHtmlPlugin } from './build/localization/plugin';

export default defineConfig({
  plugins: [createLocalizedHtmlPlugin()],
});
