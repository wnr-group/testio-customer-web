import { House, ShieldCheck, Sprout, Truck } from 'lucide-react'
import { trustRibbon } from '@/lib/marketing-content'

const ICONS = {
  home: House,
  shield: ShieldCheck,
  truck: Truck,
  sprout: Sprout,
} as const

// The hero's closing strip. Rendered inside <Hero> rather than as a sibling
// so it lands above the fold and travels with the pinned section.
export function TrustRibbon() {
  return (
    <div data-ink aria-label="Why TESTIO" className="w-full bg-green-deep">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-5 md:grid-cols-4 md:gap-x-6 md:py-6">
        {trustRibbon.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <li key={item.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-paper/10 ring-1 ring-paper/20">
                <Icon aria-hidden className="size-5 text-brand-secondary" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-paper">{item.title}</span>
                <span className="block truncate text-xs text-paper/70">{item.sub}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
