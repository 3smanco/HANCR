import { Download } from 'lucide-react';
import { type Locale, translator } from '@/i18n/messages';

interface Props {
  locale: Locale;
  variant?: 'rider' | 'driver' | 'both';
}

export function AppDownloadCTA({ locale, variant = 'both' }: Props) {
  const tt = translator(locale);
  const isAr = locale === 'ar';

  const heading = isAr ? 'حمِّل التطبيق الآن' : 'Download the app';
  const subtitle = isAr
    ? 'متاح الآن على أندرويد. iOS قريباً.'
    : 'Available on Android. iOS coming soon.';

  const cards: Array<{
    href: string;
    title: string;
    subtitle: string;
    accent: 'ember' | 'stone';
    size: string;
  }> = [];

  if (variant === 'rider' || variant === 'both') {
    cards.push({
      href: '/downloads/hancr-rider.apk',
      title: tt('cta.downloadRider'),
      subtitle: isAr ? 'احجز رحلتك خلال ثوانٍ' : 'Book a ride in seconds',
      accent: 'ember',
      size: '48.6 MB',
    });
  }
  if (variant === 'driver' || variant === 'both') {
    cards.push({
      href: '/downloads/hancr-driver.apk',
      title: tt('cta.downloadDriver'),
      subtitle: isAr ? 'قُد واربح بمرونة' : 'Drive and earn on your terms',
      accent: 'stone',
      size: '46.2 MB',
    });
  }

  return (
    <section className="py-20 px-6 bg-coal/60 border-y border-stone/40">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-3">
          {heading}
        </h2>
        <p className="text-muted mb-10">{subtitle}</p>

        <div
          className={`grid gap-4 ${cards.length === 2 ? 'sm:grid-cols-2' : ''} max-w-3xl mx-auto`}
        >
          {cards.map((c) => (
            <a
              key={c.href}
              href={c.href}
              download
              className={`group block rounded-2xl p-6 text-start transition shadow-card hover:shadow-card-xl ${
                c.accent === 'ember'
                  ? 'bg-ember hover:bg-ember-deep text-pearl'
                  : 'bg-ash hover:bg-smoke text-pearl border-2 border-stone hover:border-ember'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    c.accent === 'ember' ? 'bg-pearl/15' : 'bg-ember/15'
                  }`}
                >
                  <Download
                    className={`w-6 h-6 ${
                      c.accent === 'ember' ? 'text-pearl' : 'text-ember'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg leading-tight">{c.title}</div>
                  <div
                    className={`text-sm ${
                      c.accent === 'ember' ? 'text-pearl/80' : 'text-muted'
                    } mt-0.5`}
                  >
                    {c.subtitle}
                  </div>
                </div>
                <div
                  className={`text-xs font-semibold ${
                    c.accent === 'ember' ? 'text-pearl/70' : 'text-muted'
                  }`}
                >
                  APK · {c.size}
                </div>
              </div>
            </a>
          ))}
        </div>

        <p className="text-xs text-hint mt-6">
          {isAr ? 'Android 7.0+ · مجاناً' : 'Android 7.0+ · Free'}
        </p>
      </div>
    </section>
  );
}
