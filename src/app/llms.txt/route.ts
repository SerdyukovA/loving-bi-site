import { getAllTgPosts } from '@/lib/tg-posts'

export const dynamic = 'force-static'

const BASE = 'https://lovingbi.ru'

// llms.txt — a machine-readable index for LLM/AI crawlers (see llmstxt.org)
export function GET() {
  const posts = [...getAllTgPosts()].sort((a, b) => parseInt(b.id) - parseInt(a.id))

  const lines = [
    '# Любовь, BI и графики',
    '',
    '> Блог Senior BI-аналитика Валерии Смирновой (Авито) о дата-визуализации, дашбордах, BI и A/B-тестах. Реальные рабочие кейсы, принципы хорошего датавиза и разбор типичных ошибок визуализации.',
    '',
    'Автор: Валерия Смирнова — Senior BI-аналитик. Telegram-канал: https://t.me/loving_bi',
    '',
    '## Посты',
    '',
    ...posts.map(p => {
      const title = p.ai?.seoTitle || p.text.split('\n').find(l => l.trim()) || `Пост #${p.id}`
      const sum = p.ai?.summary ? `: ${p.ai.summary}` : ''
      return `- [${title}](${BASE}/tg/${p.id})${sum}`
    }),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
