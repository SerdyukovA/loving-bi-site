import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
})

export const metadata: Metadata = {
  title: 'Любовь, BI и графики — канал Валерии Смирновой',
  description:
    'Канал Senior BI-аналитика Авито о дата-визуализации: реальные рабочие кейсы, авторские датавизы и советы по A/B-тестам, дашбордам и инфографике.',
  openGraph: {
    title: 'Любовь, BI и графики',
    description: 'Телеграм-канал Валерии Смирновой о дата-визуализации',
    type: 'website',
  },
}

// Replace YANDEX_METRIKA_ID with your real counter ID from metrika.yandex.ru
const YANDEX_METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || ''

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geistSans.variable} antialiased`}>
      <head>
        {YANDEX_METRIKA_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                ym(${YANDEX_METRIKA_ID}, "init", {
                  clickmap: true,
                  trackLinks: true,
                  accurateTrackBounce: true,
                  webvisor: true
                });
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-screen">
        {children}
        {YANDEX_METRIKA_ID && (
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`} style={{position:'absolute',left:'-9999px'}} alt="" />
            </div>
          </noscript>
        )}
      </body>
    </html>
  )
}
