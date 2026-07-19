'use client'

// Thin red ticker band. Loops continuously; scrolling fast spins it faster
// (velocity-reactive), then it settles back to cruising speed.

import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { marquee } from '@/lib/marketing-content'

export function Marquee() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const row = ref.current!.querySelector<HTMLElement>('[data-row]')!
        const tween = gsap.to(row, { xPercent: -50, ease: 'none', duration: 22, repeat: -1 })
        const st = ScrollTrigger.create({
          onUpdate(self) {
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 4)
            gsap
              .timeline({ overwrite: true })
              .to(tween, { timeScale: boost, duration: 0.2 })
              .to(tween, { timeScale: 1, duration: 1.4 })
          },
        })
        return () => {
          st.kill()
          tween.kill()
        }
      })
    },
    { scope: ref }
  )

  // Content is duplicated so the -50% loop is seamless.
  const items = [...marquee, ...marquee]

  return (
    <div ref={ref} aria-hidden className="overflow-hidden bg-[#E8202A] py-3">
      <div data-row className="flex w-max items-center whitespace-nowrap">
        {items.map((text, i) => (
          <span
            key={i}
            className="flex items-center text-sm font-extrabold uppercase tracking-[0.25em] text-white"
          >
            <span className="px-6">{text}</span>
            <span className="text-[#F5A623]">✳</span>
          </span>
        ))}
      </div>
    </div>
  )
}
