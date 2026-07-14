'use client'

import Link from 'next/link'
import { ShoppingCart, User, Menu } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[--color-border-color] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/home" className="text-xl font-bold text-[--color-brand-primary]">
          TESTIO
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/home" className="text-sm font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary]">
            Discover
          </Link>
          <Link href="/orders" className="text-sm font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary]">
            My Orders
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="size-5" />
            </Button>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[--color-brand-primary] text-[10px] font-semibold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <User className="size-5" />
            </Button>
          </Link>

          {/* Mobile menu — placeholder, implement drawer in TES-173 */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
