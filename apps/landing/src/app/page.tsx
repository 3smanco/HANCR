import type { Metadata } from 'next';
import { DEFAULT_LOCALE } from '@/i18n/messages';

/**
 * Root entry — static export-friendly redirect to the default locale.
 * `next/navigation`'s `redirect()` requires a server, so for `output: 'export'`
 * we emit a tiny page with both a `<meta http-equiv="refresh">` and a JS fallback.
 */
const TARGET = `/${DEFAULT_LOCALE}`;

export const metadata: Metadata = {
  title: 'HANCR',
  robots: { index: false, follow: true },
  alternates: { canonical: TARGET },
};

export default function RootIndex() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${TARGET}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(TARGET)});`,
        }}
      />
      <noscript>
        <a href={TARGET}>HANCR</a>
      </noscript>
    </>
  );
}
