import type { Metadata } from 'next';
import Link from 'next/link';
import { User, Car, CreditCard, ShieldAlert, Briefcase, ArrowRight } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';
import { Hero } from '@/components/Hero';
import { FAQAccordion } from '@/components/FAQAccordion';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'nav.help'),
    description:
      locale === 'ar'
        ? 'مركز مساعدة HANCR — إجابات على الأسئلة الشائعة للراكب والسائق والأعمال.'
        : 'HANCR Help Center — answers to common questions for riders, drivers, and businesses.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

const TOPICS = [
  { slug: 'rider', icon: User },
  { slug: 'driver', icon: Car },
  { slug: 'payments', icon: CreditCard },
  { slug: 'safety', icon: ShieldAlert },
  { slug: 'business', icon: Briefcase },
] as const;

export default function HelpPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  const topicLabels: Record<string, { title: string; summary: string }> = isAr
    ? {
        rider: { title: 'للراكب', summary: 'حجز، إلغاء، تتبُّع، تقييم.' },
        driver: { title: 'للسائق', summary: 'الانضمام، الأرباح، السحب، المتطلبات.' },
        payments: { title: 'المدفوعات', summary: 'البطاقات، المحفظة، الفواتير.' },
        safety: { title: 'الأمان', summary: 'SOS، الإبلاغ، المخالفات.' },
        business: { title: 'الأعمال', summary: 'الفواتير، الموظفون، التقارير.' },
      }
    : {
        rider: { title: 'For riders', summary: 'Book, cancel, track, rate.' },
        driver: { title: 'For drivers', summary: 'Join, earnings, withdrawals, requirements.' },
        payments: { title: 'Payments', summary: 'Cards, wallet, invoices.' },
        safety: { title: 'Safety', summary: 'SOS, reporting, violations.' },
        business: { title: 'Business', summary: 'Invoices, employees, reports.' },
      };

  return (
    <>
      <Hero
        eyebrow={isAr ? 'مركز المساعدة' : 'Help Center'}
        title={
          isAr ? (
            <>
              كيف يمكننا
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                {' '}مساعدتك؟
              </span>
            </>
          ) : (
            <>
              How can we
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                {' '}help you?
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'إجابات سريعة على الأسئلة الشائعة. لا تجد ما تبحث عنه؟ تواصل معنا.'
            : "Quick answers to common questions. Don't see what you need? Contact us."
        }
        primaryCta={{ href: localizedHref(locale, '/contact'), label: isAr ? 'تواصل معنا' : 'Contact us' }}
      />

      {/* ── Topic cards ── */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map(({ slug, icon: Icon }) => {
            const meta = topicLabels[slug];
            return (
              <Link
                key={slug}
                href={localizedHref(locale, `/help/${slug}`)}
                className="group bg-ash/60 hover:bg-ash border border-stone/60 hover:border-ember/40 rounded-2xl p-5 transition"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-ember/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-ember" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-pearl text-base mb-0.5 group-hover:text-ember transition">
                      {meta.title}
                    </h3>
                    <p className="text-muted text-sm">{meta.summary}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-ember transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <FAQAccordion
        heading={isAr ? 'الأسئلة الأكثر شيوعاً' : 'Most asked questions'}
        items={
          isAr
            ? [
                {
                  q: 'كيف أنشئ حساباً؟',
                  a: 'حمِّل التطبيق، أدخل رقم جوالك، تحقَّق برمز OTP، وستجد حسابك جاهزاً.',
                },
                {
                  q: 'هل يمكنني إلغاء الرحلة بعد طلبها؟',
                  a: 'نعم. الإلغاء مجاني خلال أول دقيقتين أو قبل وصول السائق بـ 3 دقائق. بعد ذلك تطبَّق رسوم رمزية.',
                },
                {
                  q: 'كيف أبلغ عن سائق؟',
                  a: 'افتح التطبيق → الرحلات السابقة → الرحلة → "أبلغ عن مشكلة". فريقنا يراجع البلاغ خلال 24 ساعة.',
                },
                {
                  q: 'متى تصل أرباحي كسائق؟',
                  a: 'الأرباح متاحة فوراً في محفظتك. السحب لحسابك البنكي يستغرق ساعات.',
                },
                {
                  q: 'هل تعملون في أكثر من مدينة؟',
                  a: 'حالياً في الرياض، مع توسُّع مخطَّط لـ جدة، الدوحة، ودبي. راجع صفحة المدن للتفاصيل.',
                },
              ]
            : [
                {
                  q: 'How do I create an account?',
                  a: 'Download the app, enter your phone number, verify with OTP, and your account is ready.',
                },
                {
                  q: 'Can I cancel a ride after requesting?',
                  a: 'Yes. Free cancellation within the first 2 minutes or 3 minutes before driver arrival. After that a small fee applies.',
                },
                {
                  q: 'How do I report a driver?',
                  a: 'App → Past trips → the trip → "Report an issue". Our team reviews reports within 24 hours.',
                },
                {
                  q: 'When do I receive earnings as a driver?',
                  a: 'Earnings are available instantly in your wallet. Bank withdrawal takes hours.',
                },
                {
                  q: 'Do you operate in more than one city?',
                  a: 'Currently in Riyadh, with planned expansion to Jeddah, Doha, and Dubai. See the Cities page.',
                },
              ]
        }
      />
    </>
  );
}
