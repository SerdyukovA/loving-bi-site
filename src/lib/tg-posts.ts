// Server-only: reads posts from disk. Do NOT import in 'use client' components.
import { readFileSync } from 'fs'
import { join } from 'path'
import type { TgPost } from './tg-utils'

export type { TgPost }
export { getTag, formatDate } from './tg-utils'

export function getAllTgPosts(): TgPost[] {
  try {
    const raw = readFileSync(join(process.cwd(), 'src/data/telegram-posts.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}
