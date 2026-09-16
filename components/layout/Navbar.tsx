"use client";

import { useSyncExternalStore, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, User, Menu, Bell, LogOut } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'

const emptySubscribe = () => () => {};

export function Navbar() {
  // Subscribe to `items` so React re-renders reliably when items change
  const count = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.qty, 0),
  );
  const clearAuthStore = useAuthStore((s) => s.clear);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { count, error } = await supabase
        .from("notification_logs")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Failed to fetch unread notifications count:", error);
        return;
      }

      if (count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("Error fetching unread notifications count:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications, pathname]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`unread-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notification_logs",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadNotifications();
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, fetchUnreadNotifications]);

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
          {/* Notifications */}
          <Link
            href="/notifications"
            aria-label="Notifications"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
          >
            <Bell className="size-5" />
            {mounted && unreadCount > 0 && (
              <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[red] text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" aria-label="Shopping Cart" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}>
            <ShoppingCart className="size-5" />
            {mounted && count > 0 && (
              <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[red] text-[10px] font-bold text-white shadow-sm">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link href="/profile" aria-label="User profile" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <User className="size-5" />
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
                  <SheetClose
                    nativeButton={false}
                    render={
                      <Link
                        href="/home"
                        className="block text-base font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary] py-2 transition-colors"
                      />
                    }
                  >
                    Discover
                  </SheetClose>

                  <SheetClose
                    nativeButton={false}
                    render={
                      <Link
                        href="/orders"
                        className="block text-base font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary] py-2 transition-colors"
                      />
                    }
                  >
                    My Orders
                  </SheetClose>

                  <SheetClose
                    nativeButton={false}
                    render={
                      <Link
                        href="/notifications"
                        className="flex items-center justify-between text-base font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary] py-2 transition-colors"
                      />
                    }
                  >
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </SheetClose>

                  <SheetClose
                    nativeButton={false}
                    render={
                      <Link
                        href="/profile"
                        className="block text-base font-medium text-[--color-text-secondary] hover:text-[--color-brand-primary] py-2 transition-colors"
                      />
                    }
                  >
                    Profile
                  </SheetClose>
                </nav>

                {/* Logout Action at Bottom */}
                <div className="border-t border-[--color-border-color] pt-4">
                  <SheetClose
                    render={
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          await supabase.auth.signOut();
                          clearAuthStore();
                          router.push("/");
                        }}
                      />
                    }
                  >
                    <LogOut className="size-5" />
                    <span className="font-medium">Logout</span>
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
