import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { footer } from '@/lib/marketing-content'

export function MarketingFooter() {
  return (
    <footer className="bg-[#191210] px-4 pb-8 pt-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo variant="dark" />
          <p className="mt-3 text-sm font-semibold text-[#F5A623]">{footer.tagline}</p>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/50">{footer.trust}</p>
        </div>
        {footer.columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              {col.heading}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
            Get the app
          </h3>
          <div className="mt-4 flex flex-col gap-2.5">
            {['Google Play', 'App Store'].map((store) => (
              <span
                key={store}
                className="w-44 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/50"
              >
                {store} — coming soon
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
        {footer.legal}
      </div>
    </footer>
  )
}
