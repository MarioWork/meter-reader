import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

type AppAssetsOptions = {
  // The plugin's name, for Vite's logs.
  name: string;
  // Where the app serves the files, under its base path.
  folder: string;
  // Each file's name under the folder, and the file it is in node_modules.
  sources: Record<string, string>;
};

const NODE_MODULES = path.resolve(import.meta.dirname, 'node_modules');
const LEADING_SLASH = /^\//;
const QUERY_START = '?';

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.gz': 'application/gzip',
  '.wasm': 'application/wasm',
  '.pfb': 'application/octet-stream',
};

// The file asked for, from a request url already stripped of the assets folder: '/worker.min.js?v=1'.
function requestedFileName(requestUrl = ''): string {
  const [pathOnly] = requestUrl.split(QUERY_START);

  return pathOnly.replace(LEADING_SLASH, '');
}

// A library's own files (a worker, WebAssembly, data), served by the app instead of the library's default CDN, so they
// work offline and under the app's CSP: the dev server answers them from node_modules, and the build copies them to
// dist/<folder>/, where the PWA precaches them.
export function appAssets({ name, folder, sources }: AppAssetsOptions): Plugin {
  let assetsUrl = `/${folder}/`;

  const sourcePath = (fileName: string) => path.join(NODE_MODULES, sources[fileName]);

  return {
    name,
    configResolved(config) {
      assetsUrl = `${config.base}${folder}/`;
    },
    configureServer(server) {
      server.middlewares.use(assetsUrl, (request, response, next) => {
        const fileName = requestedFileName(request.url);
        const isServedFile = Object.hasOwn(sources, fileName);

        if (!isServedFile) return next();

        response.setHeader('Content-Type', CONTENT_TYPES[path.extname(fileName)]);
        fs.createReadStream(sourcePath(fileName)).pipe(response);
      });
    },
    generateBundle() {
      for (const fileName of Object.keys(sources)) {
        this.emitFile({
          type: 'asset',
          fileName: `${folder}/${fileName}`,
          source: fs.readFileSync(sourcePath(fileName)),
        });
      }
    },
  };
}
