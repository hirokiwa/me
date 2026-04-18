export type LocaleCode = 'ja' | 'en';

export type LocaleMessages = Record<string, string>;

export type LocaleDefinition = {
  code: LocaleCode;
  hrefLang: LocaleCode;
  htmlLang: LocaleCode;
  outputPath: 'index.html' | 'en/index.html';
  pagePath: '/' | '/en/';
  messages: LocaleMessages;
};
