import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n/messages';

/** Narrow a string to a valid Locale, falling back to DEFAULT_LOCALE. */
export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

/** Swap the locale segment in a pathname. `/ar/drive` + `en` → `/en/drive`. */
export function swapLocaleInPath(path: string, newLocale: Locale): string {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return `/${newLocale}`;
  const first = parts[0];
  if ((SUPPORTED_LOCALES as readonly string[]).includes(first)) {
    parts[0] = newLocale;
  } else {
    parts.unshift(newLocale);
  }
  return '/' + parts.join('/');
}

/** Build a localized path: `localizedHref('ar', '/drive')` → `/ar/drive` */
export function localizedHref(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean === '/' ? '' : clean}`;
}
