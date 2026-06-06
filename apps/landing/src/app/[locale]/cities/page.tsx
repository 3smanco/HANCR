import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { Hero } from '@/components/Hero';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'footer.cities'),
    description:
      locale === 'ar'
        ? 'المدن التي تخدمها HANCR — السعودية، الإمارات، وقطر.'
        : 'Cities served by HANCR — Saudi Arabia, UAE, and Qatar.',
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
  status: 'live' | 'soon';
}

export default function CitiesPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  const cities: City[] = isAr
    ? [
        { name: 'الرياض', country: 'السعودية', status: 'live' },
        { name: 'جدة', country: 'السعودية', status: 'soon' },
        { name: 'الدمام', country: 'السعودية', status: 'soon' },
        { name: 'الخبر', country: 'السعودية', status: 'soon' },
        { name: 'مكة المكرمة', country: 'السعودية', status: 'soon' },
        { name: 'المدينة المنورة', country: 'السعودية', status: 'soon' },
        { name: 'الدوحة', country: 'قطر', status: 'soon' },
        { name: 'دبي', country: 'الإمارات', status: 'soon' },
        { name: 'أبوظبي', country: 'الإمارات', status: 'soon' },
        { name: 'الكويت', country: 'الكويت', status: 'soon' },
        { name: 'المنامة', country: 'البحرين', status: 'soon' },
        { name: 'مسقط', country: 'عُمان', status: 'soon' },
      ]
    : [
        { name: 'Riyadh', country: 'Saudi Arabia', status: 'live' },
        { name: 'Jeddah', country: 'Saudi Arabia', status: 'soon' },
        { name: 'Dammam', country: 'Saudi Arabia', status: 'soon' },
        { name: 'Khobar', country: 'Saudi Arabia', status: 'soon' },
        { name: 'Makkah', country: 'Saudi Arabia', status: 'soon' },
        { name: 'Madinah', country: 'Saudi Arabia', status: 'soon' },
        { name: 'Doha', country: 'Qatar', status: 'soon' },
        { name: 'Dubai', country: 'UAE', status: 'soon' },
        { name: 'Abu Dhabi', country: 'UAE', status: 'soon' },
        { name: 'Kuwait City', country: 'Kuwait', status: 'soon' },
        { name: 'Manama', country: 'Bahrain', status: 'soon' },
        { name: 'Muscat', country: 'Oman', status: 'soon' },
      ];

  const liveCount = cities.filter((c) => c.status === 'live').length;
  const soonCount = cities.filter((c) => c.status === 'soon').length;

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
            ? `${liveCount} مدينة تعمل الآن · ${soonCount} مدينة قريباً.`
            : `${liveCount} city live · ${soonCount} cities coming soon.`
        }
        primaryCta={{
          href: '/downloads/hancr-rider.apk',
          label: isAr ? 'حمِّل التطبيق' : 'Download the app',
        }}
      />

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cities.map((c) => (
            <div
              key={c.name}
              className={`bg-ash/60 border rounded-2xl p-5 transition ${
                c.status === 'live'
                  ? 'border-ember/40 shadow-ember'
                  : 'border-stone/60 hover:border-ember/30'
              }`}
            >
              <MapPin
                className={`w-7 h-7 mb-3 ${
                  c.status === 'live' ? 'text-ember' : 'text-muted'
                }`}
              />
              <h3 className="font-bold text-pearl text-base mb-1">{c.name}</h3>
              <p className="text-muted text-xs mb-3">{c.country}</p>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  c.status === 'live'
                    ? 'bg-success/20 text-success'
                    : 'bg-ember/15 text-ember'
                }`}
              >
                {c.status === 'live'
                  ? isAr
                    ? 'متاح الآن'
                    : 'Live now'
                  : isAr
                    ? 'قريباً'
                    : 'Coming soon'}
              </span>
            </div>
          ))}
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
