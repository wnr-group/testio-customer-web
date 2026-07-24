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

const STORAGE_KEY = 'resolved_location'

// Persisted across mounts (but not across browser sessions) so that
// navigating away from /home and back doesn't re-run the resolution
// chain and silently overwrite a location the user already picked.
function loadStored(userId?: string): ResolvedLocation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.location?.lat === 'number' && 
      typeof parsed.location?.lng === 'number' && 
      typeof parsed.location?.label === 'string' &&
      ['device', 'saved', 'picked'].includes(parsed.location?.source) &&
      parsed.userId === userId
    ) {
      return parsed.location as ResolvedLocation
    }
  } catch {
    // corrupted / private mode — ignore
  }
  return null
}

function storeLocation(loc: ResolvedLocation, userId?: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ location: loc, userId }))
  } catch {
    // private mode — session-only is fine
  }
}

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
 * Resolves the user's delivery location, in priority order:
 *   1. a location already persisted this session (a prior device/saved/picked resolution)
 *   2. device geolocation (if permitted)
 *   3. their default saved address
 *   4. otherwise → status 'needs-picker' so the UI can ask them to choose a spot
 * Never falls back to a hardcoded location.
 */
export function useResolvedLocation() {
  const [location, setLocationState] = useState<ResolvedLocation | null>(null)
  const [status, setStatus] = useState<ResolveStatus>('resolving')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // 0. Already resolved/picked earlier this session — skip re-resolving
      // entirely so a manual pick survives unmount/remount (e.g. back-navigation).
      const stored = loadStored(user?.id)
      if (stored) {
        if (cancelled) return
        setLocationState(stored)
        setStatus('ready')
        return
      }

      // 1. Device geolocation
      const geo = await tryGeolocation()
      if (cancelled) return
      if (geo) {
        const label = (await reverseGeocode(geo.lat, geo.lng)) || 'Current location'
        if (cancelled) return
        const resolved: ResolvedLocation = { lat: geo.lat, lng: geo.lng, label, source: 'device' }
        setLocationState(resolved)
        setStatus('ready')
        storeLocation(resolved, user?.id)
        return
      }

      // 2. Default saved address
      try {
        if (user) {
          const { data } = await supabase
            .from('customer_addresses')
            .select('label, address_line, lat, lng, is_default, created_at')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
          const a = data?.[0]
          if (!cancelled && a && a.lat != null && a.lng != null) {
            const resolved: ResolvedLocation = {
              lat: Number(a.lat),
              lng: Number(a.lng),
              label: a.label || a.address_line || 'Saved address',
              source: 'saved',
            }
            setLocationState(resolved)
            setStatus('ready')
            storeLocation(resolved, user?.id)
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
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      storeLocation(loc, user?.id)
    })
  }, [])

  return { location, status, setLocation }
}
