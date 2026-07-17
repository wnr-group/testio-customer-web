// TODO (TES-167): 6-digit OTP input, countdown timer, resend link
// Uses: supabase.auth.verifyOtp({ phone, token, type: 'sms' })
'use client'
import { useSearchParams } from "next/navigation"
import { useState ,useRef, useEffect, Suspense} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function OtpPageContent() {

  const router = useRouter();
  const supabase = createClient();

  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhone(sessionStorage.getItem("login_phone") || "");
    }
  }, []);

  const otpInputs = Array(6).fill("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const canResend = countdown <= 0;
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // focus next block
  const handleChange = (value: string, index: number) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) return;

    const newOtp = [...otp];
    newOtp[index] = cleanValue.substring(cleanValue.length - 1);
    setOtp(newOtp);

    if (index < 5 && cleanValue)
    {
      inputRefs.current[index + 1]?.focus();
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace")
    {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
      
    }
  };

  // paste functionality
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) {
      toast.error("Please paste a valid 6-digit OTP");
      return;
    }

    const digits = pastedData.split("");
    setOtp(digits);

    // Focus the last input box after pasting
    inputRefs.current[5]?.focus();
  };


  const handleClickVerify = async (e:React.FormEvent) => {
    e.preventDefault();

    const code = otp.join("");
    if (!phone || code.length !== 6) {
      if (!phone) {
        toast.error("Phone number is missing. Please restart the login process.");
      } else {
        toast.error("Please enter a complete 6-digit OTP code.");
      }
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

       if (error) {
         toast.error(error.message);
         setOtp(Array(6).fill(""));
       } else {
         const user = data.user;
         if (user) {
           const { data: userProfile, error: profileError } = await supabase
             .from("users")
             .select("name")
             .eq("id", user.id)
             .single();

            if (profileError) {
              if (profileError.code === "PGRST116") {
                toast.success("Successfully logged in!");
                router.push("/dashboard"); // First-time user onboarding (missing profile row)
              } else {
                toast.error(profileError.message);
              }
            } else {
              toast.success("Successfully logged in!");
              if (userProfile && userProfile.name) {
                router.push("/home"); // Returning user with a setup profile
              } else {
                router.push("/dashboard"); // First-time user onboarding (profile exists but no name)
              }
            }
         }
       }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    }
    finally {
      setLoading(false);
    }
    

   
  }

  const handleResend = async (e:React.FormEvent) => {
    if (resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (!error) {
        toast.success("New OTP code sent!");
        setCountdown(60);
        setOtp(Array(6).fill(""));
        inputRefs.current[0]?.focus(); // Refocus first field
      } else {
        toast.error(error.message);
      }
    } finally {
      setResending(false);
    }
  }



  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 p-4 z-50">
      <Card className="w-full max-w-[400px] min-w-[320px] shadow-lg border border-slate-100 bg-white rounded-2xl p-6 flex flex-col gap-6">
        {/* Brand Logo and Title */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#FEECEF] rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-[#E8202A] font-bold text-xl">T</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Verify Mobile Number
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              We sent a 6-digit OTP code to {phone}
            </p>
          </div>
        </div>

        {/* Form wrapping OTP inputs and verification Button */}
        <form onSubmit={handleClickVerify} className="flex flex-col gap-6">
          {/* 6-Digit OTP Inputs */}
          <div className="flex justify-between gap-2 my-2" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                inputMode="numeric"
                maxLength={1}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                autoFocus={idx === 0}
                aria-label={`Digit ${idx + 1}`}
                name={`otp-digit-${idx + 1}`}
                className="w-12 h-12 text-center text-lg font-semibold text-slate-800 border border-slate-200 rounded-xl outline-none focus:border-[#E8202A] focus:ring-2 focus:ring-[#E8202A]/10 bg-white transition-all"
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            type="submit"
            disabled={loading || otp.some((d) => d === "")}
            className="w-full bg-[#E8202A] hover:bg-[#c71821] text-white font-semibold py-2.5 rounded-xl transition-colors h-11"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>

        {/* Resend OTP and Timer */}
        <div className="text-center text-sm">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-[#E8202A] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          ) : (
            <span className="text-slate-400">Resend OTP in {countdown}s</span>
          )}
        </div>
      </Card>
    </div>
  );

}

export default function OtpPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 p-4 z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8202A]"></div>
      </div>
    }>
      <OtpPageContent />
    </Suspense>
  );
}
