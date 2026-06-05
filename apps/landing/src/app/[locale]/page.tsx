import Link from 'next/link';
import { Car, Download, Shield, Smartphone, Sparkles } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  translator,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = (SUPPORTED_LOCALES as readonly string[]).includes(params.locale)
    ? (params.locale as Locale)
    : DEFAULT_LOCALE;
  const tt = translator(locale);
  const isAr = locale === 'ar';

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-ember/15 rounded-full blur-[140px] animate-glow pointer-events-none" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ember/10 border border-ember/30 text-sm mb-8">
            <Sparkles className="w-4 h-4 text-ember" />
            <span className="text-pearl/90">{tt('meta.tagline')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 text-pearl">
            {isAr ? (
              <>
                تنقَّل بذكاء.
                <br />
                <span className="bg-gradient-to-r from-ember via-ember-light to-ember bg-clip-text text-transparent">
                  وصِّل بأمان.
                </span>
              </>
            ) : (
              <>
                Move smart.
                <br />
                <span className="bg-gradient-to-r from-ember via-ember-light to-ember bg-clip-text text-transparent">
                  Deliver safely.
                </span>
              </>
            )}
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
            {isAr
              ? 'منصة التنقل الذكي الأولى في الخليج. رحلات، توصيل بضائع، ومشاركة سيارات — في تطبيق واحد آمن وسهل.'
              : 'The Gulf\'s leading smart mobility platform. Rides, delivery, and carpooling — in one safe and easy app.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={localizedHref(locale, '/ride')}
              className="inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep transition px-8 py-4 rounded-xl font-bold text-lg text-pearl shadow-ember-lg"
            >
              <Smartphone className="w-5 h-5" />
              {tt('cta.bookRide')}
            </Link>
            <Link
              href={localizedHref(locale, '/drive')}
              className="inline-flex items-center justify-center gap-2 border-2 border-stone hover:border-ember hover:bg-ember/10 transition px-8 py-4 rounded-xl font-bold text-lg text-pearl"
            >
              <Car className="w-5 h-5" />
              {tt('cta.signUpDriver')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Service cards ── */}
      <section className="py-20 px-6 bg-coal/50 border-y border-stone/40">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Smartphone, href: '/ride', label: tt('nav.ride') },
            { icon: Car, href: '/drive', label: tt('nav.drive') },
            { icon: Download, href: '/deliver', label: tt('nav.deliver') },
            { icon: Shield, href: '/business', label: tt('nav.business') },
          ].map(({ icon: Icon, href, label }) => (
            <Link
              key={href}
              href={localizedHref(locale, href)}
              className="group bg-ash/60 hover:bg-ash border border-stone/60 hover:border-ember/50 rounded-2xl p-6 transition shadow-card hover:shadow-ember"
            >
              <div className="w-12 h-12 rounded-xl bg-ember/15 group-hover:bg-ember/25 transition flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-ember" />
              </div>
              <h3 className="text-lg font-bold text-pearl mb-1">{label}</h3>
              <p className="text-sm text-muted">{tt('cta.learnMore')} →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Apps download ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-pearl">
            {tt('cta.download')}
          </h2>
          <p className="text-muted mb-10">{tt('common.comingSoon')} — iOS</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <a
              href="/downloads/hancr-rider.apk"
              download
              className="bg-ember hover:bg-ember-deep transition px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-ember"
            >
              <Download className="w-5 h-5" />
              {tt('cta.downloadRider')}
            </a>
            <a
              href="/downloads/hancr-driver.apk"
              download
              className="bg-ash border-2 border-stone hover:border-ember transition px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3"
            >
              <Download className="w-5 h-5" />
              {tt('cta.downloadDriver')}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
