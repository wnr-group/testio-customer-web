"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrder, type OrderStatus } from "@/hooks/useRealtimeOrder";
import StatusStepper from "@/components/order/StatusStepper";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Phone,
  Star,
  Utensils,
  Loader2,
  XCircle,
} from "lucide-react";

const OrderTrackingMap = dynamic(() => import("@/components/order/OrderTrackingMap"), {
  ssr: false,
});

const LIVE_TRACKING_STATUSES: OrderStatus[] = [
  "accepted",
  "preparing",
  "ready",
  "delivery_assigned",
  "picked_up",
];

interface OrderItemRow {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  dishes: { name: string; image_url: string | null } | null;
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  tax: number | null;
  delivery_fee: number | null;
  total: number;
  delivery_type: string | null;
  pickup_time: string | null;
  cancellation_reason: string | null;
  created_at: string | null;
  cook_id: string;
  cook_profiles: { kitchen_name: string; profile_image_url: string | null } | null;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasReview, setHasReview] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cookPhone, setCookPhone] = useState<string | null>(null);
  const [cookPhoneLoading, setCookPhoneLoading] = useState(true);

  const { status: liveStatus } = useRealtimeOrder(id);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `id, order_number, status, subtotal, tax, delivery_fee, total, delivery_type, pickup_time, cancellation_reason, created_at, cook_id,
           cook_profiles ( kitchen_name, profile_image_url )`
        )
        .eq("id", id)
        .single();

      if (orderError || !orderData) {
        toast.error("Order not found");
        router.push("/orders");
        return;
      }
      setOrder(orderData as unknown as OrderRow);

      // Runs independently of the main load flow so setLoading(false) below
      // doesn't wait on it — the button has its own cookPhoneLoading state.
      supabase
        .rpc("get_order_cook_phone", { p_order_id: id })
        .then(({ data: phoneData, error: phoneError }) => {
          if (phoneError) {
            console.error("Fetch cook phone error:", phoneError);
          }
          setCookPhone(typeof phoneData === "string" && phoneData.trim() ? phoneData : null);
          setCookPhoneLoading(false);
        });

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("id, quantity, unit_price, total_price, dishes ( name, image_url )")
        .eq("order_id", id);
      setItems((itemsData as unknown as OrderItemRow[]) ?? []);

      if (orderData.status === "completed") {
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("id")
          .eq("order_id", id)
          .maybeSingle();
        setHasReview(!!reviewData);
      }

      setLoading(false);
    }

    load();
  }, [id, supabase, router]);

  const currentStatus: OrderStatus = (liveStatus ?? (order?.status as OrderStatus)) || "pending";
  const canCancel = currentStatus === "pending" || currentStatus === "accepted";

  const handleCancelOrder = async () => {
    if (!order) return;
    const reason = window.prompt("Please tell us why you're cancelling this order:");
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("A cancellation reason is required");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    setCancelling(true);
    try {
      // orders has no customer UPDATE RLS policy (only cook_update /
      // customer_select / customer_insert) — a direct client-side update
      // here matches 0 rows and PostgREST reports that as success, so this
      // must go through cancel-order (service_role), which also restores
      // dish quantities, issues the refund, and notifies the cook.
      const { data, error } = await supabase.functions.invoke("cancel-order", {
        body: { order_id: order.id, reason: reason.trim() },
      });
      if (error) {
        const body = await error.context?.json?.().catch(() => null);
        throw new Error(body?.error || error.message);
      }
      if (data?.error) throw new Error(data.error);

      setOrder({ ...order, status: "cancelled", cancellation_reason: reason.trim() });
      toast.success("Order cancelled");
    } catch (err) {
      console.error("Cancel order error:", err);
      const message = err instanceof Error ? err.message : "Failed to cancel order. Please try again.";
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-8 px-4 md:px-8">
        <div className="mx-auto max-w-3xl flex flex-col gap-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const kitchenName = order.cook_profiles?.kitchen_name || "Home Kitchen";
  const kitchenImage = order.cook_profiles?.profile_image_url;

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-8 px-4 md:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/orders"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-4 w-fit"
        >
          <ArrowLeft className="size-3.5" /> Back to Orders
        </Link>

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#091A36] tracking-tight">
              Order #{order.order_number}
            </h1>
            {order.created_at && (
              <p className="text-slate-400 text-xs font-semibold mt-1">
                Placed on{" "}
                {new Date(order.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
          {currentStatus === "completed" && !hasReview && (
            <Link href={`/order/${order.id}/review`}>
              <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5">
                <Star className="size-3.5" />
                Rate your order
              </Button>
            </Link>
          )}
        </div>

        {/* Status Card */}
        <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 mb-6">
          <StatusStepper status={currentStatus} deliveryType={order.delivery_type} />
          {currentStatus === "cancelled" && order.cancellation_reason && (
            <p className="text-[11px] font-semibold text-red-500/80 mt-3">
              Reason: {order.cancellation_reason}
            </p>
          )}
        </Card>

        {/* Live Tracking Map — delivery orders only, while actually in progress */}
        {order.delivery_type === "delivery" && LIVE_TRACKING_STATUSES.includes(currentStatus) && (
          <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden mb-6">
            <div className="w-full aspect-[16/9] sm:aspect-[2/1] relative">
              <OrderTrackingMap orderId={order.id} className="w-full h-full relative" />
            </div>
          </Card>
        )}

        {/* Cook Info Card */}
        <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-12 relative rounded-full overflow-hidden bg-slate-50 border border-slate-150 shrink-0">
              {kitchenImage ? (
                <Image src={kitchenImage} alt={kitchenName} fill className="object-cover" sizes="48px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <Utensils className="size-5 text-slate-300" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#091A36] text-sm truncate">{kitchenName}</p>
              {order.delivery_type === "pickup" && order.pickup_time ? (
                <p className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mt-0.5">
                  <Clock className="size-3" /> Pickup: {order.pickup_time}
                </p>
              ) : (
                <p className="text-slate-400 text-[11px] font-semibold mt-0.5 capitalize">
                  {order.delivery_type || "delivery"}
                </p>
              )}
            </div>
          </div>

          {cookPhoneLoading ? (
            <Button
              disabled
              className="bg-slate-100 text-slate-400 hover:bg-slate-100 rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5 cursor-not-allowed shrink-0 shadow-none"
            >
              <Phone className="size-3.5" />
              Call Cook
            </Button>
          ) : cookPhone ? (
            <a
              href={`tel:${cookPhone}`}
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5 shrink-0 shadow-none"
              )}
            >
              <Phone className="size-3.5" />
              <div className="flex flex-col leading-none">
                <span>Call Cook</span>
                <span className="text-[10px]">{cookPhone}</span>
              </div>
            </a>
          ) : (
            <Button
              disabled
              className="bg-slate-100 text-slate-400 hover:bg-slate-100 rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5 cursor-not-allowed shrink-0 shadow-none"
            >
              <Phone className="size-3.5" />
              Phone unavailable
            </Button>
          )}
        </Card>

        {/* Itemized Bill */}
        <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 mb-6">
          <h2 className="text-sm font-bold text-[#091A36] mb-4">Order Items</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="size-14 relative rounded-xl overflow-hidden bg-slate-50 border border-slate-150 shrink-0">
                  {item.dishes?.image_url ? (
                    <Image
                      src={item.dishes.image_url}
                      alt={item.dishes.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Utensils className="size-5 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {item.dishes?.name || "Dish"}
                  </p>
                  <p className="text-slate-400 text-[11px] font-semibold mt-0.5">
                    Qty {item.quantity} × ₹{item.unit_price.toFixed(2)}
                  </p>
                </div>
                <span className="font-bold text-[#D61A22] text-sm shrink-0">
                  ₹{item.total_price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="bg-slate-100/70 my-4" />

          <div className="flex flex-col gap-2 text-xs font-semibold">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span>
                {order.delivery_fee ? `₹${order.delivery_fee.toFixed(2)}` : "Free"}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes</span>
              <span>₹{(order.tax ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <Separator className="bg-slate-100/70 my-4" />

          <div className="flex justify-between items-center text-sm font-bold text-slate-800">
            <span>Total</span>
            <span className="text-xl font-extrabold text-[#D61A22]">₹{order.total.toFixed(2)}</span>
          </div>
        </Card>

        {canCancel && (
          <Button
            onClick={handleCancelOrder}
            disabled={cancelling}
            variant="outline"
            className="w-full border-red-200 text-[#D61A22] hover:bg-red-50 rounded-xl font-bold text-xs tracking-wider uppercase h-11 flex items-center justify-center gap-1.5"
          >
            {cancelling ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Cancelling...
              </>
            ) : (
              <>
                <XCircle className="size-3.5" /> Cancel Order
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
