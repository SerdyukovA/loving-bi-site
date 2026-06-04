#!/usr/bin/env node
/**
 * Export all generated LinkedIn drafts (RU + EN) into a single Markdown doc
 * so Valeria can backfill old posts to LinkedIn at her own pace.
 *
 * Order: oldest → newest (chronological backfill).
 * Output: ../LINKEDIN_DRAFTS.md (in the loving_bi project root).
 *
 * Usage: node scripts/export-linkedin.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'

const DATA_URL = new URL('../src/data/telegram-posts.json', import.meta.url)
const OUT_URL = new URL('../../LINKEDIN_DRAFTS.md', import.meta.url)
const BASE = 'https://lovingbi.ru'

const posts = JSON.parse(readFileSync(DATA_URL, 'utf8'))
  .filter(p => p.ai?.linkedinRu)
  .sort((a, b) => parseInt(a.id) - parseInt(b.id)) // oldest first

function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}

const lines = [
  '# LinkedIn — бэклог постов',
  '',
  '> Готовые черновики для LinkedIn (RU + EN) по всем постам канала, от старых к новым.',
  '> Идея: Лера потихоньку постит старые посты по порядку. Когда догонит — новые посты будет присылать бот @linkedin_loving_bi_bot автоматически.',
  '',
  '**Как пользоваться:** копируешь нужный блок (RU или EN), открываешь LinkedIn, постишь. Отмечай галочкой опубликованные.',
  '',
  `_Всего черновиков: ${posts.length}. Сгенерировано моделью ${posts[0]?.ai?.model || '—'}._`,
  '',
  '---',
  '',
]

posts.forEach((p, i) => {
  const ai = p.ai
  lines.push(`## ${i + 1}. ${ai.seoTitle}`)
  lines.push('')
  lines.push(`- **Статус:** \`[ ]\` не опубликовано`)
  lines.push(`- **Дата поста:** ${fmtDate(p.date)}`)
  lines.push(`- **Ссылка на сайт:** ${BASE}/tg/${p.id}`)
  lines.push(`- **Оригинал в Telegram:** ${p.tgUrl}`)
  lines.push('')
  lines.push('### 🇷🇺 RU')
  lines.push('')
  lines.push('```')
  lines.push(ai.linkedinRu.trim())
  lines.push('```')
  lines.push('')
  lines.push('### 🇬🇧 EN')
  lines.push('')
  lines.push('```')
  lines.push(ai.linkedinEn.trim())
  lines.push('```')
  lines.push('')
  lines.push('---')
  lines.push('')
})

writeFileSync(OUT_URL, lines.join('\n'), 'utf8')
console.log(`Wrote ${posts.length} LinkedIn drafts → ${OUT_URL.pathname}`)
