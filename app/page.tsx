import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Root "/" — redirect to /home if logged in, else show landing page
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/home')

  // TODO (TES-167): Build full landing page here
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <h1 className="text-4xl font-bold text-[#E8202A]">TESTIO</h1>
      <p className="mt-2 text-lg text-[#666]">Taste of Native</p>
      <a
        href="/login"
        className="mt-8 rounded-xl bg-[#E8202A] px-8 py-3 font-semibold text-white"
      >
        Order Now
      </a>
    </main>
  )
}
