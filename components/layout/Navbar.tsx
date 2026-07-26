"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShoppingCart, User, Menu } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { LogOut } from 'lucide-react' // Import LogOut icon

const emptySubscribe = () => () => {};

export function Navbar() {
  // Subscribe to `items` so React re-renders reliably when items change
  const count = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.qty, 0),
  );
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[--color-border-color] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/home" aria-label="TESTIO home">
          <Logo />
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
          <Link href="/cart" aria-label="Shopping Cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="size-5" />
              {mounted && count > 0 && (
                <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[red] text-[10px] font-bold text-white shadow-sm">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Button>
          </Link>

          {/* Profile */}
          <Link href="/profile" aria-label="User profile">
            <Button variant="ghost" size="icon">
              <User className="size-5" />
            </Button>
          </Link>

          {/* Mobile menu drawer */}
          <Sheet>
            {/* The button that opens the drawer */}
            <SheetTrigger
              className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>

            {/* The drawer panel that slides out */}
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left font-bold">Menu</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col justify-between h-[calc(100vh-80px)] pt-6">
                {/* Navigation Links */}
                <nav className="flex flex-col gap-4">
                  <SheetClose>
                    <Link
                      href="/home"
                      className="block text-base font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary] py-2 transition-colors"
                    >
                      Discover
                    </Link>
                  </SheetClose>

                  <SheetClose>
                    <Link
                      href="/orders"
                      className="block text-base font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary] py-2 transition-colors"
                    >
                      My Orders
                    </Link>
                  </SheetClose>

                  <SheetClose>
                    <Link
                      href="/profile"
                      className="block text-base font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary] py-2 transition-colors"
                    >
                      Profile
                    </Link>
                  </SheetClose>
                </nav>

                {/* Logout Action at Bottom */}
                <div className="border-t border-[--color-border-color] pt-4">
                  <SheetClose>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        console.log("Logging out...");
                      }}
                    >
                      <LogOut className="size-5" />
                      <span className="font-medium">Logout</span>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
