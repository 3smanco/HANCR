import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n/messages';
import { localizedHref } from '@/lib/locale';

const ARTICLES: Record<string, { ar: Article; en: Article }> = {
  'launch-riyadh': {
    ar: {
      title: 'HANCR تطلق رسمياً في الرياض',
      date: '2026-05-01',
      category: 'إطلاق',
      paragraphs: [
        'بعد أشهر من الاختبار المغلق، يسرُّنا أن نُعلن إطلاق HANCR رسمياً في مدينة الرياض. الخدمة الآن متاحة للعموم — راكبين وسائقين.',
        'في مرحلة الاختبار، أكملنا أكثر من 10,000 رحلة بمتوسط تقييم 4.9 نجوم، ووقت مطابقة لا يتجاوز 30 ثانية في معظم الأحياء.',
        'الخطوة التالية: التوسُّع لجدة في الربع الرابع 2026، ثم الدوحة ودبي خلال 2027.',
      ],
    },
    en: {
      title: 'HANCR officially launches in Riyadh',
      date: '2026-05-01',
      category: 'Launch',
      paragraphs: [
        "After months of closed beta, we're proud to officially launch HANCR in Riyadh. The service is now publicly available — both riders and drivers.",
        'In our beta, we completed over 10,000 trips with an average 4.9-star rating, and matching times under 30 seconds in most neighborhoods.',
        'Next: Jeddah expansion in Q4 2026, then Doha and Dubai in 2027.',
      ],
    },
  },
  'driver-app-launch': {
    ar: {
      title: 'تطبيق السائق الجديد — 8 لغات + برنامج Stars',
      date: '2026-04-15',
      category: 'منتج',
      paragraphs: [
        'يأتي تطبيق السائق الجديد بدعم 8 لغات (العربية، الإنجليزية، الأردية، البنغالية، الهندية، الإندونيسية، التغالوغية، والأمهرية) لخدمة الكادر متعدد الجنسيات في المنطقة.',
        'برنامج Stars يكافئ السائقين الأكثر نشاطاً بعمولات مخفَّضة، أولوية في المطابقة، وحوافز نقدية شهرية.',
        'متاح الآن للتحميل المباشر كـ APK. نسخة Play Store قيد المراجعة.',
      ],
    },
    en: {
      title: 'New driver app — 8 languages + Stars program',
      date: '2026-04-15',
      category: 'Product',
      paragraphs: [
        'The new driver app supports 8 languages (Arabic, English, Urdu, Bengali, Hindi, Indonesian, Tagalog, and Amharic) to serve the multinational driver pool in the region.',
        'The Stars program rewards top drivers with reduced commissions, matching priority, and monthly cash incentives.',
        "Available now as a direct APK download. Play Store version is under review.",
      ],
    },
  },
  'admin-panel-v2': {
    ar: {
      title: 'لوحة الإدارة v2 — 24 صفحة، RBAC كامل، خرائط حيّة',
      date: '2026-06-01',
      category: 'منتج',
      paragraphs: [
        'أنهينا عملية تطوير امتدَّت على 11 مرحلة لتجديد لوحة إدارتنا. الجديد يشمل: خريطة حيّة للسائقين، صفحة تفاصيل للراكب والسائق، صندوق شكاوى مع timeline، إدارة دفعات السائقين، ومناطق التسعير الديناميكي.',
        'تطبيق نظام RBAC حقيقي بـ 5 أدوار (super / finance / ops / marketing / support) — كل دور يرى ما يحتاجه فقط.',
        'فريق العمليات لدينا أبلغ عن تحسُّن في وقت الاستجابة بنسبة 65%.',
      ],
    },
    en: {
      title: 'Admin Panel v2 — 24 pages, full RBAC, live maps',
      date: '2026-06-01',
      category: 'Product',
      paragraphs: [
        'We wrapped an 11-phase rebuild of our admin panel. New features include: live driver map, driver and rider detail pages, complaint inbox with timeline, driver payouts, and dynamic pricing zones.',
        'Real RBAC across 5 roles (super / finance / ops / marketing / support) — each role sees only what they need.',
        'Our ops team reports a 65% improvement in response time.',
      ],
    },
  },
  'sustainability-pledge': {
    ar: {
      title: 'التزامنا الأخضر: 30% رحلات كهربائية بحلول 2028',
      date: '2026-03-20',
      category: 'استدامة',
      paragraphs: [
        'دعماً لرؤية المملكة 2030 ومبادرة السعودية الخضراء، نلتزم بأن تكون 30% من رحلاتنا بسيارات كهربائية أو هجينة بحلول 2028.',
        'لتحقيق ذلك، نطلق برنامج حوافز للسائقين الكهربائيين: عمولة مخفَّضة (10% بدلاً من 15%) + أولوية في المطابقة + قسائم شحن.',
        'في المرحلة الأولى، نهدف لـ 50 سيارة كهربائية في الرياض خلال 2026.',
      ],
    },
    en: {
      title: 'Our green pledge: 30% EV trips by 2028',
      date: '2026-03-20',
      category: 'Sustainability',
      paragraphs: [
        'In support of Vision 2030 and the Saudi Green Initiative, we pledge that 30% of our trips will be on EVs or hybrids by 2028.',
        'To get there, we launch an EV driver incentive program: reduced 10% commission, matching priority, and charging vouchers.',
        'Phase one: 50 EVs in Riyadh during 2026.',
      ],
    },
  },
};

interface Article {
  title: string;
  date: string;
  category: string;
  paragraphs: string[];
}

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of SUPPORTED_LOCALES) {
    for (const slug of Object.keys(ARTICLES)) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Metadata {
  const locale = pick(params.locale);
  const article = ARTICLES[params.slug]?.[locale];
  if (!article) return { title: 'Not found' };
  return {
    title: article.title,
    description: article.paragraphs[0],
  };
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export default function ArticlePage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = pick(params.locale);
  const article = ARTICLES[params.slug]?.[locale];
  if (!article) notFound();
  const isAr = locale === 'ar';

  return (
    <article className="py-16 px-6 max-w-3xl mx-auto">
      <Link
        href={localizedHref(locale, '/newsroom')}
        className="inline-flex items-center gap-2 text-muted hover:text-ember transition text-sm mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {isAr ? 'كل الأخبار' : 'All news'}
      </Link>

      <div className="flex items-center gap-3 text-xs text-muted mb-4">
        <span className="px-2 py-0.5 rounded-full bg-ember/15 text-ember font-semibold uppercase tracking-wider">
          {article.category}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {article.date}
        </span>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-pearl leading-tight mb-8">
        {article.title}
      </h1>

      <div className="space-y-5 text-pearl/90 text-lg leading-relaxed">
        {article.paragraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>
    </article>
  );
}
