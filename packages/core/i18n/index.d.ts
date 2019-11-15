import * as i18n from 'i18n';

export { setOrDetectLocale } from './src';

export function __(
  phraseOrOptions: string | i18n.TranslateOptions,
  ...replace: string[]
): string;

export function __(
  phraseOrOptions: string | i18n.TranslateOptions,
  replacements: i18n.Replacements
): string;
