import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'

import { Logo } from '@/components/brand/Logo'

// Shared shell for /login and /login/otp: a branded photo panel (full
// left column on desktop, a short top banner on mobile) next to the
// actual form content passed in as children.
export function AuthShell({
  children,
  closeHref = '/',
}: {
  children: React.ReactNode
  closeHref?: string
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white md:flex-row">
      <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-52 md:h-auto md:w-[44%] lg:w-[40%]">
        <Image
          src="/marketing/auth-backdrop.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 44vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 md:bg-gradient-to-br md:from-black/15 md:via-black/45 md:to-black/85" />
        <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-10">
          <Link href={closeHref} aria-label="Back to TESTIO">
            <Logo variant="dark" />
          </Link>
          <div className="hidden md:block">
            <p className="max-w-xs text-2xl font-extrabold leading-tight text-white lg:text-3xl">
              Homemade. Hyperlocal. Made by your neighbours.
            </p>
            <p className="mt-3 max-w-xs text-sm text-white/70">
              Real home cooks, real recipes — fresh from kitchens near you.
            </p>
          </div>
        </div>
      </div>

      <div className="relative isolate flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full bg-[#F5A623]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 -z-10 h-96 w-96 rounded-full bg-[#E8202A]/15 blur-3xl" />
        <Link
          href={closeHref}
          aria-label="Close and go back to TESTIO"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-md ring-1 ring-slate-100 transition-colors hover:bg-slate-50 hover:text-slate-800 sm:right-6 sm:top-6"
        >
          <X className="h-5 w-5" />
        </Link>
        {children}
      </div>
    </div>
  )
}
