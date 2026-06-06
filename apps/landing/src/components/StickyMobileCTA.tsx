'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { type Locale, translator } from '@/i18n/messages';

interface Props {
  locale: Locale;
  /** Which APK to surface. Defaults to rider. */
  variant?: 'rider' | 'driver';
}

/**
 * Floating CTA bar shown on small screens after the user scrolls past
 * the hero. Always offers one direct APK download to lower friction
 * for visitors arriving on mobile. Dismissible per session.
 */
export function StickyMobileCTA({ locale, variant = 'rider' }: Props) {
  const tt = translator(locale);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('hancr.mobileCTA.dismissed') === '1') {
      setDismissed(true);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (dismissed || !visible) return null;

  const href =
    variant === 'driver'
      ? '/downloads/hancr-driver.apk'
      : '/downloads/hancr-rider.apk';
  const label =
    variant === 'driver' ? tt('cta.downloadDriver') : tt('cta.downloadRider');

  return (
    <div className="lg:hidden fixed bottom-3 inset-x-3 z-40 flex items-center gap-2 bg-obsidian/95 backdrop-blur border border-ember/40 rounded-2xl p-3 shadow-ember-lg animate-slide-up">
      <a
        href={href}
        download
        className="flex-1 inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep transition px-4 py-3 rounded-xl font-bold text-pearl text-sm shadow-ember"
      >
        <Download className="w-4 h-4" />
        {label}
      </a>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          sessionStorage.setItem('hancr.mobileCTA.dismissed', '1');
          setDismissed(true);
        }}
        className="w-10 h-10 grid place-items-center rounded-xl bg-ash hover:bg-smoke transition text-muted text-lg"
      >
        ×
      </button>
    </div>
  );
}
