/**
 * HANCR Landing — i18n messages (ar + en).
 * Same pattern as apps/admin-panel/src/i18n/messages.ts.
 * Keys are dot-namespaced.
 */

export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

type Dict = Record<string, string>;
type Messages = Record<Locale, Dict>;

export const messages: Messages = {
  ar: {
    // ── Meta ──
    'meta.siteName': 'HANCR',
    'meta.tagline': 'منصة التنقل الذكي الأولى في الخليج',

    // ── Nav ──
    'nav.ride': 'الركوب',
    'nav.drive': 'القيادة',
    'nav.deliver': 'التوصيل',
    'nav.business': 'الأعمال',
    'nav.about': 'عن HANCR',
    'nav.help': 'المساعدة',
    'nav.login': 'دخول',
    'nav.signup': 'تسجيل',
    'nav.language': 'English',
    'nav.menu': 'القائمة',

    // ── CTAs ──
    'cta.download': 'حمِّل التطبيق',
    'cta.downloadRider': 'تطبيق الراكب',
    'cta.downloadDriver': 'تطبيق السائق',
    'cta.signUpDriver': 'انضم سائقاً',
    'cta.signUpBusiness': 'تواصل مع المبيعات',
    'cta.learnMore': 'اعرف المزيد',
    'cta.getStarted': 'ابدأ الآن',
    'cta.contact': 'تواصل معنا',
    'cta.bookRide': 'احجز رحلة',
    'cta.submit': 'إرسال',

    // ── Footer ──
    'footer.company': 'الشركة',
    'footer.products': 'منتجاتنا',
    'footer.trust': 'الأمان',
    'footer.legal': 'قانوني',
    'footer.social': 'تابعنا',
    'footer.about': 'عن HANCR',
    'footer.careers': 'الوظائف',
    'footer.newsroom': 'الأخبار',
    'footer.investors': 'المستثمرون',
    'footer.contact': 'اتصل بنا',
    'footer.ride': 'الركوب',
    'footer.drive': 'انضم سائقاً',
    'footer.deliver': 'التوصيل',
    'footer.business': 'للأعمال',
    'footer.safety': 'الأمان والسلامة',
    'footer.sustainability': 'الاستدامة',
    'footer.accessibility': 'إمكانية الوصول',
    'footer.terms': 'الشروط والأحكام',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.cookies': 'سياسة الكوكيز',
    'footer.help': 'مركز المساعدة',
    'footer.cities': 'المدن المتاحة',
    'footer.sitemap': 'خريطة الموقع',
    'footer.tagline': 'منصة التنقل الذكي الأولى في الخليج. صُنعت بشغف لخدمة المنطقة العربية.',
    'footer.rights': 'كل الحقوق محفوظة.',
    'footer.adminPanel': 'لوحة الإدارة',

    // ── Coming Soon (placeholder) ──
    'common.comingSoon': 'قريباً',
    'common.loading': 'جارٍ التحميل...',
    'common.email': 'البريد الإلكتروني',
    'common.name': 'الاسم الكامل',
    'common.phone': 'رقم الجوال',
    'common.company': 'اسم الشركة',
    'common.message': 'رسالتك',
    'common.city': 'المدينة',
    'common.thanks': 'شكراً لك! سنتواصل معك قريباً.',
    'common.error': 'حدث خطأ ما. حاول مرة أخرى.',
  },
  en: {
    // ── Meta ──
    'meta.siteName': 'HANCR',
    'meta.tagline': 'The Gulf\'s smart mobility platform',

    // ── Nav ──
    'nav.ride': 'Ride',
    'nav.drive': 'Drive',
    'nav.deliver': 'Deliver',
    'nav.business': 'Business',
    'nav.about': 'About',
    'nav.help': 'Help',
    'nav.login': 'Log in',
    'nav.signup': 'Sign up',
    'nav.language': 'العربية',
    'nav.menu': 'Menu',

    // ── CTAs ──
    'cta.download': 'Download the app',
    'cta.downloadRider': 'Rider app',
    'cta.downloadDriver': 'Driver app',
    'cta.signUpDriver': 'Sign up to drive',
    'cta.signUpBusiness': 'Contact sales',
    'cta.learnMore': 'Learn more',
    'cta.getStarted': 'Get started',
    'cta.contact': 'Contact us',
    'cta.bookRide': 'Book a ride',
    'cta.submit': 'Submit',

    // ── Footer ──
    'footer.company': 'Company',
    'footer.products': 'Products',
    'footer.trust': 'Trust',
    'footer.legal': 'Legal',
    'footer.social': 'Follow us',
    'footer.about': 'About HANCR',
    'footer.careers': 'Careers',
    'footer.newsroom': 'Newsroom',
    'footer.investors': 'Investors',
    'footer.contact': 'Contact',
    'footer.ride': 'Ride',
    'footer.drive': 'Drive',
    'footer.deliver': 'Deliver',
    'footer.business': 'Business',
    'footer.safety': 'Safety',
    'footer.sustainability': 'Sustainability',
    'footer.accessibility': 'Accessibility',
    'footer.terms': 'Terms',
    'footer.privacy': 'Privacy',
    'footer.cookies': 'Cookies',
    'footer.help': 'Help Center',
    'footer.cities': 'Cities',
    'footer.sitemap': 'Sitemap',
    'footer.tagline': 'The Gulf\'s smart mobility platform. Built with passion for the MENA region.',
    'footer.rights': 'All rights reserved.',
    'footer.adminPanel': 'Admin Panel',

    // ── Coming Soon (placeholder) ──
    'common.comingSoon': 'Coming soon',
    'common.loading': 'Loading...',
    'common.email': 'Email',
    'common.name': 'Full name',
    'common.phone': 'Phone',
    'common.company': 'Company name',
    'common.message': 'Your message',
    'common.city': 'City',
    'common.thanks': 'Thanks! We\'ll be in touch soon.',
    'common.error': 'Something went wrong. Please try again.',
  },
};

/** Lookup a translation. Returns the key itself if missing. */
export function t(locale: Locale, key: string): string {
  return messages[locale]?.[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
}

/** Curried form: `const tt = useTranslator('ar'); tt('nav.ride')` */
export function translator(locale: Locale) {
  return (key: string) => t(locale, key);
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}
