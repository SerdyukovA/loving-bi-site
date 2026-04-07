// Shared utilities — no Node.js imports, safe for client and server

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
