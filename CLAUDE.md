@AGENTS.md

# lovingbi.ru — для Claude

Сайт-спутник Telegram-канала @loving_bi (Валерия Смирнова, Senior BI-аналитик) + скилл
`dataviz-dashboards`. Next.js 16 + React 19 + Tailwind, деплой на Vercel из `main`.
Репо публичное: секреты только в GitHub Secrets, в код и коммиты — никогда.

## Конвейер (`.github/workflows/scrape.yml`, раз в сутки ~09:00 UTC, бывает позже)
`scrape-telegram.mjs` → `enrich-seo.mjs` (Claude: SEO-статья, FAQ, `linkedinRu/En`) →
`notify-linkedin.mjs` (бот шлёт черновики) → commit → Vercel.

- ⚠️ Скрапер перезаписывает `src/data/telegram-posts.json` целиком и **обязан сохранять поле `ai`
  по id** — иначе обогащение стирается. Любая правка скрапера должна это сохранять.
- Файл переписывается только при изменении постов; просмотры/реакции — по понедельникам
  или Run workflow с `force=true`.
- `enrich-seo.mjs` флаги: `--id`, `--force`, `--dry`, `--linkedin-only`. Ссылки в LinkedIn-черновик
  добавляет код (`lib-linkedin.mjs`), не модель.
- Secrets: `ANTHROPIC_API_KEY`, `LOVINGBI_TG_BOT_TOKEN`, `LOVINGBI_TG_CHAT_ID`.

## Скилл
`skill/skills/dataviz-dashboards/` — плагин Claude Code (`.claude-plugin/marketplace.json` в корне).
Правило попадает в скилл только из поста канала или со слов Леры; источник — в `sources.md`.
При изменении — поднять `version` в `skill/.claude-plugin/plugin.json` и `SKILL.md`, строка в `CHANGELOG.md`.

## Инструкция для Леры
`public/guide/index.html` → https://lovingbi.ru/guide/index.html (noindex).

## Закрепление знаний (compounding)

В конце содержательной сессии один раз предложи «упаковать знания» (в заметку/правило/скилл); любые правки файлов делай только после явного ОК пользователя.
