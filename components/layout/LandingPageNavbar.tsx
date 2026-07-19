import Link from "next/link";
import { User } from "lucide-react";

export function LandingPageNavbar() {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[--color-border-color] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/home"
          className="text-xl font-bold text-[--color-brand-primary]"
        >
          TESTIO
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/home"
            className="text-sm font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary]"
          >
            Discover
          </Link>
          <Link
            href="/orders"
            className="text-sm font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary]"
          >
            My Orders
          </Link>
        </nav>

        {/* Mobile nav fallback */}
        <nav className="flex items-center gap-4 md:hidden">
          <Link
            href="/home"
            className="text-xs font-semibold text-[--color-text-secondary] hover:text-[--color-brand-primary]"
          >
            Discover
          </Link>
          <Link
            href="/orders"
            className="text-xs font-semibold text-[--color-text-secondary] hover:text-[--color-brand-primary]"
          >
            My Orders
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Profile */}
          <Link 
            href="/profile"
            aria-label="Profile"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-9 w-9"
          >
            <User className="h-4 w-4 text-slate-500" />
          </Link>
        </div>
      </div>
    </header>
  );
}
