import type { Metadata } from 'next';
import './globals.css';
import { ApolloProvider } from '@/components/layout/ApolloProvider';
import { AuthBootstrap } from '@/components/layout/AuthBootstrap';
import { LocaleProvider } from '@/i18n/LocaleProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { GlobalScopeProvider } from '@/components/global/GlobalScopeProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'HANCR Admin Panel',
  description: 'HANCR Smart Mobility — Control Panel',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // NOTE: initial lang/dir set to Arabic for FOUC prevention.
  // LocaleProvider will sync them to the saved cookie on client mount.
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ThemeProvider>
          <LocaleProvider>
          <ApolloProvider>
            <GlobalScopeProvider>
            <AuthBootstrap>{children}</AuthBootstrap>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#22223B',
                  color: '#F2E9E4',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                },
                success: { iconTheme: { primary: '#10B981', secondary: '#F2E9E4' } },
                error:   { iconTheme: { primary: '#EF4444', secondary: '#F2E9E4' } },
              }}
            />
            </GlobalScopeProvider>
          </ApolloProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
