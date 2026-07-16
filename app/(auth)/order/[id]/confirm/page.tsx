import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, ArrowRight, Clock, MapPin } from "lucide-react";

export default async function OrderConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch order data and cook profile to display detailed confirmation info
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      cook_profiles (
        kitchen_name
      )
    `)
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const isPickup = order.delivery_type === "pickup";

  return (
    <div className="min-h-[80vh] bg-[#FAF8F8] flex items-center justify-center py-12 px-4">
      <div className="bg-white border border-slate-100/80 rounded-2xl p-8 max-w-md w-full shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] text-center flex flex-col items-center gap-6">
        
        {/* Success Check Icon */}
        <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 animate-bounce">
          <CheckCircle2 className="size-10" />
        </div>

        {/* Header Title */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-extrabold text-[#091A36] tracking-tight">Order Confirmed!</h1>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Your order has been sent to the kitchen.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-3.5 text-left text-xs font-semibold text-slate-700">
          <div className="flex justify-between border-b border-slate-150/70 pb-2.5">
            <span className="text-slate-400">Order Number</span>
            <span className="font-bold text-slate-800">#{order.order_number}</span>
          </div>

          <div className="flex justify-between border-b border-slate-150/70 pb-2.5">
            <span className="text-slate-400">Kitchen Name</span>
            <span className="font-bold text-slate-800">{order.cook_profiles?.kitchen_name || "Home Kitchen"}</span>
          </div>

          <div className="flex justify-between border-b border-slate-150/70 pb-2.5">
            <span className="text-slate-400">Delivery Type</span>
            <span className="font-bold text-slate-800 capitalize">{order.delivery_type}</span>
          </div>

          {isPickup ? (
            <div className="flex gap-2 items-center text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
              <Clock className="size-4 shrink-0 text-amber-600" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold">Pickup Time</p>
                <p className="mt-0.5">{order.pickup_time}</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-center text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
              <MapPin className="size-4 shrink-0 text-emerald-600" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold">Delivery Address</p>
                <p className="mt-0.5 text-slate-600 font-medium">Delivering to your selected address</p>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Info */}
        <div className="w-full flex justify-between items-center px-2">
          <span className="text-sm font-bold text-slate-600">Total Paid</span>
          <span className="text-xl font-extrabold text-[#D61A22]">₹{order.total.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          <Link href={`/order/${order.id}`} className="w-full">
            <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl py-5 font-bold text-xs flex items-center justify-center gap-1.5 h-10 shadow-sm">
              <ShoppingBag className="size-4" />
              Track Order
            </Button>
          </Link>

          <Link href="/home" className="w-full">
            <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-5 font-bold text-xs flex items-center justify-center gap-1.5 h-10">
              Continue Shopping
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
