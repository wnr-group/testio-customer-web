"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Utensils } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, cookName, updateQty, removeItem, total, itemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-12">
        <div className="mx-auto max-w-5xl px-4">
          <SkeletonCart />
        </div>
      </div>
    );
  }

  const subtotal = total();
  const serviceFee = subtotal > 0 ? 25 : 0;
  const tax = subtotal * 0.05; // 5% tax
  const checkoutTotal = subtotal + serviceFee + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4 bg-white border border-slate-100/80 rounded-2xl p-8 shadow-sm">
          <div className="p-4 bg-red-50 rounded-full text-[#D61A22]">
            <ShoppingCart className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-[#091A36]">Your cart is empty</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Looks like you haven&apos;t added any home-cooked meals to your cart yet.
          </p>
          <Link href="/home" className="w-full mt-2">
            <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs">
              Browse Cooks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight mb-8">My Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ==================== LEFT: ITEMS LIST ==================== */}
          <div className="flex-1 flex flex-col gap-6 w-full">
            <Card className="bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] overflow-hidden">
              <CardHeader className="border-b border-slate-50 px-6 py-4">
                <div className="flex items-center gap-2 text-slate-800">
                  <Utensils className="size-4 text-[#D61A22]" />
                  <span className="font-bold text-sm">Ordering from {cookName}</span>
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100/70 p-0">
                {items.map((item) => (
                  <div key={item.dishId} className="flex gap-4 p-6 items-center">
                    {/* Dish Image */}
                    <div className="size-16 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-100/80 shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Utensils className="size-6" />
                        </div>
                      )}
                    </div>

                    {/* Dish Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                      <p className="text-[#D61A22] text-xs font-bold mt-1">₹{item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity Selector & Remove Action */}
                    <div className="flex items-center gap-6 shrink-0">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-slate-50 border border-slate-200/50 rounded-xl p-0.5 h-8">
                        <button
                          onClick={() => updateQty(item.dishId, item.qty - 1)}
                          className="size-7 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.dishId, item.qty + 1)}
                          className="size-7 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.dishId)}
                        className="text-slate-400 hover:text-[#D61A22] transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ==================== RIGHT: ORDER SUMMARY ==================== */}
          <div className="w-full lg:w-[320px] shrink-0">
            <Card className="bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-4">
              <CardTitle className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">
                Order Summary
              </CardTitle>

              <div className="flex flex-col gap-2.5 text-xs font-semibold">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-600 font-bold">Free</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service Fee</span>
                  <span>₹{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="bg-slate-100/80" />

              <div className="flex justify-between text-base font-extrabold text-[#D61A22]">
                <span>Total</span>
                <span>₹{checkoutTotal.toFixed(2)}</span>
              </div>

              <Button
                onClick={() => router.push("/checkout")}
                className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl py-5 font-bold text-xs tracking-wider transition-colors mt-2 h-10 flex items-center justify-center gap-1.5"
              >
                Proceed to Checkout
                <ArrowRight className="size-3.5" />
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCart() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-pulse mt-8">
      <div className="flex-1 bg-white rounded-2xl p-6 border border-slate-100 h-64 flex flex-col gap-4">
        <Skeleton className="h-6 w-1/4 rounded-md" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="w-full lg:w-[320px] bg-white rounded-2xl p-5 border border-slate-100 h-48 flex flex-col gap-4">
        <Skeleton className="h-5 w-1/2 rounded-md" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
