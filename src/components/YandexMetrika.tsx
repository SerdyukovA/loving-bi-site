'use client'

import { useEffect } from 'react'

const ID = 108696342

export default function YandexMetrika() {
  useEffect(() => {
    // Standard Yandex Metrika initialization — queue must be set up before tag.js loads
    // @ts-expect-error ym global
    window.ym = window.ym || function(...args: unknown[]) {
      // @ts-expect-error ym queue
      ;(window.ym.a = window.ym.a || []).push(args)
    }
    // @ts-expect-error ym global
    window.ym.l = Date.now()

    const script = document.createElement('script')
    script.src = 'https://mc.yandex.ru/metrika/tag.js'
    script.async = true
    document.head.appendChild(script)

    // @ts-expect-error ym global
    window.ym(ID, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    })
  }, [])

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://mc.yandex.ru/watch/${ID}`}
        style={{ position: 'absolute', left: '-9999px' }}
        alt=""
      />
    </noscript>
  )
}
