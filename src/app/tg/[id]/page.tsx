import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllTgPosts, getTag, formatDate } from '@/lib/tg-posts'

export async function generateStaticParams() {
  return getAllTgPosts().map(p => ({ id: p.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = getAllTgPosts().find(p => p.id === id)
  if (!post) return {}
  const title = post.text.split('\n').find(l => l.trim()) || `Пост #${id}`
  return {
    title: `${title} — Любовь, BI и графики`,
    description: post.text.slice(0, 160),
  }
}

function ImageGallery({ images }: { images: string[] }) {
  if (!images.length) return null
  const [first, ...rest] = images

  return (
    <div className="mb-8">
      {/* Main image */}
      <div className="rounded-2xl overflow-hidden bg-gray-100 mb-2">
        <img
          src={first}
          alt=""
          className="w-full object-cover max-h-[520px]"
        />
      </div>
      {/* Rest as grid */}
      {rest.length > 0 && (
        <div className={`grid gap-2 ${rest.length === 1 ? 'grid-cols-1' : rest.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {rest.map((src, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                    />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function renderText(text: string) {
  // Split into paragraphs, preserve line breaks
  return text
    .split('\n\n')
    .map((block, i) => {
      const lines = block.split('\n')
      return (
        <p key={i} className="text-gray-700 leading-relaxed text-base md:text-[17px] mb-5">
          {lines.map((line, j) => (
            <span key={j}>
              {line}
              {j < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      )
    })
}

export default async function TgPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const posts = getAllTgPosts()
  const post = posts.find(p => p.id === id)
  if (!post) notFound()

  const imgs = post.localImages?.length ? post.localImages : post.images
  const lines = post.text.split('\n').filter(l => l.trim())
  const title = lines[0] || `Пост #${post.id}`
  const bodyText = lines.slice(1).join('\n').trim()
  const tag = getTag(post.text)

  // Find prev/next posts
  const sorted = [...posts].sort((a, b) => parseInt(b.id) - parseInt(a.id))
  const idx = sorted.findIndex(p => p.id === id)
  const prev = sorted[idx + 1] ?? null
  const next = sorted[idx - 1] ?? null

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/#posts"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Все посты
          </Link>
          <a
            href="https://t.me/loving_bi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-white px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--teal)' }}
          >
            ✈️ @loving_bi
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)' }}
          >
            {tag}
          </span>
          {post.date && (
            <span className="text-sm text-gray-400">{formatDate(post.date)}</span>
          )}
          {post.views && (
            <span className="text-sm text-gray-400 flex items-center gap-1 ml-auto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {post.views}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-8">
          {title}
        </h1>

        {/* Images */}
        <ImageGallery images={imgs} />

        {/* Body */}
        {bodyText && (
          <article className="mb-10">
            {renderText(bodyText)}
          </article>
        )}

        {/* Reactions */}
        {post.reactions.length > 0 && (
          <div className="flex items-center gap-4 py-4 border-t border-b border-gray-100 mb-10">
            {post.reactions.map((r, i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm text-gray-500">
                <span className="text-base">{r.emoji}</span>
                <span>{r.count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Open in Telegram CTA */}
        <div
          className="rounded-2xl p-6 mb-12 flex items-center justify-between gap-4"
          style={{ background: 'var(--teal-light)' }}
        >
          <div>
            <div className="font-semibold text-gray-900 mb-1">Читать оригинал в Telegram</div>
            <div className="text-sm text-gray-500">Там можно оставить реакцию и написать комментарий</div>
          </div>
          <a
            href={post.tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: 'var(--teal)' }}
          >
            ✈️ Открыть
          </a>
        </div>

        {/* Author */}
        <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 mb-12">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'var(--teal-light)' }}
          >
            🥰
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">Валерия Смирнова</div>
            <div className="text-xs text-gray-400 mt-0.5">Senior BI-аналитик в Авито · <a href="https://t.me/mozzalerra" target="_blank" className="hover:underline" style={{ color: 'var(--teal-dark)' }}>@mozzalerra</a></div>
          </div>
          <Link
            href="/#collab"
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
          >
            Сотрудничество →
          </Link>
        </div>

        {/* Prev / Next */}
        <div className="grid grid-cols-2 gap-4">
          {prev ? (
            <Link
              href={`/tg/${prev.id}`}
              className="group p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="text-xs text-gray-400 mb-1.5">← Предыдущий</div>
              <div className="text-sm font-medium text-gray-700 line-clamp-2 group-hover:text-[var(--teal-dark)] transition-colors">
                {prev.text.split('\n').find(l => l.trim()) || `Пост #${prev.id}`}
              </div>
            </Link>
          ) : <div />}

          {next ? (
            <Link
              href={`/tg/${next.id}`}
              className="group p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-right"
            >
              <div className="text-xs text-gray-400 mb-1.5">Следующий →</div>
              <div className="text-sm font-medium text-gray-700 line-clamp-2 group-hover:text-[var(--teal-dark)] transition-colors">
                {next.text.split('\n').find(l => l.trim()) || `Пост #${next.id}`}
              </div>
            </Link>
          ) : <div />}
        </div>
      </main>
    </div>
  )
}
