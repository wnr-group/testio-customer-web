'use client'

// Two-column hero with featured cards and trust ribbon. Headline lines rise
// in, the rooster-comb underline draws itself under "Homemade.", and the
// taped note and garnish bowl parallax at different speeds while the section
// is pinned (only where it fits the viewport).

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap'
import { hero, heroFeatured, heroSpecial } from '@/lib/marketing-content'
import { TrustRibbon } from '@/components/marketing/TrustRibbon'
import { Leaf } from '@/components/marketing/icons'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const container = ref.current
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Comb underline draws on after the headline rises in.
        const path = container.querySelector<SVGPathElement>('[data-comb] path')
        if (path) {
          const len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.7 })
        }

        const lines = container.querySelectorAll('[data-hero-line]')
        if (lines.length > 0) {
          gsap.from(lines, {
            yPercent: 110,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
          })
        }

        const subCtaFeatured = container.querySelectorAll('[data-hero-sub], [data-hero-cta], [data-hero-featured]')
        if (subCtaFeatured.length > 0) {
          gsap.from(subCtaFeatured, {
            y: 24,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            delay: 0.5,
            ease: 'power2.out',
          })
        }

        const heroArt = container.querySelectorAll('[data-hero-art]')
        if (heroArt.length > 0) {
          gsap.from(heroArt, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power3.out',
          })
        }

        const dishes = container.querySelectorAll('[data-dish]')
        if (dishes.length > 0) {
          gsap.from(dishes, {
            scale: 0.7,
            opacity: 0,
            duration: 0.7,
            stagger: 0.1,
            delay: 0.55,
            ease: 'back.out(1.6)',
          })
        }
      })

      // Pin only where the whole composition fits the viewport.
      mm.add(
        '(prefers-reduced-motion: no-preference) and (min-width: 768px) and (min-height: 720px)',
        () => {
          if (!pinRef.current) return
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: 'top top',
              end: '+=70%',
              scrub: true,
              pin: pinRef.current,
            },
          })
          const dishes = container.querySelectorAll<HTMLElement>('[data-dish]')
          dishes.forEach((el) => {
            tl.to(el, { y: -Number(el.dataset.speed || 0) * 120, ease: 'none' }, 0)
          })
          const heroCopy = container.querySelector('[data-hero-copy]')
          if (heroCopy) {
            tl.to(heroCopy, { y: -60, ease: 'none' }, 0)
          }
        }
      )

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from(container, { opacity: 0, duration: 0.4 })
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      data-hero-section
    >
      <div 
        ref={pinRef} 
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
    </section>
  )
}
