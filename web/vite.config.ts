import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { msw } from 'msw/vite';
import fs, { globSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults, defineConfig } from 'vitest/config';
import { tesseractAssets } from './tesseractAssetsPlugin';

const alias = {
  '@api': path.resolve(import.meta.dirname, 'src/common/api'),
  '@services': path.resolve(import.meta.dirname, 'src/common/api/services'),
  '@application': path.resolve(import.meta.dirname, 'src/application'),
  '@app-types': path.resolve(import.meta.dirname, 'src/types'),
  '@utils': path.resolve(import.meta.dirname, 'src/common/utils'),
  '@pages': path.resolve(import.meta.dirname, 'src/pages'),
  '@components': path.resolve(import.meta.dirname, 'src/common/components'),
  '@hooks': path.resolve(import.meta.dirname, 'src/common/hookUtils'),
  '@mocks': path.resolve(import.meta.dirname, 'src/mocks'),
  '@test-utils': path.resolve(import.meta.dirname, 'src/testUtils.tsx'),
};

// One worker per core thrashes on a heavy render tree. The cap also covers CI, which reports the host's cores.
const maxWorkers = process.env.VITEST_MAX_FORKS
  ? Number(process.env.VITEST_MAX_FORKS)
  : Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2)));

// Playwright specs end in .e2e.test.ts, which vitest's default include would pick up.
const baseExclude = [...configDefaults.exclude, 'e2e/**', 'tests-examples/*'];

// Where `cd api && yarn dev` listens.
const API_DEV_URL = 'http://localhost:3000';
const API_PREFIX = /^\/api/;
// Pages the service worker must not answer with the app: an API url opened as a page (a full-size photo).
const API_PAGES = /^\/api\//;

const APP_NAME = 'Meter Reader';
const APP_DESCRIPTION = 'Read a water meter from a photo';
// The light theme's page background (THEME_COLOURS in src/common/utils/themeUtils.ts). A manifest holds one colour;
// index.html's theme-color tags give the dark one, and the browser prefers those tags.
const THEME_COLOR = '#ffffff';
const BACKGROUND_COLOR = '#ffffff';
// The app's code and icons, plus Tesseract's gzipped language data (photo OCR must work offline).
const PRECACHE_GLOBS = ['**/*.{js,css,html,ico,png,svg,webmanifest,gz}'];
// Workbox skips anything over 2 MB by default; Tesseract's core builds are about 3.9 MB each.
const PRECACHE_MAX_FILE_BYTES = 5_000_000;

// Files that `vi.mock` a module get their own project, so a module mock never leaks into another file.
const mockingTests = globSync('src/**/*.test.{ts,tsx}')
  .map((file) => file.replace(/\\/g, '/'))
  .filter((file) => fs.readFileSync(file, 'utf8').includes('vi.mock('));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const projectPath = env.VITE_PROJECT_PATH || '/';
  // MSW registers its own service worker, and only one can control a scope, so mocked builds skip the PWA one.
  const useMocks = env.VITE_USE_MOCKS === 'true';

  return {
    base: projectPath,
    plugins: [
      react(),
      // React Compiler: components and hooks are memoized at build time, so no manual useMemo/useCallback.
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      // Serves the MSW worker script in dev and provides `virtual:msw` (see src/mocks/browser.ts).
      msw(),
      // Tesseract's worker, core and language data, served by the app itself (photo OCR offline).
      tesseractAssets(),
      // Installable app: web manifest, generated icons and an offline cache. Off in dev by default.
      VitePWA({
        disable: useMocks,
        registerType: 'autoUpdate',
        // index.html carries its own theme-color tags, one per device setting, so the plugin adds none.
        pwaAssets: { config: true, injectThemeColor: false },
        // The MSW worker ships in the build too, but the app never needs it offline.
        workbox: {
          globPatterns: PRECACHE_GLOBS,
          globIgnores: ['**/mockServiceWorker.js'],
          maximumFileSizeToCacheInBytes: PRECACHE_MAX_FILE_BYTES,
          navigateFallbackDenylist: [API_PAGES],
        },
        manifest: {
          name: APP_NAME,
          short_name: APP_NAME,
          description: APP_DESCRIPTION,
          theme_color: THEME_COLOR,
          background_color: BACKGROUND_COLOR,
          display: 'standalone',
        },
      }),
    ],
    test: {
      globals: true,
      exclude: baseExclude,
      setupFiles: ['./src/setupTests.ts'],
      // `.test.ts` runs on `node`. One that needs a DOM carries a `// @vitest-environment jsdom` docblock.
      // Inline projects inherit the root config (Vitest 5), so plugins and setup are declared once above.
      projects: [
        {
          test: {
            name: 'node',
            environment: 'node',
            include: ['src/**/*.test.ts'],
            exclude: [...baseExclude, ...mockingTests],
          },
        },
        {
          test: {
            name: 'dom',
            environment: 'jsdom',
            include: ['src/**/*.test.tsx'],
            exclude: [...baseExclude, ...mockingTests],
          },
        },
        {
          test: { name: 'mocked', environment: 'jsdom', include: mockingTests },
        },
      ],
      restoreMocks: true,
      testTimeout: 60000,
      minWorkers: 1,
      maxWorkers,
      // Stylesheets stay empty in tests, except one read as text (?raw): themeContrast.test.ts checks index.css.
      css: { include: [/\.css\?raw$/] },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,tsx}'],
        // Files with nothing to cover: declarations, barrels, mocks, the test harness and the entry point.
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/*.type.ts',
          'src/**/*.d.ts',
          'src/**/index.ts',
          'src/mocks/**',
          'src/setupTests.ts',
          'src/testUtils.tsx',
          'src/main.tsx',
        ],
      },
    },
    resolve: {
      alias,
    },
    // Same origin in dev as on the server: /api/<path> goes to the api as /<path>, like Caddy's handle_path.
    server: {
      proxy: {
        '/api': {
          target: API_DEV_URL,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(API_PREFIX, ''),
        },
      },
    },
  };
});
