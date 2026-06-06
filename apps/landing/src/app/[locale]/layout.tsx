import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApolloWrapper } from '@/app/apollo-provider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyMobileCTA } from '@/components/StickyMobileCTA';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale = (SUPPORTED_LOCALES as readonly string[]).includes(params.locale)
    ? (params.locale as Locale)
    : DEFAULT_LOCALE;
  return {
    title: { default: t(locale, 'meta.siteName'), template: `%s · ${t(locale, 'meta.siteName')}` },
    description: t(locale, 'meta.tagline'),
    alternates: {
      languages: {
        ar: '/ar',
        en: '/en',
      },
    },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(params.locale)) {
    notFound();
  }
  const locale = params.locale as Locale;

  return (
    <ApolloWrapper>
      <div className={locale === 'ar' ? 'font-ar' : 'font-en'}>
        <Header locale={locale} />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer locale={locale} />
        <StickyMobileCTA locale={locale} />
      </div>
    </ApolloWrapper>
  );
}
