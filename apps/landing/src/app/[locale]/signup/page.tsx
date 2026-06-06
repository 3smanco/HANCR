import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Briefcase, Car, User } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale = pick(params.locale);
  return {
    title: locale === 'ar' ? 'إنشاء حساب' : 'Sign up',
    description:
      locale === 'ar'
        ? 'انضم لـ HANCR — كراكب أو سائق أو شركة.'
        : 'Join HANCR — as a rider, driver, or business.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function SignupPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-ember/10 border border-ember/30 text-ember text-xs font-semibold mb-5 uppercase tracking-wider">
            {isAr ? 'إنشاء حساب' : 'Sign up'}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-pearl leading-tight mb-3">
            {isAr ? 'كيف تريد البدء؟' : 'How do you want to get started?'}
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            {isAr
              ? 'اختر دورك وسنوجِّهك للخطوة الصحيحة.'
              : 'Pick your role and we\'ll guide you to the right step.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Path
            icon={User}
            featured
            title={isAr ? 'راكب' : 'Rider'}
            body={
              isAr
                ? 'حساب فوري عبر التطبيق. كل ما تحتاجه رقم جوالك.'
                : 'Instant in-app account. All you need is your phone number.'
            }
            steps={
              isAr
                ? ['حمِّل التطبيق', 'أدخل رقم جوالك', 'استلم رمز SMS وادخل']
                : ['Install the app', 'Enter your phone', 'Confirm by SMS code']
            }
            cta={{
              href: '/downloads/hancr-rider.apk',
              label: isAr ? 'حمِّل تطبيق الراكب' : 'Download rider app',
              download: true,
            }}
          />

          <Path
            icon={Car}
            title={isAr ? 'سائق' : 'Driver'}
            body={
              isAr
                ? '4 خطوات في الموقع، ثم مراجعة فريقنا، ثم تبدأ.'
                : "4 steps on the website, our team reviews, then you're live."
            }
            steps={
              isAr
                ? ['املأ النموذج (4 خطوات)', 'فريقنا يراجع خلال 48 ساعة', 'حمِّل تطبيق السائق وادخل']
                : ['Fill the 4-step form', 'We review within 48 hours', 'Install the driver app and sign in']
            }
            cta={{
              href: localizedHref(locale, '/drive/apply'),
              label: isAr ? 'ابدأ التسجيل' : 'Start application',
            }}
          />

          <Path
            icon={Briefcase}
            title={isAr ? 'شركة' : 'Business'}
            body={
              isAr
                ? 'حساب موحَّد لكل موظفيك بفواتير شهرية.'
                : 'A central account for all employees, billed monthly.'
            }
            steps={
              isAr
                ? ['تواصل مع المبيعات', 'اجتماع مخصَّص لاحتياجاتك', 'إعداد الحساب خلال 24 ساعة']
                : ['Get in touch with sales', 'Tailored demo', 'Account set up within 24 hours']
            }
            cta={{
              href: localizedHref(locale, '/business'),
              label: isAr ? 'تواصل مع المبيعات' : 'Talk to sales',
            }}
          />
        </div>

        <div className="mt-12 bg-ash/50 border border-stone/60 rounded-2xl p-6 text-center">
          <p className="text-muted text-sm mb-3">
            {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
          </p>
          <Link
            href={localizedHref(locale, '/login')}
            className="inline-flex items-center gap-2 text-ember font-bold hover:gap-3 transition-all"
          >
            {isAr ? 'سجِّل الدخول' : 'Log in'}
            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Path({
  icon: Icon,
  featured,
  title,
  body,
  steps,
  cta,
}: {
  icon: typeof User;
  featured?: boolean;
  title: string;
  body: string;
  steps: string[];
  cta: { href: string; label: string; download?: boolean };
}) {
  return (
    <div
      className={`rounded-2xl p-6 flex flex-col gap-5 ${
        featured
          ? 'bg-gradient-to-br from-ember/15 via-ash to-coal border-2 border-ember/30 shadow-ember'
          : 'bg-ash/60 border border-stone/60 hover:border-ember/40 transition'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl grid place-items-center ${
          featured ? 'bg-ember text-pearl shadow-ember' : 'bg-ember/15 text-ember'
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-extrabold text-pearl mb-2">{title}</h3>
        <p className="text-muted text-sm leading-relaxed">{body}</p>
      </div>
      <ol className="space-y-2 mt-1">
        {steps.map((s, idx) => (
          <li key={s} className="flex items-start gap-2 text-sm text-pearl/85">
            <span className="w-5 h-5 rounded-full bg-ember/15 text-ember text-xs font-bold grid place-items-center shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-auto pt-2">
        {cta.download ? (
          <a
            href={cta.href}
            download
            className="w-full inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep transition px-4 py-2.5 rounded-lg font-bold text-sm text-pearl shadow-ember"
          >
            {cta.label}
          </a>
        ) : (
          <Link
            href={cta.href}
            className="w-full inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep transition px-4 py-2.5 rounded-lg font-bold text-sm text-pearl shadow-ember"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}
