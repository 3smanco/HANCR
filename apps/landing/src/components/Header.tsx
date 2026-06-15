'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { type Locale, translator } from '@/i18n/messages';
import { localizedHref, swapLocaleInPath } from '@/lib/locale';
import { HancrMark } from '@/components/HancrMark';

export function Header({ locale }: { locale: Locale }) {
  const tt = translator(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const otherLocale: Locale = locale === 'ar' ? 'en' : 'ar';
  const otherPath = swapLocaleInPath(pathname || `/${locale}`, otherLocale);

  const links = [
    { href: '/ride', label: tt('nav.ride') },
    { href: '/drive', label: tt('nav.drive') },
    { href: '/deliver', label: tt('nav.deliver') },
    { href: '/business', label: tt('nav.business') },
    { href: '/about', label: tt('nav.about') },
    { href: '/help', label: tt('nav.help') },
  ];

  return (
    <header className="sticky top-0 inset-x-0 z-50 backdrop-blur-lg bg-obsidian/85 border-b border-stone/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 shrink-0"
          aria-label="HANCR home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coal to-obsidian flex items-center justify-center shadow-ember p-1">
            <HancrMark idSuffix="hdr" />
          </div>
          <span className="font-bold text-xl text-pearl tracking-wide">
            HANCR
          </span>
        </Link>

        <nav className="hidden lg:flex gap-7 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={localizedHref(locale, l.href)}
              className="text-pearl/85 hover:text-ember transition font-medium"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={otherPath}
            className="hidden sm:inline-block text-pearl/80 hover:text-ember transition text-sm font-medium px-3 py-1.5"
            hrefLang={otherLocale}
          >
            {tt('nav.language')}
          </Link>
          <Link
            href={localizedHref(locale, '/login')}
            className="hidden sm:inline-block text-pearl/80 hover:text-ember transition text-sm font-medium"
          >
            {tt('nav.login')}
          </Link>
          <Link
            href={localizedHref(locale, '/signup')}
            className="hidden md:inline-flex bg-ember hover:bg-ember-deep transition px-4 py-2 rounded-lg font-semibold text-sm text-pearl shadow-ember"
          >
            {tt('nav.signup')}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden w-10 h-10 grid place-items-center rounded-lg hover:bg-ash transition text-pearl"
            aria-label={tt('nav.menu')}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-stone/60 bg-obsidian">
          <nav className="px-6 py-4 flex flex-col gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={localizedHref(locale, l.href)}
                className="py-2 text-pearl/90 hover:text-ember transition font-medium"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={otherPath}
              className="py-2 text-pearl/70 border-t border-stone/40 mt-2"
              onClick={() => setOpen(false)}
            >
              {tt('nav.language')}
            </Link>
            <Link
              href={localizedHref(locale, '/login')}
              className="py-2 text-pearl/90 hover:text-ember transition font-medium"
              onClick={() => setOpen(false)}
            >
              {tt('nav.login')}
            </Link>
            <Link
              href={localizedHref(locale, '/signup')}
              className="mt-2 bg-ember hover:bg-ember-deep transition px-4 py-3 rounded-lg font-semibold text-center text-pearl"
              onClick={() => setOpen(false)}
            >
              {tt('nav.signup')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
