"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase/client";
import { LoginPromptSheet } from "@/components/marketing/LoginPromptSheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export interface Dish {
  id: string;
  cook_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  max_quantity: number;
  dietary_status?: string | null;
  cook_profiles?: {
    kitchen_name: string;
  };
}

interface DishCardProps {
  dish: Dish;
}

export function DishCard({ dish }: DishCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const cartItems = useCartStore((s) => s.items);
  const currentCookId = useCartStore((s) => s.cookId);
  const currentCookName = useCartStore((s) => s.cookName);
  const [mounted, setMounted] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const cartItem = cartItems.find((i) => i.dishId === dish.id);
  const qty = cartItem ? cartItem.qty : 0;

  const isVeg = dish.dietary_status
    ? !dish.dietary_status.toLowerCase().includes("non") &&
      dish.dietary_status.toLowerCase().includes("veg")
    : false;

  const handleAdd = async () => {
    const kitchenName = dish.cook_profiles?.kitchen_name || "Home Cook";

    // Logged-out visitors: remember the dish, then prompt to sign in.
    // getSession reads local storage — no network round-trip per click.
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      try {
        sessionStorage.setItem(
          "pending_dish",
          JSON.stringify({
            cookId: dish.cook_id,
            cookName: kitchenName,
            item: {
              dishId: dish.id,
              name: dish.name,
              price: dish.price,
              qty: 1,
              imageUrl: dish.image_url || undefined,
              max_quantity: dish.max_quantity,
            },
          })
        );
      } catch {
        // private mode — the login gate still works, just no auto-add
      }
      setShowLoginPrompt(true);
      return;
    }

    // Ask user for confirmation if they are ordering from a different kitchen
    if (currentCookId && currentCookId !== dish.cook_id) {
      const confirmClear = window.confirm(
        `Your cart contains items from "${currentCookName}". Adding this item will clear your current cart. Do you want to continue?`
      );
      if (!confirmClear) return;
    }

    addItem(dish.cook_id, kitchenName, {
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      qty: 1,
      imageUrl: dish.image_url || undefined,
      max_quantity: dish.max_quantity,
    });
    toast.success(`Added ${dish.name} to cart`);
  };

  const handleIncrement = () => {
    if (qty >= dish.max_quantity) {
      toast.error(`Maximum quantity of ${dish.max_quantity} reached`);
      return;
    }
    updateQty(dish.id, qty + 1);
  };

  const handleDecrement = () => {
    updateQty(dish.id, qty - 1);
  };

  return (
    <Card className="w-full shadow-sm bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col group h-full pt-0 pb-0">
      {/* Aspect Ratio Image with Overlay badges - attached to top of card */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dish.image_url || "/placeholder-dish.jpg"}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
          }}
        />

        {/* Capsule Veg / Non-Veg Indicator Badge */}
        {dish.dietary_status && (
          <div className="absolute top-3 left-3 bg-white/95 px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1.5 border border-slate-100">
            <div
              className={`w-2 h-2 rounded-full ${
                isVeg ? "bg-[#2DB34A]" : "bg-[#D32F2F]"
              }`}
            />
            <span
              className={`text-[9px] font-extrabold ${
                isVeg ? "text-[#2DB34A]" : "text-[#D32F2F]"
              }`}
            >
              {dish.dietary_status.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-4 flex flex-col flex-1 gap-2.5 justify-between">
        <div className="flex flex-col gap-1">
          {/* Dish Title */}
          <h4 className="font-bold text-slate-800 text-base leading-snug line-clamp-1">
            {dish.name}
          </h4>

          {/* Kitchen / Cook Source */}
          <p className="text-xs text-slate-400 font-medium line-clamp-1">
            {dish.cook_profiles?.kitchen_name || "Home Cook"}
            <span> • Serves {/(thali|platter|feast|set)/i.test(dish.name) ? "1-2" : "1"}</span>
          </p>

          {/* Description */}
          {dish.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-1 leading-normal">
              {dish.description}
            </p>
          )}
        </div>

        {/* Price and Add Controls */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {/* Brand Red Price Text */}
          <span className="font-extrabold text-[#E8202A] text-lg">
            ₹{Number(dish.price).toFixed(2)}
          </span>

          {mounted && qty > 0 ? (
            /* Selected Quantity Controls */
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden h-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDecrement}
                aria-label={`Decrease ${dish.name}`}
                className="w-7 h-7 rounded-none hover:bg-slate-100"
              >
                <Minus className="size-3 text-slate-600" />
              </Button>
              <span className="px-2 font-bold text-slate-800 text-xs">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleIncrement}
                disabled={qty >= dish.max_quantity}
                aria-label={`Increase ${dish.name}`}
                className="w-7 h-7 rounded-none hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="size-3 text-slate-600" />
              </Button>
            </div>
          ) : (
            /* Circular Pink Plus Action Button */
            <button
              onClick={handleAdd}
              aria-label={`Add ${dish.name} to cart`}
              className="w-8 h-8 rounded-full bg-[#FEECEF] hover:bg-[#FCD7DC] text-[#E8202A] flex items-center justify-center transition-all font-extrabold text-lg shadow-sm border border-transparent hover:scale-105 active:scale-95"
            >
              +
            </button>
          )}
        </div>
      </div>

      <LoginPromptSheet
        dish={dish}
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </Card>
  );
}
