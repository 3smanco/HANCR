import type { Metadata } from 'next';
import { Heart, Compass, Users, Globe2 } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';
import { Hero } from '@/components/Hero';
import { ValuePropsGrid } from '@/components/ValuePropsGrid';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'nav.about'),
    description:
      locale === 'ar'
        ? 'مهمتنا في HANCR — تبسيط التنقل حول العالم، بكفاءة وأمان.'
        : 'Our mission at HANCR — simplifying mobility everywhere, with efficiency and safety.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <Hero
        eyebrow={isAr ? 'عن HANCR' : 'About HANCR'}
        title={
          isAr ? (
            <>
              نُيسِّر التنقل
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                لكل شخص، في كل مكان.
              </span>
            </>
          ) : (
            <>
              Making mobility easier
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                for everyone, everywhere.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'تأسَّست HANCR على فكرة بسيطة: التنقل يجب أن يكون آمناً وعادلاً وذكياً — للراكب والسائق على حدٍّ سواء.'
            : 'HANCR was founded on a simple idea: mobility should be safe, fair, and smart — for both riders and drivers.'
        }
        primaryCta={{
          href: localizedHref(locale, '/careers'),
          label: isAr ? 'انضم لنا' : 'Join us',
        }}
        secondaryCta={{
          href: localizedHref(locale, '/contact'),
          label: isAr ? 'تواصل معنا' : 'Get in touch',
        }}
      />

      {/* ── Story ── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-6 text-pearl/90 text-lg leading-relaxed">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pearl">
            {isAr ? 'قصتنا' : 'Our story'}
          </h2>
          <p>
            {isAr
              ? 'بدأت HANCR من ملاحظة بسيطة: السائقون حول العالم يدفعون عمولات مرتفعة لمنصات لا تفهم احتياجاتهم المحلية، والركاب يدفعون أسعاراً متذبذبة بلا وضوح. أردنا أن نبني بديلاً يحترم الجميع، في كل مدينة نعمل بها.'
              : 'HANCR started from a simple observation: drivers everywhere pay high commissions to platforms that don\'t understand their local needs, and riders pay opaque, fluctuating prices. We wanted to build an alternative that respects everyone, in every city we operate in.'}
          </p>
          <p>
            {isAr
              ? 'بنينا منصة كاملة من الصفر — تطبيقات أصلية للراكب والسائق، لوحة إدارة احترافية، ومحرك مطابقة ذكي يعمل بسرعة قياسية. كل خطوة، نسأل: هل هذا أفضل للسائق؟ للراكب؟ للمجتمع؟'
              : 'We built a full platform from scratch — native rider and driver apps, a professional admin panel, and a smart matching engine that runs at record speed. At every step we ask: is this better for the driver? For the rider? For the community?'}
          </p>
          <p>
            {isAr
              ? 'اليوم، نخدم آلاف الرحلات شهرياً في الرياض، ونتوسَّع تدريجياً إلى جدة، الدوحة، ودبي. هذه فقط البداية.'
              : 'Today we serve thousands of rides per month in Riyadh, and are gradually expanding to Jeddah, Doha, and Dubai. This is just the beginning.'}
          </p>
        </div>
      </section>

      <ValuePropsGrid
        heading={isAr ? 'قيمنا' : 'Our values'}
        items={[
          {
            icon: Heart,
            title: isAr ? 'إنسانية أولاً' : 'People first',
            description: isAr
              ? 'وراء كل رحلة سائق وراكب. قراراتنا تبدأ منهم.'
              : 'Behind every ride is a driver and a rider. Decisions start with them.',
          },
          {
            icon: Compass,
            title: isAr ? 'الشفافية مبدأ' : 'Transparency as a principle',
            description: isAr
              ? 'أسعار واضحة، عمولات معلنة، وقواعد لا تتغير في الخفاء.'
              : 'Clear prices, public commissions, and rules that don\'t change in secret.',
          },
          {
            icon: Users,
            title: isAr ? 'فريق محلي' : 'Local team',
            description: isAr
              ? 'مهندسون من المنطقة، يفهمون لغتها، عاداتها، وأولوياتها.'
              : 'Engineers from the region, who speak its language and understand its culture.',
          },
          {
            icon: Globe2,
            title: isAr ? 'طموح عالمي' : 'Global ambition',
            description: isAr
              ? 'هدفنا أن نكون منصة التنقل المفضّلة في كل مدينة نعمل بها، حول العالم.'
              : 'Our goal is to be the preferred mobility platform in every city we operate in, around the world.',
          },
        ]}
        columns={4}
      />

      {/* ── Stats ── */}
      <section className="py-16 px-6 bg-coal/40 border-y border-stone/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { value: '15%', label: isAr ? 'عمولة فقط' : 'Commission only' },
            { value: '3s', label: isAr ? 'متوسط المطابقة' : 'Avg match time' },
            { value: '24/7', label: isAr ? 'دعم بشري' : 'Human support' },
            { value: '2026', label: isAr ? 'تأسسنا' : 'Founded' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent mb-2">
                {s.value}
              </div>
              <div className="text-muted text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
