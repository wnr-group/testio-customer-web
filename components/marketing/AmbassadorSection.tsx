'use client'

// Dual-viewport ambassador component:
// Desktop (>=1024px): verbatim feat/redesginhomepage — light background,
// soft circular rings, noise texture overlay, premium stats cards, and a
// rotated three-card achievement gallery around the cutout figure.
// Mobile (<1024px): feat/mobileversion's mobile-optimized achievement
// carousel and testimonial card.

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Quote } from 'lucide-react'
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap'
import { ambassador } from '@/lib/marketing-content'

export function AmbassadorSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const container = ref.current
      const mm = gsap.matchMedia()
      const desktopContainer = container.querySelector<HTMLElement>('[data-amb-desktop]')
      const mobileContainer = container.querySelector<HTMLElement>('[data-amb-mobile]')

      // ---------------- DESKTOP (>=1024px) — verbatim feat/redesginhomepage ----------------
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        if (!desktopContainer) return

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: desktopContainer,
            start: 'top 75%',
          },
        })

        const staggers = desktopContainer.querySelectorAll('[data-amb-stagger]')
        if (staggers.length > 0) {
          tl.fromTo(
            staggers,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out' }
          )
        }

        const quoteTargets = desktopContainer.querySelectorAll('[data-amb-quote]')
        if (quoteTargets.length > 0) {
          tl.fromTo(
            quoteTargets,
            { x: -30, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
            '-=0.4'
          )
        }

        const glow = desktopContainer.querySelectorAll('[data-amb-glow]')
        if (glow.length > 0) {
          gsap.to(glow, {
            scale: 1.05,
            opacity: 0.8,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }

        const ring = desktopContainer.querySelectorAll('[data-amb-ring]')
        if (ring.length > 0) {
          gsap.to(ring, {
            y: -50,
            rotation: 5,
            ease: 'none',
            scrollTrigger: {
              trigger: desktopContainer,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          })
        }

        const ambHero = desktopContainer.querySelectorAll('[data-amb-hero]')
        if (ambHero.length > 0) {
          gsap.fromTo(
            ambHero,
            { y: 60, opacity: 0, scale: 0.98 },
            {
              y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
              scrollTrigger: { trigger: desktopContainer, start: 'top 75%' },
            }
          )
        }

        const ambHeroImg = desktopContainer.querySelectorAll('[data-amb-hero] img')
        if (ambHeroImg.length > 0) {
          gsap.to(ambHeroImg, {
            y: -3,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }

        const cards = desktopContainer.querySelectorAll('[data-amb-card]')
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { y: 40, opacity: 0 },
            {
              y: 0, opacity: 1, stagger: 0.15, duration: 1, ease: 'power3.out',
              scrollTrigger: { trigger: desktopContainer, start: 'top 60%' },
            }
          )
        }

        return () => {
          ScrollTrigger.getAll()
            .filter((t) => t.trigger === desktopContainer)
            .forEach((t) => t.kill())
        }
      })

      // ---------------- MOBILE (<1024px) — feat/mobileversion, unchanged ----------------
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        if (!mobileContainer) return

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: mobileContainer,
            start: 'top 75%',
          },
        })

        const staggers = mobileContainer.querySelectorAll('[data-amb-stagger]')
        if (staggers.length > 0) {
          tl.fromTo(
            staggers,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out' }
          )
        }

        const ambHero = mobileContainer.querySelectorAll('[data-amb-hero]')
        if (ambHero.length > 0) {
          gsap.fromTo(
            ambHero,
            { y: 60, opacity: 0, scale: 0.98 },
            {
              y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
              scrollTrigger: { trigger: mobileContainer, start: 'top 75%' },
            }
          )
        }
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref}>
      {/* ================= DESKTOP AMBASSADOR (>=1024px) — verbatim feat/redesginhomepage ================= */}
      <div
        data-amb-desktop
        data-ambassador-section
        className="relative hidden lg:flex min-h-[min(100svh,65rem)] w-full items-center overflow-hidden bg-[--color-bg-base] px-4 py-24 md:py-32"
      >
        {/* Background Layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-brand-primary)_0%,var(--color-bg-base)_100%)] opacity-[0.03]" />

        {/* Soft circular rings behind everything */}
        <div
          data-amb-ring
          className="absolute right-[5%] top-[10%] h-[800px] w-[800px] rounded-full border border-black/[0.03] lg:right-[15%] lg:top-[20%]"
        />
        <div
          data-amb-ring
          className="absolute right-[10%] top-[15%] h-[600px] w-[600px] rounded-full border border-black/[0.04] lg:right-[20%] lg:top-[25%]"
        />

        <div
          data-amb-glow
          className="absolute bottom-0 right-[10%] h-[70vh] w-[70vh] bg-[radial-gradient(circle_at_center,rgba(232,32,42,0.08)_0%,transparent_60%)] mix-blend-multiply blur-[80px]"
        />

        {/* Tiny particles / noise pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
        />

        <div className="relative mx-auto grid w-full max-w-[90rem] gap-16 lg:grid-cols-12 lg:items-center">
          {/* Left Side: Content */}
          <div className="relative z-20 flex flex-col justify-center lg:col-span-5 lg:pl-8 xl:pl-16">
            <p data-amb-stagger className="text-xs font-black uppercase tracking-[0.25em] text-[--color-brand-secondary]">
              {ambassador.eyebrow}
            </p>

            <h2 data-amb-stagger className="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-text-primary md:text-6xl xl:text-7xl">
              {ambassador.heading}
            </h2>

            <div data-amb-stagger data-amb-copy className="mt-8 flex flex-col gap-1 border-l-[3px] border-[--color-brand-primary]/50 pl-5">
              {ambassador.name && (
                <p className="text-xl font-bold tracking-tight text-text-primary">{ambassador.name}</p>
              )}
              <p className="text-sm font-semibold text-text-secondary">{ambassador.title}</p>
            </div>

            <p data-amb-stagger className="mt-8 max-w-lg text-lg leading-relaxed text-text-secondary">
              {ambassador.body}
            </p>

            {/* Premium Stats Cards */}
            <div data-amb-stagger className="mt-10 grid gap-4 sm:grid-cols-3">
              {ambassador.stats.map((stat) => {
                const labelParts = stat.label.split(' ')
                const firstWord = labelParts[0]
                const restWords = labelParts.slice(1).join(' ')
                return (
                  <div
                    key={stat.label}
                    className="group relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-black/5 bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-black/10 hover:shadow-md"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black/[0.03] text-2xl transition-transform duration-300 group-hover:scale-110">
                      {stat.value === '🇮🇳' ? (
                        <img
                          src="https://flagcdn.com/w160/in.png"
                          alt="India Flag"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary/70">
                        {firstWord}
                      </span>
                      <span className="block text-sm font-bold text-text-primary">
                        {restWords}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Premium Testimonial Card */}
            {ambassador.quote && (
              <div data-amb-quote className="relative mt-12 overflow-hidden rounded-2xl border border-[--color-brand-secondary]/20 bg-surface/80 p-8 shadow-card backdrop-blur-xl">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-[--color-brand-primary]/70" />
                <Quote className="absolute right-6 top-6 h-20 w-20 text-black/[0.03]" />
                <p className="relative z-10 text-lg italic leading-relaxed text-text-secondary">
                  &quot;{ambassador.quote}&quot;
                </p>
              </div>
            )}

            <div data-amb-stagger className="mt-12">
              <Link
                href={ambassador.cta.href}
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-brand-primary px-8 py-4 text-sm font-bold text-cream shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-float focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
              >
                <span className="absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-[100%]" />
                <span className="relative">{ambassador.cta.label}</span>
                <ArrowRight aria-hidden className="relative size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Side: Visual */}
          <div data-amb-stage className="relative z-10 mt-16 flex h-[500px] w-full items-end justify-center lg:col-span-7 lg:mt-0 lg:h-[800px] xl:h-[900px] lg:justify-center">
            <div data-amb-cutout className="relative flex h-[95%] w-full max-w-[450px] xl:max-w-[500px] items-end justify-center">
              {/* Grounding floor shadow */}
              <div className="absolute bottom-0 left-1/2 h-8 w-[130%] -translate-x-1/2 rounded-[100%] bg-black/90 blur-2xl" />

              {/* Hero Image */}
              <div data-amb-hero className="relative z-20 h-full w-full pt-8">
                <Image
                  src={ambassador.images.cutout}
                  alt={ambassador.name ?? 'TESTIO brand ambassador'}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] p-4 pt-12 contrast-[1.03] saturate-[0.97]"
                />
              </div>

              {/* Desktop Achievement Gallery */}
              <div className="absolute inset-0 z-30 pointer-events-none [&>*]:pointer-events-auto">
                <div
                  data-amb-card
                  className="absolute -left-[25%] top-[12%] xl:-left-[30%] xl:top-[12%] -rotate-[3deg]"
                >
                  <AchievementCard
                    src={ambassador.images.portrait1}
                    alt="Competition Portrait"
                    title="Competition"
                  />
                </div>

                <div
                  data-amb-card
                  className="absolute -right-[25%] top-[40%] xl:-right-[30%] xl:top-[40%] rotate-[4deg]"
                >
                  <AchievementCard
                    src={ambassador.images.medals}
                    alt="Medal Ceremony"
                    title="Honors"
                  />
                </div>

                <div
                  data-amb-card
                  className="absolute -left-[10%] bottom-[12%] xl:-left-[15%] xl:bottom-[12%] rotate-[2deg]"
                >
                  <AchievementCard
                    src={ambassador.images.portrait2}
                    alt="Trophy Collection"
                    title="Triumphs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MOBILE AMBASSADOR (<1024px) — feat/mobileversion, unchanged ================= */}
      <div
        data-amb-mobile
        className="block lg:hidden relative flex min-h-[min(100svh,65rem)] w-full items-end overflow-hidden bg-[--color-bg-base] px-4 py-10 sm:py-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-brand-primary)_0%,var(--color-bg-base)_100%)] opacity-[0.03]" />

        <div
          data-amb-glow
          className="absolute bottom-0 right-[10%] h-[70vh] w-[70vh] bg-[radial-gradient(circle_at_center,rgba(232,32,42,0.08)_0%,transparent_60%)] mix-blend-multiply blur-[80px]"
        />

        <div className="relative mx-auto grid w-full min-w-0 max-w-[90rem] grid-cols-1 gap-8">
          {/* Left Side: Content */}
          <div data-amb-copy className="relative z-20 flex w-full min-w-0 flex-col justify-center">
            <p data-amb-stagger className="text-xs font-black uppercase tracking-[0.25em] text-[--color-brand-secondary]">
              {ambassador.eyebrow}
            </p>

            <h2 data-amb-stagger className="mt-3 text-3xl font-black leading-[1.1] tracking-tight text-text-primary sm:text-4xl break-words">
              {ambassador.heading}
            </h2>

            <div data-amb-stagger className="mt-6 flex flex-col gap-1 border-l-[3px] border-[--color-brand-primary]/50 pl-4 sm:pl-5">
              {ambassador.name && (
                <p className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">{ambassador.name}</p>
              )}
              <p className="text-xs font-semibold text-text-secondary sm:text-sm">{ambassador.title}</p>
            </div>

            <p data-amb-stagger className="mt-6 w-full min-w-0 max-w-full text-base leading-relaxed text-text-secondary break-words [overflow-wrap:break-word] sm:max-w-lg">
              {ambassador.body}
            </p>

            {/* Premium Stats Cards */}
            <div data-amb-stagger className="mt-6 flex w-full min-w-0 flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
              {ambassador.stats.map((stat) => {
                const labelParts = stat.label.split(' ')
                const firstWord = labelParts[0]
                const restWords = labelParts.slice(1).join(' ')
                return (
                  <div
                    key={stat.label}
                    className="group relative flex w-full min-w-0 flex-row items-center gap-3.5 overflow-hidden rounded-2xl border border-black/5 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-black/10 hover:shadow-md sm:flex-col sm:justify-center sm:text-center sm:p-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/[0.03] text-xl transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12 sm:text-2xl">
                      {stat.value === '🇮🇳' ? (
                        <img
                          src="https://flagcdn.com/w160/in.png"
                          alt="India Flag"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left sm:text-center">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary/70">
                        {firstWord}
                      </span>
                      <span className="block text-xs font-bold text-text-primary break-words sm:text-sm">
                        {restWords}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Testimonial Card */}
            {ambassador.quote && (
              <div data-amb-quote className="relative mt-6 overflow-hidden rounded-2xl border border-[--color-brand-secondary]/20 bg-surface/80 p-5 shadow-card backdrop-blur-xl sm:p-8">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-[--color-brand-primary]/70" />
                <Quote className="absolute right-6 top-6 h-16 w-16 text-black/[0.03] sm:h-20 sm:w-20" />
                <p className="relative z-10 text-base italic leading-relaxed text-text-secondary sm:text-lg">
                  &quot;{ambassador.quote}&quot;
                </p>
              </div>
            )}

            <div data-amb-stagger className="mt-6 flex w-full min-w-0 justify-start">
              <Link
                href={ambassador.cta.href}
                className="group relative inline-flex min-h-[48px] w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-brand-primary px-8 py-3.5 text-sm font-bold text-cream shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-float sm:w-auto"
              >
                <span className="relative">{ambassador.cta.label}</span>
                <ArrowRight aria-hidden="true" className="relative size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Side Cutout & Carousel */}
          <div data-amb-stage className="relative z-10 mt-6 flex w-full min-w-0 flex-col items-center justify-center h-auto">
            <div data-amb-cutout className="relative flex h-[350px] sm:h-[450px] w-full max-w-[320px] sm:max-w-[450px] items-end justify-center">
              <div className="absolute bottom-0 left-1/2 h-8 w-full sm:w-[130%] -translate-x-1/2 rounded-[100%] bg-black/90 blur-2xl" />

              <div data-amb-hero className="relative z-20 h-full w-full">
                <Image
                  src={ambassador.images.cutout}
                  alt={ambassador.name ?? 'TESTIO brand ambassador'}
                  fill
                  sizes="100vw"
                  className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] contrast-[1.03] saturate-[0.97]"
                />
              </div>
            </div>

            {/* Mobile Achievement Carousel */}
            <div className="relative mt-4 z-30 flex w-full min-w-0 max-w-full overflow-hidden px-1 pt-3 pb-3">
              <div className="flex w-max gap-3.5 animate-amb-scroll">
                <AchievementCard src={ambassador.images.portrait1} alt="Competition Portrait" title="Competition" />
                <AchievementCard src={ambassador.images.medals} alt="Medal Ceremony" title="Honors" />
                <AchievementCard src={ambassador.images.portrait2} alt="Trophy Collection" title="Triumphs" />
                <AchievementCard src={ambassador.images.portrait1} alt="Competition Portrait" title="Competition" />
                <AchievementCard src={ambassador.images.medals} alt="Medal Ceremony" title="Honors" />
                <AchievementCard src={ambassador.images.portrait2} alt="Trophy Collection" title="Triumphs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AchievementCard({ src, alt, title }: { src: string; alt: string; title: string }) {
  return (
    <figure
      className="group relative w-48 shrink-0 overflow-hidden rounded-2xl border border-border-color bg-surface p-2 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-black/10 hover:shadow-md xl:w-56"
    >
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[--color-brand-secondary]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-300 shadow-inner">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 224px, 192px"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
        <figcaption className="absolute bottom-4 left-4 right-4 text-center text-xs font-bold uppercase tracking-widest text-white drop-shadow-md">
          {title}
        </figcaption>
      </div>
    </figure>
  )
}
