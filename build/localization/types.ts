export type LocaleCode = 'ja' | 'en';

export type PageId = 'home' | 'contact' | 'privacy';

export type LocaleMessages = Record<string, string>;

export type LocaleDefinition = {
  code: LocaleCode;
  hrefLang: LocaleCode;
  htmlLang: LocaleCode;
  outputPath: string;
  pagePath: string;
  pageId: PageId;
  templatePath: string;
  messages: LocaleMessages;
};
