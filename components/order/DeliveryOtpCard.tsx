"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeliveryOtpCardProps {
  otp: string;
}

export default function DeliveryOtpCard({ otp }: DeliveryOtpCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      toast.success("OTP copied");
    } catch {
      toast.error("Couldn't copy OTP");
    }
  };

  return (
    <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
      <div>
        <p className="font-bold text-[#091A36] text-sm">Delivery OTP</p>
        <p className="text-slate-400 text-[11px] font-semibold mt-0.5">
          Share this code with your delivery partner to confirm delivery
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="text-2xl font-extrabold text-[#D61A22] tracking-[0.35em] tabular-nums"
          aria-live="polite"
        >
          {otp}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          className="border-slate-200 text-[#091A36] hover:bg-slate-50 rounded-xl font-bold text-xs tracking-wider uppercase h-9 flex items-center gap-1.5 shrink-0 shadow-none"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Card>
  );
}
