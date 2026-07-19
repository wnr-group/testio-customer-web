import { cn } from '@/lib/utils'

// Flat SVG recreation of the TESTIO brand mark: yellow tile, red rooster
// comb, white T. Hand-built so it works at any size on light or dark.
type LogoProps = {
  variant?: 'light' | 'dark'
  withWordmark?: boolean
  className?: string
}

export function Logo({ variant = 'light', withWordmark = true, className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="TESTIO"
      className={cn('inline-flex select-none items-center gap-2', className)}
    >
      <svg viewBox="0 0 64 64" aria-hidden className="h-9 w-9 shrink-0">
        <rect x="2" y="6" width="60" height="56" rx="16" fill="#F5A623" />
        {/* rooster comb */}
        <path
          d="M18 22 C16 11 24 8 27 15 C28 5 37 5 38 13 C42 6 49 9 47 20 L44 24 H21 Z"
          fill="#E8202A"
        />
        {/* T */}
        <path d="M15 26 h34 v10 h-12 v20 h-10 V36 H15 Z" fill="#FFFFFF" />
      </svg>
      {withWordmark && (
        <span
          className={cn(
            'text-xl font-extrabold leading-none tracking-tight',
            variant === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
          )}
        >
          TESTIO
        </span>
      )}
    </span>
  )
}
