'use client'

import { useEffect, useState } from 'react'
import { LINKEDIN_URL } from '@/lib/social'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="font-bold text-sm tracking-tight" style={{ color: 'var(--teal-dark)' }}>
          Любовь, BI и графики
        </a>
        <div className="hidden md:flex items-center gap-7">
          <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            Об авторе
          </a>
          <a href="#posts" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            Посты
          </a>
          <a href="#collab" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            Сотрудничество
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer me"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            LinkedIn
          </a>
          <a
            href="https://t.me/loving_bi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: 'var(--teal)' }}
          >
            Подписаться ✈️
          </a>
        </div>
        {/* Mobile CTA */}
        <div className="md:hidden flex items-center gap-3">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer me"
            className="text-sm font-medium text-gray-500"
          >
            LinkedIn
          </a>
          <a
            href="https://t.me/loving_bi"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden text-sm font-semibold text-white px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--teal)' }}
          >
            ✈️ Канал
          </a>
        </div>
      </div>
    </nav>
  )
}
