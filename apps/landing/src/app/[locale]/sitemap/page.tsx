import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'footer.sitemap'),
    description:
      locale === 'ar' ? 'كل صفحات موقع HANCR.' : 'All HANCR website pages.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function SitemapPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const tt = (k: string) => t(locale, k);
  const isAr = locale === 'ar';

  const sections: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
    {
      title: tt('footer.products'),
      links: [
        { href: '/ride', label: tt('nav.ride') },
        { href: '/drive', label: tt('nav.drive') },
        { href: '/deliver', label: tt('nav.deliver') },
        { href: '/business', label: tt('nav.business') },
      ],
    },
    {
      title: tt('footer.company'),
      links: [
        { href: '/about', label: tt('footer.about') },
        { href: '/careers', label: tt('footer.careers') },
        { href: '/newsroom', label: tt('footer.newsroom') },
        { href: '/investors', label: tt('footer.investors') },
        { href: '/contact', label: tt('footer.contact') },
      ],
    },
    {
      title: tt('footer.trust'),
      links: [
        { href: '/safety', label: tt('footer.safety') },
        { href: '/sustainability', label: tt('footer.sustainability') },
        { href: '/accessibility', label: tt('footer.accessibility') },
        { href: '/cities', label: tt('footer.cities') },
      ],
    },
    {
      title: tt('nav.help'),
      links: [
        { href: '/help', label: isAr ? 'مركز المساعدة' : 'Help Center' },
        { href: '/help/rider', label: isAr ? 'للراكب' : 'For riders' },
        { href: '/help/driver', label: isAr ? 'للسائق' : 'For drivers' },
        { href: '/help/payments', label: isAr ? 'المدفوعات' : 'Payments' },
        { href: '/help/safety', label: isAr ? 'الأمان' : 'Safety' },
        { href: '/help/business', label: isAr ? 'الأعمال' : 'Business' },
      ],
    },
    {
      title: tt('footer.legal'),
      links: [
        { href: '/legal/terms', label: tt('footer.terms') },
        { href: '/legal/privacy', label: tt('footer.privacy') },
        { href: '/legal/cookies', label: tt('footer.cookies') },
      ],
    },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-pearl mb-3">
          {tt('footer.sitemap')}
        </h1>
        <p className="text-muted mb-12">
          {isAr ? 'كل صفحات الموقع في مكان واحد.' : 'Every page on this site in one place.'}
        </p>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((sec) => (
            <div key={sec.title}>
              <h2 className="text-pearl font-bold text-sm uppercase tracking-wider mb-4">
                {sec.title}
              </h2>
              <ul className="space-y-2.5">
                {sec.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={localizedHref(locale, l.href)}
                      className="text-pearl/80 hover:text-ember transition text-sm"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
