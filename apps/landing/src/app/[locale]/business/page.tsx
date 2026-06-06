import type { Metadata } from 'next';
import { Building2, Users, Receipt, BarChart3, ShieldCheck, Globe } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
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
    title: t(locale, 'nav.business'),
    description:
      locale === 'ar'
        ? 'حلول التنقل للأعمال — حساب موحَّد، فواتير شهرية، وتقارير تفصيلية.'
        : 'Mobility solutions for business — single account, monthly invoicing, detailed reports.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function BusinessPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <Hero
        eyebrow={isAr ? 'HANCR Business' : 'HANCR Business'}
        title={
          isAr ? (
            <>
              تنقُّل لشركتك،
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                بسهولة وكفاءة.
              </span>
            </>
          ) : (
            <>
              Mobility for your company,
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                made simple.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'حساب موحَّد لكل موظفيك، فواتير شهرية، تقارير مفصَّلة، وتحكُّم كامل في الميزانية.'
            : 'A single account for all employees, monthly invoicing, detailed reports, and complete budget control.'
        }
        primaryCta={{
          href: '#contact',
          label: isAr ? 'تحدَّث مع المبيعات' : 'Talk to sales',
        }}
      />

      <ValuePropsGrid
        heading={isAr ? 'حلول صُمِّمت لشركتك' : 'Built for your business'}
        items={[
          {
            icon: Building2,
            title: isAr ? 'حساب موحَّد' : 'Centralized account',
            description: isAr
              ? 'إدارة كل موظفيك ورحلاتهم من لوحة تحكم واحدة.'
              : 'Manage all employees and trips from one dashboard.',
          },
          {
            icon: Users,
            title: isAr ? 'صلاحيات متعددة' : 'Role-based access',
            description: isAr
              ? 'مدير، محاسب، وموظف — كل دور بصلاحياته.'
              : 'Manager, accountant, employee — each role with its own permissions.',
          },
          {
            icon: Receipt,
            title: isAr ? 'فواتير شهرية' : 'Monthly invoicing',
            description: isAr
              ? 'فاتورة واحدة لكل الرحلات. لا حاجة لمعاملات فردية.'
              : 'A single invoice for all trips. No individual transactions to chase.',
          },
          {
            icon: BarChart3,
            title: isAr ? 'تقارير تفصيلية' : 'Detailed reports',
            description: isAr
              ? 'تصدير CSV/Excel: لكل قسم، مشروع، أو موظف.'
              : 'CSV/Excel exports per department, project, or employee.',
          },
          {
            icon: ShieldCheck,
            title: isAr ? 'حدود الإنفاق' : 'Spending limits',
            description: isAr
              ? 'حدِّد ميزانية شهرية لكل موظف، وحدّد ساعات وأنواع رحلات مسموحة.'
              : 'Set monthly budget per employee, restrict hours and trip types.',
          },
          {
            icon: Globe,
            title: isAr ? 'تغطية إقليمية' : 'Regional coverage',
            description: isAr
              ? 'حساب واحد يعمل عبر كل المدن المُغطَّاة.'
              : 'One account works across all covered cities.',
          },
        ]}
      />

      <HowItWorks
        heading={isAr ? 'كيف تبدأ؟' : 'How to get started'}
        steps={[
          {
            title: isAr ? 'تواصل معنا' : 'Get in touch',
            description: isAr
              ? 'املأ النموذج وسيتواصل معك مندوب مبيعات.'
              : 'Fill the form and a sales rep will reach out.',
          },
          {
            title: isAr ? 'اجتماع مخصَّص' : 'Tailored demo',
            description: isAr
              ? 'نفهم احتياجاتك ونصمِّم لك خطة مناسبة.'
              : 'We understand your needs and propose a tailored plan.',
          },
          {
            title: isAr ? 'إعداد حسابك' : 'Account setup',
            description: isAr
              ? 'فريقنا يجهِّز حسابك وحساب الموظفين خلال 24 ساعة.'
              : 'Our team sets up your account and employees within 24 hours.',
          },
          {
            title: isAr ? 'ابدأ الاستخدام' : 'Go live',
            description: isAr
              ? 'الموظفون يحجزون، الفاتورة تأتي شهرياً.'
              : 'Employees book, you get one monthly invoice.',
          },
        ]}
      />

      <section id="contact" className="py-20 px-6 bg-coal/50 border-y border-stone/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-3">
              {isAr ? 'تحدَّث مع مبيعات HANCR Business' : 'Talk to HANCR Business sales'}
            </h2>
            <p className="text-muted">
              {isAr
                ? 'سنتواصل معك خلال يوم عمل واحد.'
                : "We'll be in touch within one business day."}
            </p>
          </div>
          <LeadForm locale={locale} type="business" showCompany showCity />
        </div>
      </section>

      <FAQAccordion
        heading={isAr ? 'أسئلة شائعة' : 'FAQ'}
        items={
          isAr
            ? [
                {
                  q: 'ما الحد الأدنى لعدد الموظفين؟',
                  a: 'لا يوجد حد أدنى. نبدأ من 5 موظفين وحتى آلاف.',
                },
                {
                  q: 'هل توفِّرون فواتير ضريبية؟',
                  a: 'نعم، فواتير ضريبية مطابقة لمتطلبات ZATCA في السعودية و VAT في الإمارات.',
                },
                {
                  q: 'هل يستطيع الموظف الدفع نقداً؟',
                  a: 'يمكنك تفعيل ذلك أو حصره على الحساب فقط — أنت تتحكَّم.',
                },
                {
                  q: 'هل أستطيع تحديد ساعات استخدام معيَّنة؟',
                  a: 'نعم، حدِّد ساعات العمل، نوع الرحلات، والحد الأقصى للكلفة لكل رحلة أو شهر.',
                },
              ]
            : [
                {
                  q: "What's the minimum number of employees?",
                  a: 'No minimum. We onboard teams from 5 to thousands of employees.',
                },
                {
                  q: 'Do you provide VAT invoices?',
                  a: 'Yes — VAT-compliant invoices for ZATCA (Saudi) and FTA (UAE).',
                },
                {
                  q: 'Can employees pay cash?',
                  a: "You decide — enable cash, or restrict to company account only.",
                },
                {
                  q: 'Can I set usage windows or limits?',
                  a: 'Yes — set working hours, trip types, and per-trip/per-month cost caps.',
                },
              ]
        }
      />
    </>
  );
}
