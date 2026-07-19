import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/marketing/PublicNavbar'
import { Hero } from '@/components/marketing/Hero'
import { Marquee } from '@/components/marketing/Marquee'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { KitchensTeaser } from '@/components/marketing/KitchensTeaser'
import { AmbassadorSection } from '@/components/marketing/AmbassadorSection'
import { BecomeCook } from '@/components/marketing/BecomeCook'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

// Root "/" — logged-in users go straight to /home; everyone else gets the
// marketing site. All sections server-render; GSAP only enhances.
export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/home')

  return (
    <>
      <PublicNavbar />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <KitchensTeaser />
        <AmbassadorSection />
        <BecomeCook />
      </main>
      <MarketingFooter />
    </>
  )
}
