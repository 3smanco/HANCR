import Link from 'next/link';
import {
  Car,
  Bike,
  Building2,
  Briefcase,
  Shield,
  Zap,
  MapPin,
  Star,
  Smartphone,
  Clock,
} from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  translator,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';
import { Hero } from '@/components/Hero';
import { ValuePropsGrid } from '@/components/ValuePropsGrid';
import { FeatureSplit } from '@/components/FeatureSplit';
import { AppDownloadCTA } from '@/components/AppDownloadCTA';

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = (SUPPORTED_LOCALES as readonly string[]).includes(params.locale)
    ? (params.locale as Locale)
    : DEFAULT_LOCALE;
  const tt = translator(locale);
  const isAr = locale === 'ar';

  return (
    <>
      {/* ── Hero ── */}
      <Hero
        eyebrow={isAr ? 'منصة التنقل الذكي' : 'Smart mobility platform'}
        title={
          isAr ? (
            <>
              تنقَّل بذكاء.
              <br />
              <span className="bg-gradient-to-r from-ember via-ember-light to-ember bg-clip-text text-transparent">
                وصِّل بأمان.
              </span>
            </>
          ) : (
            <>
              Move smart.
              <br />
              <span className="bg-gradient-to-r from-ember via-ember-light to-ember bg-clip-text text-transparent">
                Deliver safely.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'منصة التنقل الذكي لكل مكان. رحلات، توصيل، ومشاركة سيارات — في تطبيق واحد آمن وسهل.'
            : 'The smart mobility platform for everywhere. Rides, delivery, and carpooling — in one safe and easy app.'
        }
        primaryCta={{
          href: localizedHref(locale, '/ride'),
          label: tt('cta.bookRide'),
        }}
        secondaryCta={{
          href: localizedHref(locale, '/drive'),
          label: tt('cta.signUpDriver'),
        }}
        align="center"
      />

      {/* ── Four services ── */}
      <section className="px-6 -mt-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Car,
              href: '/ride',
              title: tt('nav.ride'),
              copy: isAr ? 'اطلب رحلة الآن' : 'Request a ride',
            },
            {
              icon: Briefcase,
              href: '/drive',
              title: tt('nav.drive'),
              copy: isAr ? 'انضم سائقاً' : 'Become a driver',
            },
            {
              icon: Bike,
              href: '/deliver',
              title: tt('nav.deliver'),
              copy: isAr ? 'وصِّل وكَسِّب' : 'Deliver and earn',
            },
            {
              icon: Building2,
              href: '/business',
              title: tt('nav.business'),
              copy: isAr ? 'حلول الشركات' : 'Business solutions',
            },
          ].map(({ icon: Icon, href, title, copy }) => (
            <Link
              key={href}
              href={localizedHref(locale, href)}
              className="group bg-ash/60 hover:bg-ash border border-stone/60 hover:border-ember/50 rounded-2xl p-5 transition shadow-card hover:shadow-ember"
            >
              <div className="w-11 h-11 rounded-xl bg-ember/15 group-hover:bg-ember/25 transition flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-ember" />
              </div>
              <h3 className="text-base font-bold text-pearl mb-0.5">{title}</h3>
              <p className="text-xs text-muted">{copy}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Safety differentiator ── */}
      <FeatureSplit
        accent="coal"
        reverse
        icon={Shield}
        eyebrow={isAr ? 'أمانك أولاً' : 'Your safety first'}
        title={isAr ? 'مصمَّمة لتحميك في كل رحلة.' : 'Built to protect you on every trip.'}
        description={
          isAr
            ? 'الأمان ليس ميزة إضافية لدينا — إنه أساس المنصّة. كل سائق موثَّق، وكل رحلة قابلة للمشاركة والتتبُّع لحظياً.'
            : "Safety isn't an add-on for us — it's the foundation of the platform. Every driver is verified, and every trip is shareable and tracked in real time."
        }
        bullets={
          isAr
            ? [
                'توثيق هوية + خلفية لكل سائق قبل قبوله',
                'مشاركة الرحلة المباشرة مع جهاتك الموثوقة',
                'زر SOS مدمج ودعم بشري 24/7',
              ]
            : [
                'ID + background verification for every driver',
                'Live trip-sharing with your trusted contacts',
                'Built-in SOS button and 24/7 human support',
              ]
        }
        cta={{ href: localizedHref(locale, '/safety'), label: isAr ? 'اعرف المزيد عن الأمان' : 'Learn about safety' }}
      />

      {/* ── Value props ── */}
      <ValuePropsGrid
        heading={isAr ? 'لماذا HANCR؟' : 'Why HANCR?'}
        subheading={
          isAr
            ? 'صُمِّمت لتُلبّي احتياجاتك، بمعايير عالمية.'
            : 'Designed for you, built to world-class standards.'
        }
        items={[
          {
            icon: Shield,
            title: isAr ? 'نظام طوارئ مدمج' : 'Built-in SOS',
            description: isAr
              ? 'زر SOS في كل رحلة يُرسل موقعك لجهات الطوارئ + فريق HANCR فوراً.'
              : 'In-ride SOS sends your live location to your trusted contacts and HANCR support immediately.',
          },
          {
            icon: Zap,
            title: isAr ? 'مطابقة فورية' : 'Instant matching',
            description: isAr
              ? 'محرك ذكي يربطك بأقرب سائق في ثوانٍ — أسرع 73% من المنافسين.'
              : 'Smart engine pairs you with the nearest driver in seconds — 73% faster than rivals.',
          },
          {
            icon: Star,
            title: isAr ? 'برنامج HANCR Miles' : 'HANCR Miles program',
            description: isAr
              ? 'أربع مستويات (برونزي إلى بلاتيني). كلما زادت رحلاتك زادت مكافآتك.'
              : 'Four tiers (Bronze to Platinum). The more you ride, the more you earn.',
          },
          {
            icon: MapPin,
            title: isAr ? 'تتبُّع حيّ' : 'Live tracking',
            description: isAr
              ? 'شارك مسار رحلتك تلقائياً مع جهاتك الموثوقة.'
              : 'Share your live trip path with your trusted contacts automatically.',
          },
          {
            icon: Smartphone,
            title: isAr ? 'تطبيقات أصلية' : 'Native apps',
            description: isAr
              ? 'تجربة استخدام سلسة على iOS و Android مع دعم RTL كامل.'
              : 'Smooth UX on iOS and Android with full RTL support.',
          },
          {
            icon: Clock,
            title: isAr ? 'دعم 24/7' : '24/7 support',
            description: isAr
              ? 'فريق دعم بشري متاح طوال الوقت — بالعربية والإنجليزية.'
              : 'Human support team always available — in Arabic and English.',
          },
        ]}
      />

      <AppDownloadCTA locale={locale} />
    </>
  );
}
