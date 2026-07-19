"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-7",
} as const;

const GAP_CLASSES = {
  sm: "gap-0.5",
  md: "gap-1",
  lg: "gap-1.5",
} as const;

interface StarRatingProps {
  value: number;
  onChange?: (n: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}

export function StarRating({ value, onChange, size = "md", readOnly }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = Boolean(onChange) && !readOnly;
  const starClass = SIZE_CLASSES[size];

  return (
    <div
      className={cn("inline-flex items-center", GAP_CLASSES[size])}
      onMouseLeave={() => interactive && setHovered(null)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Rate from 1 to 5 stars" : `Rated ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const displayValue = hovered ?? value;
        const filled = displayValue >= star;
        const halfFilled = !filled && displayValue >= star - 0.5;

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange!(star)}
              onMouseEnter={() => setHovered(star)}
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]/50"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(starClass, "transition-colors")}
                fill={filled ? "#F5A623" : "transparent"}
                stroke={filled ? "#F5A623" : "#cbd5e1"}
                strokeWidth={1.5}
              />
            </button>
          );
        }

        return (
          <span key={star} className="relative inline-flex">
            <Star
              className={starClass}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth={1.5}
            />
            {(filled || halfFilled) && (
              <Star
                className={cn(starClass, "absolute inset-0")}
                fill="#F5A623"
                stroke="#F5A623"
                strokeWidth={1.5}
                style={halfFilled ? { clipPath: "inset(0 50% 0 0)" } : undefined}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
