'use client'

// The one dark section. The ambassador cut-out rises against a red brand
// arc as it scrolls into view; the medals photo sits in a rotated polaroid.
// Her name is config-driven and gracefully omitted until confirmed.

import { useRef } from 'react'
import Image from 'next/image'
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
        gsap.from('[data-amb-copy] > *', {
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
          duration: 0.8,
          ease: 'back.out(1.4)',
          scrollTrigger: { trigger: ref.current, start: 'top 40%' },
        })
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#191210] px-4 py-24 text-white">
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
    </section>
  )
}
