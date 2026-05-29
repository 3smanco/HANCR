'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { DEFAULT_LOCALE, Locale, Messages, SUPPORTED_LOCALES, messages } from './messages';

// ─── Cookie key ─────────────────────────────────────────────────────────────
const LOCALE_COOKIE = 'hancr_admin_locale';

// ─── Context ────────────────────────────────────────────────────────────────
interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: 'rtl' | 'ltr';
  m: Messages;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  dir: 'rtl',
  m: messages[DEFAULT_LOCALE],
});

// ─── Provider ───────────────────────────────────────────────────────────────
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Load saved locale from cookie OR ?lang= query param on mount
  useEffect(() => {
    // Priority 1: ?lang=ar|en query param (deep links)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const queryLang = url.searchParams.get('lang') as Locale | null;
      if (queryLang && SUPPORTED_LOCALES.some((l) => l.code === queryLang)) {
        Cookies.set(LOCALE_COOKIE, queryLang, { expires: 365, sameSite: 'lax' });
        setLocaleState(queryLang);
        // Clean the param from URL after applying
        url.searchParams.delete('lang');
        window.history.replaceState({}, '', url.toString());
        return;
      }
    }
    // Priority 2: saved cookie
    const saved = Cookies.get(LOCALE_COOKIE) as Locale | undefined;
    if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
      setLocaleState(saved);
    }
  }, []);

  // Sync <html lang> + dir whenever locale changes
  useEffect(() => {
    const meta = SUPPORTED_LOCALES.find((l) => l.code === locale)!;
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', meta.dir);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    Cookies.set(LOCALE_COOKIE, l, { expires: 365, sameSite: 'lax' });
    setLocaleState(l);
  }, []);

  const meta = SUPPORTED_LOCALES.find((l) => l.code === locale)!;

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        dir: meta.dir,
        m: messages[locale],
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** Returns the entire messages object for the current locale */
export function useMessages(): Messages {
  return useContext(LocaleContext).m;
}

/** Returns the current locale + setter + direction */
export function useLocale() {
  const { locale, setLocale, dir } = useContext(LocaleContext);
  return { locale, setLocale, dir };
}

/**
 * Translate a dot-path key with optional interpolation.
 *
 * Example:
 *   const t = useT();
 *   t('auth.login.title')               // → "HANCR Admin"
 *   t('common.showing', { n: 5 })       // → "Showing 5"
 *   t('drivers.subtitle', { count: 12 }) // → "12 drivers registered"
 */
export function useT() {
  const { m } = useContext(LocaleContext);
  return useCallback(
    (path: string, vars?: Record<string, string | number>): string => {
      const value = getByPath(m, path);
      if (typeof value !== 'string') {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing translation: ${path}`);
        return path;
      }
      if (!vars) return value;
      return interpolate(value, vars);
    },
    [m],
  );
}

// ─── Internals ──────────────────────────────────────────────────────────────

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}
