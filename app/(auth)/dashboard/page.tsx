"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShoppingCart, MapPin, User, Loader2, Utensils } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import OrderCard, { type OrderCardData } from "@/components/order/OrderCard";
import type { OrderStatus } from "@/components/order/StatusStepper";

function mapOrder(raw: any): OrderCardData {
  const itemNames: string[] = (raw.order_items || []).map((oi: any) => {
    const name = oi.dishes?.name || "Item";
    return oi.quantity > 1 ? `${name} x${oi.quantity}` : name;
  });

  return {
    id: raw.id,
    order_number: raw.order_number,
    status: raw.status as OrderStatus,
    total: raw.total,
    created_at: raw.created_at,
    kitchen_name: raw.cook_profiles?.kitchen_name || "Home Kitchen",
    cook_id: raw.cook_id,
    cook_image_url: raw.cook_profiles?.profile_image_url || null,
    item_summary: itemNames.join(", "),
    has_review: Array.isArray(raw.reviews) && raw.reviews.length > 0,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const cartItemCount = useCartStore((s) => s.itemCount());

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [recentOrders, setRecentOrders] = useState<OrderCardData[]>([]);

  useEffect(() => {
    async function checkUserAndFetchOrders() {
      setLoading(true);
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push("/login");
          return;
        }
        setUser(authUser);

        const { data: profile } = await supabase
          .from("users")
          .select("name")
          .eq("id", authUser.id)
          .single();

        setProfileName(profile?.name || "");

        const { data: ordersData } = await supabase
          .from("orders")
          .select(`
            id, order_number, status, total, created_at, cook_id,
            cook_profiles ( kitchen_name, profile_image_url ),
            order_items ( id, quantity, dishes ( name ) ),
            reviews ( id )
          `)
          .eq("customer_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(3);

        setRecentOrders((ordersData || []).map(mapOrder));
      } catch (err) {
        console.error("Dashboard check error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUserAndFetchOrders();
  }, [supabase, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error("Please enter a valid name");
      return;
    }

    setSavingName(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ name: nameInput.trim() })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile completed successfully!");
      setProfileName(nameInput.trim());
    } catch (err: any) {
      toast.error(err.message || "Failed to complete profile");
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-12">
        <div className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[240px] bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-6">
            <Skeleton className="h-6 w-1/2 rounded-md" />
            <div className="flex flex-col gap-3 mt-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-8 w-1/4 rounded-md mt-4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-8 items-start">

        {/* ==================== LEFT SIDEBAR ==================== */}
        <aside className="w-full lg:w-[240px] shrink-0 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col gap-6">
          <div>
            <h4 className="text-lg font-extrabold text-[#9C0A15] tracking-tight">Your Order</h4>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">From Local Kitchens</p>
          </div>

          <nav className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#D61A22] text-white font-bold text-sm shadow-sm transition-all"
            >
              <ShoppingCart className="size-4 shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/orders"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <ShoppingCart className="size-4 shrink-0" />
              <span>My Orders</span>
            </Link>

            <Link
              href="/addresses"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <MapPin className="size-4 shrink-0" />
              <span>Saved Addresses</span>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <User className="size-4 shrink-0" />
              <span>Profile</span>
            </Link>
          </nav>

          <Link href="/cart" className="mt-2 block w-full">
            <Button className="w-full bg-[#A30D1B] hover:bg-[#820710] text-white rounded-xl py-5 font-bold text-xs tracking-wider transition-colors uppercase h-10">
              View Cart {cartItemCount > 0 && `(${cartItemCount})`}
            </Button>
          </Link>
        </aside>

        {/* ==================== RIGHT PANEL ==================== */}
        <main className="flex-1 flex flex-col gap-6 w-full">

          {/* Onboarding form for first-time users completing their profile */}
          {!profileName && (
            <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1 text-center md:text-left">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  Welcome to TESTIO!
                </h2>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Save your name below to complete your profile and start ordering.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-center shrink-0">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full sm:w-56 px-3.5 py-2 border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#D61A22] focus:border-[#D61A22] bg-white h-9"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  disabled={savingName}
                />
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl px-5 py-2 font-bold text-xs tracking-wider transition-colors h-9 shrink-0 shadow-sm"
                  disabled={savingName}
                >
                  {savingName ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </form>
            </section>
          )}

          {/* Browse Cooks CTA */}
          <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-50 text-[#D61A22] shrink-0">
                <Utensils className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hungry for something new?</h3>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">
                  Discover home-cooked meals from kitchens near you.
                </p>
              </div>
            </div>
            <Link href="/home" className="w-full md:w-auto shrink-0">
              <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl px-5 py-2 font-bold text-xs tracking-wider transition-colors h-9 shadow-sm">
                Browse Cooks
              </Button>
            </Link>
          </section>

          {/* Recent Orders */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-3xl font-extrabold text-[#091A36] tracking-tight">Recent Orders</h2>
              {recentOrders.length > 0 && (
                <Link href="/orders" className="text-xs font-bold text-[#D61A22] hover:underline">
                  View All
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center gap-3">
                <ShoppingCart className="size-10 text-slate-350" />
                <h4 className="text-base font-bold text-slate-750">You don&apos;t have any orders yet</h4>
                <p className="text-slate-400 text-xs max-w-xs leading-relaxed font-semibold">
                  You don&apos;t have any orders yet, browse cooks near you!
                </p>
                <Link href="/home" className="mt-2">
                  <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl text-xs font-bold px-4 py-2">
                    Browse Cooks
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recentOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}
