import Image from 'next/image'

import { Logo } from '@/components/brand/Logo'

// Shared shell for /login and /login/otp: a branded photo panel (full
// left column on desktop, a short top banner on mobile) next to the
// actual form content passed in as children.
export function AuthShell({ children }: { children: React.ReactNode }) {
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
          <Logo variant="dark" />
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

      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">{children}</div>
    </div>
  )
}
