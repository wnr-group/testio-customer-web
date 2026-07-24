'use client'

// Public discovery — the logged-out counterpart of /home. Real data via
// get_nearby_cooks (anon-safe: approved cooks only). Location comes from
// useBrowseLocation: device (granted/prompt) or manual search — never a
// silent default.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { List, LocateFixed, Map as MapIcon, MapPin, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import { CookCard, type CookProfile } from '@/components/CookCard'
import { DishCard, type Dish } from '@/components/DishCard'
import { useBrowseLocation } from '@/hooks/useBrowseLocation'
import { LocationSearchBox } from '@/components/marketing/LocationSearchBox'
import { heroDishes } from '@/lib/marketing-content'

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

type NearbyCook = CookProfile & {
  latitude?: number
  longitude?: number
  lat?: number
  lng?: number
  today_dish_count?: number
}

export default function ExplorePage() {
  const router = useRouter()
  const { location, permission, locating, useMyLocation, setManualLocation } = useBrowseLocation()

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [changingLocation, setChangingLocation] = useState(false)
  const [cooks, setCooks] = useState<NearbyCook[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!location) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: cooksData, error: cooksError } = await supabase.rpc('get_nearby_cooks', {
          user_lat: location.lat,
          user_lng: location.lng,
          radius_meters: 10000,
          today_date: new Date().toISOString().split('T')[0],
        })
        if (cooksError) throw cooksError
        if (cancelled) return
        const nearby = (cooksData as NearbyCook[]) || []
        setCooks(nearby)

        if (nearby.length > 0) {
          const { data: dishesData, error: dishesError } = await supabase
            .from('dishes')
            .select('*, cook_profiles ( kitchen_name )')
            .in(
              'cook_id',
              nearby.map((c) => c.id)
            )
            .eq('is_available', true)
          if (dishesError) throw dishesError
          if (cancelled) return
          setDishes((dishesData as Dish[]) || [])
        } else {
          setDishes([])
        }
      } catch (err) {
        console.error('Explore fetch failed:', err)
        if (!cancelled) toast.error('Failed to load nearby kitchens')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [location])

  const cookMarkers = cooks
    .filter((c) => {
      const lat = c.lat ?? c.latitude;
      const lng = c.lng ?? c.longitude;
      return typeof lat === 'number' && typeof lng === 'number';
    })
    .map((c) => ({
      lng: (c.lng ?? c.longitude)!,
      lat: (c.lat ?? c.latitude)!,
      cookId: c.id,
      kitchenName: c.kitchen_name,
      rating: c.avg_rating != null ? Number(c.avg_rating) : null,
      distanceKm: c.distance_km != null ? Number(c.distance_km) : null,
      dishCount: c.today_dish_count != null ? Number(c.today_dish_count) : null,
      cuisineTypes: c.cuisine_types ?? null,
      imageUrl: c.kitchen_image_url || c.image_url || null,
      isOpen: c.is_open ?? null,
    }))

  return (
    <div className="min-h-screen bg-[#FFF9F2] pb-20">
      {/* Header */}
      <section className="border-b border-[#1A1A1A]/5 bg-white px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A] md:text-3xl">
            Explore home kitchens
          </h1>
          {location ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A]/70">
                <MapPin className="size-4 text-[#E8202A]" /> {location.label}
              </span>
              <button
                type="button"
                onClick={() => setChangingLocation((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-[#1A1A1A]/5 px-4 py-1.5 text-xs font-bold text-[#1A1A1A]/70 transition-colors hover:bg-[#1A1A1A]/10"
              >
                <Navigation className="size-3" /> Change location
              </button>
              {changingLocation && (
                <div className="w-full max-w-md">
                  <LocationSearchBox
                    autoFocus
                    onPick={(p) => {
                      setManualLocation(p)
                      setChangingLocation(false)
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex max-w-xl flex-col gap-3">
              {permission === 'denied' ? (
                <p className="text-sm text-[#666]">
                  Location is blocked — enable it in your browser&apos;s site settings, or search
                  your area:
                </p>
              ) : (
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E8202A] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#c71821] disabled:opacity-60"
                >
                  <LocateFixed className="size-4" /> {locating ? 'Locating…' : 'Use my location'}
                </button>
              )}
              <LocationSearchBox onPick={setManualLocation} />
            </div>
          )}
        </div>
      </section>

      {!location && (
        <section className="px-4 py-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="mb-8 flex items-center justify-center -space-x-6">
              {heroDishes.slice(0, 3).map((dish, i) => (
                <Image
                  key={dish.src}
                  src={dish.src}
                  alt={dish.alt}
                  width={128}
                  height={128}
                  className={`aspect-square rounded-full object-cover shadow-lg ring-4 ring-[#FFF9F2] ${
                    i === 1 ? 'z-10 size-32' : 'size-24 opacity-90'
                  }`}
                />
              ))}
            </div>
            <h2 className="text-xl font-extrabold text-[#1A1A1A] md:text-2xl">
              Real home-cooked food is closer than you think
            </h2>
            <p className="mt-2 max-w-md text-sm text-[#666]">
              Share your location or search your area above and we&apos;ll show you kitchens
              cooking fresh, right now.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {['Fresh daily', 'Verified cooks', 'Hyperlocal'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#1A1A1A]/70 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {location && (
        <div className="mx-auto max-w-7xl px-4">
          {/* view toggle */}
          <div className="flex items-center justify-between py-6">
            <p className="text-sm font-semibold text-[#1A1A1A]/60">
              {loading ? 'Finding kitchens…' : `${cooks.length} kitchens within 10 km`}
            </p>
            <div className="flex items-center rounded-xl border border-[#1A1A1A]/10 bg-white p-1">
              <Button
                onClick={() => setViewMode('list')}
                variant="ghost"
                size="sm"
                className={`h-8 rounded-lg px-3 text-xs font-semibold ${
                  viewMode === 'list' ? 'bg-[#FFF9F2] text-[#1A1A1A]' : 'text-[#1A1A1A]/50'
                }`}
              >
                <List className="size-3.5" /> List
              </Button>
              <Button
                onClick={() => setViewMode('map')}
                variant="ghost"
                size="sm"
                className={`h-8 rounded-lg px-3 text-xs font-semibold ${
                  viewMode === 'map' ? 'bg-[#FFF9F2] text-[#1A1A1A]' : 'text-[#1A1A1A]/50'
                }`}
              >
                <MapIcon className="size-3.5" /> Map
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                </div>
              ))}
            </div>
          ) : cooks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#1A1A1A]/15 bg-white p-14 text-center">
              <p className="text-lg font-bold text-[#1A1A1A]">
                We&apos;re not cooking around {location.label} yet
              </p>
              <p className="mt-1 text-sm text-[#666]">We&apos;re growing fast — try another area.</p>
            </div>
          ) : viewMode === 'map' ? (
            <div className="relative aspect-[2/1] min-h-[400px] w-full overflow-hidden rounded-3xl border border-[#1A1A1A]/10 bg-white shadow-sm">
              <MapView
                center={[location.lng, location.lat]}
                className="h-full w-full"
                markers={cookMarkers}
                userLocation={{ lng: location.lng, lat: location.lat }}
                onViewCookProfile={(cookId) => router.push(`/cook/${cookId}`)}
                onViewCookMenu={(cookId) => router.push(`/cook/${cookId}/menu`)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {cooks.map((cook) => (
                  <CookCard key={cook.id} cook={cook} showButton={false} />
                ))}
              </div>
              {dishes.length > 0 && (
                <div>
                  <h2 className="mb-6 text-lg font-bold text-[#1A1A1A] md:text-xl">
                    What&apos;s cooking today
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {dishes.slice(0, 8).map((dish) => (
                      <DishCard key={dish.id} dish={dish} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
