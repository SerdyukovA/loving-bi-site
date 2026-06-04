'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

type LatestPost = { id: string; title: string; date: string }

// Correct Russian plural for "пост"
function postsLabel(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'пост в канале'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'поста в канале'
  return 'постов в канале'
}

// Subtle math symbols for background decoration
const MATH = ['∑', '∫', 'π', 'Δ', 'μ', 'σ', 'R²', '≥', '%', 'α', 'β', 'H₀']

export default function Hero({ postCount, latestPost }: { postCount: number; latestPost: LatestPost | null }) {
  const mathRef = useRef<HTMLDivElement>(null)

  const STATS = [
    { num: String(postCount), label: postsLabel(postCount) },
    { num: '1.4К', label: 'подписчиков' },
    { num: '8+', label: 'лет в аналитике' },
  ]

  const latestCardInner = latestPost && (
    <>
      <div
        className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
        style={{ color: 'var(--teal-dark)' }}
      >
        Последний пост
      </div>
      <div className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
        {latestPost.title}
      </div>
      {latestPost.date && <div className="text-xs text-gray-400 mt-2">{latestPost.date}</div>}
    </>
  )

  useEffect(() => {
    const el = mathRef.current
    if (!el) return
    // Animate each symbol with a slight delay
    const symbols = el.querySelectorAll<HTMLSpanElement>('.math-sym')
    symbols.forEach((sym, i) => {
      sym.style.animationDelay = `${i * 0.3}s`
    })
  }, [])

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F0FFFE 0%, #FFF8EE 55%, #F3F0FF 100%)',
        paddingTop: '64px',
      }}
    >
      {/* Math background */}
      <div ref={mathRef} className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {MATH.map((sym, i) => (
          <span
            key={i}
            className="math-sym absolute text-3xl font-light opacity-[0.06] animate-pulse"
            style={{
              left: `${(i * 37 + 5) % 95}%`,
              top: `${(i * 53 + 10) % 85}%`,
              color: i % 3 === 0 ? 'var(--teal)' : i % 3 === 1 ? 'var(--orange)' : 'var(--purple)',
              animationDuration: `${3 + (i % 4)}s`,
            }}
          >
            {sym}
          </span>
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="max-w-2xl">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)' }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: 'var(--teal)' }}
            />
            Телеграм-канал о дата-визуализации
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6 text-gray-900">
            Любовь,{' '}
            <span
              className="italic"
              style={{
                color: 'var(--teal-dark)',
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
              }}
            >
              BI
            </span>{' '}
            и графики
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-8 max-w-xl">
            Канал{' '}
            <a
              href="https://t.me/mozzalerra"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-700 hover:underline"
            >
              Валерии Смирновой
            </a>{' '}
            — Senior BI-аналитика в Авито. Реальные рабочие кейсы, авторские визуализации данных
            и советы о том, как делать графики честными и красивыми.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-12">
            <a
              href="https://t.me/loving_bi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: 'var(--teal)',
                boxShadow: '0 4px 14px rgba(27,188,179,0.35)',
              }}
            >
              ✈️ Открыть канал
            </a>
            <a
              href="#posts"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-700 text-sm bg-white border border-gray-200 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
            >
              📊 Смотреть посты
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-8 bg-gray-200" />}
                <div>
                  <div
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: 'var(--teal-dark)' }}
                  >
                    {s.num}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Latest post — mobile (in normal flow, photo is hidden here) */}
          {latestPost && (
            <Link
              href={`/tg/${latestPost.id}`}
              className="lg:hidden mt-8 block rounded-2xl p-4 border border-gray-100 bg-white/70 backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {latestCardInner}
            </Link>
          )}
        </div>

        {/* Author photo blended into the background */}
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[30rem] h-[30rem] pointer-events-none">
          {/* Soft multicolor glow that melts into the page background */}
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-70"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(27,188,179,0.40) 0%, rgba(244,161,53,0.30) 45%, rgba(139,92,246,0.28) 70%, transparent 78%)',
            }}
          />
          {/* Portrait in a soft circle with a gentle float */}
          <div
            className="absolute inset-10 rounded-full overflow-hidden shadow-2xl ring-1 ring-white/60"
            style={{ animation: 'floaty 7s ease-in-out infinite' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lera.jpg"
              alt="Валерия Смирнова"
              className="w-full h-full object-cover"
            />
            {/* Subtle vignette to feather edges into the glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: 'inset 0 0 50px 14px rgba(255,248,238,0.40)' }}
            />
          </div>
        </div>

        {/* Latest post — desktop glass card near the photo */}
        {latestPost && (
          <Link
            href={`/tg/${latestPost.id}`}
            className="hidden lg:block absolute right-2 bottom-12 z-20 w-72 rounded-2xl p-4 border border-white/60 shadow-xl backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.72)' }}
          >
            {latestCardInner}
          </Link>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-300">
        <div className="text-xs font-medium tracking-wider uppercase">Скролл</div>
        <div
          className="w-0.5 h-8 animate-pulse rounded-full"
          style={{ background: 'var(--teal)' }}
        />
      </div>
    </section>
  )
}
