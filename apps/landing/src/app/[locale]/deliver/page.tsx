import type { Metadata } from 'next';
import { Package, Bike, Clock, MapPin, ShieldCheck, Smartphone } from 'lucide-react';
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
import { LeadForm } from '@/components/LeadForm';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'nav.deliver'),
    description:
      locale === 'ar'
        ? 'وصِّل وكَسِّب مع HANCR. سيارة، دراجة نارية، أو دراجة هوائية.'
        : 'Deliver and earn with HANCR. Car, motorbike, or bicycle.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function DeliverPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <Hero
        eyebrow={isAr ? 'للموصِّل' : 'For couriers'}
        title={
          isAr ? (
            <>
              وصِّل بأي شيء.
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                واكسب بمرونة.
              </span>
            </>
          ) : (
            <>
              Deliver anything.
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                Earn on your terms.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'ابدأ بالتوصيل عبر HANCR — وثائق، طلبات بقالة، أو طلبات شخصية. تحكَّم في وقتك، واسحب أرباحك فوراً.'
            : 'Start delivering on HANCR — documents, groceries, or personal errands. Set your own hours, withdraw earnings instantly.'
        }
        primaryCta={{
          href: '#apply',
          label: isAr ? 'سجِّل كموصِّل' : 'Sign up to deliver',
        }}
        secondaryCta={{
          href: localizedHref(locale, '/drive'),
          label: isAr ? 'أو سجِّل كسائق' : 'Or drive instead',
        }}
      />

      <ValuePropsGrid
        heading={isAr ? 'لماذا التوصيل مع HANCR؟' : 'Why deliver with HANCR'}
        items={[
          {
            icon: Bike,
            title: isAr ? 'أي وسيلة نقل' : 'Any vehicle',
            description: isAr
              ? 'سيارة، دراجة نارية، أو دراجة هوائية — أنت تختار.'
              : 'Car, motorbike, or bicycle — your call.',
          },
          {
            icon: Clock,
            title: isAr ? 'مرونة كاملة' : 'Full flexibility',
            description: isAr
              ? 'لا ورديات، لا حد أدنى. ابدأ وأوقف متى شئت.'
              : 'No shifts, no minimums. Start and stop anytime.',
          },
          {
            icon: Package,
            title: isAr ? 'طلبات متنوعة' : 'Varied orders',
            description: isAr
              ? 'وثائق، طرود، بقالة، طلبات شخصية. اختر ما يناسبك.'
              : 'Documents, parcels, groceries, errands. Pick what suits you.',
          },
          {
            icon: MapPin,
            title: isAr ? 'مسارات قصيرة' : 'Short routes',
            description: isAr
              ? 'خوارزمية المطابقة تعطيك أقرب الطلبات أولاً.'
              : 'Matching algorithm prioritizes the closest orders.',
          },
          {
            icon: ShieldCheck,
            title: isAr ? 'دعم وضمان' : 'Support & coverage',
            description: isAr
              ? 'تأمين أثناء التوصيل + دعم متاح 24/7.'
              : 'In-delivery insurance + 24/7 support.',
          },
          {
            icon: Smartphone,
            title: isAr ? 'تطبيق سهل' : 'Easy app',
            description: isAr
              ? 'نفس تطبيق السائق — التبديل بين الركوب والتوصيل بنقرة.'
              : 'Same driver app — switch between rides and deliveries with one tap.',
          },
        ]}
      />

      <HowItWorks
        heading={isAr ? 'خطوات البدء' : 'How to start'}
        steps={[
          {
            title: isAr ? 'املأ النموذج' : 'Apply',
            description: isAr ? 'بياناتك ووسيلة نقلك.' : 'Your info and your vehicle.',
          },
          {
            title: isAr ? 'وثائق الاعتماد' : 'Submit documents',
            description: isAr
              ? 'هوية، رخصة (إن وُجدت)، صورة شخصية.'
              : 'ID, license (if applicable), profile photo.',
          },
          {
            title: isAr ? 'تدريب قصير' : 'Quick onboarding',
            description: isAr
              ? 'ندخلك على التطبيق ونوضح القواعد. أقل من ساعة.'
              : 'We get you on the app and explain the rules. Under an hour.',
          },
          {
            title: isAr ? 'ابدأ التوصيل' : 'Start delivering',
            description: isAr
              ? 'فعِّل وضعك على "متاح" واستلم الطلبات.'
              : 'Flip to "available" and start receiving orders.',
          },
        ]}
      />

      <section id="apply" className="py-20 px-6 bg-coal/50 border-y border-stone/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-3">
              {isAr ? 'سجِّل كموصِّل' : 'Sign up to deliver'}
            </h2>
            <p className="text-muted">
              {isAr
                ? 'سنتواصل معك خلال 48 ساعة لإتمام الاعتماد.'
                : "We'll reach out within 48 hours to complete onboarding."}
            </p>
          </div>
          <LeadForm locale={locale} type="driver_signup" />
        </div>
      </section>

      <FAQAccordion
        heading={isAr ? 'أسئلة شائعة' : 'FAQ'}
        items={
          isAr
            ? [
                {
                  q: 'هل أحتاج سيارة للتوصيل؟',
                  a: 'لا. يمكنك التوصيل بدراجة نارية أو هوائية أو حتى مشياً للطلبات القريبة.',
                },
                {
                  q: 'ما العمولة على التوصيل؟',
                  a: 'نفس عمولة الركوب — 15% فقط.',
                },
                {
                  q: 'متى تصلني الأرباح؟',
                  a: 'فوراً عند انتهاء الطلب. يمكنك السحب أي وقت إلى حسابك البنكي أو محفظتك الرقمية المدعومة.',
                },
              ]
            : [
                {
                  q: 'Do I need a car to deliver?',
                  a: 'No. You can deliver by motorbike, bicycle, or even on foot for nearby orders.',
                },
                {
                  q: "What's the delivery commission?",
                  a: 'Same as rides — only 15%.',
                },
                {
                  q: 'When do earnings arrive?',
                  a: 'Immediately on order completion. Withdraw anytime to your bank account or a supported digital wallet.',
                },
              ]
        }
      />
    </>
  );
}
