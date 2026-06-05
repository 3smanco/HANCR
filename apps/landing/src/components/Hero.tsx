import Link from 'next/link';
import type { ReactNode } from 'react';

interface HeroProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  image?: ReactNode;
  align?: 'center' | 'start';
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  image,
  align = 'start',
}: HeroProps) {
  const hasImage = !!image;
  return (
    <section className="relative pt-20 pb-16 px-6 overflow-hidden">
      <div className="absolute top-10 -left-32 w-[500px] h-[500px] bg-ember/15 rounded-full blur-[120px] pointer-events-none animate-glow" />
      <div className="absolute bottom-10 -right-32 w-[400px] h-[400px] bg-ember/8 rounded-full blur-[100px] pointer-events-none" />

      <div
        className={`relative max-w-7xl mx-auto ${
          hasImage ? 'grid lg:grid-cols-2 gap-12 items-center' : ''
        }`}
      >
        <div className={align === 'center' ? 'text-center mx-auto max-w-3xl' : ''}>
          {eyebrow ? (
            <div className="inline-block px-3 py-1 rounded-full bg-ember/10 border border-ember/30 text-ember text-xs font-semibold mb-6 uppercase tracking-wider">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 text-pearl">
            {title}
          </h1>
          <p className="text-lg sm:text-xl text-muted leading-relaxed mb-8 max-w-2xl">
            {subtitle}
          </p>
          <div
            className={`flex flex-wrap gap-3 ${
              align === 'center' ? 'justify-center' : ''
            }`}
          >
            <Link
              href={primaryCta.href}
              className="inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-deep transition px-7 py-3.5 rounded-xl font-bold text-base text-pearl shadow-ember-lg"
            >
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex items-center justify-center gap-2 border-2 border-stone hover:border-ember hover:bg-ember/10 transition px-7 py-3.5 rounded-xl font-bold text-base text-pearl"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        {image ? <div className="hidden lg:block">{image}</div> : null}
      </div>
    </section>
  );
}
