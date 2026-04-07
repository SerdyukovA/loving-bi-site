# loving_bi site MVP

Сайт принимает посты из n8n через webhook и показывает их:

- список постов на `/`
- детальная страница на `/posts/[slug]`

## 1) Локальный запуск

```bash
cp .env.example .env.local
npm run dev
```

Открой `http://localhost:3000`.

## 2) Обязательная настройка секрета

В `.env.local` задай:

```bash
INGEST_SECRET=leshaleratest
```

Тот же секрет укажи в n8n в заголовке `X-Webhook-Secret`.

## 3) Endpoint для n8n

`POST /api/inbound/telegram`

Заголовки:

- `Content-Type: application/json`
- `X-Webhook-Secret: leshaleratest`

Body JSON:

```json
{
  "source_post_id": "129",
  "channel_username": "loving_bi",
  "raw_text": "Текст поста из Telegram",
  "published_at_unix": 1774293942
}
```

Успешный ответ:

```json
{
  "ok": true,
  "post": {
    "id": "...",
    "slug": "..."
  }
}
```

## 4) Минимальная настройка n8n

После ноды `If (true)` добавь `HTTP Request`:

- Method: `POST`
- URL: `http://localhost:3000/api/inbound/telegram` (локально)
- Headers:
  - `X-Webhook-Secret: <INGEST_SECRET>`
- Send body as JSON:
  - `source_post_id`: `{{$json.source_post_id}}`
  - `channel_username`: `{{$json.channel_username}}`
  - `raw_text`: `{{$json.raw_text}}`
  - `published_at_unix`: `{{$json.published_at_unix}}`

## 5) Где хранятся посты

Локальное хранилище: `data/posts.json`.

Для следующего этапа можно заменить на БД (Supabase/Postgres) без изменения n8n payload.
