"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import type { OrderStatus } from "@/components/order/StatusStepper";

export interface OrderCardData {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string | null;
  kitchen_name: string;
  cook_id: string;
  cook_image_url: string | null;
  item_summary: string;
  has_review: boolean;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  delivery_assigned: "Delivery Assigned",
  picked_up: "On the Way",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: "bg-[#FFF7ED] text-[#F97316] hover:bg-[#FFF7ED]",
  accepted: "bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#EFF6FF]",
  preparing: "bg-[#FFF7ED] text-[#F97316] hover:bg-[#FFF7ED]",
  ready: "bg-[#EAFBF3] text-[#10B981] hover:bg-[#EAFBF3]",
  delivery_assigned: "bg-[#EAFBF3] text-[#10B981] hover:bg-[#EAFBF3]",
  picked_up: "bg-[#EAFBF3] text-[#10B981] hover:bg-[#EAFBF3]",
  delivered: "bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#EFF6FF]",
  completed: "bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#EFF6FF]",
  cancelled: "bg-red-50 text-red-600 hover:bg-red-50",
  rejected: "bg-red-50 text-red-600 hover:bg-red-50",
};

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "delivery_assigned",
  "picked_up",
];

export default function OrderCard({ order }: { order: OrderCardData }) {
  const isActive = ACTIVE_STATUSES.includes(order.status);
  const dateLabel = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-5">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-3 items-center min-w-0">
          {order.cook_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.cook_image_url}
              alt={order.kitchen_name}
              className="size-11 rounded-xl object-cover border border-slate-100 shrink-0"
            />
          ) : (
            <div className="size-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
              <Utensils className="size-5" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <h4 className="font-extrabold text-[#091A36] text-base leading-snug truncate">
              {order.kitchen_name}
            </h4>
            <span className="text-slate-400 text-xs font-semibold mt-0.5">
              Order #{order.order_number} · {dateLabel}
            </span>
          </div>
        </div>

        <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase shadow-none border-0 tracking-wider shrink-0 ${STATUS_BADGE_CLASS[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
        <p className="text-slate-500 font-semibold text-xs leading-relaxed line-clamp-2">
          {order.item_summary || "Order items unavailable"}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto gap-3">
        <div className="text-base font-extrabold text-[#D61A22] shrink-0">
          ₹{order.total.toFixed(2)}
        </div>

        <div className="flex items-center gap-4">
          {isActive ? (
            <Link href={`/order/${order.id}`}>
              <button className="text-xs font-bold text-[#D61A22] hover:underline">
                Track Order
              </button>
            </Link>
          ) : order.status === "cancelled" || order.status === "rejected" ? (
            <Link href={`/order/${order.id}`}>
              <button className="text-xs font-bold text-slate-400 hover:text-slate-600 hover:underline">
                View Details
              </button>
            </Link>
          ) : (
            <>
              <Link href={`/cook/${order.cook_id}`}>
                <button className="text-xs font-bold text-[#D61A22] hover:underline">
                  Reorder
                </button>
              </Link>

              {order.has_review ? (
                <span className="text-xs font-bold text-slate-350">Reviewed</span>
              ) : (
                <Link href={`/order/${order.id}/review`}>
                  <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white rounded-lg text-xs font-bold px-4 h-8 transition-colors">
                    Leave Review
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
