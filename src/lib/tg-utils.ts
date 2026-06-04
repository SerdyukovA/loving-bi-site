// Shared utilities — no Node.js imports, safe for client and server

export type ArticleBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }

export type PostAI = {
  seoTitle: string
  metaDescription: string
  summary: string
  articleBody: ArticleBlock[]
  faq: { q: string; a: string }[]
  keywords: string[]
  /** LinkedIn drafts (semi-auto posting) — generated alongside SEO */
  linkedinRu?: string
  linkedinEn?: string
  /** generator metadata */
  model?: string
  generatedAt?: string
}

export type TgPost = {
  id: string
  date: string | null
  text: string
  images: string[]
  localImages: string[]
  views: string | null
  reactions: { emoji: string; count: number }[]
  tgUrl: string
  forwardedFrom: string | null
  ai?: PostAI
}

export function getTag(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('a/b') || t.includes('а/б')) return 'A/B-тесты'
  if (t.includes('sql') || t.includes('null') || t.includes('join')) return 'SQL'
  if (t.includes('дашборд') || t.includes('dashboard') || t.includes('дэш')) return 'Дашборды'
  if (t.includes('совет') || t.includes('принцип') || t.includes('правил')) return 'Советы'
  if (t.includes('проект') || t.includes('тинькофф') || t.includes('авито') || t.includes('оскар') || t.includes('бамбл')) return 'Проекты'
  return 'Датавиз'
}

export function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return ''
  }
}
