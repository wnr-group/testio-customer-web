'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reverseGeocode } from '@/lib/utils'

export type LocationSource = 'device' | 'saved' | 'picked'
export type ResolvedLocation = {
  lat: number
  lng: number
  label: string
  source: LocationSource
}
// resolving  → still figuring out where the user is
// ready      → we have a location to show cooks for
// needs-picker → no device location and no saved address; the user must pick one
export type ResolveStatus = 'resolving' | 'ready' | 'needs-picker'

async function tryGeolocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null
  // Avoid re-prompting if the user has already denied permission.
  try {
    const perms = (navigator as unknown as { permissions?: { query?: (d: unknown) => Promise<{ state: string }> } }).permissions
    if (perms?.query) {
      const status = await perms.query({ name: 'geolocation' })
      if (status.state === 'denied') return null
    }
  } catch {
    // Permissions API unsupported — fall through and let getCurrentPosition prompt.
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000 }
    )
  })
}

/**
 * Resolves the user's delivery location on mount, in priority order:
 *   1. device geolocation (if permitted)
 *   2. their default saved address
 *   3. otherwise → status 'needs-picker' so the UI can ask them to choose a spot
 * Never falls back to a hardcoded location.
 */
export function useResolvedLocation() {
  const [location, setLocationState] = useState<ResolvedLocation | null>(null)
  const [status, setStatus] = useState<ResolveStatus>('resolving')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const supabase = createClient()

      // 1. Device geolocation
      const geo = await tryGeolocation()
      if (cancelled) return
      if (geo) {
        const label = (await reverseGeocode(geo.lat, geo.lng)) || 'Current location'
        if (cancelled) return
        setLocationState({ lat: geo.lat, lng: geo.lng, label, source: 'device' })
        setStatus('ready')
        return
      }

      // 2. Default saved address
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('customer_addresses')
            .select('label, address_line, lat, lng, is_default, created_at')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
          const a = data?.[0]
          if (!cancelled && a && a.lat != null && a.lng != null) {
            setLocationState({
              lat: Number(a.lat),
              lng: Number(a.lng),
              label: a.label || a.address_line || 'Saved address',
              source: 'saved',
            })
            setStatus('ready')
            return
          }
        }
      } catch (e) {
        console.error('Failed to load saved address', e)
      }
      if (cancelled) return

      // 3. Nothing to go on — ask the user to pick a spot.
      setStatus('needs-picker')
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Called when the user picks/changes a location (e.g. from the picker).
  const setLocation = useCallback((loc: ResolvedLocation) => {
    setLocationState(loc)
    setStatus('ready')
  }, [])

  return { location, status, setLocation }
}
