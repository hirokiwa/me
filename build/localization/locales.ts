import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { LocaleCode, LocaleDefinition, LocaleMessages } from './types';

const localeDirectoryPath = path.resolve(process.cwd(), 'src/i18n');

const localeFileNames: Record<LocaleCode, string> = {
  ja: 'ja.json',
  en: 'en.json',
};

const localePagePaths: Record<LocaleCode, LocaleDefinition['pagePath']> = {
  ja: '/',
  en: '/en/',
};

const localeOutputPaths: Record<LocaleCode, LocaleDefinition['outputPath']> = {
  ja: 'index.html',
  en: 'en/index.html',
};

const readLocaleMessages = async (localeCode: LocaleCode): Promise<LocaleMessages> => {
  const localeFilePath = path.join(localeDirectoryPath, localeFileNames[localeCode]);
  const localeFileContents = await readFile(localeFilePath, 'utf8');

  return JSON.parse(localeFileContents) as LocaleMessages;
};

export const loadLocaleDefinitions = async (): Promise<LocaleDefinition[]> => {
  const localeCodes: LocaleCode[] = ['ja', 'en'];
  const localeDefinitions = await Promise.all(
    localeCodes.map(async (localeCode) => ({
      code: localeCode,
      hrefLang: localeCode,
      htmlLang: localeCode,
      outputPath: localeOutputPaths[localeCode],
      pagePath: localePagePaths[localeCode],
      messages: await readLocaleMessages(localeCode),
    })),
  );

  return localeDefinitions;
};
