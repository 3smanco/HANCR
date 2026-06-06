import type { Metadata } from 'next';
import { DollarSign, Clock, Smartphone, ShieldCheck, TrendingUp, Award } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { ValuePropsGrid } from '@/components/ValuePropsGrid';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQAccordion } from '@/components/FAQAccordion';
import { localizedHref } from '@/lib/locale';
import { ArrowRight } from 'lucide-react';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'nav.drive'),
    description:
      locale === 'ar'
        ? 'انضم سائقاً في HANCR. عمولات أقل، سحب فوري للأرباح، وبدون رسوم خفية.'
        : "Drive with HANCR. Lower commission, instant payouts, no hidden fees.",
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function DrivePage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <Hero
        eyebrow={isAr ? 'للسائق' : 'For drivers'}
        title={
          isAr ? (
            <>
              قُد بحُريَّة.
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                اربح بثقة.
              </span>
            </>
          ) : (
            <>
              Drive on your terms.
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                Earn with confidence.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'انضم لـ HANCR. عمولة 15% فقط، بدون رسوم اشتراك، وسحب أرباحك في أي وقت.'
            : 'Join HANCR. Only 15% commission, no subscription fees, withdraw earnings anytime.'
        }
        primaryCta={{
          href: localizedHref(locale, '/drive/apply'),
          label: isAr ? 'قدِّم طلبك الآن' : 'Apply now',
        }}
        secondaryCta={{
          href: '/downloads/hancr-driver.apk',
          label: isAr ? 'حمِّل تطبيق السائق' : 'Download driver app',
        }}
      />

      <ValuePropsGrid
        heading={isAr ? 'لماذا يختار السائقون HANCR؟' : 'Why drivers choose HANCR'}
        items={[
          {
            icon: DollarSign,
            title: isAr ? 'عمولة 15% فقط' : '15% commission',
            description: isAr
              ? 'الأقل في الخليج. كل دينار تكسبه يَبقى في جيبك.'
              : 'Lowest in the Gulf. Keep more of what you earn.',
          },
          {
            icon: Clock,
            title: isAr ? 'سحب فوري' : 'Instant payouts',
            description: isAr
              ? 'حوِّل أرباحك متى شئت. لا انتظار أسبوع. لا حدّ أدنى.'
              : 'Cash out whenever you want. No weekly wait. No minimum.',
          },
          {
            icon: Smartphone,
            title: isAr ? 'تطبيق سائق متطور' : 'Modern driver app',
            description: isAr
              ? 'بحث ذكي عن الطلبات، خرائط دقيقة، وملاحة مدمجة.'
              : 'Smart order matching, accurate maps, and built-in navigation.',
          },
          {
            icon: ShieldCheck,
            title: isAr ? 'دعم وضمان' : 'Support & guarantees',
            description: isAr
              ? 'فريق دعم 24/7 + تأمين أثناء الرحلة.'
              : '24/7 human support + in-ride insurance.',
          },
          {
            icon: TrendingUp,
            title: isAr ? 'حوافز Stars' : 'Stars incentives',
            description: isAr
              ? 'كلما زادت رحلاتك، زادت مكافآتك الإضافية.'
              : 'The more you drive, the more bonuses you unlock.',
          },
          {
            icon: Award,
            title: isAr ? 'مرونة كاملة' : 'Full flexibility',
            description: isAr
              ? 'قُد متى شئت — لا ورديات إلزامية، لا تارجت.'
              : 'Drive when you want — no mandatory shifts, no targets.',
          },
        ]}
      />

      <HowItWorks
        heading={isAr ? 'خطوات الانضمام' : 'How to join'}
        steps={[
          {
            title: isAr ? 'املأ النموذج' : 'Fill the form',
            description: isAr
              ? 'يأخذ منك أقل من دقيقة.'
              : 'Less than a minute of your time.',
          },
          {
            title: isAr ? 'حمِّل وثائقك' : 'Upload documents',
            description: isAr
              ? 'هوية، رخصة قيادة، استمارة السيارة، وصورة شخصية.'
              : 'ID, license, registration, and a profile photo.',
          },
          {
            title: isAr ? 'اعتماد سريع' : 'Quick approval',
            description: isAr
              ? 'فريقنا يراجع طلبك خلال 48 ساعة.'
              : 'Our team reviews your application within 48 hours.',
          },
          {
            title: isAr ? 'ابدأ القيادة' : 'Start driving',
            description: isAr
              ? 'فعِّل التطبيق وابدأ استلام الطلبات.'
              : 'Activate the app and start receiving orders.',
          },
        ]}
      />

      {/* ── Apply CTA ── */}
      <section id="apply" className="py-20 px-6 bg-coal/50 border-y border-stone/40">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-ember/10 border border-ember/30 text-ember text-xs font-semibold mb-5 uppercase tracking-wider">
            {isAr ? 'تقديم احترافي بـ 4 خطوات' : '4-step pro application'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-4">
            {isAr ? 'جاهز للانضمام؟' : 'Ready to join?'}
          </h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            {isAr
              ? 'بيانات شخصية، سيارة، 5 وثائق، ثم مراجعة. يأخذ عادةً 10 دقائق.'
              : 'Personal info, vehicle, 5 documents, then a review. Takes about 10 minutes.'}
          </p>
          <Link
            href={localizedHref(locale, '/drive/apply')}
            className="inline-flex items-center gap-2 bg-ember hover:bg-ember-deep transition px-8 py-4 rounded-xl font-bold text-lg text-pearl shadow-ember-lg"
          >
            {isAr ? 'ابدأ التسجيل' : 'Start application'}
            <ArrowRight className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
            <span>{isAr ? '✓ بياناتك سرية' : '✓ Data confidential'}</span>
            <span>{isAr ? '✓ مراجعة خلال 48 ساعة' : '✓ Reviewed in 48h'}</span>
            <span>{isAr ? '✓ عمولة 15% فقط' : '✓ 15% commission'}</span>
          </div>
        </div>
      </section>

      <FAQAccordion
        heading={isAr ? 'أسئلة سائقين' : 'Driver questions'}
        items={
          isAr
            ? [
                {
                  q: 'ما هي المتطلبات للانضمام؟',
                  a: '• عمر 21+ سنة\n• رخصة قيادة سارية (سنتان خبرة)\n• سيارة موديل 2014 أو أحدث\n• استمارة سارية + تأمين شامل',
                },
                {
                  q: 'كم سأكسب شهرياً؟',
                  a: 'السائق المتفرغ يربح ما بين 5,000 و 9,000 ر.س شهرياً في الرياض. السائق الجزئي 1,500–3,000 ر.س. الأرقام تعتمد على ساعات العمل والمنطقة.',
                },
                {
                  q: 'هل العمولة 15% حقاً نهائية؟',
                  a: 'نعم. لا رسوم اشتراك، لا اقتطاعات إضافية، لا غرامات إلغاء من جانبنا.',
                },
                {
                  q: 'كيف يتم السحب؟',
                  a: 'مباشرة لحسابك البنكي أو Mada أو STC Pay. التحويل خلال ساعات.',
                },
                {
                  q: 'هل أستطيع العمل في الإمارات أو قطر؟',
                  a: 'حالياً نعمل في السعودية فقط. توسُّعنا الإقليمي مخطَّط له خلال 2026.',
                },
              ]
            : [
                {
                  q: 'What are the requirements to join?',
                  a: '• Age 21+\n• Valid driving license (2+ years experience)\n• Car model 2014 or newer\n• Valid registration + comprehensive insurance',
                },
                {
                  q: 'How much can I earn monthly?',
                  a: 'A full-time driver earns SAR 5,000–9,000 monthly in Riyadh. Part-time SAR 1,500–3,000. Numbers depend on hours and area.',
                },
                {
                  q: 'Is the 15% commission really all-in?',
                  a: 'Yes. No subscription fees, no extra cuts, no cancellation penalties from us.',
                },
                {
                  q: 'How do I withdraw earnings?',
                  a: 'Direct to your bank, Mada, or STC Pay. Transfer in hours.',
                },
                {
                  q: 'Can I work in UAE or Qatar?',
                  a: "We're currently in Saudi only. Regional expansion is planned for 2026.",
                },
              ]
        }
      />
    </>
  );
}
