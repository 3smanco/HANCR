import type { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@/i18n/messages';

const BASE_PATHS = [
  '',
  '/ride',
  '/drive',
  '/deliver',
  '/business',
  '/about',
  '/careers',
  '/contact',
  '/newsroom',
  '/newsroom/launch-riyadh',
  '/newsroom/driver-app-launch',
  '/newsroom/admin-panel-v2',
  '/newsroom/sustainability-pledge',
  '/investors',
  '/safety',
  '/sustainability',
  '/help',
  '/help/rider',
  '/help/driver',
  '/help/payments',
  '/help/safety',
  '/help/business',
  '/cities',
  '/sitemap',
  '/accessibility',
  '/legal/terms',
  '/legal/privacy',
  '/legal/cookies',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = 'https://hancr.com';
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const path of BASE_PATHS) {
      entries.push({
        url: `${origin}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1.0 : path.startsWith('/legal') ? 0.3 : 0.7,
      });
    }
  }

  return entries;
}
