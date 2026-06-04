#!/usr/bin/env node
/**
 * Send ready LinkedIn drafts (RU + EN) to Valeria via the Telegram bot.
 *
 * Sends drafts for posts that have `ai.linkedinRu` but no `ai.linkedinSentAt`
 * yet, then stamps `ai.linkedinSentAt` so each post is sent exactly once.
 * The scraper preserves the `ai` field across re-scrapes, so the flag persists.
 *
 * Usage:
 *   LOVINGBI_TG_BOT_TOKEN=... LOVINGBI_TG_CHAT_ID=... node scripts/notify-linkedin.mjs
 *   node scripts/notify-linkedin.mjs --baseline   # mark all current drafts as sent, WITHOUT sending (run once)
 *   node scripts/notify-linkedin.mjs --dry        # show what would be sent
 *   node scripts/notify-linkedin.mjs --limit N
 *
 * Backlog of old posts goes via LINKEDIN_DRAFTS.md, not the bot — that's what
 * --baseline is for: establish a "already handled" baseline so the bot only
 * fires for genuinely new posts going forward.
 */

import { readFileSync, writeFileSync } from 'node:fs'

const DATA_URL = new URL('../src/data/telegram-posts.json', import.meta.url)
const BASE = 'https://lovingbi.ru'
const TOKEN = process.env.LOVINGBI_TG_BOT_TOKEN
const CHAT = process.env.LOVINGBI_TG_CHAT_ID

const args = process.argv.slice(2)
const BASELINE = args.includes('--baseline')
const DRY = args.includes('--dry')
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity

if (!BASELINE && !DRY && (!TOKEN || !CHAT)) {
  console.error('✗ LOVINGBI_TG_BOT_TOKEN / LOVINGBI_TG_CHAT_ID not set. Aborting.')
  process.exit(1)
}

async function send(text, markdown = false) {
  const body = { chat_id: CHAT, text, disable_web_page_preview: false }
  if (markdown) body.parse_mode = 'Markdown'
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const j = await res.json()
  if (!j.ok) throw new Error(JSON.stringify(j).slice(0, 200))
  await new Promise(r => setTimeout(r, 400)) // be polite to the Bot API
}

async function sendDraft(post) {
  const ai = post.ai
  await send(`📝 Новый пост → LinkedIn-черновик\n\n«${ai.seoTitle}»\n\nНиже RU и EN — копируй нужный блок и постируй.`)
  await send('🇷🇺 RU\n```\n' + ai.linkedinRu.trim() + '\n```', true)
  await send('🇬🇧 EN\n```\n' + ai.linkedinEn.trim() + '\n```', true)
  await send(`🔗 Пост на сайте: ${BASE}/tg/${post.id}`)
}

async function main() {
  const posts = JSON.parse(readFileSync(DATA_URL, 'utf8'))
  let queue = posts
    .filter(p => p.ai?.linkedinRu && !p.ai.linkedinSentAt)
    .sort((a, b) => parseInt(a.id) - parseInt(b.id)) // oldest first
    .slice(0, LIMIT)

  console.log(`Pending drafts: ${queue.length}${BASELINE ? ' (baseline mode — marking as sent, NOT sending)' : ''}${DRY ? ' (dry run)' : ''}`)

  let sent = 0, failed = 0
  for (const post of queue) {
    const idx = posts.findIndex(p => p.id === post.id)
    const titlePreview = (post.ai.seoTitle || '').slice(0, 50)
    if (DRY) { console.log(`  would send [${post.id}] ${titlePreview}`); continue }
    if (BASELINE) {
      posts[idx].ai.linkedinSentAt = new Date().toISOString()
      writeFileSync(DATA_URL, JSON.stringify(posts, null, 2) + '\n', 'utf8')
      sent++
      continue
    }
    try {
      await sendDraft(post)
      posts[idx].ai.linkedinSentAt = new Date().toISOString()
      writeFileSync(DATA_URL, JSON.stringify(posts, null, 2) + '\n', 'utf8')
      sent++
      console.log(`  ✓ sent [${post.id}] ${titlePreview}`)
    } catch (e) {
      failed++
      console.log(`  ✗ FAILED [${post.id}]: ${e.message}`)
    }
  }

  console.log(BASELINE ? `\nBaselined ${sent} posts as already-sent.` : `\nDone: ${sent} sent, ${failed} failed.`)
}

main().catch(e => { console.error(e); process.exit(1) })
