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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
