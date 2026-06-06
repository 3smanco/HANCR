import type { Metadata } from 'next';
import { Shield, AlertOctagon, Eye, UserCheck, PhoneCall, MapPin } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';
import { Hero } from '@/components/Hero';
import { ValuePropsGrid } from '@/components/ValuePropsGrid';
import { FAQAccordion } from '@/components/FAQAccordion';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'footer.safety'),
    description:
      locale === 'ar'
        ? 'الأمان أولاً — كيف تحمي HANCR ركابها وسائقيها في كل رحلة.'
        : 'Safety first — how HANCR protects riders and drivers on every trip.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function SafetyPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <Hero
        eyebrow={isAr ? 'الأمان والسلامة' : 'Safety'}
        title={
          isAr ? (
            <>
              أمانك هو
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                {' '}أولويتنا.
              </span>
            </>
          ) : (
            <>
              Your safety is
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                {' '}our priority.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'كل ميزة في HANCR مصمَّمة بـ"الأمان أولاً". من التحقق من السائق إلى زر الطوارئ المدمج، نحرص أن تشعر بالأمان قبل وأثناء وبعد رحلتك.'
            : 'Every feature in HANCR is designed safety-first. From driver verification to built-in SOS, we make sure you feel safe before, during, and after your trip.'
        }
        primaryCta={{
          href: localizedHref(locale, '/help'),
          label: isAr ? 'مركز المساعدة' : 'Help center',
        }}
      />

      <ValuePropsGrid
        heading={isAr ? 'كيف نحميك' : 'How we protect you'}
        items={[
          {
            icon: UserCheck,
            title: isAr ? 'تحقُّق صارم من السائقين' : 'Strict driver verification',
            description: isAr
              ? 'كل سائق يخضع لفحص جنائي + تحقُّق من الرخصة والسيارة والتأمين قبل القيادة.'
              : 'Every driver passes a background check + verification of license, vehicle, and insurance before driving.',
          },
          {
            icon: AlertOctagon,
            title: isAr ? 'زر طوارئ SOS' : 'SOS button',
            description: isAr
              ? 'متاح في كل رحلة. ينقل موقعك الحيّ لجهات الطوارئ المسجَّلة + فريق HANCR فوراً.'
              : 'Available in every ride. Sends your live location to your emergency contacts + HANCR support instantly.',
          },
          {
            icon: Eye,
            title: isAr ? 'مشاركة الرحلة الحيّة' : 'Live trip sharing',
            description: isAr
              ? 'شارك مسار رحلتك تلقائياً مع جهاتك الموثوقة. تظهر الرحلة وسرعتها والوصول المتوقع لحظياً.'
              : 'Auto-share your trip path with trusted contacts. They see live route, speed, and ETA in real-time.',
          },
          {
            icon: PhoneCall,
            title: isAr ? 'اتصال مقنَّع' : 'Masked calls',
            description: isAr
              ? 'الاتصالات بين الراكب والسائق تستخدم أرقاماً وسيطة. لا يحصل أيّ طرف على رقم الآخر.'
              : 'Rider-driver calls use proxy numbers. Neither party gets the other\'s real number.',
          },
          {
            icon: MapPin,
            title: isAr ? 'تتبُّع الرحلة' : 'Trip tracking',
            description: isAr
              ? 'كل رحلة مسجَّلة في النظام. يمكن لفريق HANCR استعراض تفاصيلها لأي تحقيق.'
              : 'Every trip is logged. The HANCR team can review details for any investigation.',
          },
          {
            icon: Shield,
            title: isAr ? 'تأمين شامل' : 'Comprehensive insurance',
            description: isAr
              ? 'كل رحلة مغطَّاة بتأمين شامل للسائق والراكب — بدون رسوم إضافية.'
              : 'Every trip is covered by comprehensive insurance for both rider and driver — no extra fees.',
          },
        ]}
      />

      {/* ── Emergency contact ── */}
      <section className="py-16 px-6 bg-coal/40 border-y border-stone/40">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pearl mb-4">
            {isAr ? 'تواجه حالة طارئة الآن؟' : 'In an emergency right now?'}
          </h2>
          <p className="text-muted mb-6">
            {isAr
              ? 'استخدم زر SOS داخل التطبيق، أو اتصل بالأرقام التالية مباشرة.'
              : 'Use the in-app SOS button, or call the following numbers directly.'}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
            <a
              href="tel:911"
              className="bg-danger/15 hover:bg-danger/25 border border-danger/40 hover:border-danger transition rounded-xl p-5"
            >
              <div className="text-xs text-muted uppercase tracking-wider mb-1">
                {isAr ? 'الطوارئ (السعودية)' : 'Emergency (Saudi)'}
              </div>
              <div className="text-2xl font-extrabold text-danger">911</div>
            </a>
            <a
              href="mailto:safety@hancr.com"
              className="bg-ash hover:bg-smoke border border-stone hover:border-ember transition rounded-xl p-5"
            >
              <div className="text-xs text-muted uppercase tracking-wider mb-1">
                {isAr ? 'فريق أمان HANCR' : 'HANCR safety team'}
              </div>
              <div className="text-base font-bold text-pearl">safety@hancr.com</div>
            </a>
          </div>
        </div>
      </section>

      <FAQAccordion
        heading={isAr ? 'أسئلة الأمان' : 'Safety FAQ'}
        items={
          isAr
            ? [
                {
                  q: 'كيف يتم التحقق من السائقين؟',
                  a: 'فحص جنائي رسمي، رخصة قيادة سارية، استمارة سيارة سارية، تأمين شامل، وصورة شخصية مطابقة لهويته. كل وثيقة تُراجَع يدوياً من فريقنا قبل الموافقة.',
                },
                {
                  q: 'ماذا يحدث عند الضغط على SOS؟',
                  a: '1) موقعك الحيّ يُرسَل لجهاتك الموثوقة\n2) فريق HANCR يتلقى تنبيهاً فورياً\n3) في الحالات الحرجة، نتواصل مع الشرطة لإرسال دورية',
                },
                {
                  q: 'هل بياناتي آمنة؟',
                  a: 'نعم. لا نشارك بياناتك مع أي طرف ثالث للأغراض التسويقية. كل البيانات مشفَّرة، والأرقام مقنَّعة في الاتصالات.',
                },
                {
                  q: 'ماذا أفعل لو شعرت بعدم الأمان؟',
                  a: 'استخدم SOS فوراً. حتى لو أردت الاتصال بنا فقط، يمكنك ذلك من شاشة الرحلة → "تواصل مع HANCR".',
                },
              ]
            : [
                {
                  q: 'How are drivers verified?',
                  a: 'Official background check, valid license, valid vehicle registration, comprehensive insurance, and a profile photo matching their ID. Every document is manually reviewed by our team before approval.',
                },
                {
                  q: 'What happens when I press SOS?',
                  a: '1) Your live location is sent to your trusted contacts\n2) HANCR support receives an instant alert\n3) In critical cases, we contact the police to dispatch a patrol',
                },
                {
                  q: 'Is my data safe?',
                  a: 'Yes. We don\'t share your data with any third party for marketing purposes. All data is encrypted, and calls use masked numbers.',
                },
                {
                  q: 'What do I do if I feel unsafe?',
                  a: 'Use SOS immediately. Even if you just want to contact us, you can do so from the trip screen → "Contact HANCR".',
                },
              ]
        }
      />
    </>
  );
}
