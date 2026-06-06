import type { Metadata } from 'next';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n/messages';
import { DriverApplicationWizard } from '@/components/DriverApplicationWizard';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale = pick(params.locale);
  return {
    title: locale === 'ar' ? 'تسجيل سائق' : 'Driver application',
    description:
      locale === 'ar'
        ? 'تقديم طلب الانضمام كسائق في HANCR — 4 خطوات سريعة.'
        : 'Apply to drive on HANCR — a 4-step application.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function ApplyPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full bg-ember/10 border border-ember/30 text-ember text-xs font-semibold mb-4 uppercase tracking-wider">
            {isAr ? 'طلب انضمام سائق' : 'Driver application'}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-pearl leading-tight mb-3">
            {isAr ? (
              <>
                ابدأ القيادة مع
                <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                  {' '}HANCR
                </span>
              </>
            ) : (
              <>
                Drive with
                <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                  {' '}HANCR
                </span>
              </>
            )}
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            {isAr
              ? '4 خطوات بسيطة. اعتماد فريقنا خلال 48 ساعة، ثم تبدأ استلام الطلبات.'
              : '4 simple steps. Our team reviews within 48 hours, then you can start receiving orders.'}
          </p>
        </div>

        <DriverApplicationWizard locale={locale} />
      </div>
    </section>
  );
}
