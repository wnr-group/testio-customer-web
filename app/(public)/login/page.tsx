"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/AuthShell";
import { Logo } from "@/components/brand/Logo";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/utils";



function LoginContent() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const closeHref = safeInternalPath(searchParams.get("next")) || "/";

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phone.length != 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    const formattedPhone = `+91${phone}`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      })

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("OTP sent successfully!")
      sessionStorage.setItem("login_phone", formattedPhone);
      const next = safeInternalPath(searchParams.get("next"));
      if (next) {
        sessionStorage.setItem("login_next", next);
      } else {
        sessionStorage.removeItem("login_next");
      }
      router.push("/login/otp");

    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
    finally {
      setLoading(false);
    }
  };
  
    return (
      <AuthShell closeHref={closeHref}>
        <Card className="relative w-full max-w-[400px] min-w-[320px] shadow-xl border border-slate-100 bg-white rounded-2xl overflow-hidden p-6 sm:p-7 flex flex-col gap-6">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F5A623] via-[#E8202A] to-[#F5A623]" />

          {/* Welcome */}
          <div className="text-center flex flex-col items-center gap-3 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FEECEF] to-[#FDF3E4] flex items-center justify-center shrink-0">
              <Logo withWordmark={false} iconClassName="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome to TESTIO
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Enter your mobile number to get started
              </p>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-3 px-3.5 py-2.5 border border-slate-200 rounded-xl focus-within:border-[#E8202A] focus-within:ring-2 focus-within:ring-[#E8202A]/10 bg-white transition-all">
              <Smartphone className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-800 font-medium text-sm">+91</span>
              <span className="text-slate-300">|</span>
              <label htmlFor="phone" className="sr-only">
                Mobile Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="Mobile Number"
                className="flex-1 bg-transparent border-0 p-0 outline-none text-sm placeholder:text-slate-400 text-slate-800"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="group w-full bg-gradient-to-r from-[#E8202A] to-[#c71821] hover:from-[#c71821] hover:to-[#a91419] text-white font-semibold py-2.5 rounded-xl transition-all h-11 shadow-md shadow-[#E8202A]/20"
            >
              {loading ? (
                "Sending OTP..."
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Send OTP
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          {/* Trust footer */}
          <div className="flex flex-col items-center gap-1.5 border-t border-slate-100 pt-4 text-center">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-[#E8202A]" />
              Your number is safe — used only for login and order updates.
            </p>
            <p className="text-xs text-slate-400">
              By continuing, you agree to our{" "}
              <Link href="/agreement" className="text-slate-600 hover:text-[#E8202A] hover:underline">
                Terms &amp; Privacy Policy
              </Link>
            </p>
          </div>
        </Card>
      </AuthShell>
    );
  }

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 p-4 z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8202A]"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

