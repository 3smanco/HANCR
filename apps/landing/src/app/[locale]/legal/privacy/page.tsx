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
    title: t(locale, 'footer.privacy'),
    description:
      locale === 'ar'
        ? 'سياسة الخصوصية لـ HANCR — أي بيانات نجمع، كيف نستخدمها، وحقوقك.'
        : "HANCR privacy policy — what data we collect, how we use it, and your rights.",
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout
      title={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
      lastUpdated="2026-06-01"
      locale={locale}
    >
      <LegalSection title={isAr ? '1. ما البيانات التي نجمعها؟' : '1. What we collect'}>
        {isAr
          ? 'الاسم، رقم الجوال، البريد، الموقع الجغرافي أثناء الرحلة، طرق الدفع (مشفَّرة)، وتاريخ الرحلات.'
          : 'Name, phone, email, live location during trips, payment methods (encrypted), and trip history.'}
      </LegalSection>

      <LegalSection title={isAr ? '2. كيف نستخدم بياناتك' : '2. How we use it'}>
        {isAr
          ? '• تشغيل الخدمة (المطابقة، الدفع، الدعم)\n• تحسين تجربتك\n• الأمان وكشف الاحتيال\n• تواصل عملي محدود (إيصالات، تنبيهات أمان)'
          : '• Run the service (matching, payment, support)\n• Improve your experience\n• Safety and fraud detection\n• Limited operational comms (receipts, safety alerts)'}
      </LegalSection>

      <LegalSection title={isAr ? '3. مع من نُشارك بياناتك' : '3. Who we share with'}>
        {isAr
          ? 'لا نبيع بياناتك. نشاركها فقط مع: السائق المُكلَّف برحلتك (للتواصل)، مزوِّدي الدفع (HyperPay/Moyasar)، السلطات عند طلبٍ قانوني.'
          : "We don't sell your data. We share it only with: your assigned driver (for contact), payment providers (HyperPay/Moyasar), authorities upon legal request."}
      </LegalSection>

      <LegalSection title={isAr ? '4. التشفير والأمان' : '4. Encryption & security'}>
        {isAr
          ? 'كل البيانات مُشفَّرة في النقل (TLS 1.3) وفي التخزين (AES-256). كلمات المرور مُجزَّأة بـ bcrypt.'
          : 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Passwords are hashed with bcrypt.'}
      </LegalSection>

      <LegalSection title={isAr ? '5. حقوقك' : '5. Your rights'}>
        {isAr
          ? 'لديك الحق في: الوصول لبياناتك، تعديلها، حذفها، أو تصديرها. أرسل طلباً لـ privacy@hancr.com وسنرد خلال 30 يوماً.'
          : 'You have the right to: access, edit, delete, or export your data. Email privacy@hancr.com and we respond within 30 days.'}
      </LegalSection>

      <LegalSection title={isAr ? '6. الاحتفاظ بالبيانات' : '6. Data retention'}>
        {isAr
          ? 'نحتفظ ببيانات الحساب طوال نشاطه. بعد الحذف، تُمحَى البيانات الشخصية خلال 90 يوماً، باستثناء ما يلزم قانونياً (سجلات مالية لـ 7 سنوات).'
          : 'We keep account data while active. After deletion, personal data is wiped within 90 days, except as legally required (financial records for 7 years).'}
      </LegalSection>

      <LegalSection title={isAr ? '7. الأطفال' : '7. Children'}>
        {isAr
          ? 'لا تجمع HANCR بيانات من أطفال دون 18 سنة. إذا اكتشفنا حساباً لقاصر، نحذفه فوراً.'
          : 'HANCR does not collect data from anyone under 18. If we detect an account for a minor, we delete it immediately.'}
      </LegalSection>

      <LegalSection title={isAr ? '8. التواصل' : '8. Contact'}>
        {isAr ? 'أسئلة الخصوصية: ' : 'Privacy questions: '}
        <a href="mailto:privacy@hancr.com" className="text-ember hover:underline">
          privacy@hancr.com
        </a>
      </LegalSection>
    </LegalLayout>
  );
}
