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
    title: t(locale, 'footer.cookies'),
    description:
      locale === 'ar'
        ? 'كيف نستخدم الكوكيز في موقع HANCR.'
        : 'How we use cookies on the HANCR website.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function CookiesPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout
      title={isAr ? 'سياسة الكوكيز' : 'Cookie Policy'}
      lastUpdated="2026-06-01"
      locale={locale}
    >
      <LegalSection title={isAr ? 'ما هي الكوكيز؟' : 'What are cookies?'}>
        {isAr
          ? 'الكوكيز ملفات نصية صغيرة يحفظها متصفِّحك لتذكُّر تفضيلاتك (مثل اللغة) وتحسين تجربتك.'
          : 'Cookies are small text files your browser saves to remember your preferences (like language) and improve your experience.'}
      </LegalSection>

      <LegalSection title={isAr ? 'كوكيز ضرورية' : 'Strictly necessary'}>
        {isAr
          ? 'تخزين اللغة المختارة، حالة تسجيل الدخول. لا يمكن تعطيلها دون التأثير على عمل الموقع.'
          : 'Stores selected language and login state. Cannot be disabled without breaking site functionality.'}
      </LegalSection>

      <LegalSection title={isAr ? 'كوكيز قياس الأداء' : 'Performance cookies'}>
        {isAr
          ? 'نستخدم تحليلات بسيطة لقياس الصفحات الأكثر زيارة. لا نتتبَّع المستخدمين الأفراد عبر مواقع أخرى.'
          : "We use basic analytics to measure most-visited pages. We do not track individuals across other sites."}
      </LegalSection>

      <LegalSection title={isAr ? 'بدون كوكيز إعلانية' : 'No advertising cookies'}>
        {isAr
          ? 'لا نستخدم كوكيز للإعلانات الموجَّهة. لا نُشارك بياناتك مع شبكات الإعلانات.'
          : 'We do not use cookies for targeted advertising. We do not share your data with ad networks.'}
      </LegalSection>

      <LegalSection title={isAr ? 'إدارة الكوكيز' : 'Managing cookies'}>
        {isAr
          ? 'يمكنك حذف الكوكيز من إعدادات متصفِّحك أو إيقافها. تذكَّر أن إيقاف الكوكيز الضرورية يمنع الموقع من العمل بشكل صحيح.'
          : "You can delete or block cookies from your browser settings. Note that blocking necessary cookies prevents the site from working properly."}
      </LegalSection>
    </LegalLayout>
  );
}
