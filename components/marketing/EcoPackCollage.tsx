import Image from 'next/image'
import { cn } from '@/lib/utils'

// The packaging visual. Renders an illustrated collage of moulded-fibre
// containers from CSS + inline SVG so the section ships without waiting on
// product photography. Pass `photo` to swap in a real shot — it fills the
// identical box, so nothing else moves.

function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M20 4C10 4 4 9 4 16c0 2 .6 3.4 1.4 4.4C8 16 12 13 17 11.6 12.6 14 9 17.4 7.4 21.4c1 .4 2 .6 3.1.6 6 0 9.5-5 9.5-12 0-2.4-.3-4.4 0-6Z"
        fill="currentColor"
      />
    </svg>
  )
}

// One container: a rounded fibre shell with a paper band across it.
function Container({ className, band = true }: { className?: string; band?: boolean }) {
  return (
    <div
      className={cn(
        'relative rounded-pack bg-gradient-to-br from-fibre-light via-fibre-mid to-fibre-dark shadow-float ring-1 ring-fibre-dark/30',
        className
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-pack opacity-25 [background-image:repeating-linear-gradient(115deg,rgb(255_255_255_/_0.55)_0_2px,transparent_2px_7px)]"
      />
      <span aria-hidden className="absolute inset-x-2 top-1.5 h-1.5 rounded-full bg-paper/45" />
      {band && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-1/2 flex h-9 -translate-y-1/2 items-center justify-center bg-paper shadow-card"
        >
          <LeafMark className="size-4 text-green-deep" />
        </span>
      )}
    </div>
  )
}

export function EcoPackCollage({
  photo,
  className,
}: {
  photo?: { src: string; alt: string }
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-frame bg-gradient-to-br from-cream-deep via-cream to-cream-deep ring-1 ring-text-primary/5',
        className
      )}
    >
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1024px) 46vw, 92vw"
          className="object-cover"
        />
      ) : (
        <>
          <span
            aria-hidden
            className="absolute -left-10 -top-10 size-48 rounded-full bg-green-deep/10 blur-2xl"
          />
          <span
            aria-hidden
            className="absolute -bottom-12 -right-8 size-56 rounded-full bg-brand-secondary/20 blur-2xl"
          />

          <LeafMark className="absolute left-[6%] top-[10%] size-10 -rotate-12 text-green-deep/35" />
          <LeafMark className="absolute right-[8%] top-[16%] size-8 rotate-[25deg] text-green-deep/25" />
          <LeafMark className="absolute bottom-[10%] left-[16%] size-9 rotate-[160deg] text-green-deep/30" />

          {/* the cluster — percentage-positioned so it scales with the box */}
          <Container className="absolute left-[8%] top-[26%] h-[26%] w-[34%]" />
          <Container className="absolute right-[9%] top-[20%] h-[30%] w-[32%]" />
          <Container className="absolute left-[30%] top-[44%] h-[34%] w-[42%]" />
          <Container className="absolute bottom-[9%] left-[6%] h-[22%] w-[28%]" band={false} />
          <Container className="absolute bottom-[11%] right-[7%] h-[24%] w-[30%]" band={false} />

          <span
            aria-hidden
            className="absolute inset-x-[10%] bottom-[5%] h-4 rounded-full bg-fibre-dark/25 blur-md"
          />
        </>
      )}
    </div>
  )
}
