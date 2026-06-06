import type { Metadata } from 'next';
import { TrendingUp, Users, MapPin, DollarSign, Target, Award } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { Hero } from '@/components/Hero';
import { ValuePropsGrid } from '@/components/ValuePropsGrid';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'footer.investors'),
    description:
      locale === 'ar'
        ? 'علاقات المستثمرين — معلومات استراتيجية ومالية عن HANCR.'
        : 'Investor relations — strategic and financial information about HANCR.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function InvestorsPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <Hero
        eyebrow={isAr ? 'علاقات المستثمرين' : 'Investor relations'}
        title={
          isAr ? (
            <>
              نبني منصة التنقل
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                الإقليمية الرائدة.
              </span>
            </>
          ) : (
            <>
              Building the region&apos;s leading
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                mobility platform.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'سوق التنقل في الخليج يقدَّر بـ 12 مليار دولار سنوياً وينمو بـ 18% — وHANCR في موقع فريد للاستحواذ على حصة كبيرة.'
            : 'The Gulf mobility market is valued at $12B annually, growing at 18% — and HANCR is uniquely positioned to capture significant share.'
        }
        primaryCta={{
          href: 'mailto:investors@hancr.com',
          label: isAr ? 'تواصل مع IR' : 'Contact IR',
        }}
      />

      {/* ── Key stats ── */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: '$12B', label: isAr ? 'حجم السوق السنوي' : 'Annual market size' },
            { value: '18%', label: isAr ? 'نمو السوق' : 'Market growth' },
            { value: '15%', label: isAr ? 'عمولتنا' : 'Our commission' },
            { value: '2026', label: isAr ? 'تأسسنا' : 'Founded' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-ash/60 border border-stone/60 rounded-2xl p-6 text-center"
            >
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent mb-2">
                {s.value}
              </div>
              <div className="text-muted text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <ValuePropsGrid
        heading={isAr ? 'لماذا HANCR؟' : 'Why HANCR'}
        items={[
          {
            icon: MapPin,
            title: isAr ? 'سوق منخفض الاختراق' : 'Underserved market',
            description: isAr
              ? 'منطقة الخليج تعتمد على لاعبين عالميين لا يفهمون احتياجاتها المحلية.'
              : 'The Gulf relies on global players that don\'t understand local needs.',
          },
          {
            icon: DollarSign,
            title: isAr ? 'اقتصاديات وحدوية متينة' : 'Strong unit economics',
            description: isAr
              ? 'عمولة 15% + low CAC نتيجة الاعتماد على الإحالة + نمو عضوي.'
              : '15% commission + low CAC driven by referral + organic growth.',
          },
          {
            icon: Users,
            title: isAr ? 'فريق مؤسِّس قوي' : 'Strong founding team',
            description: isAr
              ? 'مزيج من خبرة منتج، هندسة، وعمليات بخبرة 10+ سنوات.'
              : 'Mix of product, engineering, and operations expertise with 10+ years experience.',
          },
          {
            icon: TrendingUp,
            title: isAr ? 'نمو سريع' : 'Fast growth',
            description: isAr
              ? '10,000+ رحلة في أول 6 أشهر، بهامش ربح موجب لكل رحلة.'
              : '10,000+ rides in first 6 months, with positive per-ride margin.',
          },
          {
            icon: Target,
            title: isAr ? 'طريق واضح للقياس' : 'Clear path to scale',
            description: isAr
              ? 'منصة قابلة للتوسُّع تقنياً، وخطة محكمة لـ 4 مدن خلال 18 شهراً.'
              : 'Technically scalable platform, tight plan for 4 cities within 18 months.',
          },
          {
            icon: Award,
            title: isAr ? 'هوامش تشغيلية ممتازة' : 'Healthy operating margins',
            description: isAr
              ? 'بنية تكاليف خفيفة، فريق صغير عالي الكفاءة.'
              : 'Lean cost structure, small high-leverage team.',
          },
        ]}
      />

      {/* ── Contact IR ── */}
      <section className="py-16 px-6 bg-coal/40 border-y border-stone/40">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pearl mb-4">
            {isAr ? 'مهتم بالاستثمار؟' : 'Interested in investing?'}
          </h2>
          <p className="text-muted mb-6">
            {isAr
              ? 'نشارك بيت المستثمرين عرض تقديمي مفصَّل، مؤشرات تشغيلية، ونماذج مالية لجولات التمويل القادمة.'
              : 'We share with investors a detailed deck, operating metrics, and financial models for upcoming rounds.'}
          </p>
          <a
            href="mailto:investors@hancr.com"
            className="inline-flex items-center gap-2 bg-ember hover:bg-ember-deep transition px-6 py-3 rounded-xl font-bold text-pearl shadow-ember"
          >
            investors@hancr.com
          </a>
        </div>
      </section>
    </>
  );
}
