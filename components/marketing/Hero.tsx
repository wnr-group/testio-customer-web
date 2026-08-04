'use client'

// Dual-viewport hero component:
// Desktop (>=1024px): verbatim feat/redesginhomepage two-column hero —
// headline rises in, the rooster-comb underline draws itself under
// "Homemade.", and the taped note and garnish bowl parallax at different
// speeds while the section is pinned (only where it fits the viewport).
// Mobile (<1024px): feat/mobileversion's mobile-optimized stacked hero art
// with touch-friendly featured cards and trust ribbon.

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap'
import { hero, heroFeatured, heroSpecial } from '@/lib/marketing-content'
import { TrustRibbon } from '@/components/marketing/TrustRibbon'
import { Leaf } from '@/components/marketing/icons'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const desktopPinRef = useRef<HTMLDivElement>(null)
  const mobilePinRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const container = ref.current
      const mm = gsap.matchMedia()
      const desktopContainer = container.querySelector<HTMLElement>('[data-hero-desktop]')
      const mobileContainer = container.querySelector<HTMLElement>('[data-hero-mobile]')

      // ---------------- DESKTOP (>=1024px) — verbatim feat/redesginhomepage ----------------
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        if (!desktopContainer) return

        const path = desktopContainer.querySelector<SVGPathElement>('[data-comb] path')
        if (path) {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.7 })
        }

        const lines = desktopContainer.querySelectorAll('[data-hero-line]')
        if (lines.length > 0) {
          gsap.from(lines, { yPercent: 110, duration: 0.8, stagger: 0.12, ease: 'power3.out' })
        }

        const subCtaFeatured = desktopContainer.querySelectorAll('[data-hero-sub], [data-hero-cta], [data-hero-featured]')
        if (subCtaFeatured.length > 0) {
          gsap.from(subCtaFeatured, { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.5, ease: 'power2.out' })
        }

        const heroArt = desktopContainer.querySelectorAll('[data-hero-art]')
        if (heroArt.length > 0) {
          gsap.from(heroArt, { y: 40, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' })
        }

        const dishes = desktopContainer.querySelectorAll('[data-dish]')
        if (dishes.length > 0) {
          gsap.from(dishes, { scale: 0.7, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.55, ease: 'back.out(1.6)' })
        }
      })

      // Pin only where the whole composition fits the viewport (verbatim original gate).
      mm.add(
        '(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 720px)',
        () => {
          if (!desktopContainer || !desktopPinRef.current) return
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: desktopContainer,
              start: 'top top',
              end: '+=70%',
              scrub: true,
              pin: desktopPinRef.current,
            },
          })
          const pinDishes = desktopContainer.querySelectorAll<HTMLElement>('[data-dish]')
          pinDishes.forEach((el) => {
            tl.to(el, { y: -Number(el.dataset.speed || 0) * 120, ease: 'none' }, 0)
          })
          const heroCopy = desktopContainer.querySelector('[data-hero-copy]')
          if (heroCopy) {
            tl.to(heroCopy, { y: -60, ease: 'none' }, 0)
          }

          return () => {
            ScrollTrigger.getAll()
              .filter((t) => t.trigger === desktopContainer)
              .forEach((t) => t.kill())
          }
        }
      )

      // ---------------- MOBILE (<1024px) — feat/mobileversion, unchanged ----------------
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
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
      {/* ================= DESKTOP HERO (>=1024px) — verbatim feat/redesginhomepage ================= */}
      <div data-hero-desktop className="hidden lg:block">
        <div
          ref={desktopPinRef}
          data-hero-section
          className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cream pt-24 sm:pt-28 lg:pt-32"
        >
          <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-3 md:grid-cols-[48%_52%] lg:gap-12">
            {/* ---------------- left: copy, CTAs, featured cards ---------------- */}
            <div data-hero-copy className="relative z-10">
              <h1
                data-ink
                className="max-w-[12em] text-4xl font-extrabold leading-[0.95] tracking-tight text-text-primary sm:text-5xl lg:text-[clamp(50px,4.5vw,72px)]"
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
                className="mt-6 max-w-md text-xs text-text-secondary md:text-base"
              >
                {hero.sub}
              </p>

              <div
                data-hero-cta
                data-ink
                className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <Link
                  href={hero.ctaPrimary.href}
                  className="rounded-full bg-brand-primary px-7 py-3 text-center text-sm font-bold text-paper shadow-float transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary active:scale-95"
                >
                  {hero.ctaPrimary.label}
                </Link>
                <Link
                  href={hero.ctaSecondary.href}
                  className="rounded-full border-2 border-text-primary/15 px-7 py-3 text-center text-sm font-bold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  {hero.ctaSecondary.label}
                </Link>
              </div>

              <div data-hero-featured data-ink className="mt-4">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-text-primary/45">
                  Featured in your area
                </p>
                {/* Snap strip on phones, 4-up grid from sm. */}
                <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
                  {heroFeatured.map((item, index) => (
                    <li key={item.dish} className="group w-[9rem] shrink-0 snap-start sm:w-auto">
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
                      <p className="mt-3 text-[15px] font-bold leading-tight text-text-primary line-clamp-2">{item.dish}</p>
                      <p className="mt-0.5 text-sm font-medium text-text-secondary line-clamp-2">By {item.cook}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ---------------- right: layered food composition ---------------- */}
            <div
              data-hero-art
              data-ink
              className="relative mx-auto w-full sm:mx-0 md:mx-0"
            >
              <div className="relative aspect-square overflow-hidden rounded-panel bg-gradient-to-br from-brand-secondary via-amber-mid to-amber-deep shadow-panel">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]"
                />
                <Leaf className="absolute -left-8 top-[18%] w-32 -rotate-[24deg] text-green-deep/70 sm:w-40" />
                <Leaf className="absolute -right-6 bottom-[14%] w-28 rotate-[150deg] text-green-deep/60 sm:w-36" />
                <Image
                  src={heroSpecial.image.src}
                  alt={heroSpecial.image.alt}
                  width={720}
                  height={720}
                  sizes="(min-width: 1280px) 520px, (min-width: 768px) 44vw, 88vw"
                  priority
                  className="absolute left-1/2 top-1/2 w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover shadow-float ring-8 ring-paper/70"
                />
              </div>

              {/* taped "Today's Special" note */}
              <figure
                data-dish
                data-speed="0.5"
                className="absolute right-0 top-[6%] w-[8.5rem] rotate-2 bg-paper p-3 shadow-float ring-1 ring-text-primary/5 sm:w-36 sm:p-4 md:-right-4 lg:-right-8 lg:w-40"
              >
                <span
                  aria-hidden
                  className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-2 bg-brand-secondary/35"
                />
                <figcaption>
                  <span className="block text-lg font-extrabold leading-tight tracking-tight text-text-primary sm:text-xl">
                    {heroSpecial.eyebrow}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-brand-primary">
                    {heroSpecial.dish}
                  </span>
                  <span className="block text-[11px] text-text-secondary">By {heroSpecial.cook}</span>
                </figcaption>
              </figure>

              {/* garnish bowl breaking the panel edge */}
              <div
                data-dish
                data-speed="0.9"
                className="absolute -bottom-4 right-4 w-20 sm:w-28 md:-right-2 lg:w-32"
              >
                <Image
                  src={heroSpecial.garnish.src}
                  alt={heroSpecial.garnish.alt}
                  width={320}
                  height={320}
                  sizes="(min-width: 1024px) 144px, 96px"
                  className="aspect-square w-full rounded-full object-cover shadow-float ring-4 ring-paper"
                />
              </div>
            </div>
          </div>

          {/* bottom strip — inside the section so it lands above the fold */}
          <TrustRibbon />
        </div>
      </div>

      {/* ================= MOBILE HERO (<1024px) — feat/mobileversion, unchanged ================= */}
      <div data-hero-mobile className="block lg:hidden">
        <div
          ref={mobilePinRef}
          data-hero-section
          className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cream pt-14 sm:pt-16"
        >
          <div data-ink className="mx-auto grid w-full max-w-6xl flex-1 items-start md:items-center gap-6 px-4 sm:px-3 md:grid-cols-[48%_52%] pb-6 md:pb-0">
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
