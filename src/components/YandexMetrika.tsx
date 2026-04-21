'use client'

import { useEffect } from 'react'

const ID = '10808342'

export default function YandexMetrika() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://mc.yandex.ru/metrika/tag.js'
    script.async = true
    script.onload = () => {
      // @ts-expect-error ym is injected by metrika
      window.ym(ID, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
      })
    }
    document.head.appendChild(script)
  }, [])

  return (
    <noscript>
      <img
        src={`https://mc.yandex.ru/watch/${ID}`}
        style={{ position: 'absolute', left: '-9999px' }}
        alt=""
      />
    </noscript>
  )
}
