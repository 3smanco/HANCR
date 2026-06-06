import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  t,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';
import { Hero } from '@/components/Hero';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = pick(params.locale);
  return {
    title: t(locale, 'footer.newsroom'),
    description:
      locale === 'ar'
        ? 'آخر أخبار HANCR — إطلاقات، شراكات، وتوسُّعات.'
        : "Latest HANCR news — launches, partnerships, and expansions.",
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

interface Article {
  slug: string;
  title: string;
  summary: string;
  date: string;
  category: string;
}

export default function NewsroomPage({ params }: { params: { locale: string } }) {
  const locale = pick(params.locale);
  const isAr = locale === 'ar';

  const articles: Article[] = isAr
    ? [
        {
          slug: 'launch-riyadh',
          title: 'HANCR تطلق رسمياً في الرياض',
          summary: 'بعد أشهر من الاختبار، نطلق خدمتنا للعموم في العاصمة السعودية.',
          date: '2026-05-01',
          category: 'إطلاق',
        },
        {
          slug: 'driver-app-launch',
          title: 'تطبيق السائق الجديد — 8 لغات + برنامج Stars',
          summary: 'إصدار شامل بـ 8 لغات + برنامج مكافآت Stars للسائقين النشطين.',
          date: '2026-04-15',
          category: 'منتج',
        },
        {
          slug: 'admin-panel-v2',
          title: 'لوحة الإدارة v2 — 24 صفحة، RBAC كامل، خرائط حيّة',
          summary: 'تجديد كامل للوحة الإدارة بـ 11 مرحلة تطوير. عمليات أسرع لفريقنا.',
          date: '2026-06-01',
          category: 'منتج',
        },
        {
          slug: 'sustainability-pledge',
          title: 'التزامنا الأخضر: 30% رحلات كهربائية بحلول 2028',
          summary: 'نطلق برنامج حوافز للسائقين الكهربائيين دعماً لرؤية المملكة 2030.',
          date: '2026-03-20',
          category: 'استدامة',
        },
      ]
    : [
        {
          slug: 'launch-riyadh',
          title: 'HANCR officially launches in Riyadh',
          summary: 'After months of testing, we go live to the public in the Saudi capital.',
          date: '2026-05-01',
          category: 'Launch',
        },
        {
          slug: 'driver-app-launch',
          title: 'New driver app — 8 languages + Stars program',
          summary: 'Major release with 8 languages and a Stars rewards program for active drivers.',
          date: '2026-04-15',
          category: 'Product',
        },
        {
          slug: 'admin-panel-v2',
          title: 'Admin Panel v2 — 24 pages, full RBAC, live maps',
          summary: 'A complete admin panel revamp delivered across 11 phases. Faster ops for our team.',
          date: '2026-06-01',
          category: 'Product',
        },
        {
          slug: 'sustainability-pledge',
          title: 'Our green pledge: 30% EV trips by 2028',
          summary: 'We launch an EV driver incentive program in support of Vision 2030.',
          date: '2026-03-20',
          category: 'Sustainability',
        },
      ];

  return (
    <>
      <Hero
        eyebrow={isAr ? 'الأخبار' : 'Newsroom'}
        title={
          isAr ? (
            <>
              قصة HANCR،
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                تُحدَّث أسبوعياً.
              </span>
            </>
          ) : (
            <>
              The HANCR story,
              <br />
              <span className="bg-gradient-to-r from-ember to-ember-light bg-clip-text text-transparent">
                updated weekly.
              </span>
            </>
          )
        }
        subtitle={
          isAr
            ? 'آخر الإطلاقات، الشراكات، التوسُّعات، والتحديثات.'
            : 'Latest launches, partnerships, expansions, and updates.'
        }
        primaryCta={{
          href: localizedHref(locale, '/contact'),
          label: isAr ? 'للتواصل الإعلامي' : 'Press inquiries',
        }}
      />

      {/* ── Articles ── */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {articles.map((a) => (
            <article
              key={a.slug}
              className="group bg-ash/60 hover:bg-ash border border-stone/60 hover:border-ember/40 rounded-2xl p-6 transition"
            >
              <div className="flex items-center gap-3 text-xs text-muted mb-3">
                <span className="px-2 py-0.5 rounded-full bg-ember/15 text-ember font-semibold uppercase tracking-wider">
                  {a.category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {a.date}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-pearl mb-2 group-hover:text-ember transition">
                {a.title}
              </h3>
              <p className="text-muted leading-relaxed mb-4">{a.summary}</p>
              <Link
                href={localizedHref(locale, `/newsroom/${a.slug}`)}
                className="inline-flex items-center gap-1.5 text-ember text-sm font-bold hover:gap-2.5 transition-all"
              >
                {isAr ? 'اقرأ المزيد' : 'Read more'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── Press kit ── */}
      <section className="py-16 px-6 bg-coal/40 border-y border-stone/40">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-pearl mb-3">
            {isAr ? 'حزمة الإعلام' : 'Press kit'}
          </h2>
          <p className="text-muted mb-6">
            {isAr
              ? 'شعارات، صور، ومعلومات تعريفية للصحافة. تواصل معنا للحصول عليها.'
              : 'Logos, photos, and company info for journalists. Contact us to request access.'}
          </p>
          <a
            href="mailto:press@hancr.com"
            className="inline-flex items-center gap-2 bg-ember hover:bg-ember-deep transition px-6 py-3 rounded-xl font-bold text-pearl shadow-ember"
          >
            press@hancr.com
          </a>
        </div>
      </section>
    </>
  );
}
