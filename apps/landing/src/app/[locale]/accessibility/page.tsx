import type { Metadata } from 'next';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { LegalLayout, LegalSection } from '@/components/LegalLayout';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'footer.accessibility'),
    description:
      locale === 'ar'
        ? 'التزام HANCR بإمكانية الوصول للجميع.'
        : "HANCR's commitment to accessibility for all.",
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function AccessibilityPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout
      title={isAr ? 'إمكانية الوصول' : 'Accessibility'}
      lastUpdated="2026-06-01"
      locale={locale}
    >
      <LegalSection title={isAr ? 'التزامنا' : 'Our commitment'}>
        {isAr
          ? 'نسعى أن تكون HANCR متاحة لكل مستخدم — بمن فيهم ذوو الإعاقة. نلتزم بمعايير WCAG 2.1 المستوى AA كحدٍّ أدنى في تطبيقاتنا وموقعنا.'
          : 'We strive to make HANCR available to every user — including those with disabilities. We commit to WCAG 2.1 Level AA as a minimum across our apps and website.'}
      </LegalSection>

      <LegalSection title={isAr ? 'الميزات' : 'Features'}>
        {isAr
          ? '• دعم قارئات الشاشة (TalkBack و VoiceOver)\n• تباين ألوان مرتفع (4.5:1 على الأقل)\n• أحجام لمس كبيرة (44×44 بكسل على الأقل)\n• دعم تكبير النص حتى 200% دون كسر التصميم\n• دعم RTL/LTR كامل'
          : '• Screen reader support (TalkBack and VoiceOver)\n• High color contrast (minimum 4.5:1)\n• Large touch targets (minimum 44×44px)\n• Text zoom up to 200% without layout breaks\n• Full RTL/LTR support'}
      </LegalSection>

      <LegalSection title={isAr ? 'خدمات إضافية' : 'Additional services'}>
        {isAr
          ? 'يمكن طلب رحلات بسيارات متاحة للكراسي المتحرِّكة من فئة الخدمات داخل التطبيق.'
          : 'Wheelchair-accessible vehicles can be requested from the in-app service category.'}
      </LegalSection>

      <LegalSection title={isAr ? 'الإبلاغ عن مشكلة' : 'Report an issue'}>
        {isAr ? 'وجدت مشكلة في إمكانية الوصول؟ راسلنا على ' : 'Found an accessibility issue? Email us at '}
        <a href="mailto:accessibility@hancr.com" className="text-ember hover:underline">
          accessibility@hancr.com
        </a>
        {isAr ? ' وسنردُّ خلال 5 أيام عمل.' : ' and we respond within 5 business days.'}
      </LegalSection>
    </LegalLayout>
  );
}
