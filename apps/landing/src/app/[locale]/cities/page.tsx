import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { Hero } from '@/components/Hero';
import { CitiesLive } from '@/components/CitiesLive';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'footer.cities'),
    description:
      locale === 'ar'
        ? 'المدن التي تخدمها HANCR، وخطة التوسُّع القادمة.'
        : "Cities HANCR serves today, and what's coming next.",
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

interface City {
  name: string;
  country: string;
}

export default function CitiesPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  const cities: City[] = isAr
    ? [
        { name: 'جدة', country: 'السعودية' },
        { name: 'الدمام', country: 'السعودية' },
        { name: 'الخبر', country: 'السعودية' },
        { name: 'مكة المكرمة', country: 'السعودية' },
        { name: 'المدينة المنورة', country: 'السعودية' },
        { name: 'الدوحة', country: 'قطر' },
        { name: 'دبي', country: 'الإمارات' },
        { name: 'أبوظبي', country: 'الإمارات' },
        { name: 'الكويت', country: 'الكويت' },
        { name: 'المنامة', country: 'البحرين' },
        { name: 'مسقط', country: 'عُمان' },
      ]
    : [
        { name: 'Jeddah', country: 'Saudi Arabia' },
        { name: 'Dammam', country: 'Saudi Arabia' },
        { name: 'Khobar', country: 'Saudi Arabia' },
        { name: 'Makkah', country: 'Saudi Arabia' },
        { name: 'Madinah', country: 'Saudi Arabia' },
        { name: 'Doha', country: 'Qatar' },
        { name: 'Dubai', country: 'UAE' },
        { name: 'Abu Dhabi', country: 'UAE' },
        { name: 'Kuwait City', country: 'Kuwait' },
        { name: 'Manama', country: 'Bahrain' },
        { name: 'Muscat', country: 'Oman' },
      ];

  const soonCount = cities.length;

  return (
    <>
      <Hero
        eyebrow={isAr ? 'المدن المتاحة' : 'Cities served'}
        title={
          isAr ? (
            <>
              نتوسَّع لخدمتك
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                {' '}أينما كنت.
              </span>
            </>
          ) : (
            <>
              Expanding to serve you
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                {' '}wherever you are.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? `متاحة الآن، و${soonCount} مدينة قادمة قريباً — ونتوسَّع باستمرار.`
            : `Live now, with ${soonCount} more cities coming soon — and we're expanding continuously.`
        }
        primaryCta={{
          href: '/downloads/hancr-rider.apk',
          label: isAr ? 'حمِّل التطبيق' : 'Download the app',
        }}
      />

      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-pearl mb-4">
            {isAr ? 'متاح الآن' : 'Live now'}
          </h2>
          <CitiesLive locale={locale} />
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-pearl mb-4">
            {isAr ? 'قريباً' : 'Coming soon'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cities.map((c) => (
              <div
                key={c.name}
                className="bg-ash/60 border border-stone/60 hover:border-ember/30 rounded-2xl p-5 transition"
              >
                <MapPin className="w-7 h-7 mb-3 text-muted" />
                <h3 className="font-bold text-pearl text-base mb-1">{c.name}</h3>
                <p className="text-muted text-xs mb-3">{c.country}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember/15 text-ember">
                  {isAr ? 'قريباً' : 'Coming soon'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto bg-coal/50 border border-stone/60 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-pearl mb-2">
            {isAr ? 'مدينتك ليست في القائمة؟' : "Don't see your city?"}
          </h3>
          <p className="text-muted mb-4">
            {isAr
              ? 'أخبرنا — نأخذ طلبات التوسُّع بعين الاعتبار عند تحديد المدن القادمة.'
              : "Tell us — we take expansion requests into account when prioritizing next cities."}
          </p>
          <a
            href="mailto:hello@hancr.com?subject=City%20request"
            className="inline-flex items-center gap-2 bg-ember hover:bg-ember-deep transition px-5 py-2.5 rounded-xl font-bold text-pearl text-sm shadow-ember"
          >
            {isAr ? 'اطلب مدينتك' : 'Request your city'}
          </a>
        </div>
      </section>
    </>
  );
}
