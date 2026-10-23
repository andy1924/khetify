import { useCallback } from 'react';
import { en, type StringKey } from './en';
import { useDemoState } from '../demo';
import type { Locale } from '../demo/types';

export type { StringKey };

/** Language metadata shown in the picker. Native names are real; labels are English. */
export interface LocaleOption {
  code: Locale;
  nativeKey: StringKey;
  englishKey: StringKey | null;
}

export const localeOptions: LocaleOption[] = [
  { code: 'en', nativeKey: 'language.native.en', englishKey: null },
  { code: 'hi', nativeKey: 'language.native.hi', englishKey: 'language.english.hi' },
  { code: 'mr', nativeKey: 'language.native.mr', englishKey: 'language.english.mr' },
  { code: 'gu', nativeKey: 'language.native.gu', englishKey: 'language.english.gu' },
  { code: 'ta', nativeKey: 'language.native.ta', englishKey: 'language.english.ta' },
  { code: 'te', nativeKey: 'language.native.te', englishKey: 'language.english.te' },
];

export const languageNameKeys: Record<Locale, StringKey> = {
  en: 'language.native.en',
  hi: 'language.native.hi',
  mr: 'language.native.mr',
  gu: 'language.native.gu',
  ta: 'language.native.ta',
  te: 'language.native.te',
};

/**
 * Only English copy is reviewed. Other locales fall back to English until a
 * reviewed translation is supplied — no machine or invented translations.
 */
const catalogs: Partial<Record<Locale, Partial<Record<StringKey, string>>>> = {};

export type TranslateParams = Record<string, string | number>;
export type Translate = (key: StringKey, params?: TranslateParams) => string;

export function translate(locale: Locale, key: StringKey, params?: TranslateParams): string {
  const template = catalogs[locale]?.[key] ?? en[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] === undefined ? match : String(params[name]),
  );
}

/** Locale chosen in the demo store. */
export function useT(): Translate {
  const locale = useDemoState().locale;
  return useCallback<Translate>((key, params) => translate(locale, key, params), [locale]);
}

export function languageLabel(locale: Locale): string {
  return translate('en', languageNameKeys[locale]);
}

export { en };
