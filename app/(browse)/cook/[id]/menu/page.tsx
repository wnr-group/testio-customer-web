"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cartStore";
import { DishCard, type Dish } from "@/components/DishCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ShoppingBag, Utensils, ArrowRight, ArrowLeft } from "lucide-react";

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

type MenuDish = Dish & { available_date: string | null };

export default function CookMenuPage() {
  const { id: cookId } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const { cookId: cartCookId, itemCount, total } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kitchenName, setKitchenName] = useState<string>("Home Cook");
  const [dishes, setDishes] = useState<MenuDish[]>([]);
  const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow">("today");

  const todayKey = toDateKey(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrowDate);
  const selectedDateKey = selectedDay === "today" ? todayKey : tomorrowKey;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!cookId) return;

    async function loadMenu() {
      setLoading(true);
      try {
        const [{ data: cookData, error: cookError }, { data: dishData, error: dishError }] = await Promise.all([
          supabase.from("cook_profiles").select("kitchen_name").eq("id", cookId).single(),
          supabase
            .from("dishes")
            .select("*")
            .eq("cook_id", cookId)
            .eq("is_available", true)
            .order("created_at", { ascending: true }),
        ]);

        if (cookError) throw cookError;
        if (dishError) throw dishError;

        const resolvedKitchenName = cookData?.kitchen_name || "Home Cook";
        setKitchenName(resolvedKitchenName);
        setDishes(
          (dishData || []).map((d) => ({
            ...d,
            cook_profiles: { kitchen_name: resolvedKitchenName },
          }))
        );
      } catch (err) {
        console.error("Failed to load menu:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, [cookId, supabase]);

  const visibleDishes = dishes.filter(
    (d) => !d.available_date || d.available_date === selectedDateKey
  );

  const showCartBar = mounted && cartCookId === cookId && itemCount() > 0;

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-8 w-1/3 rounded-md mb-6" />
          <Skeleton className="h-10 w-48 rounded-xl mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8 ${showCartBar ? "pb-28" : ""}`}>
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/cook/${cookId}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-4 w-fit"
        >
          <ArrowLeft className="size-3.5" /> Back to Cook Profile
        </Link>

        <div className="flex items-center gap-2 text-[#B8860B] font-extrabold text-xs mb-2">
          <Utensils className="size-3.5" />
          <span>{kitchenName}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight mb-6">Menu</h1>

        <div
          role="radiogroup"
          aria-label="Menu day"
          className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 w-full sm:w-fit mb-8"
        >
          {(["today", "tomorrow"] as const).map((day) => (
            <label
              key={day}
              className={`flex-1 sm:flex-initial px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer relative focus-within:ring-2 focus-within:ring-[#D61A22] capitalize ${
                selectedDay === day
                  ? "bg-white text-[#D61A22] shadow-sm border border-slate-200/20"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              <input
                type="radio"
                name="menuDay"
                value={day}
                checked={selectedDay === day}
                onChange={() => setSelectedDay(day)}
                className="sr-only"
              />
              <CalendarDays className="size-3.5" />
              <span>{day}</span>
            </label>
          ))}
        </div>

        {visibleDishes.length === 0 ? (
          <div className="text-center max-w-sm mx-auto flex flex-col items-center gap-4 bg-white border border-slate-100/80 rounded-2xl p-8 shadow-sm mt-8">
            <div className="p-4 bg-red-50 rounded-full text-[#D61A22]">
              <ShoppingBag className="size-8" />
            </div>
            <h2 className="text-lg font-bold text-[#091A36]">No dishes available</h2>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              {kitchenName} hasn&apos;t added any dishes for {selectedDay}. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </div>

      {showCartBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-red-50 rounded-full text-[#D61A22]">
                <ShoppingBag className="size-4" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-800">
                  {itemCount()} item{itemCount() > 1 ? "s" : ""} in cart
                </p>
                <p className="text-[11px] font-semibold text-slate-400">₹{total().toFixed(2)}</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/cart")}
              className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs tracking-wider uppercase h-10 px-6 flex items-center gap-1.5"
            >
              View Cart
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
