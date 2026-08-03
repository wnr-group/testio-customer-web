'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Quote } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { ambassador } from '@/lib/marketing-content'
import { cn } from '@/lib/utils'

export function AmbassadorSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Entrance timeline
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 75%',
          },
        })

        // Stagger left content
        tl.fromTo(
          '[data-amb-stagger]',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: 'power3.out' }
        )

        // Quote card sliding fade
        tl.fromTo(
          '[data-amb-quote]',
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.4'
        )

        // Background breathing glow
        gsap.to('[data-amb-glow]', {
          scale: 1.05,
          opacity: 0.8,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })

        // Subtle circular rings parallax
        gsap.to('[data-amb-ring]', {
          y: -50,
          rotation: 5,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        })

        // Hero image ground reveal
        gsap.fromTo(
          '[data-amb-hero]',
          { y: 60, opacity: 0, scale: 0.98 },
          { 
            y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: ref.current, start: 'top 75%' }
          }
        )

        // Subtle float for hero (very subtle 2-4px)
        gsap.to('[data-amb-hero] img', {
          y: -3,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })

        // Float and reveal achievement cards
        gsap.fromTo(
          '[data-amb-card]',
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1, stagger: 0.15, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: ref.current, start: 'top 60%' }
          }
        )
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      data-ambassador-section
      className="relative flex min-h-[min(100svh,65rem)] w-full items-center overflow-hidden bg-[#191210] px-4 py-24 md:py-32"
    >
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,32,42,0.05)_0%,rgba(25,18,16,1)_100%)]" />
      
      {/* Soft circular rings behind everything */}
      <div 
        data-amb-ring 
        className="absolute right-[5%] top-[10%] h-[800px] w-[800px] rounded-full border border-white/[0.02] lg:right-[15%] lg:top-[20%]" 
      />
      <div 
        data-amb-ring 
        className="absolute right-[10%] top-[15%] h-[600px] w-[600px] rounded-full border border-white/[0.03] lg:right-[20%] lg:top-[25%]" 
      />

      <div
        data-amb-glow
        className="absolute bottom-0 right-[10%] h-[70vh] w-[70vh] bg-[radial-gradient(circle_at_center,rgba(232,32,42,0.15)_0%,transparent_60%)] mix-blend-screen blur-[80px]"
      />
      
      {/* Tiny particles / noise pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />

      <div className="relative mx-auto grid w-full max-w-[90rem] gap-16 lg:grid-cols-12 lg:items-center">
        
        {/* Left Side: Content */}
        <div className="relative z-20 flex flex-col justify-center lg:col-span-5 lg:pl-8 xl:pl-16">
          <p data-amb-stagger className="text-xs font-black uppercase tracking-[0.25em] text-[#E8202A]">
            {ambassador.eyebrow}
          </p>
          
          <h2 data-amb-stagger className="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-[#FFF9F2] md:text-6xl xl:text-7xl">
            {ambassador.heading}
          </h2>
          
          <div data-amb-stagger className="mt-8 flex flex-col gap-1 border-l-[3px] border-[#E8202A]/50 pl-5">
            {ambassador.name && (
              <p className="text-xl font-bold tracking-tight text-[#FFF9F2]">{ambassador.name}</p>
            )}
            <p className="text-sm font-semibold text-[#F5A623]/90">{ambassador.title}</p>
          </div>
          
          <p data-amb-stagger className="mt-8 max-w-lg text-lg leading-relaxed text-white/70">
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
                  className="group relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-[#191210]/50 p-5 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#F5A623]/30 hover:bg-[#191210]/80 hover:shadow-[0_10px_40px_rgba(232,32,42,0.15)]"
                >
                  {/* Subtle highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl shadow-inner backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    {stat.value}
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                      {firstWord}
                    </span>
                    <span className="block text-sm font-bold text-white/90">
                      {restWords}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Premium Testimonial Card */}
          {ambassador.quote && (
            <div data-amb-quote className="relative mt-12 overflow-hidden rounded-2xl border border-[#F5A623]/20 bg-[#191210]/60 p-8 shadow-2xl backdrop-blur-xl">
              {/* Thin left accent line */}
              <div className="absolute left-0 top-0 h-full w-[2px] bg-[#E8202A]/70" />
              {/* Large quotation mark */}
              <Quote className="absolute right-6 top-6 h-20 w-20 text-white/[0.03]" />
              <p className="relative z-10 text-lg italic leading-relaxed text-white/80">
                &quot;{ambassador.quote}&quot;
              </p>
            </div>
          )}

          <div data-amb-stagger className="mt-12">
            <Link
              href={ambassador.cta.href}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-[#E8202A] px-8 py-4 text-sm font-bold text-[#FFF9F2] shadow-[0_4px_20px_rgba(232,32,42,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(232,32,42,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5A623]"
            >
              <span className="absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-[100%]" />
              <span className="relative">{ambassador.cta.label}</span>
              <ArrowRight aria-hidden className="relative size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right Side: Visual Redesign */}
        <div className="relative z-10 mt-16 flex h-[500px] w-full items-end justify-center lg:col-span-7 lg:mt-0 lg:h-[800px] xl:h-[900px] lg:justify-center">
          
          <div className="relative flex h-[95%] w-full max-w-[450px] xl:max-w-[500px] items-end justify-center">
            {/* Grounding floor shadow */}
            <div className="absolute bottom-0 left-1/2 h-8 w-[130%] -translate-x-1/2 rounded-[100%] bg-black/90 blur-2xl" />

            {/* Hero Image */}
            <div data-amb-hero className="relative z-20 h-full w-full pt-8">
              <Image
                src={ambassador.images.cutout}
                alt={ambassador.name ?? 'TESTIO brand ambassador'}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] p-4 pt-12 contrast-[1.03] saturate-[0.97]"
              />
            </div>

            {/* Desktop Achievement Gallery */}
            <div className="absolute inset-0 z-30 hidden lg:block pointer-events-none [&>*]:pointer-events-auto">
              {/* Card 1: Top Left */}
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
              
              {/* Card 2: Top Right */}
              <div 
                data-amb-card 
                className="absolute -right-[25%] top-[18%] xl:-right-[30%] xl:top-[18%] rotate-[4deg]"
              >
                <AchievementCard
                  src={ambassador.images.medals}
                  alt="Medal Ceremony"
                  title="Honors"
                />
              </div>

              {/* Card 3: Bottom Left/Center */}
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
          
          {/* Mobile Achievement Carousel */}
          <div className="absolute -bottom-16 left-0 right-0 z-30 flex gap-4 overflow-x-auto px-4 pb-8 pt-4 lg:hidden [&::-webkit-scrollbar]:hidden">
            <AchievementCard src={ambassador.images.portrait1} alt="Competition Portrait" title="Competition" />
            <AchievementCard src={ambassador.images.medals} alt="Medal Ceremony" title="Honors" />
            <AchievementCard src={ambassador.images.portrait2} alt="Trophy Collection" title="Triumphs" />
          </div>
        </div>

      </div>
    </section>
  )
}

function AchievementCard({ src, alt, title }: { src: string; alt: string; title: string }) {
  return (
    <figure 
      className="group relative w-48 shrink-0 overflow-hidden rounded-2xl border border-[#F5A623]/10 bg-[#191210] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-[#F5A623]/40 hover:shadow-[0_30px_60px_rgba(232,32,42,0.2)] xl:w-56"
    >
      {/* Subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5A623]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#191210] shadow-inner">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 224px, 192px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#191210] via-[#191210]/40 to-transparent opacity-90" />
        <figcaption className="absolute bottom-4 left-4 right-4 text-center text-xs font-bold uppercase tracking-widest text-[#FFF9F2] drop-shadow-md">
          {title}
        </figcaption>
      </div>
    </figure>
  )
}
