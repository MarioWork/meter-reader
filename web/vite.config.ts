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

const APP_NAME = 'Meter Reader';
const APP_DESCRIPTION = 'Read a water meter from a photo';
const THEME_COLOR = '#0b4f8a';
const BACKGROUND_COLOR = '#ffffff';

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
      // Installable app: web manifest, generated icons and an offline cache. Off in dev by default.
      VitePWA({
        disable: useMocks,
        registerType: 'autoUpdate',
        pwaAssets: { config: true },
        // The MSW worker ships in the build too, but the app never needs it offline.
        workbox: { globIgnores: ['**/mockServiceWorker.js'] },
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
      css: false,
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
  };
});
