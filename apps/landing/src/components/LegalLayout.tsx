import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { type Locale } from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';

interface Props {
  title: string;
  lastUpdated: string;
  locale: Locale;
  children: ReactNode;
}

export function LegalLayout({ title, lastUpdated, locale, children }: Props) {
  const isAr = locale === 'ar';
  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href={localizedHref(locale, '/')}
          className="inline-flex items-center gap-2 text-muted hover:text-ember transition text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAr ? 'العودة للرئيسية' : 'Back to home'}
        </Link>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-pearl leading-tight mb-2">
          {title}
        </h1>
        <p className="text-muted text-sm mb-10">
          {isAr ? 'آخر تحديث: ' : 'Last updated: '}
          <time dateTime={lastUpdated}>{lastUpdated}</time>
        </p>

        <div className="space-y-8">{children}</div>
      </div>
    </section>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold text-pearl mb-3">{title}</h2>
      <div className="text-pearl/85 leading-relaxed whitespace-pre-line">{children}</div>
    </section>
  );
}
