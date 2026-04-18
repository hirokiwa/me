import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite';
import { loadLocaleDefinitions } from './locales';
import { renderLocalizedHtml } from './renderHtml';
import type { LocaleDefinition } from './types';

const templateHtmlPath = path.resolve(process.cwd(), 'index.html');

const googleTagId = 'G-D598T36NNK';

const googleTagScripts: HtmlTagDescriptor[] = [
  {
    tag: 'script',
    attrs: {
      async: true,
      src: `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`,
    },
    injectTo: 'head',
  },
  {
    tag: 'script',
    children: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${googleTagId}');
    `,
    injectTo: 'head',
  },
];

const normalizeRequestPath = (requestUrl: string): string => {
  const parsedUrl = new URL(requestUrl, 'http://localhost');
  const normalizedPathname = parsedUrl.pathname === '' ? '/' : parsedUrl.pathname;

  return normalizedPathname.endsWith('/') ? normalizedPathname : `${normalizedPathname}/`;
};

const resolveLocaleDefinition = (
  localeDefinitions: LocaleDefinition[],
  requestPath: string,
): LocaleDefinition => {
  const matchedLocaleDefinition = localeDefinitions.find(
    (localeDefinition) => localeDefinition.pagePath === requestPath,
  );

  return matchedLocaleDefinition ?? localeDefinitions[0];
};

const createEnPageMiddleware = (
  server: Parameters<Plugin['configureServer']>[0],
  localeDefinitionsPromise: Promise<LocaleDefinition[]>,
): Connect.NextHandleFunction => async (
  request: IncomingMessage,
  response: ServerResponse,
  next: Connect.NextFunction,
) => {
  const requestPath = normalizeRequestPath(request.url ?? '/');

  if (requestPath !== '/en/') {
    next();
    return;
  }

  const localeDefinitions = await localeDefinitionsPromise;
  const localeDefinition = resolveLocaleDefinition(localeDefinitions, requestPath);
  const templateHtml = await readFile(templateHtmlPath, 'utf8');
  const localizedHtml = renderLocalizedHtml(templateHtml, localeDefinition);
  const transformedHtml = await server.transformIndexHtml(requestPath, localizedHtml);

  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/html');
  response.end(transformedHtml);
};

export const createLocalizedHtmlPlugin = (): Plugin => {
  const localeDefinitionsPromise = loadLocaleDefinitions();
  const resolvedConfigState: { config?: ResolvedConfig } = {};

  return {
    name: 'localized-html-pages',
    configResolved(config) {
      resolvedConfigState.config = config;
    },
    configureServer(server) {
      server.middlewares.use(createEnPageMiddleware(server, localeDefinitionsPromise));
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, context) {
        const localeDefinitions = await localeDefinitionsPromise;

        if (context.server) {
          const localeDefinition = resolveLocaleDefinition(
            localeDefinitions,
            normalizeRequestPath(context.path),
          );

          return renderLocalizedHtml(html, localeDefinition);
        }

        return {
          html,
          tags: googleTagScripts,
        };
      },
    },
    async closeBundle() {
      const localeDefinitions = await localeDefinitionsPromise;
      const outDirectoryPath = resolvedConfigState.config
        ? path.resolve(resolvedConfigState.config.root, resolvedConfigState.config.build.outDir)
        : path.resolve(process.cwd(), 'dist');
      const rootIndexHtmlPath = path.join(outDirectoryPath, 'index.html');
      const builtHtml = await readFile(rootIndexHtmlPath, 'utf8').catch(() => '');

      if (builtHtml === '') {
        throw new Error('Built index.html was not found.');
      }

      const japaneseLocaleDefinition = resolveLocaleDefinition(localeDefinitions, '/');
      const englishLocaleDefinition = resolveLocaleDefinition(localeDefinitions, '/en/');
      const japaneseHtml = renderLocalizedHtml(builtHtml, japaneseLocaleDefinition);
      const englishHtml = renderLocalizedHtml(builtHtml, englishLocaleDefinition);
      const englishIndexDirectoryPath = path.join(outDirectoryPath, 'en');
      const englishIndexHtmlPath = path.join(englishIndexDirectoryPath, 'index.html');

      await mkdir(englishIndexDirectoryPath, { recursive: true });
      await writeFile(rootIndexHtmlPath, japaneseHtml);
      await writeFile(englishIndexHtmlPath, englishHtml);
    },
  };
};
