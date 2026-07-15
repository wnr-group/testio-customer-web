"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

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

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Cart */}
         
          {/* Profile */}
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              
            </Button>
          </Link>

         
        </div>
      </div>
    </header>
  );
}
