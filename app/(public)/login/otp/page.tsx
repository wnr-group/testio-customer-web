// TODO (TES-167): 6-digit OTP input, countdown timer, resend link
// Uses: supabase.auth.verifyOtp({ phone, token, type: 'sms' })
export default function OtpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <p className="text-[#666]">OTP Verify (TES-167)</p>
    </div>
  )
}
