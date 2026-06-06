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
    title: t(locale, 'footer.terms'),
    description:
      locale === 'ar'
        ? 'الشروط والأحكام لاستخدام منصة HANCR.'
        : 'Terms and conditions for using the HANCR platform.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function TermsPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout
      title={isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
      lastUpdated="2026-06-01"
      locale={locale}
    >
      <LegalSection title={isAr ? '1. القبول' : '1. Acceptance'}>
        {isAr
          ? 'باستخدامك تطبيق HANCR أو موقعنا الإلكتروني، فإنك توافق على هذه الشروط. إذا لم توافق، يُرجى عدم استخدام خدماتنا.'
          : 'By using the HANCR app or website, you agree to these terms. If you do not agree, please do not use our services.'}
      </LegalSection>

      <LegalSection title={isAr ? '2. الخدمة' : '2. The service'}>
        {isAr
          ? 'HANCR منصة تربط بين الركاب والسائقين المستقلين. نحن لا نملك السيارات ولا نوظِّف السائقين، بل نوفِّر التقنية للوساطة بينهم.'
          : 'HANCR is a platform connecting riders with independent drivers. We do not own vehicles or employ drivers; we provide the technology that intermediates between them.'}
      </LegalSection>

      <LegalSection title={isAr ? '3. الحساب' : '3. Your account'}>
        {isAr
          ? 'يجب أن تكون 18 عاماً أو أكثر لإنشاء حساب. أنت مسؤول عن سرية بياناتك وكل النشاط على حسابك.'
          : 'You must be 18+ to create an account. You are responsible for keeping your credentials confidential and for all activity under your account.'}
      </LegalSection>

      <LegalSection title={isAr ? '4. الأسعار والدفع' : '4. Pricing & payment'}>
        {isAr
          ? 'تُعرَض أسعار الرحلات قبل التأكيد. قد تطبَّق رسوم إلغاء حسب وقت الإلغاء. تُحسَب الضريبة المضافة وفق أنظمة بلد التشغيل.'
          : 'Trip prices are shown before confirmation. Cancellation fees may apply based on timing. VAT is calculated according to local regulations.'}
      </LegalSection>

      <LegalSection title={isAr ? '5. السلوك' : '5. Conduct'}>
        {isAr
          ? 'يُمنع التحرُّش، العنف، التمييز، أو إتلاف ممتلكات السائق. أي مخالفة قد تؤدي لتعليق الحساب فوراً.'
          : 'Harassment, violence, discrimination, or damage to driver property is prohibited. Violations may result in immediate account suspension.'}
      </LegalSection>

      <LegalSection title={isAr ? '6. حدود المسؤولية' : '6. Limitation of liability'}>
        {isAr
          ? 'إلى الحد الذي يسمح به القانون، لا تتحمَّل HANCR مسؤولية أي أضرار غير مباشرة أو تبعية ناتجة عن استخدام الخدمة.'
          : 'To the maximum extent permitted by law, HANCR is not liable for indirect or consequential damages arising from use of the service.'}
      </LegalSection>

      <LegalSection title={isAr ? '7. تعديل الشروط' : '7. Changes to terms'}>
        {isAr
          ? 'قد نُحدِّث هذه الشروط من حين لآخر. سنخطرك بأي تغيير جوهري عبر التطبيق أو البريد المسجَّل.'
          : 'We may update these terms periodically. Material changes will be notified via the app or your registered email.'}
      </LegalSection>

      <LegalSection title={isAr ? '8. القانون الحاكم' : '8. Governing law'}>
        {isAr
          ? 'تخضع هذه الشروط لأنظمة المملكة العربية السعودية. أي نزاع يحلُّ أمام محاكم الرياض.'
          : 'These terms are governed by the laws of the Kingdom of Saudi Arabia. Any dispute is resolved in Riyadh courts.'}
      </LegalSection>

      <LegalSection title={isAr ? '9. التواصل' : '9. Contact'}>
        {isAr ? 'استفسارات قانونية: ' : 'Legal inquiries: '}
        <a href="mailto:legal@hancr.com" className="text-ember hover:underline">
          legal@hancr.com
        </a>
      </LegalSection>
    </LegalLayout>
  );
}
