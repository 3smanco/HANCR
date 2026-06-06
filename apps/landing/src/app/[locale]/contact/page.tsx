import type { Metadata } from 'next';
import { Mail, Phone, MessageCircle, MapPin } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { Hero } from '@/components/Hero';
import { LeadForm } from '@/components/LeadForm';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: locale === 'ar' ? 'تواصل معنا' : 'Contact us',
    description:
      locale === 'ar'
        ? 'تواصل مع فريق HANCR — استفسار، شراكة، أو دعم.'
        : 'Reach the HANCR team — inquiries, partnerships, or support.',
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  const channels = [
    {
      icon: Mail,
      label: isAr ? 'الاستفسارات العامة' : 'General inquiries',
      value: 'hello@hancr.com',
      href: 'mailto:hello@hancr.com',
    },
    {
      icon: MessageCircle,
      label: isAr ? 'دعم العملاء' : 'Customer support',
      value: 'support@hancr.com',
      href: 'mailto:support@hancr.com',
    },
    {
      icon: Mail,
      label: isAr ? 'انضمام السائقين' : 'Driver onboarding',
      value: 'drivers@hancr.com',
      href: 'mailto:drivers@hancr.com',
    },
    {
      icon: Phone,
      label: isAr ? 'مكتب الرياض' : 'Riyadh office',
      value: '+966 11 000 0000',
      href: 'tel:+966110000000',
    },
  ];

  return (
    <>
      <Hero
        eyebrow={isAr ? 'تواصل معنا' : 'Contact us'}
        title={
          isAr ? (
            <>
              نحن
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                {' '}هنا لمساعدتك.
              </span>
            </>
          ) : (
            <>
              We are
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                {' '}here to help.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'استفسار، شراكة، أو دعم. اختر القناة المناسبة وسنرد عليك بسرعة.'
            : 'Inquiry, partnership, or support. Pick the right channel and we will get back to you fast.'
        }
        primaryCta={{ href: '#form', label: isAr ? 'أرسل رسالة' : 'Send a message' }}
      />

      {/* ── Channels ── */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-4">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <a
              key={value}
              href={href}
              className="group bg-ash/60 hover:bg-ash border border-stone/60 hover:border-ember/40 rounded-2xl p-5 flex items-center gap-4 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-ember/15 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-ember" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted uppercase tracking-wider mb-0.5">
                  {label}
                </div>
                <div className="text-pearl font-semibold truncate group-hover:text-ember transition">
                  {value}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Address ── */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto bg-coal/50 border border-stone/60 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-ember/15 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-ember" />
          </div>
          <div>
            <div className="text-xs text-muted uppercase tracking-wider mb-1">
              {isAr ? 'المقر الرئيسي' : 'Headquarters'}
            </div>
            <div className="text-pearl font-semibold">
              {isAr
                ? 'الرياض، المملكة العربية السعودية'
                : 'Riyadh, Kingdom of Saudi Arabia'}
            </div>
            <div className="text-muted text-sm mt-0.5">
              {isAr ? 'ساعات العمل: الأحد–الخميس · 9 ص–6 م' : 'Hours: Sun–Thu · 9am–6pm'}
            </div>
          </div>
        </div>
      </section>

      {/* ── Form ── */}
      <section id="form" className="py-20 px-6 bg-coal/40 border-y border-stone/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-3">
              {isAr ? 'أرسل لنا رسالة' : 'Send us a message'}
            </h2>
            <p className="text-muted">
              {isAr
                ? 'سنرد خلال يوم عمل واحد.'
                : 'We respond within one business day.'}
            </p>
          </div>
          <LeadForm locale={locale} type="contact" />
        </div>
      </section>
    </>
  );
}
