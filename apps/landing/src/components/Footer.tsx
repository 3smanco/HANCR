import Link from 'next/link';
import { type Locale, translator } from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';

export function Footer({ locale }: { locale: Locale }) {
  const tt = translator(locale);

  const columns: Array<{ title: string; items: Array<{ href: string; label: string }> }> = [
    {
      title: tt('footer.company'),
      items: [
        { href: '/about', label: tt('footer.about') },
        { href: '/careers', label: tt('footer.careers') },
        { href: '/newsroom', label: tt('footer.newsroom') },
        { href: '/investors', label: tt('footer.investors') },
        { href: '/contact', label: tt('footer.contact') },
      ],
    },
    {
      title: tt('footer.products'),
      items: [
        { href: '/ride', label: tt('footer.ride') },
        { href: '/drive', label: tt('footer.drive') },
        { href: '/deliver', label: tt('footer.deliver') },
        { href: '/business', label: tt('footer.business') },
      ],
    },
    {
      title: tt('footer.trust'),
      items: [
        { href: '/safety', label: tt('footer.safety') },
        { href: '/sustainability', label: tt('footer.sustainability') },
        { href: '/accessibility', label: tt('footer.accessibility') },
        { href: '/cities', label: tt('footer.cities') },
      ],
    },
    {
      title: tt('footer.legal'),
      items: [
        { href: '/legal/terms', label: tt('footer.terms') },
        { href: '/legal/privacy', label: tt('footer.privacy') },
        { href: '/legal/cookies', label: tt('footer.cookies') },
        { href: '/help', label: tt('footer.help') },
        { href: '/sitemap', label: tt('footer.sitemap') },
      ],
    },
  ];

  return (
    <footer className="bg-coal border-t border-stone/60 text-pearl/80 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ember to-ember-deep flex items-center justify-center font-bold text-pearl text-lg shadow-ember">
                H
              </div>
              <span className="font-bold text-xl text-pearl">HANCR</span>
            </div>
            <p className="text-muted leading-relaxed max-w-sm">
              {tt('footer.tagline')}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="/downloads/hancr-rider.apk"
                download
                className="text-xs px-3 py-2 rounded-lg border border-stone/60 hover:border-ember hover:text-ember transition"
              >
                {tt('cta.downloadRider')}
              </a>
              <a
                href="/downloads/hancr-driver.apk"
                download
                className="text-xs px-3 py-2 rounded-lg border border-stone/60 hover:border-ember hover:text-ember transition"
              >
                {tt('cta.downloadDriver')}
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-bold mb-4 text-pearl text-sm uppercase tracking-wider">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={localizedHref(locale, it.href)}
                      className="text-pearl/70 hover:text-ember transition"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-stone/60 flex flex-col md:flex-row justify-between items-center gap-4 text-muted text-sm">
          <p>© 2026 HANCR. {tt('footer.rights')}</p>
          <div className="flex items-center gap-6">
            <a
              href="https://admin.hancr.com"
              className="hover:text-ember transition"
              rel="noopener"
            >
              {tt('footer.adminPanel')}
            </a>
            <Link
              href={localizedHref(locale, '/contact')}
              className="hover:text-ember transition"
            >
              {tt('footer.contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
