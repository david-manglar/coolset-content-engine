'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NavHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-[#060850]">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Coolset"
            width={100}
            height={20}
            className="h-5 w-auto brightness-0 invert"
            priority
          />
          <span className="text-sm font-medium text-white/60">Content Engine</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname === '/'
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/articles"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              pathname.startsWith('/articles')
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            Articles
          </Link>
        </nav>
      </div>
    </header>
  )
}
