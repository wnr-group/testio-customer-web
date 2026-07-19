'use client'

// Pinned section: the three steps light up one at a time as the visitor
// scrolls, while the phone frame crossfades between real app screenshots.
// Reduced motion / no-JS: all steps visible, first screenshot shown.

import { useRef } from 'react'
import Image from 'next/image'
import { gsap, useGSAP } from '@/lib/gsap'
import { howItWorks } from '@/lib/marketing-content'

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const steps = gsap.utils.toArray<HTMLElement>('[data-step]')
        const screens = gsap.utils.toArray<HTMLElement>('[data-screen]')
        gsap.set(steps.slice(1), { opacity: 0.25 })
        gsap.set(screens.slice(1), { autoAlpha: 0 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: '+=200%',
            scrub: 0.4,
            pin: true,
          },
        })
        steps.forEach((_, i) => {
          if (i === 0) return
          tl.to(steps[i - 1], { opacity: 0.25, duration: 0.3 }, i)
            .to(steps[i], { opacity: 1, duration: 0.3 }, i)
            .to(screens[i - 1], { autoAlpha: 0, y: -16, duration: 0.3 }, i)
            .fromTo(
              screens[i],
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.3 },
              i
            )
        })
        tl.to({}, { duration: 0.5 }) // breathing room after the last step
      })
    },
    { scope: ref }
  )

  return (
    <section ref={ref} className="flex min-h-screen items-center bg-white px-4 py-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] md:text-5xl">
            {howItWorks.heading}
          </h2>
          <ol className="mt-10 flex flex-col gap-8">
            {howItWorks.steps.map((step, i) => (
              <li key={step.title} data-step className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8202A] text-base font-extrabold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A]">{step.title}</h3>
                  <p className="mt-1 max-w-sm text-sm text-[#666]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Phone frame with real app screenshots */}
        <div className="relative mx-auto hidden aspect-[9/19] w-64 md:block lg:w-72">
          <div className="absolute inset-0 rounded-[2.8rem] border-[10px] border-[#1A1A1A] bg-[#1A1A1A] shadow-2xl">
            <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1A1A1A]" />
            <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-white">
              {howItWorks.steps.map((step) => (
                <Image
                  key={step.screen}
                  data-screen
                  src={step.screen}
                  alt={`TESTIO app — ${step.title}`}
                  fill
                  sizes="288px"
                  className="object-cover object-top"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
