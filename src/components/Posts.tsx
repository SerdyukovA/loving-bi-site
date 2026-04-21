'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type TgPost, getTag, formatDate } from '@/lib/tg-utils'

type Props = { posts: TgPost[] }

const TAGS = ['Все', 'Датавиз', 'A/B-тесты', 'SQL', 'Дашборды', 'Советы', 'Проекты']

function ImageGrid({ images }: { images: string[] }) {
  const show = images.slice(0, 4)
  const count = show.length
  const cls =
    count === 1 ? 'count-1' :
    count === 2 ? 'count-2' :
    count === 3 ? 'count-3' : 'count-4'

  return (
    <div className={`post-images-grid ${cls}`}>
      {show.map((src, i) => (
        <div key={i} className="post-img-wrap">
          <img
            src={src}
            alt=""
            className="post-img"
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      ))}
    </div>
  )
}

function PostCard({ post }: { post: TgPost }) {
  const imgs = post.localImages?.length ? post.localImages : post.images
  const hasImages = imgs.length > 0
  const tag = getTag(post.text)
  const lines = post.text.split('\n').filter(l => l.trim())
  const title = lines[0] || `Пост #${post.id}`
  const body = lines.slice(1).join('\n').trim()
  const cover = imgs[0]

  return (
    <Link
      href={`/tg/${post.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
    >
      {/* Cover image — only for posts that actually have images */}
      {hasImages && cover && (
        <div className="overflow-hidden aspect-[16/9] bg-gray-50 flex-shrink-0">
          <img
            src={cover}
            alt=""
            className="post-img w-full h-full object-cover"
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none' }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Tag + date — for text-only posts also show small channel avatar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)' }}
          >
            {tag}
          </span>
          <div className="flex items-center gap-2">
            {!hasImages && (
              <img
                src="/tg-images/channel-avatar.jpg"
                alt="Канал"
                width={24}
                height={24}
                className="rounded-full object-cover flex-shrink-0 opacity-70"
                style={{ width: 24, height: 24 }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            {post.date && (
              <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[var(--teal-dark)] transition-colors">
          {title}
        </h3>

        {/* Body preview */}
        {body && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">
            {body}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3">
            {post.reactions.slice(0, 3).map((r, i) => (
              <span key={i} className="text-xs text-gray-500 flex items-center gap-1">
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </span>
            ))}
          </div>
          {post.views && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {post.views}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Posts({ posts }: Props) {
  const [activeTag, setActiveTag] = useState('Все')
  const [visibleCount, setVisibleCount] = useState(12)

  // Sort newest first
  const sorted = [...posts].sort((a, b) => parseInt(b.id) - parseInt(a.id))

  const filtered = activeTag === 'Все'
    ? sorted
    : sorted.filter(p => getTag(p.text) === activeTag)

  const visible = filtered.slice(0, visibleCount)

  function handleTagClick(tag: string) {
    setActiveTag(tag)
    setVisibleCount(12)
  }

  return (
    <section id="posts" className="py-24" style={{ background: '#F7F7F5' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--teal-dark)' }}>
            Телеграм-канал
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              Посты из канала
            </h2>
            <a
              href="https://t.me/loving_bi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold"
              style={{ color: 'var(--teal-dark)' }}
            >
              Все посты в Телеграме →
            </a>
          </div>
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
                activeTag === tag
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              style={activeTag === tag ? { background: 'var(--teal)', borderColor: 'var(--teal)' } : {}}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <div className="font-medium">Постов в этой категории пока нет</div>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {visibleCount < filtered.length && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setVisibleCount(v => v + 9)}
                  className="px-8 py-3 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-gray-300 bg-white transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  Показать ещё ({filtered.length - visibleCount})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
