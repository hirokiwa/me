import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite';
import { loadLocaleDefinitions } from './locales';
import { renderLocalizedHtml } from './renderHtml';
import type { LocaleDefinition } from './types';

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

const getTemplateHtmlPath = (localeDefinition: LocaleDefinition) =>
  path.resolve(process.cwd(), localeDefinition.templatePath);

const createLocalizedPageMiddleware = (
  server: Parameters<Plugin['configureServer']>[0],
  localeDefinitionsPromise: Promise<LocaleDefinition[]>,
): Connect.NextHandleFunction => async (
  request: IncomingMessage,
  response: ServerResponse,
  next: Connect.NextFunction,
) => {
  const requestPath = normalizeRequestPath(request.url ?? '/');
  const localeDefinitions = await localeDefinitionsPromise;
  const localeDefinition = localeDefinitions.find(
    (localeDefinitionEntry) => localeDefinitionEntry.pagePath === requestPath,
  );

  if (!localeDefinition) {
    next();
    return;
  }

  const templateHtml = await readFile(getTemplateHtmlPath(localeDefinition), 'utf8');
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
      server.middlewares.use(createLocalizedPageMiddleware(server, localeDefinitionsPromise));
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
      const templatePaths = [...new Set(localeDefinitions.map((localeDefinition) => localeDefinition.templatePath))];
      const templateHtmlEntries = await Promise.all(
        templatePaths.map(async (templatePath) => {
          const builtTemplateHtml = await readFile(path.join(outDirectoryPath, templatePath), 'utf8').catch(() => '');

          if (builtTemplateHtml === '') {
            throw new Error(`Built template HTML was not found: ${templatePath}`);
          }

          return [templatePath, builtTemplateHtml] as const;
        }),
      );
      const templateHtmlByPath = new Map(templateHtmlEntries);

      await Promise.all(
        localeDefinitions.map(async (localeDefinition) => {
          const builtTemplateHtml = templateHtmlByPath.get(localeDefinition.templatePath);

          if (!builtTemplateHtml) {
            throw new Error(`Template HTML cache miss: ${localeDefinition.templatePath}`);
          }

          const localizedHtml = renderLocalizedHtml(builtTemplateHtml, localeDefinition);
          const outputHtmlPath = path.join(outDirectoryPath, localeDefinition.outputPath);

          await mkdir(path.dirname(outputHtmlPath), { recursive: true });
          await writeFile(outputHtmlPath, localizedHtml);
        }),
      );
    },
  };
};
