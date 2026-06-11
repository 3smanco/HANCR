import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Car,
  Download,
  LayoutDashboard,
  Smartphone,
  User,
} from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';
import { ApplicationStatusLookup } from '@/components/ApplicationStatusLookup';

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
    title: locale === 'ar' ? 'تسجيل الدخول' : 'Log in',
    description:
      locale === 'ar'
        ? 'الوصول لتطبيق HANCR — للراكب أو السائق أو لوحة الإدارة.'
        : 'Access HANCR — rider app, driver app, or admin panel.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function LoginPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  return (
    <>
      <section className="pt-16 pb-8 px-6 text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-ember/10 border border-ember/30 text-ember text-xs font-semibold mb-5 uppercase tracking-wider">
          {isAr ? 'تسجيل الدخول' : 'Log in'}
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-pearl leading-tight mb-3">
          {isAr ? 'كيف تريد الدخول؟' : 'How do you want to sign in?'}
        </h1>
        <p className="text-muted max-w-xl mx-auto">
          {isAr
            ? 'اختر دورك — تجربة تسجيل الدخول للراكب والسائق تتم داخل التطبيق نفسه برمز SMS.'
            : 'Pick your role. Rider and driver sign-in happens inside the app via SMS code.'}
        </p>
      </section>

      {/* ── 3 entry-point cards ── */}
      <section className="px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
          {/* Rider */}
          <RoleCard
            icon={User}
            tone="ember"
            title={isAr ? 'الراكب' : 'Rider'}
            body={
              isAr
                ? 'سجّل دخولك من المتصفح برقم جوالك ورمز التحقُّق، أو حمّل التطبيق.'
                : 'Sign in from your browser with your phone and a verification code, or get the app.'
            }
            primary={{
              href: localizedHref(locale, '/account'),
              label: isAr ? 'تسجيل الدخول' : 'Log in',
            }}
            secondary={{
              href: '/downloads/hancr-rider.apk',
              label: isAr ? 'حمِّل التطبيق' : 'Download app',
              download: true,
            }}
          />

          {/* Driver */}
          <RoleCard
            icon={Car}
            tone="muted"
            title={isAr ? 'السائق' : 'Driver'}
            body={
              isAr
                ? 'تطبيق السائق على جوالك. ليس لديك حساب بعد؟ ابدأ من نموذج التسجيل.'
                : "Driver app on your phone. New here? Start by submitting an application."
            }
            primary={{
              href: '/downloads/hancr-driver.apk',
              label: isAr ? 'حمِّل تطبيق السائق' : 'Download driver app',
              download: true,
            }}
            secondary={{
              href: localizedHref(locale, '/drive/apply'),
              label: isAr ? 'سجِّل كسائق' : 'Apply as driver',
            }}
          />

          {/* Admin */}
          <RoleCard
            icon={LayoutDashboard}
            tone="muted"
            title={isAr ? 'لوحة الإدارة' : 'Admin Panel'}
            body={
              isAr
                ? 'للفريق التشغيلي — مالية، عمليات، دعم، تسويق. تسجيل الدخول بالبريد وكلمة المرور.'
                : 'For the ops team — finance, ops, support, marketing. Email + password sign-in.'
            }
            primary={{
              href: 'https://admin.hancr.com/login',
              label: isAr ? 'دخول لوحة الإدارة' : 'Open admin panel',
              external: true,
            }}
          />
        </div>
      </section>

      {/* ── Application status lookup ── */}
      <section className="py-20 px-6 mt-12 bg-coal/40 border-y border-stone/40">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-pearl mb-2">
              {isAr ? 'تابِع حالة طلب التسجيل' : 'Track your driver application'}
            </h2>
            <p className="text-muted text-sm">
              {isAr
                ? 'هل قدَّمت طلب تسجيل كسائق؟ أدخل رقم الطلب وجوالك المسجَّل لمعرفة الحالة.'
                : 'Submitted a driver application? Enter your application ID and the phone you used.'}
            </p>
          </div>
          <ApplicationStatusLookup locale={locale} />
        </div>
      </section>

      {/* ── Help foot ── */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto bg-ash/50 border border-stone/60 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-bold text-pearl mb-2 inline-flex items-center gap-2 justify-center">
            <Smartphone className="w-4 h-4 text-ember" />
            {isAr ? 'هل تواجه مشكلة في الدخول؟' : 'Trouble signing in?'}
          </h3>
          <p className="text-muted text-sm mb-4">
            {isAr
              ? 'تأكَّد من تثبيت أحدث نسخة من التطبيق وأن رقم جوالك يستقبل رسائل SMS. لو استمرَّت المشكلة، تواصل معنا.'
              : 'Make sure you have the latest app version and that your phone receives SMS. If issues persist, reach out.'}
          </p>
          <Link
            href={localizedHref(locale, '/help')}
            className="inline-flex items-center gap-1.5 text-ember font-bold text-sm hover:gap-2.5 transition-all"
          >
            {isAr ? 'مركز المساعدة' : 'Help Center'}
            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </section>
    </>
  );
}

// ── Role card ─────────────────────────────────────────────────────────────

function RoleCard({
  icon: Icon,
  tone,
  title,
  body,
  primary,
  secondary,
}: {
  icon: typeof User;
  tone: 'ember' | 'muted';
  title: string;
  body: string;
  primary: { href: string; label: string; external?: boolean; download?: boolean };
  secondary?: { href: string; label: string; download?: boolean };
}) {
  const isEmber = tone === 'ember';
  return (
    <div
      className={`rounded-2xl p-6 flex flex-col gap-4 ${
        isEmber
          ? 'bg-gradient-to-br from-ember/15 via-ash to-coal border-2 border-ember/30 shadow-ember'
          : 'bg-ash/60 border border-stone/60 hover:border-ember/40 transition'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl grid place-items-center ${
          isEmber ? 'bg-ember text-pearl shadow-ember' : 'bg-ember/15 text-ember'
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-extrabold text-pearl mb-2">{title}</h3>
        <p className="text-muted text-sm leading-relaxed">{body}</p>
      </div>

      <div className="mt-auto space-y-2 pt-2">
        {primary.download ? (
          <a
            href={primary.href}
            download
            className="w-full inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep transition px-4 py-2.5 rounded-lg font-bold text-sm text-pearl shadow-ember"
          >
            <Download className="w-4 h-4" />
            {primary.label}
          </a>
        ) : primary.external ? (
          <a
            href={primary.href}
            className="w-full inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep transition px-4 py-2.5 rounded-lg font-bold text-sm text-pearl shadow-ember"
          >
            {primary.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <Link
            href={primary.href}
            className="w-full inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep transition px-4 py-2.5 rounded-lg font-bold text-sm text-pearl shadow-ember"
          >
            {primary.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        {secondary ? (
          <Link
            href={secondary.href}
            {...(secondary.download ? { download: true } : {})}
            className="w-full inline-flex items-center justify-center gap-2 border border-stone hover:border-ember hover:text-ember transition px-4 py-2.5 rounded-lg font-semibold text-xs text-pearl"
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
