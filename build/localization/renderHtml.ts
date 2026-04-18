import type { LocaleDefinition } from './types';

const placeholderPattern = /\{\{([^}]+)\}\}/g;

export const renderLocalizedHtml = (
  templateHtml: string,
  localeDefinition: LocaleDefinition,
): string => {
  return templateHtml.replace(placeholderPattern, (_, placeholderName: string) => {
    const resolvedValue = localeDefinition.messages[placeholderName];

    if (typeof resolvedValue !== 'string') {
      throw new Error(`Missing localized template value: ${placeholderName}`);
    }

    return resolvedValue;
  });
};
