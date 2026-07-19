'use client'

// Full-viewport pinned hero. Headline lines rise in, the rooster-comb
// underline draws itself under "Homemade.", and four dish photos parallax
// at different speeds while the section is pinned and scrubbed.

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap, useGSAP } from '@/lib/gsap'
import { hero, heroDishes } from '@/lib/marketing-content'

const DISH_LAYOUT = [
  { className: 'left-[4%] top-[16%] w-28 md:w-44 rotate-[-6deg]', speed: 1.4 },
  { className: 'right-[6%] top-[20%] w-24 md:w-40 rotate-[5deg]', speed: 1.0 },
  { className: 'left-[10%] bottom-[10%] w-24 md:w-36 rotate-[4deg]', speed: 0.7 },
  { className: 'right-[12%] bottom-[14%] w-28 md:w-44 rotate-[-5deg]', speed: 1.2 },
]

export function Hero() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Comb underline draws on after the headline rises in.
        const path = ref.current!.querySelector<SVGPathElement>('[data-comb] path')
        if (path) {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.7 })
        }
        gsap.from('[data-hero-line]', {
          yPercent: 110,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        })
        gsap.from('[data-hero-sub], [data-hero-cta]', {
          y: 24,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.5,
          ease: 'power2.out',
        })
        gsap.from('[data-dish]', {
          scale: 0.6,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          delay: 0.3,
          ease: 'back.out(1.6)',
        })

        // Pinned scrub: dishes drift up at different speeds, copy eases back.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: '+=70%',
            scrub: true,
            pin: true,
          },
        })
        gsap.utils.toArray<HTMLElement>('[data-dish]').forEach((el) => {
          tl.to(el, { y: -Number(el.dataset.speed) * 260, ease: 'none' }, 0)
        })
        tl.to('[data-hero-copy]', { y: -80, ease: 'none' }, 0)
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from(ref.current, { opacity: 0, duration: 0.4 })
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FFF9F2] px-4 pt-16"
    >
      {heroDishes.map((dish, i) => (
        <div
          key={dish.src}
          data-dish
          data-speed={DISH_LAYOUT[i].speed}
          className={`pointer-events-none absolute ${DISH_LAYOUT[i].className}`}
        >
          <Image
            src={dish.src}
            alt={dish.alt}
            width={360}
            height={360}
            className="aspect-square rounded-full object-cover shadow-xl ring-4 ring-white"
            priority={i < 2}
          />
        </div>
      ))}

      <div data-hero-copy className="relative z-10 mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#1A1A1A] sm:text-6xl md:text-7xl">
          {hero.headline.map((line) => (
            <span key={line} className="block overflow-hidden pb-1">
              <span data-hero-line className="block">
                {line === hero.underlineWord ? (
                  <span className="relative inline-block">
                    {line}
                    <svg
                      data-comb
                      viewBox="0 0 220 30"
                      preserveAspectRatio="none"
                      aria-hidden
                      fill="none"
                      className="absolute -bottom-[0.22em] left-0 h-[0.28em] w-full"
                    >
                      <path
                        d="M4 24 C30 10 44 10 58 22 C70 8 84 8 96 20 C110 6 126 6 138 18 C160 8 190 10 216 22"
                        stroke="#E8202A"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                ) : (
                  line
                )}
              </span>
            </span>
          ))}
        </h1>
        <p data-hero-sub className="mx-auto mt-6 max-w-xl text-base text-[#666] md:text-lg">
          {hero.sub}
        </p>
        <div data-hero-cta className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={hero.ctaPrimary.href}
            className="rounded-full bg-[#E8202A] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E8202A]/25 transition-transform hover:scale-[1.03] active:scale-95"
          >
            {hero.ctaPrimary.label}
          </Link>
          <Link
            href={hero.ctaSecondary.href}
            className="rounded-full border-2 border-[#1A1A1A]/15 px-8 py-3.5 text-sm font-bold text-[#1A1A1A] transition-colors hover:border-[#E8202A] hover:text-[#E8202A]"
          >
            {hero.ctaSecondary.label}
          </Link>
        </div>
      </div>

      <p className="absolute bottom-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#1A1A1A]/40">
        Scroll to taste
      </p>
    </section>
  )
}
