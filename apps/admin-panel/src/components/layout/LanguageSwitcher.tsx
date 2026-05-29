'use client';

import { useState, useRef, useEffect } from 'react';
import { Languages, Check } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import { SUPPORTED_LOCALES, type Locale } from '@/i18n/messages';

/**
 * LanguageSwitcher — مفتاح تبديل اللغة بـ dropdown
 *
 * يُستخدم في Topbar. يحفظ الاختيار في cookie ويُحدّث `dir` + `lang` تلقائياً.
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = SUPPORTED_LOCALES.find((l) => l.code === locale)!;

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl
                   border border-gray-200 bg-white text-gray-700
                   hover:bg-gray-50 hover:border-gray-300 transition-colors"
        aria-label="Change language"
      >
        <Languages className="w-4 h-4" />
        <span className="text-sm font-bold">{current.flag}</span>
        <span className="text-xs font-bold uppercase">{current.code}</span>
      </button>

      {open && (
        <div
          className="absolute end-0 mt-2 w-48 card p-1.5 animate-fade-in z-50"
          style={{ minWidth: '12rem' }}
        >
          {SUPPORTED_LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  transition-colors ${
                    active
                      ? 'bg-hancr-violet-light text-hancr-violet-deep font-bold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span className="flex-1 text-start">{l.label}</span>
                {active && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
