import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://hancr.com/sitemap.xml',
    host: 'https://hancr.com',
  };
}
