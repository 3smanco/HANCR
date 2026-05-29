import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HANCR — منصة التنقل الذكي',
  description: 'منصة التنقل الذكي الأولى في الخليج. توصيل، نقل، وأمان — في تطبيق واحد.',
  keywords: ['تطبيق توصيل', 'نقل', 'الخليج', 'السعودية', 'الإمارات', 'ride-hailing', 'mobility'],
  openGraph: {
    title: 'HANCR — منصة التنقل الذكي',
    description: 'منصة التنقل الذكي الأولى في الخليج',
    url: 'https://hancr.com',
    siteName: 'HANCR',
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HANCR — منصة التنقل الذكي',
    description: 'منصة التنقل الذكي الأولى في الخليج',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-navy text-cream min-h-screen">{children}</body>
    </html>
  );
}
