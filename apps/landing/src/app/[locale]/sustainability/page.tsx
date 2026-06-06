import type { Metadata } from 'next';
import { Leaf, Zap, Recycle, TreePine, Users, BarChart3 } from 'lucide-react';
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
    title: t(locale, 'footer.sustainability'),
    description:
      locale === 'ar'
        ? 'التزام HANCR بالاستدامة — سيارات كهربائية، تشارك الرحلات، وقياس بصمتنا الكربونية.'
        : 'HANCR\'s commitment to sustainability — EVs, carpooling, and measuring our carbon footprint.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function SustainabilityPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <Hero
        eyebrow={isAr ? 'الاستدامة' : 'Sustainability'}
        title={
          isAr ? (
            <>
              تنقُّل أنظف
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                لخليجٍ أخضر.
              </span>
            </>
          ) : (
            <>
              Cleaner mobility
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                for a greener Gulf.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'نتبنَّى رؤية المملكة 2030 ومبادرة الشرق الأوسط الأخضر. هدفنا 30% من رحلاتنا بسيارات كهربائية أو هجينة بحلول 2028.'
            : 'We align with Vision 2030 and the Saudi Green Initiative. Our goal: 30% of trips on EVs or hybrids by 2028.'
        }
        primaryCta={{
          href: '#commitments',
          label: isAr ? 'التزاماتنا' : 'Our commitments',
        }}
      />

      <ValuePropsGrid
        heading={isAr ? 'كيف نقلِّل بصمتنا' : 'How we reduce our footprint'}
        items={[
          {
            icon: Zap,
            title: isAr ? 'حوافز للسيارات الكهربائية' : 'EV incentives',
            description: isAr
              ? 'سائقو السيارات الكهربائية يحصلون على عمولة مخفَّضة (10% بدلاً من 15%) وأولوية في المطابقة.'
              : 'EV drivers get reduced commission (10% instead of 15%) and matching priority.',
          },
          {
            icon: Users,
            title: isAr ? 'مشاركة الرحلات' : 'Carpooling',
            description: isAr
              ? 'خدمة Carpool تخفِّض الانبعاثات بمشاركة الرحلة مع راكب آخر في نفس الاتجاه.'
              : 'Our Carpool service reduces emissions by sharing rides with another passenger going the same way.',
          },
          {
            icon: Recycle,
            title: isAr ? 'تقليل الرحلات الفارغة' : 'Less empty driving',
            description: isAr
              ? 'محرك المطابقة يقلِّل ساعات السائق بدون راكب بنسبة 40% مقارنةً بالمنافسين.'
              : 'Our matching engine cuts empty-driver hours by 40% compared to rivals.',
          },
          {
            icon: TreePine,
            title: isAr ? 'تعويض الكربون' : 'Carbon offsetting',
            description: isAr
              ? 'نخصِّص 1% من إيراداتنا لمشاريع التشجير في المنطقة.'
              : 'We dedicate 1% of revenue to regional reforestation projects.',
          },
          {
            icon: Leaf,
            title: isAr ? 'مكاتب صديقة للبيئة' : 'Eco-friendly offices',
            description: isAr
              ? 'مكاتبنا تعمل بالطاقة الشمسية كلياً ومعتمدة LEED Gold.'
              : 'Our offices run 100% on solar and are LEED Gold certified.',
          },
          {
            icon: BarChart3,
            title: isAr ? 'تقارير شفافة' : 'Transparent reporting',
            description: isAr
              ? 'ننشر تقريراً سنوياً عن بصمتنا الكربونية والتقدُّم نحو أهدافنا.'
              : 'We publish an annual carbon footprint report and progress toward our targets.',
          },
        ]}
      />

      {/* ── Commitments ── */}
      <section id="commitments" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pearl mb-8 text-center">
            {isAr ? 'التزاماتنا حتى 2030' : 'Our commitments by 2030'}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { value: '30%', label: isAr ? 'رحلات بسيارات كهربائية بحلول 2028' : 'EV trips by 2028' },
              { value: '50%', label: isAr ? 'تخفيض الانبعاثات لكل رحلة' : 'Emission reduction per trip' },
              { value: 'Net 0', label: isAr ? 'في عملياتنا بحلول 2030' : 'In operations by 2030' },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-ash/60 border border-stone/60 rounded-2xl p-6 text-center"
              >
                <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent mb-2">
                  {c.value}
                </div>
                <div className="text-muted text-sm">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
