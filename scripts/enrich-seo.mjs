#!/usr/bin/env node
/**
 * AI-SEO / GEO enrichment for Telegram posts.
 *
 * Reads src/data/telegram-posts.json, and for every post that has no `.ai`
 * field yet, calls the Anthropic API to produce an LLM-friendly web article
 * (clean structure, TL;DR, FAQ) plus LinkedIn drafts (RU+EN), then writes the
 * result back into the same JSON. Idempotent: existing `.ai` posts are skipped
 * unless --force is passed.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node scripts/enrich-seo.mjs [--limit N] [--id ID] [--force] [--dry]
 *
 * The API key is read ONLY from the environment — never hard-code or commit it.
 */

import { readFileSync, writeFileSync } from 'node:fs'

const DATA_URL = new URL('../src/data/telegram-posts.json', import.meta.url)
const MODEL = process.env.ENRICH_MODEL || 'claude-sonnet-4-6'
const API_KEY = process.env.ANTHROPIC_API_KEY

// ---- CLI args ----
const args = process.argv.slice(2)
const has = f => args.includes(f)
const val = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }
const FORCE = has('--force')
const DRY = has('--dry')
const LIMIT = val('--limit') ? parseInt(val('--limit'), 10) : Infinity
const ONLY_ID = val('--id')

if (!API_KEY) {
  console.error('✗ ANTHROPIC_API_KEY not set in environment. Aborting.')
  process.exit(1)
}

const SYSTEM = `Ты — редактор и SEO/GEO-специалист для русскоязычного блога Senior BI-аналитика Валерии Смирновой о дата-визуализации, дашбордах, BI и A/B-тестах.

Твоя задача: превратить сырой пост из Telegram в чистую веб-статью, которую (1) удобно читать в вебе, (2) хорошо находит поиск, (3) легко цитируют AI-системы (LLM-friendly).

Жёсткие правила:
- Язык статьи — русский. Тон — экспертный, спокойный, без инфоцыганщины и кликбейта.
- НЕ ВЫДУМЫВАЙ факты, цифры, имена и кейсы, которых нет в оригинале. Можно переструктурировать, прояснить и дополнить общими определениями по теме — но не фабриковать конкретику.
- Вычисти телеграм-мусор: "Please open Telegram to view this post", "VIEW IN TELEGRAM", хвостовые "@loving_bi", избыточные эмодзи, обрывки. На сайте стиль чище, чем в телеге, — это нормально.
- seoTitle: конкретный, поисковый, с ключевым термином по теме, до 60 символов.
- metaDescription: 140–160 символов, ёмко передаёт суть.
- summary: TL;DR в 1–2 предложениях, ставится в начало статьи.
- articleBody: массив блоков. Структура: 1–2 абзаца intro → подзаголовки h2 с абзацами → где уместно, блок практики ("Что сделать на практике") со списком → короткий вывод. Используй явные списки (ul), определения, шаги — это AI-native формат. Без эмодзи в заголовках.
- faq: 2–4 вопроса-ответа, релевантных теме поста (то, что реально спрашивают/гуглят).
- keywords: 5–8 русских ключевых фраз.

LinkedIn-черновики (linkedinRu / linkedinEn) по правилам:
- Структура: hook (1–2 строки) → контекст/проблема → 3–5 практических тезисов → мини-кейс/пример → CTA (вопрос или приглашение в Telegram @loving_bi / на сайт).
- linkedinEn — НЕ дословный перевод, а адаптация под тон LinkedIn.
- Меньше эмодзи, больше конкретики. Каждый вариант ~500–900 символов.

Верни результат ТОЛЬКО через инструмент save_enrichment.`

const TOOL = {
  name: 'save_enrichment',
  description: 'Сохранить переупакованную веб-версию поста и LinkedIn-черновики.',
  input_schema: {
    type: 'object',
    properties: {
      seoTitle: { type: 'string', description: 'SEO-заголовок, до 60 символов' },
      metaDescription: { type: 'string', description: 'Meta description, 140–160 символов' },
      summary: { type: 'string', description: 'TL;DR в 1–2 предложениях' },
      articleBody: {
        type: 'array',
        description: 'Блоки статьи по порядку',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['h2', 'p', 'ul'] },
            text: { type: 'string', description: 'Текст для h2 или p' },
            items: { type: 'array', items: { type: 'string' }, description: 'Пункты для ul' },
          },
          required: ['type'],
        },
      },
      faq: {
        type: 'array',
        items: {
          type: 'object',
          properties: { q: { type: 'string' }, a: { type: 'string' } },
          required: ['q', 'a'],
        },
      },
      keywords: { type: 'array', items: { type: 'string' } },
      linkedinRu: { type: 'string' },
      linkedinEn: { type: 'string' },
    },
    required: ['seoTitle', 'metaDescription', 'summary', 'articleBody', 'faq', 'keywords', 'linkedinRu', 'linkedinEn'],
  },
}

async function enrichPost(post) {
  const tag = (post.text || '').toLowerCase()
  const userMsg = `Рубрика/тема (автоопределение): ${post.tag || 'дата-визуализация'}
Дата: ${post.date || 'не указана'}

Сырой текст поста из Telegram:
"""
${post.text}
"""`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'save_enrichment' },
      messages: [{ role: 'user', content: userMsg }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 400)}`)
  }
  const data = await res.json()
  const toolUse = (data.content || []).find(c => c.type === 'tool_use')
  if (!toolUse) throw new Error('No tool_use in response: ' + JSON.stringify(data).slice(0, 300))
  return toolUse.input
}

async function main() {
  const posts = JSON.parse(readFileSync(DATA_URL, 'utf8'))

  let candidates = posts.filter(p => (p.text || '').trim().length >= 20)
  if (ONLY_ID) candidates = candidates.filter(p => p.id === ONLY_ID)
  if (!FORCE) candidates = candidates.filter(p => !p.ai)
  candidates = candidates.slice(0, LIMIT)

  console.log(`Model: ${MODEL}`)
  console.log(`Posts total: ${posts.length} | to enrich: ${candidates.length}${DRY ? ' (dry run)' : ''}`)

  let done = 0, failed = 0
  for (const post of candidates) {
    const titlePreview = (post.text.split('\n').find(l => l.trim()) || '').slice(0, 50)
    process.stdout.write(`  [${post.id}] ${titlePreview} … `)
    if (DRY) { console.log('skip (dry)'); continue }
    try {
      const ai = await enrichPost(post)
      ai.model = MODEL
      ai.generatedAt = new Date().toISOString()
      // mutate the original array element
      const idx = posts.findIndex(p => p.id === post.id)
      posts[idx].ai = ai
      writeFileSync(DATA_URL, JSON.stringify(posts, null, 2) + '\n', 'utf8')
      done++
      console.log(`ok (${ai.seoTitle.length}c title, ${ai.articleBody.length} blocks)`)
    } catch (e) {
      failed++
      console.log(`FAILED: ${e.message}`)
    }
  }

  console.log(`\nDone: ${done} enriched, ${failed} failed.`)
}

main().catch(e => { console.error(e); process.exit(1) })
