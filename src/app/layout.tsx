import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import YandexMetrika from '@/components/YandexMetrika'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://lovingbi.ru'),
  title: 'Любовь, BI и графики — канал Валерии Смирновой',
  description:
    'Канал Senior BI-аналитика Авито о дата-визуализации: реальные рабочие кейсы, авторские датавизы и советы по A/B-тестам, дашбордам и инфографике.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Любовь, BI и графики',
    description: 'Телеграм-канал Валерии Смирновой о дата-визуализации',
    url: 'https://lovingbi.ru',
    siteName: 'Любовь, BI и графики',
    locale: 'ru_RU',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen">
        {children}
        <YandexMetrika />
      </body>
    </html>
  )
}
