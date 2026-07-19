"use client";

import { Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "delivery_assigned"
  | "picked_up"
  | "delivered"
  | "completed"
  | "cancelled"
  | "rejected";

interface StatusStepperProps {
  status: OrderStatus;
  compact?: boolean;
  deliveryType?: string | null;
}

interface Step {
  statuses: OrderStatus[];
  label: string;
}

const PICKUP_STEPS: Step[] = [
  { statuses: ["pending"], label: "Placed" },
  { statuses: ["accepted"], label: "Accepted" },
  { statuses: ["preparing"], label: "Preparing" },
  { statuses: ["ready"], label: "Ready" },
  { statuses: ["completed", "delivered"], label: "Completed" },
];

// delivery_assigned and picked_up are both order-level statuses (see
// orders_status_check) but collapse into a single "On the way" step here —
// the live tracking map is what distinguishes them for the customer.
const DELIVERY_STEPS: Step[] = [
  { statuses: ["pending"], label: "Placed" },
  { statuses: ["accepted"], label: "Accepted" },
  { statuses: ["preparing"], label: "Preparing" },
  { statuses: ["ready"], label: "Ready" },
  { statuses: ["delivery_assigned", "picked_up"], label: "On the way" },
  { statuses: ["completed", "delivered"], label: "Completed" },
];

function stepState(index: number, currentIndex: number, steps: Step[]) {
  const isFinalStepDone = index === steps.length - 1 && index === currentIndex;
  const isDone = index < currentIndex || isFinalStepDone;
  const isCurrent = index === currentIndex && !isFinalStepDone;
  return { isDone, isCurrent };
}

function StepDot({
  isDone,
  isCurrent,
  size,
}: {
  isDone: boolean;
  isCurrent: boolean;
  size: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center transition-colors",
        size === "sm" ? "size-6" : "size-9",
        isDone && "bg-[#D61A22] text-white",
        isCurrent && "bg-[#D61A22] text-white ring-4 ring-[#D61A22]/15",
        !isDone && !isCurrent && "bg-white border-2 border-slate-200 text-slate-300"
      )}
    >
      {isDone ? (
        <Check className={size === "sm" ? "size-3.5" : "size-4"} strokeWidth={3} />
      ) : (
        <span className={cn("rounded-full bg-current", size === "sm" ? "size-1.5" : "size-2")} />
      )}
    </div>
  );
}

export default function StatusStepper({ status, compact = false, deliveryType }: StatusStepperProps) {
  if (status === "cancelled" || status === "rejected") {
    const isRejected = status === "rejected";
    return (
      <div
        className={cn(
          "w-full flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl text-red-600",
          compact ? "p-3" : "p-4"
        )}
      >
        <div className="shrink-0 size-9 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="size-5" />
        </div>
        <div className="flex flex-col">
          <p className={cn("font-bold text-red-700", compact ? "text-xs" : "text-sm")}>
            {isRejected ? "Order Rejected" : "Order Cancelled"}
          </p>
          {!compact && (
            <p className="text-[11px] font-semibold text-red-500/80 mt-0.5">
              {isRejected
                ? "The cook wasn't able to accept this order."
                : "This order will not be prepared or delivered."}
            </p>
          )}
        </div>
      </div>
    );
  }

  const steps = deliveryType === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIndex = steps.findIndex((s) => s.statuses.includes(status));

  if (compact) {
    return (
      <div className="w-full flex items-start">
        {steps.map((step, index) => {
          const { isDone, isCurrent } = stepState(index, currentIndex, steps);
          const isLast = index === steps.length - 1;
          const lineDone = index < currentIndex;

          return (
            <div key={step.label} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-center">
                <StepDot isDone={isDone} isCurrent={isCurrent} size="sm" />
                {!isLast && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-1",
                      lineDone ? "bg-[#D61A22]" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
              <p
                className={cn(
                  "text-[9px] font-bold mt-1 text-center leading-tight",
                  isDone || isCurrent ? "text-[#091A36]" : "text-slate-300"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: vertical list */}
      <div className="w-full flex flex-col sm:hidden">
        {steps.map((step, index) => {
          const { isDone, isCurrent } = stepState(index, currentIndex, steps);
          const isLast = index === steps.length - 1;
          const lineDone = index < currentIndex;

          return (
            <div key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepDot isDone={isDone} isCurrent={isCurrent} size="md" />
                {!isLast && (
                  <div
                    className={cn("w-0.5 flex-1 min-h-6 my-1", lineDone ? "bg-[#D61A22]" : "bg-slate-200")}
                  />
                )}
              </div>
              <p
                className={cn(
                  "text-sm font-bold pt-1.5",
                  isLast ? "" : "pb-5",
                  isDone || isCurrent ? "text-[#091A36]" : "text-slate-300"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Desktop: horizontal row */}
      <div className="w-full hidden sm:flex items-start">
        {steps.map((step, index) => {
          const { isDone, isCurrent } = stepState(index, currentIndex, steps);
          const isLast = index === steps.length - 1;
          const lineDone = index < currentIndex;

          return (
            <div key={step.label} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-center">
                <StepDot isDone={isDone} isCurrent={isCurrent} size="md" />
                {!isLast && (
                  <div
                    className={cn("flex-1 h-0.5 mx-2", lineDone ? "bg-[#D61A22]" : "bg-slate-200")}
                  />
                )}
              </div>
              <p
                className={cn(
                  "text-xs font-bold mt-2 text-center",
                  isDone || isCurrent ? "text-[#091A36]" : "text-slate-300"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
