import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LocaleCode, LocaleDefinition, LocaleMessages, PageId } from './types';

const localeDirectoryPath = path.resolve(process.cwd(), 'src/i18n');

const localeFilePaths = {
  common: {
    ja: 'common/ja.json',
    en: 'common/en.json',
  },
  home: {
    ja: 'pages/home/ja.json',
    en: 'pages/home/en.json',
  },
  contact: {
    ja: 'pages/contact/ja.json',
    en: 'pages/contact/en.json',
  },
  privacy: {
    ja: 'pages/privacy/ja.json',
    en: 'pages/privacy/en.json',
  },
} as const satisfies Record<PageId | 'common', Record<LocaleCode, string>>;

const mergeLocaleMessages = (
  sharedMessages: LocaleMessages,
  pageMessages: LocaleMessages,
): LocaleMessages => ({
  ...sharedMessages,
  ...pageMessages,
});

const readLocaleMessages = async (
  messageScope: keyof typeof localeFilePaths,
  localeCode: LocaleCode,
): Promise<LocaleMessages> => {
  const localeFilePath = path.join(localeDirectoryPath, localeFilePaths[messageScope][localeCode]);
  const localeFileContents = await readFile(localeFilePath, 'utf8');

  return JSON.parse(localeFileContents) as LocaleMessages;
};

const localizedPages = [
  {
    pageId: 'home',
    templatePath: 'index.html',
    locales: {
      ja: {
        pagePath: '/',
        outputPath: 'index.html',
      },
      en: {
        pagePath: '/en/',
        outputPath: 'en/index.html',
      },
    },
  },
  {
    pageId: 'contact',
    templatePath: 'contact/index.html',
    locales: {
      ja: {
        pagePath: '/contact/',
        outputPath: 'contact/index.html',
      },
      en: {
        pagePath: '/en/contact/',
        outputPath: 'en/contact/index.html',
      },
    },
  },
  {
    pageId: 'privacy',
    templatePath: 'privacy/index.html',
    locales: {
      ja: {
        pagePath: '/privacy/',
        outputPath: 'privacy/index.html',
      },
      en: {
        pagePath: '/en/privacy/',
        outputPath: 'en/privacy/index.html',
      },
    },
  },
] as const satisfies ReadonlyArray<{
  pageId: PageId;
  templatePath: string;
  locales: Record<LocaleCode, { pagePath: string; outputPath: string }>;
}>;

export const loadLocaleDefinitions = async (): Promise<LocaleDefinition[]> => {
  const localeCodes: LocaleCode[] = ['ja', 'en'];
  const commonMessagesByCodeEntries = await Promise.all(
    localeCodes.map(async (localeCode) => [localeCode, await readLocaleMessages('common', localeCode)] as const),
  );
  const commonMessagesByCode = Object.fromEntries(commonMessagesByCodeEntries) as Record<LocaleCode, LocaleMessages>;
  const localizedDefinitions = await Promise.all(
    localizedPages.flatMap((localizedPage) =>
      localeCodes.map(async (localeCode) => ({
        code: localeCode,
        hrefLang: localeCode,
        htmlLang: localeCode,
        outputPath: localizedPage.locales[localeCode].outputPath,
        pagePath: localizedPage.locales[localeCode].pagePath,
        pageId: localizedPage.pageId,
        templatePath: localizedPage.templatePath,
        messages: mergeLocaleMessages(
          commonMessagesByCode[localeCode],
          await readLocaleMessages(localizedPage.pageId, localeCode),
        ),
      })),
    ),
  );

  return localizedDefinitions;
};
