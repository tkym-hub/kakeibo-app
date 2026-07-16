import type { Metadata, Viewport } from 'next'
import { Newsreader, Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/service-worker-register'

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
})

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-noto-serif-jp",
})

export const metadata: Metadata = {
  title: '家計簿 | シンプルな家計管理',
  description: 'シンプルで使いやすい家計簿アプリ。収支管理をもっと簡単に。',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '家計簿',
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f5f5f3',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${newsreader.variable} ${notoSerifJP.variable} font-sans antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
