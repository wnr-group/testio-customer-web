"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, MapPin, User } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import OrderCard, { type OrderCardData } from "@/components/order/OrderCard";
import type { OrderStatus } from "@/components/order/StatusStepper";

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

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

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const cartItemCount = useCartStore((s) => s.itemCount());

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderCardData[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push("/login");
          return;
        }

        const { data: ordersData, error } = await supabase
          .from("orders")
          .select(`
            id, order_number, status, total, created_at, cook_id,
            cook_profiles ( kitchen_name, profile_image_url ),
            order_items ( id, quantity, dishes ( name ) ),
            reviews ( id )
          `)
          .eq("customer_id", authUser.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders((ordersData || []).map(mapOrder));
      } catch (err) {
        console.error("Orders fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [supabase, router]);

  const filteredOrders = orders.filter((o) =>
    activeTab === "active" ? ACTIVE_STATUSES.includes(o.status) : !ACTIVE_STATUSES.includes(o.status)
  );

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
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <ShoppingCart className="size-4 shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/orders"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#D61A22] text-white font-bold text-sm shadow-sm transition-all"
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
          <section className="flex flex-col gap-5">
            <div className="flex flex-row items-center justify-between flex-wrap gap-3">
              <h2 className="text-3xl font-extrabold text-[#091A36] tracking-tight">Order History</h2>

              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeTab === "active"
                        ? "bg-white text-[#D61A22] shadow-sm"
                        : "text-slate-500 hover:text-slate-700 bg-transparent"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setActiveTab("past")}
                    className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeTab === "past"
                        ? "bg-white text-[#D61A22] shadow-sm"
                        : "text-slate-500 hover:text-slate-700 bg-transparent"
                    }`}
                  >
                    Past
                  </button>
                </div>

                <Link href="/home">
                  <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl px-4 py-2 font-bold text-xs shadow-sm transition-colors h-8">
                    Browse Cooks
                  </Button>
                </Link>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center gap-3">
                <ShoppingCart className="size-10 text-slate-350" />
                <h4 className="text-base font-bold text-slate-750">
                  {orders.length === 0 ? "You don't have any orders yet" : `No ${activeTab} orders found`}
                </h4>
                <p className="text-slate-400 text-xs max-w-xs leading-relaxed font-semibold">
                  {orders.length === 0
                    ? "You don't have any orders yet, browse cooks near you!"
                    : `You don't have any ${activeTab} orders at this moment. Tap the button below to browse cooks near you!`}
                </p>
                <Link href="/home" className="mt-2">
                  <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl text-xs font-bold px-4 py-2">
                    Browse Cooks
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredOrders.map((order) => (
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
