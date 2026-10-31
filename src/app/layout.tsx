import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/app/providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Streamora — Free customizable IPTV',
  description:
    'Streamora is a free, customizable IPTV streaming platform built on the public iptv-org catalog.',
  keywords: [
    'IPTV',
    'streamora',
    'free TV',
    'iptv-org',
    'live TV',
    'streaming',
  ],
  authors: [{ name: 'Streamora' }],
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    title: 'Streamora — Free customizable IPTV',
    description: 'Free, customizable TV from the iptv-org catalog.',
    siteName: 'Streamora',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Streamora — Free customizable IPTV',
    description: 'Free, customizable TV from the iptv-org catalog.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="bottom-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  )
}
