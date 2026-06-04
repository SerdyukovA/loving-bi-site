import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://lovingbi.ru/sitemap.xml',
    host: 'https://lovingbi.ru',
  }
}
