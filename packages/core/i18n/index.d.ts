import { Maybe } from "embark";
import * as i18n from "i18n";

declare module "embark-i18n" {
  function setOrDetectLocale(locale: Maybe<string>): void;
  function __(
    phraseOrOptions: string | i18n.TranslateOptions,
    ...replace: string[]
  ): string;
  function __(
    phraseOrOptions: string | i18n.TranslateOptions,
    replacements: i18n.Replacements
  ): string;
}
