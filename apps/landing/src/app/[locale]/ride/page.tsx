import type { Metadata } from 'next';
import { Smartphone, MapPin, CreditCard, Shield, Star, Clock } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';
import { Hero } from '@/components/Hero';
import { ValuePropsGrid } from '@/components/ValuePropsGrid';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQAccordion } from '@/components/FAQAccordion';
import { AppDownloadCTA } from '@/components/AppDownloadCTA';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'nav.ride'),
    description:
      locale === 'ar'
        ? 'احجز رحلتك بثقة مع HANCR. أسعار شفافة، سائقون موثوقون، وأمان مدمج.'
        : 'Book your ride with confidence on HANCR. Transparent pricing, trusted drivers, built-in safety.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function RidePage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <Hero
        eyebrow={isAr ? 'للراكب' : 'For riders'}
        title={
          isAr ? (
            <>
              رحلتك.
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                شروطك. أمانك.
              </span>
            </>
          ) : (
            <>
              Your ride.
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                Your way. Your safety.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'احجز سيارة في ثوانٍ. ادفع نقداً أو بطاقة أو محفظة. تتبَّع رحلتك مباشرة.'
            : 'Hail a car in seconds. Pay cash, card, or wallet. Track your ride live.'
        }
        primaryCta={{
          href: '/downloads/hancr-rider.apk',
          label: isAr ? 'حمِّل تطبيق الراكب' : 'Download rider app',
        }}
        secondaryCta={{
          href: localizedHref(locale, '/safety'),
          label: isAr ? 'تعرَّف على ميزات الأمان' : 'See safety features',
        }}
      />

      <ValuePropsGrid
        heading={isAr ? 'كل ما تحتاجه في تطبيق واحد' : 'Everything you need, in one app'}
        items={[
          {
            icon: Smartphone,
            title: isAr ? 'حجز في 3 ثوانٍ' : 'Book in 3 seconds',
            description: isAr
              ? 'انقر، حدِّد وجهتك، واخترْ الخدمة. سائقك في طريقه فوراً.'
              : 'Tap, set your destination, pick a service. Your driver is on the way.',
          },
          {
            icon: MapPin,
            title: isAr ? 'وجهات متعددة' : 'Multiple stops',
            description: isAr
              ? 'أضف حتى 5 نقاط توقف في الرحلة الواحدة لتوصيل عائلتك أو أصدقائك.'
              : 'Add up to 5 stops in a single trip to drop off family or friends.',
          },
          {
            icon: CreditCard,
            title: isAr ? 'دفع متعدد الخيارات' : 'Multiple payment options',
            description: isAr
              ? 'نقداً، بطاقة، Apple Pay، أو محفظة HANCR. أنت تختار.'
              : 'Cash, card, Apple Pay, or HANCR wallet. You choose.',
          },
          {
            icon: Shield,
            title: isAr ? 'زر طوارئ في كل رحلة' : 'SOS in every ride',
            description: isAr
              ? 'أرسل موقعك لجهات الطوارئ بنقرة واحدة.'
              : 'Send your location to emergency contacts with one tap.',
          },
          {
            icon: Star,
            title: isAr ? 'نقاط ولاء' : 'Loyalty points',
            description: isAr
              ? 'اربح نقاط HANCR Miles على كل رحلة، واستبدلها بخصومات.'
              : 'Earn HANCR Miles on every ride and redeem for discounts.',
          },
          {
            icon: Clock,
            title: isAr ? 'حجز مسبق' : 'Schedule ahead',
            description: isAr
              ? 'احجز رحلتك قبل ساعات أو أيام لرحلات المطار والاجتماعات.'
              : 'Schedule a ride hours or days ahead for airport runs and meetings.',
          },
        ]}
      />

      <HowItWorks
        heading={isAr ? 'كيف تعمل؟' : 'How it works'}
        steps={[
          {
            title: isAr ? 'حمِّل التطبيق' : 'Download the app',
            description: isAr
              ? 'متاح الآن على Android. iOS قريباً.'
              : 'Available on Android. iOS coming soon.',
          },
          {
            title: isAr ? 'سجِّل برقم جوالك' : 'Sign up with your phone',
            description: isAr
              ? 'تحقُّق بـ OTP خلال ثوانٍ — لا بريد إلكتروني مطلوب.'
              : 'OTP verification in seconds — no email required.',
          },
          {
            title: isAr ? 'احجز رحلتك' : 'Book your ride',
            description: isAr
              ? 'اختر وجهتك، الخدمة، وطريقة الدفع.'
              : 'Choose your destination, service, and payment.',
          },
          {
            title: isAr ? 'استمتع وقَيِّم' : 'Enjoy and rate',
            description: isAr
              ? 'تتبَّع رحلتك حياً، ثم قَيِّم سائقك بعد الوصول.'
              : 'Track your ride live, then rate your driver on arrival.',
          },
        ]}
      />

      <FAQAccordion
        heading={isAr ? 'أسئلة شائعة' : 'Frequently asked questions'}
        items={
          isAr
            ? [
                {
                  q: 'هل HANCR متاح في مدينتي؟',
                  a: 'نحن نعمل حالياً في الرياض، ونتوسَّع تدريجياً لـ جدة، الدوحة، ودبي. تابع صفحة المدن للحصول على أحدث المعلومات.',
                },
                {
                  q: 'كم تستغرق المطابقة مع سائق؟',
                  a: 'متوسط وقت المطابقة 30 ثانية في المناطق المغطاة. في ساعات الذروة قد يطول قليلاً.',
                },
                {
                  q: 'هل أحتاج بطاقة ائتمان لاستخدام HANCR؟',
                  a: 'لا. يمكنك الدفع نقداً مباشرة للسائق، أو إضافة بطاقة لاحقاً للراحة.',
                },
                {
                  q: 'ماذا أفعل لو نسيت أمتعتي في السيارة؟',
                  a: 'افتح التطبيق → الرحلات السابقة → الرحلة المعنية → "اتصل بالسائق". سيتم التواصل بنظام أرقام مقنَّعة.',
                },
                {
                  q: 'هل أسعاركم تتغير حسب الذروة؟',
                  a: 'نحن نطبِّق تسعيراً ديناميكياً شفافاً في ساعات الذروة. السعر يُعرَض دائماً قبل تأكيد الرحلة.',
                },
              ]
            : [
                {
                  q: 'Is HANCR available in my city?',
                  a: "We're currently live in Riyadh, expanding to Jeddah, Doha, and Dubai. Check the Cities page for the latest.",
                },
                {
                  q: 'How long does matching take?',
                  a: 'Average matching time is 30 seconds in covered areas. Peak hours can be a bit longer.',
                },
                {
                  q: 'Do I need a credit card to use HANCR?',
                  a: 'No. You can pay cash directly to the driver, or add a card later for convenience.',
                },
                {
                  q: 'What if I leave something in the car?',
                  a: 'Open the app → Past trips → the trip → "Call driver". Calls use masked numbers.',
                },
                {
                  q: 'Do prices change with demand?',
                  a: 'We apply transparent dynamic pricing during peak hours. The price is always shown before you confirm.',
                },
              ]
        }
      />

      <AppDownloadCTA locale={locale} variant="rider" />
    </>
  );
}
