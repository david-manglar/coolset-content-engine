import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { NavHeader } from '@/components/nav-header'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Coolset Content Engine',
  description: 'Content production pipeline for Coolset',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} antialiased`}
      >
        <NavHeader />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
