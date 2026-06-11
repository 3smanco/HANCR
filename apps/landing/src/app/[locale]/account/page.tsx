import type { Metadata } from 'next';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n/messages';
import { AccountClient } from '@/components/AccountClient';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

function pick(value: string): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const ar = pick(params.locale) === 'ar';
  return {
    title: ar ? 'حسابي — HANCR' : 'My account — HANCR',
    description: ar
      ? 'سجّل دخولك إلى حساب HANCR عبر رقم جوالك.'
      : 'Sign in to your HANCR account with your phone number.',
  };
}

export default function AccountPage({
  params,
}: {
  params: { locale: string };
}) {
  return <AccountClient isAr={pick(params.locale) === 'ar'} />;
}
