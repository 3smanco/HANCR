import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';
import { FAQAccordion, type FAQ } from '@/components/FAQAccordion';

const TOPICS: Record<string, { ar: TopicContent; en: TopicContent }> = {
  rider: {
    ar: {
      title: 'مساعدة الراكب',
      intro: 'كل ما تحتاج معرفته للحجز والركوب بأمان.',
      faqs: [
        { q: 'كيف أحجز رحلتي الأولى؟', a: 'افتح التطبيق، حدِّد موقع الالتقاط والوجهة، اختر الخدمة، ثم انقر "اطلب".' },
        { q: 'هل يمكنني تتبُّع السائق؟', a: 'نعم، تشاهد موقع السائق على الخريطة لحظياً منذ القبول وحتى الوصول.' },
        { q: 'كيف أُغيِّر وجهتي أثناء الرحلة؟', a: 'انقر "تعديل الوجهة" داخل شاشة الرحلة. السعر يُحدَّث تلقائياً.' },
        { q: 'هل يمكنني إضافة محطات متعددة؟', a: 'نعم. حتى 5 محطات في الرحلة الواحدة.' },
        { q: 'كيف أُقيِّم السائق؟', a: 'تظهر شاشة التقييم فور انتهاء الرحلة. اختر النجوم وأضف ملاحظة اختيارية.' },
      ],
    },
    en: {
      title: 'Rider help',
      intro: 'Everything you need to book and ride safely.',
      faqs: [
        { q: 'How do I book my first ride?', a: 'Open the app, set pickup and destination, pick a service, then tap "Request".' },
        { q: 'Can I track the driver?', a: 'Yes, you see the driver\'s live location from acceptance to arrival.' },
        { q: 'How do I change my destination mid-ride?', a: 'Tap "Edit destination" on the trip screen. Price updates automatically.' },
        { q: 'Can I add multiple stops?', a: 'Yes. Up to 5 stops per trip.' },
        { q: 'How do I rate the driver?', a: 'A rating screen appears right after the trip ends. Pick stars and optionally add a note.' },
      ],
    },
  },
  driver: {
    ar: {
      title: 'مساعدة السائق',
      intro: 'كل ما يخصُّ الانضمام، الأرباح، وإدارة الحساب.',
      faqs: [
        { q: 'كيف أنضم كسائق؟', a: 'املأ نموذج /drive، حمِّل وثائقك، وانتظر اعتماد فريقنا خلال 48 ساعة.' },
        { q: 'ما متطلبات السيارة؟', a: 'موديل 2014 أو أحدث، استمارة سارية، وتأمين شامل.' },
        { q: 'كيف أسحب أرباحي؟', a: 'من تبويب "المحفظة" → "سحب" → اختر طريقة (بنك / Mada / STC Pay).' },
        { q: 'كيف أُعدِّل ساعات عملي؟', a: 'فعِّل أو أوقف وضعك "متاح" من الشاشة الرئيسية في أي وقت.' },
        { q: 'ماذا أفعل إذا تأخر الراكب؟', a: 'انتظر 5 دقائق ثم يمكنك الإلغاء برسوم تُحتسَب لك.' },
      ],
    },
    en: {
      title: 'Driver help',
      intro: 'Everything about joining, earnings, and account management.',
      faqs: [
        { q: 'How do I join as a driver?', a: 'Fill the /drive form, upload your documents, wait for approval within 48 hours.' },
        { q: 'What are the vehicle requirements?', a: '2014 model or newer, valid registration, and comprehensive insurance.' },
        { q: 'How do I withdraw earnings?', a: 'Wallet tab → Withdraw → pick method (bank / Mada / STC Pay).' },
        { q: 'How do I adjust my working hours?', a: 'Toggle your "Available" status from the home screen anytime.' },
        { q: 'What if the rider is late?', a: 'Wait 5 minutes, then you can cancel with a fee credited to you.' },
      ],
    },
  },
  payments: {
    ar: {
      title: 'المدفوعات',
      intro: 'إدارة طرق الدفع والفواتير.',
      faqs: [
        { q: 'كيف أضيف بطاقة جديدة؟', a: 'الحساب → طرق الدفع → "إضافة بطاقة". نستخدم HyperPay و Moyasar للتشفير الكامل.' },
        { q: 'هل تقبلون STC Pay و Apple Pay؟', a: 'نعم، كلاهما مدعوم.' },
        { q: 'متى تُخصم تكلفة الرحلة؟', a: 'فور انتهاء الرحلة وقبول السعر النهائي.' },
        { q: 'كيف أحصل على فاتورة؟', a: 'الفواتير ترسَل تلقائياً للبريد المسجَّل + متاحة في تبويب "الرحلات السابقة".' },
      ],
    },
    en: {
      title: 'Payments',
      intro: 'Manage payment methods and invoices.',
      faqs: [
        { q: 'How do I add a new card?', a: 'Account → Payment methods → "Add card". We use HyperPay and Moyasar with full encryption.' },
        { q: 'Do you accept STC Pay and Apple Pay?', a: 'Yes, both are supported.' },
        { q: 'When is the ride cost charged?', a: 'Right after the ride ends and the final price is accepted.' },
        { q: 'How do I get an invoice?', a: 'Invoices are auto-sent to your registered email + available in the "Past trips" tab.' },
      ],
    },
  },
  safety: {
    ar: {
      title: 'الأمان',
      intro: 'كيف نحميك وكيف تبلِّغنا.',
      faqs: [
        { q: 'ماذا يحدث عند الضغط على SOS؟', a: 'موقعك يُرسَل لجهات الطوارئ + فريق HANCR + الشرطة (في الحالات الحرجة).' },
        { q: 'كيف أُبلغ عن سائق مُسيء؟', a: 'افتح التطبيق → الرحلات السابقة → الرحلة → "أبلغ عن مشكلة" → اختر الفئة.' },
        { q: 'هل أستطيع منع سائق معيَّن؟', a: 'نعم. بعد البلاغ يمكنك "منع هذا السائق" — لن يُربط بك مجدداً.' },
        { q: 'كيف تتحقَّقون من السائقين؟', a: 'فحص جنائي + توثيق الرخصة + استمارة + تأمين + صورة شخصية مطابقة لهوية.' },
      ],
    },
    en: {
      title: 'Safety',
      intro: 'How we protect you and how to report.',
      faqs: [
        { q: 'What happens when I press SOS?', a: 'Your location is sent to emergency contacts + HANCR team + police (in critical cases).' },
        { q: 'How do I report an abusive driver?', a: 'App → Past trips → the trip → "Report an issue" → pick category.' },
        { q: 'Can I block a specific driver?', a: 'Yes. After reporting you can "Block this driver" — they won\'t be matched with you again.' },
        { q: 'How do you verify drivers?', a: 'Background check + license + registration + insurance + ID-matched profile photo.' },
      ],
    },
  },
  business: {
    ar: {
      title: 'الأعمال',
      intro: 'إدارة حساب شركتك وموظفيك.',
      faqs: [
        { q: 'كيف أُضيف موظفاً جديداً؟', a: 'من لوحة Business → الموظفون → "إضافة" → أدخل البيانات + الميزانية الشهرية.' },
        { q: 'متى تصلني الفاتورة الشهرية؟', a: 'يوم 1 من كل شهر تلقائياً عبر البريد.' },
        { q: 'هل أستطيع تحديد ساعات استخدام؟', a: 'نعم، يمكنك تحديد ساعات عمل وأيام مسموحة لكل موظف.' },
        { q: 'كيف أصدِّر التقارير؟', a: 'لوحة Business → التقارير → اختر الفترة → تصدير CSV أو Excel.' },
      ],
    },
    en: {
      title: 'Business',
      intro: 'Manage your company account and employees.',
      faqs: [
        { q: 'How do I add a new employee?', a: 'Business dashboard → Employees → "Add" → enter details + monthly budget.' },
        { q: 'When do monthly invoices arrive?', a: 'On day 1 of each month, automatically by email.' },
        { q: 'Can I set usage windows?', a: 'Yes, you can set working hours and allowed days per employee.' },
        { q: 'How do I export reports?', a: 'Business dashboard → Reports → pick range → export CSV or Excel.' },
      ],
    },
  },
};

interface TopicContent {
  title: string;
  intro: string;
  faqs: FAQ[];
}

export function generateStaticParams() {
  const params: Array<{ locale: string; topic: string }> = [];
  for (const locale of SUPPORTED_LOCALES) {
    for (const topic of Object.keys(TOPICS)) {
      params.push({ locale, topic });
    }
  }
  return params;
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; topic: string };
}): Metadata {
  const locale = pick(params.locale);
  const content = TOPICS[params.topic]?.[locale];
  if (!content) return { title: 'Not found' };
  return { title: content.title, description: content.intro };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function HelpTopicPage({
  params,
}: {
  params: { locale: string; topic: string };
}) {
  const locale = pick(params.locale);
  const content = TOPICS[params.topic]?.[locale];
  if (!content) notFound();
  const isAr = locale === 'ar';

  return (
    <>
      <section className="pt-16 pb-8 px-6 max-w-3xl mx-auto">
        <Link
          href={localizedHref(locale, '/help')}
          className="inline-flex items-center gap-2 text-muted hover:text-ember transition text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAr ? 'مركز المساعدة' : 'Help Center'}
        </Link>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-pearl leading-tight mb-3">
          {content.title}
        </h1>
        <p className="text-muted text-lg">{content.intro}</p>
      </section>

      <FAQAccordion heading={isAr ? 'الأسئلة الشائعة' : 'Common questions'} items={content.faqs} />
    </>
  );
}
