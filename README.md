# lovingbi.ru

Сайт-спутник Telegram-канала [«Любовь, BI и графики»](https://t.me/loving_bi) Валерии Смирновой
и скилл для Claude «Дашборды и датавиз», собранный из постов канала.

- **Инструкция для Леры:** https://lovingbi.ru/guide/index.html (исходник — `public/guide/index.html`)
- **Скилл:** [`skill/skills/dataviz-dashboards/`](skill/skills/dataviz-dashboards/SKILL.md) — ставится в Claude Code как плагин:
  ```
  /plugin marketplace add SerdyukovA/loving-bi-site
  /plugin install dataviz-dashboards@loving-bi
  ```

## Как работает

Раз в сутки GitHub Actions (`.github/workflows/scrape.yml`):
1. забирает новые посты с `t.me/s/loving_bi` → `src/data/telegram-posts.json` + `public/tg-images/`;
2. Claude переупаковывает пост в статью для сайта и готовит черновики LinkedIn (RU + EN) — `scripts/enrich-seo.mjs`;
3. бот `@linkedin_loving_bi_bot` присылает черновики в Telegram — `scripts/notify-linkedin.mjs`;
4. коммит → Vercel сам пересобирает сайт.

## Локально

`npm install`, затем `npm run dev` → http://localhost:3000
