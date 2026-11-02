import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Builds the app icons from one SVG at build time, so no generated PNGs are committed.
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
});
