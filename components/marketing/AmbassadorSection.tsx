'use client'

// The one dark section. The ambassador cut-out rises against a red brand
// arc as it scrolls into view; the medals photo sits in a rotated polaroid.
// Her name is config-driven and gracefully omitted until confirmed.

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { ambassador } from '@/lib/marketing-content'

export function AmbassadorSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-amb-cutout]', {
          y: 160,
          opacity: 0,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'top 20%', scrub: 0.6 },
        })
        // :not([data-amb-polaroid]) — the polaroid figure is also a direct
        // child of [data-amb-copy], and it gets its own dedicated tween
        // below. Without the exclusion, two separate GSAP tweens fight over
        // the same element's opacity/y, triggered at different scroll
        // points, each independently reversible — which is what made the
        // medals photo disappear "most of the time".
        gsap.from('[data-amb-copy] > :not([data-amb-polaroid])', {
          y: 32,
          opacity: 0,
          stagger: 0.12,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 60%' },
        })
        gsap.from('[data-amb-polaroid]', {
          y: 60,
          rotation: 6,
          opacity: 0,
          ease: 'power2.out',
          // Was also a one-shot `start: 'top 40%'` trigger with the default
          // toggleActions ("play none none reverse") — scrolling back up
          // even slightly after it played (trackpad momentum settling,
          // re-reading a line) reversed it straight back to invisible.
          // scrub ties opacity directly to scroll position instead, so
          // there's no "did it fire" state to get out of sync.
          scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'top 30%', scrub: 0.6 },
        })
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      data-ambassador-section
      className="relative flex min-h-[min(96svh,57rem)] items-stretch overflow-hidden bg-ink-deep px-4 pt-section text-paper lg:pt-section-lg"
    >
      {/* layered backdrop — gradient + glow + texture, never a flat canvas */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_0%,var(--color-ink-warm)_0%,var(--color-ink-deep)_55%,#120C0B_100%)]"
      />
      <div
        aria-hidden
        className="absolute right-[-18%] top-1/2 hidden h-[70%] w-[60%] -translate-y-1/2 rounded-full bg-brand-primary/25 blur-3xl md:block"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]"
      />

      <div className="relative mx-auto grid w-full gap-10 md:items-end md:gap-8 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
        {/* -------- left: copy → stats → polaroid → CTA -------- */}
        <div data-amb-copy className="pb-12 lg:pb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-secondary">
            {ambassador.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            {ambassador.heading}
          </h2>
          {ambassador.name && (
            <p className="mt-3 text-lg font-bold text-brand-secondary">{ambassador.name}</p>
          )}
          <p className="mt-2 text-sm font-semibold text-paper/80">{ambassador.title}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/75">{ambassador.body}</p>

          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-5 border-y border-paper/10 py-5">
            {ambassador.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-2xl font-extrabold text-brand-secondary">
                    {stat.value}
                  </span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-paper/70">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {ambassador.quote && (
            <blockquote className="mt-6 border-l-2 border-brand-primary pl-4 text-sm italic leading-relaxed text-paper/75">
              {ambassador.quote}
            </blockquote>
          )}

          <figure
            data-amb-polaroid
            className="mt-7 w-40 -rotate-3 bg-paper p-2.5 pb-3 shadow-float sm:w-48 sm:p-3 sm:pb-4"
          >
            <Image
              src={ambassador.images.medals}
              alt="Medals and trophies won by the TESTIO brand ambassador"
              width={448}
              height={560}
              sizes="(min-width: 640px) 192px, 160px"
              className="aspect-[4/5] w-full object-cover object-top"
            />
            <figcaption className="mt-2 text-center text-[11px] font-semibold text-text-primary/70">
              {ambassador.medalsCaption}
            </figcaption>
          </figure>

          <Link
            href={ambassador.cta.href}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-sm font-bold text-paper shadow-float transition-colors hover:bg-red-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
          >
            {ambassador.cta.label}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        {/* -------- right: athlete, planted on a stage -------- */}
        <div data-amb-cutout className="relative flex items-end justify-center lg:justify-end">
          {/* stage: a bottom-anchored panel she stands on, not a floating circle */}
          <div
            data-amb-stage
            aria-hidden
            className="absolute bottom-0 left-1/2 h-[86%] w-[88%] -translate-x-1/2 rounded-t-full bg-gradient-to-b from-brand-primary via-red-deep to-red-shadow lg:left-auto lg:right-0 lg:w-[92%] lg:translate-x-0"
          />
          {/* contact shadow so she is planted, not hovering */}
          <div
            aria-hidden
            className="absolute bottom-1 left-1/2 h-6 w-[62%] -translate-x-1/2 rounded-full bg-black/45 blur-xl lg:left-auto lg:right-[12%] lg:translate-x-0"
          />
          <Image
            src={ambassador.images.cutout}
            alt={ambassador.name ?? 'TESTIO brand ambassador'}
            width={640}
            height={800}
            sizes="(min-width: 1280px) 460px, (min-width: 768px) 40vw, 78vw"
            className="relative z-10 h-[clamp(20rem,77svh,44rem)] w-auto object-contain object-bottom drop-shadow-cutout"
          />
        </div>
      </div>
    </section>
  )
}
