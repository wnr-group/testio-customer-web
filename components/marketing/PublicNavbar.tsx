'use client'

// Logged-out navbar. On the landing page it floats transparent over the
// hero and goes solid on scroll; browse pages pass `solid` for a sticky,
// always-solid bar.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'

export function PublicNavbar({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (solid) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [solid])

  const isSolid = solid || scrolled

  return (
    <header
      className={cn(
        'top-0 z-50 w-full transition-all duration-300',
        solid ? 'sticky' : 'fixed',
        isSolid
          ? 'border-b border-[#1A1A1A]/5 bg-[#FFF9F2]/90 shadow-sm backdrop-blur-md'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="TESTIO home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3 md:gap-6">
          <Link
            href="/explore"
            className="hidden text-sm font-semibold text-[#1A1A1A]/70 transition-colors hover:text-[#E8202A] sm:block"
          >
            Explore
          </Link>
          <Link
            href="/#become-a-cook"
            className="hidden text-sm font-semibold text-[#1A1A1A]/70 transition-colors hover:text-[#E8202A] sm:block"
          >
            Become a Cook
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#E8202A] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#c71821]"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}
