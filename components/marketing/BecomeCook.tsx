import { CheckCircle2 } from 'lucide-react'
import { becomeCook } from '@/lib/marketing-content'

// Warm yellow section echoing the launch poster. Server component — the
// CTA is a static badge until the Cook app store listing goes live.
export function BecomeCook() {
  return (
    <section id="become-a-cook" className="bg-[#F5A623] px-4 py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] md:text-5xl">
            {becomeCook.heading}
          </h2>
          <p className="mt-3 text-base font-semibold text-[#1A1A1A]/70">{becomeCook.sub}</p>
          <ul className="mt-6 flex flex-col gap-3">
            {becomeCook.points.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm font-semibold text-[#1A1A1A]">
                <CheckCircle2 className="size-5 shrink-0 text-[#E8202A]" /> {point}
              </li>
            ))}
          </ul>
        </div>
        <span className="shrink-0 rounded-full bg-[#1A1A1A] px-8 py-4 text-sm font-bold text-white shadow-lg">
          {becomeCook.cta}
        </span>
      </div>
    </section>
  )
}
