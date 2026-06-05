import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface Props {
  eyebrow?: string;
  title: string;
  description: string;
  bullets?: string[];
  cta?: { href: string; label: string };
  icon?: LucideIcon;
  reverse?: boolean;
  accent?: 'coal' | 'obsidian';
}

export function FeatureSplit({
  eyebrow,
  title,
  description,
  bullets,
  cta,
  icon: Icon,
  reverse = false,
  accent = 'obsidian',
}: Props) {
  return (
    <section className={`py-16 sm:py-20 px-6 ${accent === 'coal' ? 'bg-coal/40' : ''}`}>
      <div
        className={`max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center ${
          reverse ? 'lg:[direction:rtl]' : ''
        }`}
      >
        <div className={reverse ? 'lg:[direction:ltr]' : ''}>
          {eyebrow ? (
            <div className="inline-block px-3 py-1 rounded-full bg-ember/10 border border-ember/30 text-ember text-xs font-semibold mb-4 uppercase tracking-wider">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-5 leading-tight">
            {title}
          </h2>
          <p className="text-muted text-lg leading-relaxed mb-6">{description}</p>

          {bullets && bullets.length > 0 ? (
            <ul className="space-y-3 mb-7">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-pearl/90">
                  <span className="w-5 h-5 rounded-full bg-ember/15 text-ember flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {cta ? (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 bg-ember hover:bg-ember-deep transition px-6 py-3 rounded-xl font-bold text-pearl shadow-ember"
            >
              {cta.label}
            </Link>
          ) : null}
        </div>

        <div className={reverse ? 'lg:[direction:ltr]' : ''}>
          <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-ember/15 via-ash/40 to-coal border border-stone/60 shadow-card-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ember/5 to-transparent pointer-events-none" />
            {Icon ? (
              <Icon className="w-32 h-32 text-ember/60 animate-float relative" />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
