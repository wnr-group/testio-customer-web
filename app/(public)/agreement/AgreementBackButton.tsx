"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function AgreementBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="mb-4 text-slate-600 hover:text-slate-900 -ml-2 rounded-xl font-semibold"
    >
      <ChevronLeft className="size-4 mr-1" />
      Back
    </Button>
  );
}
