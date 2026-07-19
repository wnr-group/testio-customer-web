"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  MapPin, 
  User, 
  Coins, 
  Loader2, 
  Utensils,
  ChevronRight
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

// Mock data to match the exact designs from the screenshot if the database is empty
const MOCK_ORDERS = [
  {
    id: "9283",
    kitchen_name: "Anita's Regional Kitchen",
    order_number: "9283",
    status: "out_for_delivery",
    status_label: "Out for Delivery",
    time_label: "Today, 12:45 PM",
    total_amount: 36.00,
    items: [
      { name: "Smoked Butter Chicken x2", price: 24.00 },
      { name: "Garlic Naan x4", price: 12.00 }
    ],
    image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=60" // Avatar of cook
  },
  {
    id: "8841",
    kitchen_name: "The Dim Sum House",
    order_number: "8841",
    status: "completed",
    status_label: "Delivered",
    time_label: "Oct 24, 7:20 PM",
    total_amount: 18.50,
    items: [
      { name: "Shrimp Har Gow x3", price: 18.50 }
    ],
    image_url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=60"
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const cartItemCount = useCartStore((s) => s.itemCount());

  // State Management
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  useEffect(() => {
    async function checkUserAndFetchOrders() {
      setLoading(true);
      try {
        // 1. Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push("/login");
          return;
        }
        setUser(authUser);

        // 2. Check if name is already set in the database
        const { data: profile } = await supabase
          .from("users")
          .select("name")
          .eq("id", authUser.id)
          .single();

        if (profile && profile.name) {
          setProfileName(profile.name);
        } else {
          setProfileName("");
        }

        // 3. First time user: fetch any existing orders (likely empty, but good to check)
        const { data: ordersData } = await supabase
          .from("orders")
          .select(`
            *,
            cook_profiles (
              kitchen_name
            )
          `)
          .eq("customer_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(3);

        setRealOrders(ordersData || []);
      } catch (err) {
        console.error("Dashboard check error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUserAndFetchOrders();
  }, [supabase, router]);

  // Save profile name
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
      router.push("/home");
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
          {/* Sidebar Skeleton */}
          <div className="w-full lg:w-[240px] bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-6">
            <Skeleton className="h-6 w-1/2 rounded-md" />
            <div className="flex flex-col gap-3 mt-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          {/* Main Panel Skeleton */}
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

  // Determine what orders to display based on tab
  // If there are real orders, we filter and show them. If 0 orders, we show MOCK_ORDERS to match screenshot layout.
  const displayOrders = realOrders.length > 0 
    ? realOrders.map((o) => ({
        id: o.id,
        kitchen_name: o.cook_profiles?.kitchen_name || "Home Kitchen",
        order_number: o.order_number || o.id.slice(0, 4),
        status: o.status,
        status_label: o.status === "out_for_delivery" ? "Out for Delivery" : o.status === "completed" ? "Delivered" : o.status.toUpperCase(),
        time_label: new Date(o.created_at).toLocaleDateString(),
        total_amount: o.total_amount,
        items: [] as { name: string; price: number }[], // Detail items might need another join; fallback to basic representation
        image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=60"
      }))
    : [];

  // Filter orders by Active (pending, accepted, preparing, ready, out_for_delivery) vs Past (completed, cancelled)
  const filteredOrders = displayOrders.filter((o) => {
    const isActiveStatus = ["pending", "accepted", "preparing", "ready", "out_for_delivery"].includes(o.status);
    return activeTab === "active" ? isActiveStatus : !isActiveStatus;
  });

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
              <span>My Orders</span>
            </Link>

            <Link 
              href="/addresses" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <Utensils className="size-4 shrink-0" />
              <span>Saved Addresses</span>
            </Link>

            <Link 
              href="/profile" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <User className="size-4 shrink-0" />
              <span>Profile</span>
            </Link>

            <Link 
              href="#" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-sm transition-all"
            >
              <Coins className="size-4 shrink-0" />
              <span>Coins & Referrals</span>
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
          
          {/* 1. Onboarding Form (Only for first-time users completing profile) */}
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

          {/* 2. Order History Header and Tabs */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-3xl font-extrabold text-[#091A36] tracking-tight">Order History</h2>
              
              <div className="flex items-center gap-4">
                {/* Tabs Filter toggle */}
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

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center gap-3">
                <ShoppingCart className="size-10 text-slate-350" />
                <h4 className="text-base font-bold text-slate-750">No {activeTab} orders found</h4>
                <p className="text-slate-400 text-xs max-w-xs leading-relaxed font-semibold">
                  You don&apos;t have any {activeTab} orders at this moment. Tap the button below to browse cooks near you!
                </p>
                <Link href="/home" className="mt-2">
                  <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl text-xs font-bold px-4 py-2">
                    Browse Cooks
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredOrders.map((order) => {
                  const isMock = !realOrders.length;
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-5"
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3 items-center">
                          {/* Profile Image/Avatar */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={order.image_url} 
                            alt={order.kitchen_name}
                            className="size-11 rounded-xl object-cover border border-slate-100"
                          />
                          <div className="flex flex-col">
                            <h4 className="font-extrabold text-[#091A36] text-base leading-snug">
                              {order.kitchen_name}
                            </h4>
                            <span className="text-slate-400 text-xs font-semibold mt-0.5">
                              Order #{order.order_number} - {order.time_label}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase shadow-none border-0 tracking-wider font-bold ${
                          order.status === "out_for_delivery" 
                            ? "bg-[#EAFBF3] text-[#10B981] hover:bg-[#EAFBF3]"
                            : order.status === "completed" 
                            ? "bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#EFF6FF]"
                            : "bg-[#FFF7ED] text-[#F97316] hover:bg-[#FFF7ED]"
                        }`}>
                          {order.status_label}
                        </Badge>
                      </div>

                      {/* Card Items list */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                        {isMock ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-650 font-semibold text-xs leading-relaxed">
                              <span>{item.name}</span>
                              <span className="text-slate-500">${item.price.toFixed(2)}</span>
                            </div>
                          ))
                        ) : (
                          // Real order details fallback format
                          <div className="flex justify-between text-slate-650 font-semibold text-xs leading-relaxed">
                            <span>Order checkout items</span>
                            <span className="text-slate-500">${order.total_amount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                        <div className="text-base font-extrabold text-[#D61A22]">
                          Total: ${order.total_amount.toFixed(2)}
                        </div>

                        {/* Status-dependent actions */}
                        <div className="flex items-center gap-4">
                          {order.status === "out_for_delivery" || order.status === "pending" || order.status === "accepted" || order.status === "preparing" || order.status === "ready" ? (
                            <Link href={`/order/${order.id}`}>
                              <button className="text-xs font-bold text-[#D61A22] hover:underline">
                                Track Order
                              </button>
                            </Link>
                          ) : (
                            <>
                              <Link href="/home">
                                <button className="text-xs font-bold text-[#D61A22] hover:underline">
                                  Reorder
                                </button>
                              </Link>
                              
                              <Link href={`/order/${order.id}/review`}>
                                <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-lg text-xs font-bold px-4 h-8 transition-colors">
                                  Leave Review
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}
