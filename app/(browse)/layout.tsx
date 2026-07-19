// Publicly viewable browse pages (explore + cook pages). Auth-aware chrome:
// logged-in users keep the full app Navbar; visitors get the public one.
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { PublicNavbar } from '@/components/marketing/PublicNavbar'
import { PendingDishAutoAdd } from '@/components/marketing/PendingDishAutoAdd'

export default async function BrowseLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      {user ? <Navbar /> : <PublicNavbar solid />}
      <PendingDishAutoAdd />
      <main>{children}</main>
    </div>
  )
}
