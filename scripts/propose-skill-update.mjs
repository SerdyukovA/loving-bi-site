#!/usr/bin/env node
/**
 * Self-update of the dataviz-dashboards skill from new Telegram posts.
 *
 * For every post that has `ai` but no `ai.skillCheckedAt`, sends Claude the post
 * text + its images + the current skill (skill/skills/dataviz-dashboards/**), and asks:
 * is there a new rule or a contradiction with the skill?
 *   - nothing new  → stamp `ai.skillCheckedAt`, done;
 *   - something    → branch `skill/post-<id>` from the current HEAD with surgical edits
 *                    (+ a row in sources.md, + CHANGELOG entry, + patch version bump),
 *                    open a PR, send Lera the link via the bot, stamp `ai.skillCheckedAt`
 *                    and `ai.skillPr`.
 * The scraper preserves `ai` by id, so the stamp survives re-scrapes.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo \
 *   LOVINGBI_TG_BOT_TOKEN=... LOVINGBI_TG_CHAT_ID=... node scripts/propose-skill-update.mjs
 *   --baseline     mark all current posts as checked WITHOUT calling Claude (run once)
 *   --id ID        only this post
 *   --force        ignore the skillCheckedAt stamp (for manual reruns)
 *   --dry          call Claude and print the verdict + edits, no git / PR / bot / stamp
 *   --limit N
 *
 * Secrets are read only from the environment.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DATA = join(ROOT, 'src/data/telegram-posts.json')
const SKILL_DIR = 'skill/skills/dataviz-dashboards'
const PLUGIN_JSON = 'skill/.claude-plugin/plugin.json'
const MODEL = process.env.SKILL_MODEL || 'claude-opus-5-5'
const MAX_ATTEMPTS = 3

const args = process.argv.slice(2)
const has = f => args.includes(f)
const val = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined }
const BASELINE = has('--baseline')
const DRY = has('--dry')
const FORCE = has('--force')
const ONLY_ID = val('--id')
const LIMIT = val('--limit') ? parseInt(val('--limit'), 10) : Infinity

const env = process.env
if (!BASELINE && !env.ANTHROPIC_API_KEY) { console.error('✗ ANTHROPIC_API_KEY not set'); process.exit(1) }
if (!BASELINE && !DRY && (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY)) {
  console.error('✗ GITHUB_TOKEN / GITHUB_REPOSITORY not set (needed to open PRs)'); process.exit(1)
}

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

// ---------- skill snapshot ----------
function listFiles(dir) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [])
}
function skillSnapshot() {
  return listFiles(SKILL_DIR).sort().map(p =>
    `<file path="${relative(SKILL_DIR, p)}">\n${readFileSync(join(ROOT, p), 'utf8')}\n</file>`
  ).join('\n\n')
}

// ---------- Claude ----------
const SYSTEM = `Ты поддерживаешь скилл Claude «dataviz-dashboards» — метод проектирования дашбордов и датавиза Валерии Смирновой (Senior BI-аналитик, канал @loving_bi). Скилл собран из её постов; каждое правило ссылается на id поста в sources.md.

Тебе дают ОДИН новый пост канала (текст + картинки-карточки) и текущий скилл целиком. Реши, добавляет ли пост в скилл что-то, чего там нет:
- новое правило, приём, исключение, чек-пункт или пример, который меняет то, как Claude спроектирует или прожарит дашборд;
- противоречие или уточнение существующего правила (тогда правь само правило, а не добавляй второе рядом).

Отвечай verdict="nothing", если пост — мем, анонс, опрос, личное, реклама, SQL, или всё его содержание уже есть в скилле (пусть другими словами). Повтор уже известного — это "nothing". Лучше пропустить слабое, чем засорить скилл: Валерия будет читать каждый PR.

Если verdict="update":
- Правки хирургические: минимальные вставки/замены в тот файл, где тема уже живёт (references/<тема>.md; SKILL.md — только если это меняет порядок работы). Держи стиль файла: язык, формат списков, длину пунктов, ссылки вида (пост <id>).
- Каждая правка — пара oldText → newText. oldText — точный фрагмент текущего файла (дословно, с пробелами), встречающийся в файле РОВНО ОДИН раз; достаточно 1–3 строк. newText — этот же фрагмент с изменением. Для добавления в конец файла оставь oldText пустым.
- Новый файл в references/ — только если тема правда новая; тогда oldText пустой, а путь новый, и добавь ссылку на него в SKILL.md отдельной правкой.
- НЕ трогай sources.md и CHANGELOG.md — их обновит скрипт по полям sourcesTopic/sourcesWhere/summary.
- Не выдумывай: только то, что есть в посте или на карточках.
- quote — дословная цитата из поста или с карточки (1–3 предложения), на которой держится правка.

Верни ответ только через инструмент skill_update.`

const TOOL = {
  name: 'skill_update',
  description: 'Вердикт по посту и (если есть что взять) правки скилла.',
  input_schema: {
    type: 'object',
    properties: {
      verdict: { type: 'string', enum: ['nothing', 'update'] },
      reason: { type: 'string', description: '1–2 предложения: почему nothing или что именно нового' },
      summary: { type: 'string', description: 'Для update: одна строка для CHANGELOG и заголовка PR, что добавлено/изменено' },
      quote: { type: 'string', description: 'Для update: дословная цитата из поста/карточки' },
      sourcesTopic: { type: 'string', description: 'Для update: тема поста в 2–5 слов для таблицы sources.md' },
      sourcesWhere: { type: 'string', description: 'Для update: куда вошло, в стиле sources.md, напр. "ab-tests, roast-checklist"' },
      edits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Путь внутри скилла, напр. references/ab-tests.md или SKILL.md' },
            oldText: { type: 'string' },
            newText: { type: 'string' },
          },
          required: ['path', 'oldText', 'newText'],
        },
      },
    },
    required: ['verdict', 'reason'],
  },
}

function imageBlocks(post) {
  const out = []
  for (const rel of post.localImages || []) {
    const p = join(ROOT, 'public', rel)
    if (!existsSync(p)) continue
    const ext = rel.split('.').pop().toLowerCase()
    const media_type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    out.push({ type: 'image', source: { type: 'base64', media_type, data: readFileSync(p).toString('base64') } })
  }
  return out.slice(0, 10)
}

async function askClaude(post) {
  const content = [
    { type: 'text', text: `Текущий скилл:\n\n${skillSnapshot()}` },
    ...imageBlocks(post),
    { type: 'text', text: `Новый пост #${post.id} (${post.date || 'без даты'}), ${post.localImages?.length || 0} карточек выше.\n\nТекст поста:\n"""\n${post.text}\n"""` },
  ]
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 8000, system: SYSTEM,
      // forced tool_choice isn't supported on every model → auto + instruction in SYSTEM
      tools: [TOOL], tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`)
  const data = await res.json()
  const t = (data.content || []).find(c => c.type === 'tool_use')
  if (!t) throw new Error('No tool_use: ' + JSON.stringify(data).slice(0, 300))
  return t.input
}

// ---------- applying edits ----------
function applyEdits(dir, edits) {
  for (const e of edits) {
    const rel = e.path.replace(/^\/+/, '').replace(/^skill\/skills\/dataviz-dashboards\//, '')
    if (rel.includes('..') || !rel.endsWith('.md') || /^(sources|CHANGELOG)\.md$/.test(rel)) throw new Error(`bad path: ${e.path}`)
    const p = join(dir, SKILL_DIR, rel)
    const cur = existsSync(p) ? readFileSync(p, 'utf8') : ''
    let next
    if (!e.oldText) next = cur ? cur.replace(/\n*$/, '\n') + e.newText.replace(/\n*$/, '\n') : e.newText.replace(/\n*$/, '\n')
    else {
      const n = cur.split(e.oldText).length - 1
      if (n !== 1) throw new Error(`oldText found ${n}× in ${rel}: «${e.oldText.slice(0, 60)}»`)
      next = cur.replace(e.oldText, () => e.newText)
    }
    writeFileSync(p, next, 'utf8')
  }
}

function bumpPatch(dir) {
  const p = join(dir, PLUGIN_JSON)
  const raw = readFileSync(p, 'utf8')
  const [a, b, c] = JSON.parse(raw).version.split('.').map(Number)
  const version = `${a}.${b}.${c + 1}`
  // replace in place — keep the file's own formatting (diff = one line)
  writeFileSync(p, raw.replace(/("version"\s*:\s*")[^"]+(")/, `$1${version}$2`), 'utf8')
  return version
}

function addSourcesRow(dir, post, r) {
  const p = join(dir, SKILL_DIR, 'sources.md')
  const lines = readFileSync(p, 'utf8').split('\n')
  const lastRow = lines.reduce((acc, l, i) => (/^\| \d+ \|/.test(l) ? i : acc), -1)
  const row = `| ${post.id} | ${(post.date || '').slice(0, 10)} | ${r.sourcesTopic || '—'} | ${r.sourcesWhere || '—'} |`
  lines.splice(lastRow + 1, 0, row)
  writeFileSync(p, lines.join('\n'), 'utf8')
}

function addChangelog(dir, version, post, r) {
  const p = join(dir, SKILL_DIR, 'CHANGELOG.md')
  const cur = readFileSync(p, 'utf8')
  const entry = `## ${version} — ${new Date().toISOString().slice(0, 10)}\n${r.summary} (пост ${post.id}, предложено автоматически).\n\n`
  writeFileSync(p, cur.replace(/^(# Changelog\n+)/, `$1${entry}`), 'utf8')
}

// ---------- GitHub + bot ----------
async function gh(path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GitHub ${path} HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`)
  return body
}

async function notify(text) {
  if (!env.LOVINGBI_TG_BOT_TOKEN || !env.LOVINGBI_TG_CHAT_ID) { console.log('    (bot secrets not set — skip message)'); return }
  const res = await fetch(`https://api.telegram.org/bot${env.LOVINGBI_TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.LOVINGBI_TG_CHAT_ID, text, disable_web_page_preview: true }),
  })
  const j = await res.json()
  if (!j.ok) throw new Error('bot: ' + JSON.stringify(j).slice(0, 200))
}

function prBody(post, r, version) {
  const quote = (r.quote || '').split('\n').map(l => `> ${l}`).join('\n')
  return `Пост: https://lovingbi.ru/tg/${post.id} · [в Telegram](${post.tgUrl})

**Что меняется:** ${r.summary}

**Почему:** ${r.reason}

**Цитата из поста:**
${quote}

Версия скилла → ${version}, строка в \`sources.md\` добавлена.

---
Как ответить: **Merge** — принять, **Close** — отклонить, комментарий в PR — что поправить (правку сделает Claude Code по твоей просьбе или Алексей).
Предложено автоматически скриптом \`scripts/propose-skill-update.mjs\`.`
}

async function openPr(post, r) {
  const branch = `skill/post-${post.id}`
  const existing = await gh(`/pulls?state=all&head=${env.GITHUB_REPOSITORY.split('/')[0]}:${encodeURIComponent(branch)}`)
  if (existing.length) { console.log(`    PR already exists: ${existing[0].html_url}`); return { url: existing[0].html_url, fresh: false } }

  const wt = mkdtempSync(join(tmpdir(), `skill-${post.id}-`))
  git(ROOT, 'worktree', 'add', '-B', branch, wt, 'HEAD')
  try {
    applyEdits(wt, r.edits || [])
    addSourcesRow(wt, post, r)
    const version = bumpPatch(wt)
    addChangelog(wt, version, post, r)
    git(wt, 'add', '-A', 'skill')
    git(wt, '-c', 'user.name=github-actions[bot]', '-c', 'user.email=github-actions[bot]@users.noreply.github.com',
      'commit', '-m', `skill: ${r.summary} (пост ${post.id})`)
    git(wt, 'push', '--force', 'origin', `${branch}:refs/heads/${branch}`)
    const base = (await gh('')).default_branch
    const pr = await gh('/pulls', { method: 'POST', body: JSON.stringify({
      title: `Скилл: ${r.summary} (пост ${post.id})`, head: branch, base, body: prBody(post, r, version),
    }) })
    return { url: pr.html_url, fresh: true }
  } finally {
    git(ROOT, 'worktree', 'remove', '--force', wt)
  }
}

// ---------- main ----------
async function main() {
  const posts = JSON.parse(readFileSync(DATA, 'utf8'))
  const save = () => writeFileSync(DATA, JSON.stringify(posts, null, 2) + '\n', 'utf8')

  let queue = posts.filter(p => p.ai)
  if (ONLY_ID) queue = queue.filter(p => p.id === ONLY_ID)
  if (!FORCE) queue = queue.filter(p => !p.ai.skillCheckedAt && (p.ai.skillCheckAttempts || 0) < MAX_ATTEMPTS)
  queue = queue.sort((a, b) => parseInt(a.id) - parseInt(b.id)).slice(0, LIMIT)
  console.log(`Model: ${MODEL} | to check: ${queue.length}${BASELINE ? ' (baseline — stamping only)' : ''}${DRY ? ' (dry)' : ''}`)

  let prs = 0, nothing = 0, failed = 0
  for (const post of queue) {
    if (BASELINE) { post.ai.skillCheckedAt = new Date().toISOString(); post.ai.skillVerdict = 'baseline'; continue }
    process.stdout.write(`  [${post.id}] ${(post.ai.seoTitle || '').slice(0, 50)} … `)
    try {
      const noContent = !(post.text || '').trim() && !(post.localImages || []).length
      const r = noContent ? { verdict: 'nothing', reason: 'пустой пост' } : await askClaude(post)
      console.log(`${r.verdict}: ${r.reason}`)
      if (DRY) { if (r.verdict === 'update') console.log(JSON.stringify(r, null, 2)); continue }
      if (r.verdict === 'update' && r.edits?.length) {
        const { url, fresh } = await openPr(post, r)
        post.ai.skillPr = url
        console.log(`    PR: ${url}`)
        if (fresh) {
          await notify(`🧠 Пост ${post.id} добавляет в скилл «Дашборды»: ${r.summary}\n\nПосмотри и прими или отклони: ${url}`)
            .catch(e => console.log(`    bot failed: ${e.message}`))
        }
        prs++
      } else nothing++
      post.ai.skillCheckedAt = new Date().toISOString()
      post.ai.skillVerdict = r.verdict
      delete post.ai.skillCheckAttempts
      save()
    } catch (e) {
      failed++
      if (!DRY) { post.ai.skillCheckAttempts = (post.ai.skillCheckAttempts || 0) + 1; save() }
      console.log(`FAILED (attempt ${post.ai.skillCheckAttempts}/${MAX_ATTEMPTS}): ${e.message}`)
    }
  }
  if (BASELINE) save()
  console.log(BASELINE ? `\nBaselined ${queue.length} posts.` : `\nDone: ${prs} PR, ${nothing} nothing, ${failed} failed.`)
}

main().catch(e => { console.error(e); process.exit(1) })
