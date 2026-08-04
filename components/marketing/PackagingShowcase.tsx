import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  FlaskConical,
  Globe,
  Leaf,
  Recycle,
  RefreshCw,
  Sprout,
  UtensilsCrossed,
} from 'lucide-react'
import { packaging, type PackagingIconName } from '@/lib/marketing-content'

const ICONS: Record<PackagingIconName, typeof Leaf> = {
  leaf: Leaf,
  recycle: Recycle,
  flask: FlaskConical,
  utensils: UtensilsCrossed,
  sprout: Sprout,
  globe: Globe,
  refresh: RefreshCw,
}

// Sustainability section, directly under the hero. Server component — fully
// static, and the collage is CSS, so it adds no image request.
export function PackagingShowcase() {
  return (
    <section
      id="packaging"
      aria-labelledby="packaging-heading"
      className="bg-surface px-4 py-section lg:py-section-lg"
    >
      <div className="mx-auto max-w-6xl">
        {/* problem → solution → benefits */}
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-green-deep/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-green-deep">
            <Leaf aria-hidden className="size-3.5" />
            {packaging.problem}
          </p>
          <h2
            id="packaging-heading"
            className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl"
          >
            {packaging.heading}
          </h2>
          <p className="mt-3 text-base font-semibold text-text-primary/70 md:text-lg">
            {packaging.sub}
          </p>
        </div>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* the visual is the section's hero element */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[--radius-frame] shadow-float ring-1 ring-text-primary/5 sm:rounded-[--radius-panel]">
            <Image
              src="/marketing/box.png"
              alt="Testio Eco-friendly Packaging"
              fill
              sizes="(min-width: 1024px) 46vw, 92vw"
              className="object-contain object-center"
            />
          </div>

          <div>
            <p data-body-text="packaging-benefits" className="max-w-lg text-base leading-relaxed text-text-secondary sm:text-sm">
              {packaging.benefits}
            </p>

            <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {packaging.features.map((feature) => {
                const Icon = ICONS[feature.icon]
                return (
                  <li
                    key={feature.label}
                    className="flex items-center gap-2.5 rounded-xl border border-text-primary/10 bg-cream px-3 py-3 shadow-card"
                  >
                    <Icon
                      aria-hidden
                      className="size-4 shrink-0 text-green-deep"
                      strokeWidth={2.25}
                    />
                    <span className="min-w-0 truncate text-xs font-bold text-text-primary">
                      {feature.label}
                    </span>
                  </li>
                )
              })}
            </ul>

            <Link
              href={packaging.cta.href}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-deep px-7 py-3.5 text-sm font-bold text-paper shadow-float transition-colors hover:bg-green-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-deep"
            >
              {packaging.cta.label}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
