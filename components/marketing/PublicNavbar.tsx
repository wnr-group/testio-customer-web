'use client'

// Logged-out navbar. On the landing page it floats transparent over the
// hero and goes solid on scroll; browse pages pass `solid` for a sticky,
// always-solid bar. Below 640px, Explore / Become a Cook move into a
// slide-out drawer — there's no room for them as inline text links there,
// and previously they simply disappeared with no mobile equivalent.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'

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
          : 'bg-transparent',
        'pt-[env(safe-area-inset-top,1rem)] md:pt-0'
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
            data-touch-target="nav-login"
            className="rounded-full bg-[#E8202A] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#c71821] sm:py-2"
          >
            Login
          </Link>

          <Sheet>
            <SheetTrigger
              data-touch-target="nav-hamburger"
              aria-label="Open menu"
              className="flex h-12 w-12 items-center justify-center rounded-full text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/5 sm:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>

            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left font-bold">Menu</SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 px-4">
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/explore"
                      data-touch-target="nav-drawer-explore"
                      className="block rounded-lg px-2 py-3.5 text-base font-semibold text-[#1A1A1A]/80 transition-colors hover:bg-[#1A1A1A]/5 hover:text-[#E8202A]"
                    />
                  }
                >
                  Explore
                </SheetClose>
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/#become-a-cook"
                      data-touch-target="nav-drawer-become-cook"
                      className="block rounded-lg px-2 py-3.5 text-base font-semibold text-[#1A1A1A]/80 transition-colors hover:bg-[#1A1A1A]/5 hover:text-[#E8202A]"
                    />
                  }
                >
                  Become a Cook
                </SheetClose>
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/login"
                      data-touch-target="nav-drawer-login"
                      className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#E8202A] px-6 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-[#c71821]"
                    />
                  }
                >
                  Login
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  )
}
