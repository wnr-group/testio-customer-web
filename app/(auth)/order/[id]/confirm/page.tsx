"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusStepper, { type OrderStatus } from "@/components/order/StatusStepper";
import { toast } from "sonner";
import { CheckCircle2, ShoppingBag, ArrowRight, Clock, MapPin, Utensils } from "lucide-react";

interface OrderItemRow {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  dishes: { name: string } | null;
}

interface ConfirmedOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  delivery_type: string;
  pickup_time: string | null;
  cook_profiles: { kitchen_name: string } | null;
  order_items: OrderItemRow[];
}

export default function OrderConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          status,
          subtotal,
          tax,
          delivery_fee,
          total,
          delivery_type,
          pickup_time,
          cook_profiles ( kitchen_name ),
          order_items ( id, quantity, unit_price, total_price, dishes ( name ) )
        `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error loading order:", error);
        toast.error("Order not found");
        router.push("/home");
        return;
      }

      setOrder(data as unknown as ConfirmedOrder);
      setLoading(false);
    }

    loadOrder();
  }, [id, supabase, router]);

  if (loading || !order) {
    return (
      <div className="min-h-[80vh] bg-[#FAF8F8] flex items-center justify-center py-12 px-4">
        <div className="bg-white border border-slate-100/80 rounded-2xl p-8 max-w-md w-full shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col items-center gap-6">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex flex-col items-center gap-2 w-full">
            <Skeleton className="h-6 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const isPickup = order.delivery_type === "pickup";

  return (
    <div className="min-h-[80vh] bg-[#FAF8F8] flex items-center justify-center py-12 px-4">
      <div className="bg-white border border-slate-100/80 rounded-2xl p-8 max-w-md w-full shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] text-center flex flex-col items-center gap-6">
        <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="size-10" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-extrabold text-[#091A36] tracking-tight">Order Confirmed!</h1>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Your order has been sent to the kitchen.
          </p>
        </div>

        <div className="w-full">
          <StatusStepper status={order.status} deliveryType={order.delivery_type} compact />
        </div>

        <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-3.5 text-left text-xs font-semibold text-slate-700">
          <div className="flex justify-between border-b border-slate-150/70 pb-2.5">
            <span className="text-slate-400">Order Number</span>
            <span className="font-bold text-slate-800">#{order.order_number}</span>
          </div>

          <div className="flex justify-between border-b border-slate-150/70 pb-2.5">
            <span className="text-slate-400">Kitchen Name</span>
            <span className="font-bold text-slate-800">
              {order.cook_profiles?.kitchen_name || "Home Kitchen"}
            </span>
          </div>

          {isPickup ? (
            <div className="flex gap-2 items-center text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
              <Clock className="size-4 shrink-0 text-amber-600" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold">Pickup Time</p>
                <p className="mt-0.5">{order.pickup_time || "To be confirmed"}</p>
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

        <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-3 text-left">
          <div className="flex items-center gap-1.5 text-[#B8860B] font-extrabold text-xs">
            <Utensils className="size-3.5" />
            <span>Order Items</span>
          </div>
          <div className="flex flex-col divide-y divide-slate-150/70">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0 text-xs">
                <span className="font-bold text-slate-700 truncate pr-2">
                  {item.dishes?.name || "Dish"}{" "}
                  <span className="text-slate-400 font-semibold">× {item.quantity}</span>
                </span>
                <span className="font-bold text-slate-800 shrink-0">₹{item.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-150/70 text-[11px] font-semibold text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex justify-between items-center px-2">
          <span className="text-sm font-bold text-slate-600">Total Paid</span>
          <span className="text-xl font-extrabold text-[#D61A22]">₹{order.total.toFixed(2)}</span>
        </div>

        <div className="flex flex-col gap-2.5 w-full mt-2">
          <Link href={`/order/${order.id}`} className="w-full">
            <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 h-11 shadow-sm">
              <ShoppingBag className="size-4" />
              View Order
            </Button>
          </Link>

          <Link href="/home" className="w-full">
            <Button
              variant="outline"
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 h-11"
            >
              Continue Browsing
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
