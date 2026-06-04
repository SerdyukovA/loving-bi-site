import type { MetadataRoute } from 'next'
import { getAllTgPosts } from '@/lib/tg-posts'

const BASE = 'https://lovingbi.ru'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts: MetadataRoute.Sitemap = getAllTgPosts().map(p => ({
    url: `${BASE}/tg/${p.id}`,
    lastModified: p.date ? new Date(p.date) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...posts,
  ]
}
