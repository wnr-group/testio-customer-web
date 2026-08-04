'use client'

// Dual-viewport hero component:
// Desktop (>=1024px): Full-viewport pinned scrub hero from main branch with
// headline rising, rooster-comb underline drawing on "Homemade.", 4 parallax
// dish photos scrubbing at different speeds, and centered typography.
// Mobile (<1024px): Responsive two-column/stacked hero art with touch-friendly
// featured cards and trust ribbon from current mobile optimization.

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap, useGSAP } from '@/lib/gsap'
import { hero, heroDishes, heroFeatured, heroSpecial } from '@/lib/marketing-content'
import { TrustRibbon } from '@/components/marketing/TrustRibbon'
import { Leaf } from '@/components/marketing/icons'

const DISH_LAYOUT = [
  { className: 'left-[4%] top-[16%] w-28 md:w-44 rotate-[-6deg]', speed: 1.4 },
  { className: 'right-[6%] top-[20%] w-24 md:w-40 rotate-[5deg]', speed: 1.0 },
  { className: 'left-[5%] bottom-[4%] w-20 md:w-36 rotate-[4deg]', speed: 0.7 },
  { className: 'right-[5%] bottom-[6%] w-24 md:w-44 rotate-[-5deg]', speed: 1.2 },
]

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const mobilePinRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const container = ref.current
      const mm = gsap.matchMedia()

      // ---------------- DESKTOP ANIMATIONS (>=1024px) ----------------
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const desktopContainer = container.querySelector<HTMLElement>('[data-hero-desktop]')
        if (!desktopContainer) return

        const path = desktopContainer.querySelector<SVGPathElement>('[data-comb] path')
        if (path) {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.7 })
        }

        gsap.from(desktopContainer.querySelectorAll('[data-hero-line]'), {
          yPercent: 110,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        })

        gsap.from(desktopContainer.querySelectorAll('[data-hero-sub], [data-hero-cta]'), {
          y: 24,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.5,
          ease: 'power2.out',
        })

        gsap.from(desktopContainer.querySelectorAll('[data-dish]'), {
          scale: 0.6,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          delay: 0.3,
          ease: 'back.out(1.6)',
        })

        // Pinned scrub timeline on desktop matching main branch
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: desktopContainer,
            start: 'top top',
            end: '+=70%',
            scrub: true,
            pin: true,
          },
        })
        desktopContainer.querySelectorAll<HTMLElement>('[data-dish]').forEach((el) => {
          tl.to(el, { y: -Number(el.dataset.speed) * 260, ease: 'none' }, 0)
        })
        const copyEl = desktopContainer.querySelector('[data-hero-copy]')
        if (copyEl) {
          tl.to(copyEl, { y: -80, ease: 'none' }, 0)
        }
      })

      // ---------------- MOBILE ANIMATIONS (<1024px) ----------------
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        const mobileContainer = container.querySelector<HTMLElement>('[data-hero-mobile]')
        if (!mobileContainer) return

        const path = mobileContainer.querySelector<SVGPathElement>('[data-comb] path')
        if (path) {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.7 })
        }

        const lines = mobileContainer.querySelectorAll('[data-hero-line]')
        if (lines.length > 0) {
          gsap.from(lines, { yPercent: 110, duration: 0.8, stagger: 0.12, ease: 'power3.out' })
        }

        const subCtaFeatured = mobileContainer.querySelectorAll('[data-hero-sub], [data-hero-cta], [data-hero-featured]')
        if (subCtaFeatured.length > 0) {
          gsap.from(subCtaFeatured, { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.5, ease: 'power2.out' })
        }

        const heroArt = mobileContainer.querySelectorAll('[data-hero-art]')
        if (heroArt.length > 0) {
          gsap.from(heroArt, { y: 40, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' })
        }

        const dishes = mobileContainer.querySelectorAll('[data-dish]')
        if (dishes.length > 0) {
          gsap.from(dishes, { scale: 0.7, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.55, ease: 'back.out(1.6)' })
        }
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from(container, { opacity: 0, duration: 0.4 })
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref}>
      {/* ================= DESKTOP HERO (>=1024px) - EXACT MAIN BRANCH ================= */}
      <div
        data-hero-desktop
        className="relative hidden lg:flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FFF9F2] px-4 pt-16"
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
      </div>

      {/* ================= MOBILE HERO (<1024px) - CURRENT MOBILE OPTIMIZATION ================= */}
      <div
        data-hero-mobile
        className="block lg:hidden"
      >
        <div 
          ref={mobilePinRef} 
          data-hero-section
          className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cream pt-14 sm:pt-16"
        >
          <div data-ink className="mx-auto grid w-full max-w-6xl flex-1 items-start md:items-center gap-6 px-4 sm:px-3 md:grid-cols-[48%_52%] pb-6 md:pb-0">
            {/* left: copy, CTAs, featured cards */}
            <div data-hero-copy data-ink className="relative z-10 min-w-0 w-full max-w-full md:-mt-12">
              <h1
                data-ink
                className="max-w-[12em] text-4xl font-extrabold leading-[0.95] tracking-tight text-text-primary sm:text-5xl"
              >
                {hero.headline.map((line) => (
                  <span key={line} className="block overflow-hidden pb-[0.5em] -mb-[0.5em]">
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

              <p
                data-hero-sub
                data-ink
                className="mt-6 w-full max-w-full pr-4 text-base text-text-secondary break-words [overflow-wrap:break-word] md:max-w-md md:pr-0"
              >
                {hero.sub}
              </p>

              <div
                data-hero-cta
                data-ink
                className="mt-2 flex flex-col gap-2 w-full max-w-full sm:flex-row sm:items-center sm:w-auto"
              >
                <Link
                  href={hero.ctaPrimary.href}
                  data-touch-target="hero-cta-primary"
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-brand-primary px-6 py-3.5 text-center text-sm font-bold text-paper shadow-float transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:scale-95 sm:w-auto sm:py-3"
                >
                  {hero.ctaPrimary.label}
                </Link>
                <Link
                  href={hero.ctaSecondary.href}
                  data-touch-target="hero-cta-secondary"
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-text-primary/15 px-6 py-3.5 text-center text-sm font-bold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:w-auto sm:py-3"
                >
                  {hero.ctaSecondary.label}
                </Link>
              </div>

              <div data-hero-featured data-ink className="relative mt-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary/45">
                  Featured in your area
                </p>
                
                {/* Mobile Auto-Scroll Motion Track */}
                <div className="relative mt-4 overflow-hidden -mx-4 px-4 sm:hidden">
                  <div className="flex w-max gap-6 animate-hero-featured-scroll">
                    {[...heroFeatured, ...heroFeatured].map((item, index) => (
                      <div key={`${item.dish}-${index}`} className="group w-[9rem] min-w-[9rem] shrink-0">
                        <div className="overflow-hidden rounded-xl shadow-card ring-1 ring-text-primary/5 transition-shadow duration-300 group-hover:shadow-float">
                          <Image
                            src={item.src}
                            alt={item.alt}
                            width={240}
                            height={180}
                            sizes="144px"
                            priority={index < 2}
                            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <p className="mt-3 text-[15px] font-bold leading-tight text-text-primary truncate">{item.dish}</p>
                        <p className="mt-0.5 text-sm font-medium text-text-secondary truncate">By {item.cook}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tablet 4-up Grid */}
                <ul className="hidden mt-4 sm:grid sm:grid-cols-4 sm:gap-6">
                  {heroFeatured.map((item, index) => (
                    <li key={item.dish} className="group sm:w-auto sm:min-w-0">
                      <div className="overflow-hidden rounded-xl shadow-card ring-1 ring-text-primary/5 transition-shadow duration-300 group-hover:shadow-float">
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={240}
                          height={180}
                          sizes="(min-width: 768px) 150px, 144px"
                          priority={index < 2}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-3 text-[15px] font-bold leading-tight text-text-primary truncate">{item.dish}</p>
                      <p className="mt-0.5 text-sm font-medium text-text-secondary truncate">By {item.cook}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* right: layered food composition */}
            <div
              data-hero-art
              data-ink
              className="relative mx-auto w-full mb-6 sm:mx-0 sm:mb-0 md:mx-0 md:-mt-12"
            >
              <div className="relative aspect-square overflow-hidden rounded-panel bg-gradient-to-br from-brand-secondary via-amber-mid to-amber-deep shadow-panel">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]"
                />
                <Leaf className="absolute -left-2 top-[18%] w-32 -rotate-[24deg] text-green-deep/70 sm:-left-8 sm:w-40" />
                <Leaf className="absolute right-0 bottom-[14%] w-28 rotate-[150deg] text-green-deep/60 sm:-right-6 sm:w-36" />
                <Image
                  src={heroSpecial.image.src}
                  alt={heroSpecial.image.alt}
                  width={720}
                  height={720}
                  sizes="(min-width: 768px) 44vw, 88vw"
                  priority
                  className="absolute left-1/2 top-1/2 w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-float ring-8 ring-paper"
                />
              </div>

              {/* Taped "Today's Special" note */}
              <figure
                data-dish
                data-ink
                data-speed="0.5"
                className="absolute right-2 top-[6%] w-[8.5rem] rotate-2 bg-paper p-3 shadow-float ring-1 ring-text-primary/5 sm:right-0 sm:w-36 sm:p-4 md:-right-4"
              >
                <span
                  aria-hidden
                  className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-2 bg-brand-secondary/35"
                />
                <figcaption>
                  <span className="block text-lg font-extrabold leading-tight tracking-tight text-text-primary sm:text-xl">
                    {heroSpecial.eyebrow}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-text-secondary">
                    {heroSpecial.dish} &bull; {heroSpecial.cook}
                  </span>
                </figcaption>
              </figure>

              {/* Floating garnish image */}
              <div
                data-dish
                data-ink
                data-speed="0.9"
                className="absolute bottom-2 right-4 w-20 sm:-bottom-4 sm:w-28 md:-right-2"
              >
                <Image
                  src={heroSpecial.garnish.src}
                  alt={heroSpecial.garnish.alt}
                  width={320}
                  height={320}
                  sizes="96px"
                  className="aspect-square w-full rounded-full object-cover shadow-float ring-4 ring-paper"
                />
              </div>
            </div>
          </div>

          <TrustRibbon />
        </div>
      </div>
    </section>
  )
}
