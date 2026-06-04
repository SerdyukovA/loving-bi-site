// Shared: append a consistent links footer to LinkedIn drafts.
// Links are added in code (not by the LLM) so URLs are always correct.

const BASE = 'https://lovingbi.ru'
const CHANNEL = 'https://t.me/loving_bi'

export function withFooter(text, postId, lang = 'ru') {
  const body = (text || '').trim()
  const footer =
    lang === 'en'
      ? `📖 Full breakdown: ${BASE}/tg/${postId}\n📲 Telegram channel «Любовь, BI и графики»: ${CHANNEL}`
      : `📖 Полный разбор на сайте: ${BASE}/tg/${postId}\n📲 Telegram-канал «Любовь, BI и графики»: ${CHANNEL}`
  return `${body}\n\n—\n${footer}`
}
