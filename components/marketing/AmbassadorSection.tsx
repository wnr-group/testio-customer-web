'use client'

// Dual-viewport ambassador component:
// Desktop (>=1024px): Exact client-approved ambassador section from main branch with dark #191210 background, red brand arc, rotated medals polaroid figure, and rising cut-out GSAP animation.
// Mobile (<1024px): Mobile optimized ambassador section with achievement carousel and testimonial card.

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Quote } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { ambassador } from '@/lib/marketing-content'

export function AmbassadorSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      const container = ref.current
      const mm = gsap.matchMedia()

      // ---------------- DESKTOP GSAP (>=1024px) ----------------
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const desktopContainer = container.querySelector('[data-amb-desktop]')
        if (!desktopContainer) return

        gsap.from(desktopContainer.querySelector('[data-amb-cutout]'), {
          y: 160,
          opacity: 0,
          ease: 'power2.out',
          scrollTrigger: { trigger: desktopContainer, start: 'top 70%', end: 'top 20%', scrub: 0.6 },
        })

        gsap.from(desktopContainer.querySelectorAll('[data-amb-copy] > :not([data-amb-polaroid])'), {
          y: 32,
          opacity: 0,
          stagger: 0.12,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: desktopContainer, start: 'top 60%' },
        })

        gsap.from(desktopContainer.querySelector('[data-amb-polaroid]'), {
          y: 60,
          rotation: 6,
          opacity: 0,
          ease: 'power2.out',
          scrollTrigger: { trigger: desktopContainer, start: 'top 70%', end: 'top 30%', scrub: 0.6 },
        })
      })

      // ---------------- MOBILE GSAP (<1024px) ----------------
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        const mobileContainer = container.querySelector('[data-amb-mobile]')
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
              scrollTrigger: { trigger: mobileContainer, start: 'top 75%' }
            }
          )
        }
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref}>
      {/* ================= DESKTOP AMBASSADOR (>=1024px) - EXACT MAIN BRANCH ================= */}
      <div
        data-amb-desktop
        className="relative hidden lg:block overflow-hidden bg-[#191210] px-4 py-24 text-white"
      >
        {/* red brand arc behind the cut-out */}
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[620px] w-[620px] -translate-y-1/2 rounded-full bg-[#E8202A] opacity-90 md:-right-24"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div data-amb-copy>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#F5A623]">
              Our brand ambassador
            </p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              {ambassador.heading}
            </h2>
            {ambassador.name && (
              <p className="mt-3 text-lg font-bold text-[#F5A623]">{ambassador.name}</p>
            )}
            <p className="mt-2 text-sm font-semibold text-white/80">{ambassador.title}</p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">{ambassador.body}</p>
            <figure data-amb-polaroid className="mt-10 w-56 -rotate-3 bg-white p-3 pb-4 shadow-2xl">
              <Image
                src={ambassador.images.medals}
                alt="Medals and trophies"
                width={448}
                height={560}
                className="aspect-[4/5] w-full object-cover object-top"
              />
              <figcaption className="mt-2 text-center text-[11px] font-semibold text-[#1A1A1A]/70">
                {ambassador.medalsCaption}
              </figcaption>
            </figure>
          </div>
          <div data-amb-cutout className="relative mx-auto w-full max-w-sm md:max-w-md">
            <Image
              src={ambassador.images.cutout}
              alt={ambassador.name ?? 'TESTIO brand ambassador'}
              width={640}
              height={800}
              className="relative z-10 w-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* ================= MOBILE AMBASSADOR (<1024px) - CURRENT MOBILE OPTIMIZATION ================= */}
      <div
        data-amb-mobile
        className="block lg:hidden relative flex min-h-[min(100svh,65rem)] w-full items-end overflow-hidden bg-[--color-bg-base] px-4 py-10 sm:py-12"
      >
        {/* Background Layers */}
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
      className="group relative w-48 shrink-0 overflow-hidden rounded-2xl border border-border-color bg-surface p-2 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-black/10 hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-300 shadow-inner">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="192px"
          className="object-cover object-top origin-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
        <figcaption className="absolute bottom-4 left-4 right-4 text-center text-xs font-bold uppercase tracking-widest text-white drop-shadow-md">
          {title}
        </figcaption>
      </div>
    </figure>
  )
}

