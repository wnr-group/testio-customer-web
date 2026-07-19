'use client'

// Live kitchens on the landing page — real approved cooks from
// get_nearby_cooks. Geolocation flow per spec: granted → auto, prompt →
// "Use my location" button (user-gesture prompt), denied → settings hint +
// manual search. Never a silent default area.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LocateFixed, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CookCard, type CookProfile } from '@/components/CookCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useBrowseLocation } from '@/hooks/useBrowseLocation'
import { LocationSearchBox } from '@/components/marketing/LocationSearchBox'
import { kitchensTeaser } from '@/lib/marketing-content'

export function KitchensTeaser() {
  const { location, permission, locating, useMyLocation, setManualLocation } = useBrowseLocation()
  const [cooks, setCooks] = useState<CookProfile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!location) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_nearby_cooks', {
        user_lat: location.lat,
        user_lng: location.lng,
        radius_meters: 10000,
        today_date: new Date().toISOString().split('T')[0],
      })
      if (cancelled) return
      if (error) console.error('Nearby cooks failed:', error)
      setCooks(((data as CookProfile[]) || []).slice(0, 4))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [location])

  return (
    <section className="bg-[#FFF9F2] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] md:text-4xl">
              {kitchensTeaser.heading}
            </h2>
            <p className="mt-2 text-sm text-[#666]">
              {location ? `Near ${location.label}` : kitchensTeaser.sub}
            </p>
          </div>
          <Link
            href={kitchensTeaser.seeAll.href}
            className="inline-flex items-center gap-1 text-sm font-bold text-[#E8202A] hover:underline"
          >
            {kitchensTeaser.seeAll.label} <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8">
          {!location ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-[#1A1A1A]/15 bg-white p-10 text-center">
              <MapPin className="size-10 text-[#E8202A]" />
              {permission === 'denied' ? (
                <>
                  <p className="font-bold text-[#1A1A1A]">Location is blocked in your browser</p>
                  <p className="max-w-md text-sm text-[#666]">
                    Enable it in your browser&apos;s site settings, or search your area below.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[#1A1A1A]">See kitchens near you</p>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-2 rounded-full bg-[#E8202A] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#c71821] disabled:opacity-60"
                  >
                    <LocateFixed className="size-4" /> {locating ? 'Locating…' : 'Use my location'}
                  </button>
                  <p className="text-xs text-[#666]">or search your area</p>
                </>
              )}
              <div className="w-full max-w-md">
                <LocationSearchBox onPick={setManualLocation} />
              </div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[16/12] w-full rounded-2xl" />
              ))}
            </div>
          ) : cooks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#1A1A1A]/15 bg-white p-10 text-center">
              <p className="font-bold text-[#1A1A1A]">
                We&apos;re not cooking around {location.label} yet
              </p>
              <p className="mt-1 text-sm text-[#666]">We&apos;re growing fast — try another area:</p>
              <div className="mx-auto mt-4 max-w-md">
                <LocationSearchBox onPick={setManualLocation} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cooks.map((cook) => (
                <CookCard key={cook.id} cook={cook} showButton={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
