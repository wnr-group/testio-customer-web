"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#091A36] transition-colors mb-6"
    >
      <ChevronLeft className="size-4" />
      Back
    </button>
  );
}
