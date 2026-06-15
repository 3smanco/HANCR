import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hancr.com'),
  title: {
    default: 'HANCR — منصة التنقل الذكي',
    template: '%s · HANCR',
  },
  description: 'منصة التنقل الذكي لكل مكان. توصيل، نقل، وأمان — في تطبيق واحد.',
  keywords: [
    'تطبيق توصيل',
    'نقل',
    'تطبيق سيارات',
    'مشاركة الركوب',
    'توصيل سريع',
    'ride-hailing',
    'mobility',
    'HANCR',
  ],
  openGraph: {
    title: 'HANCR — منصة التنقل الذكي',
    description: 'منصة التنقل الذكي لكل مكان',
    url: 'https://hancr.com',
    siteName: 'HANCR',
    locale: 'ar_SA',
    alternateLocale: ['en_US'],
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'HANCR' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HANCR — منصة التنقل الذكي',
    description: 'منصة التنقل الذكي لكل مكان',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0807',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root layout. Sets defaults that work before the locale segment renders.
 * The inline script corrects `lang`/`dir` to match the URL on the client
 * before paint, avoiding any FOUC for users landing directly on /en.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname.split('/')[1];var loc=p==='en'?'en':'ar';var d=document.documentElement;d.lang=loc;d.dir=loc==='ar'?'rtl':'ltr';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-obsidian text-pearl min-h-screen antialiased">{children}</body>
    </html>
  );
}
