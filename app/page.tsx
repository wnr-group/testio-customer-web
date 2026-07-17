import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPageNavbar } from '@/components/layout/LandingPageNavbar'
import Link from 'next/link'

// Root "/" — redirect to /home if logged in, else show landing page
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/home')

  // TODO (TES-167): Build full landing page here
  return (
    <>
      <LandingPageNavbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <h1 className="text-7xl font-bold text-[#E8202A]">TESTIO</h1>
        <p className="mt-2 text-lg text-[#666]">Taste of Native</p>
        <Link
          href="/login"
          className="mt-8 rounded-xl bg-[#E8202A] px-10 py-4 font-semibold text-white"
        >
          Order Now
        </Link>

        <h2 className="text-5xl font-bold text-[#E8202A] my-7 mt-10 text-center md:text-left">
          How It Works
        </h2>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl mx-auto justify-center items-stretch my-8 px-4">
        {/* Step 1 */}
        <div className="flex flex-row items-center gap-4 bg-white border-2 border-[#E8202A] text-slate-800 p-5 rounded-2xl shadow-sm w-full md:w-1/3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-[#E8202A] text-white font-bold text-xl">
            1
          </div>
          <div className="text-lg font-semibold leading-snug text-left">
            Find a cook
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-row items-center gap-4 bg-white border-2 border-[#E8202A] text-slate-800 p-5 rounded-2xl shadow-sm w-full md:w-1/3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-[#E8202A] text-white font-bold text-xl">
            2
          </div>
          <div className="text-lg font-semibold leading-snug text-left">
            Order online
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-row items-center gap-4 bg-white border-2 border-[#E8202A] text-slate-800 p-5 rounded-2xl shadow-sm w-full md:w-1/3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-[#E8202A] text-white font-bold text-xl">
            3
          </div>
          <div className="text-lg font-semibold leading-snug text-left">
            Pick up fresh
          </div>
        </div>
      </div>

     
    </main>
  </>
  );
}
