'use client'

// Location state for logged-out browsing (landing teaser + /explore).
// Never falls back to a default area: the visitor either grants device
// location or picks a place manually.
//   permission: idle    → still checking the Permissions API
//               prompt  → we may ask; show a "Use my location" button
//                         (the browser prompt must fire on a user gesture)
//               granted → already granted; coords resolve automatically
//               denied  → browsers block re-prompting; manual search only

import { useCallback, useEffect, useState } from 'react'
import { reverseGeocode, type PlaceResult } from '@/lib/utils'

export type BrowseLocation = {
  lat: number
  lng: number
  label: string
  source: 'device' | 'manual'
}
export type BrowsePermission = 'idle' | 'prompt' | 'granted' | 'denied'

const STORAGE_KEY = 'browse_location'

function loadStored(): BrowseLocation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') return parsed
  } catch {
    // corrupted / private mode — ignore
  }
  return null
}

export function useBrowseLocation() {
  const [location, setLocationState] = useState<BrowseLocation | null>(null)
  const [permission, setPermission] = useState<BrowsePermission>('idle')
  const [locating, setLocating] = useState(false)

  const setLocation = useCallback((loc: BrowseLocation) => {
    setLocationState(loc)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
    } catch {
      // private mode — session-only is fine
    }
  }, [])

  const resolveDevice = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPermission('denied')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const label = (await reverseGeocode(lat, lng)) || 'Current location'
        setPermission('granted')
        setLocation({ lat, lng, label, source: 'device' })
        setLocating(false)
      },
      (err) => {
        setPermission(err.code === err.PERMISSION_DENIED ? 'denied' : 'prompt')
        setLocating(false)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [setLocation])

  useEffect(() => {
    const stored = loadStored()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setLocationState(stored)

    let cancelled = false
    void (async () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        if (!cancelled) setPermission('denied')
        return
      }
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' })
        if (cancelled) return
        if (status.state === 'granted') {
          setPermission('granted')
          if (!stored) resolveDevice()
        } else if (status.state === 'denied') {
          setPermission('denied')
        } else {
          setPermission('prompt')
        }
        status.onchange = () => {
          if (cancelled) return
          setPermission(
            status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'prompt'
          )
        }
      } catch {
        // Permissions API unsupported (older Safari) — we can still prompt.
        if (!cancelled) setPermission('prompt')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setManualLocation = useCallback(
    (place: PlaceResult) => {
      setLocation({ lat: place.lat, lng: place.lng, label: place.name, source: 'manual' })
    },
    [setLocation]
  )

  // useMyLocation is the user-gesture entry point (fires the browser prompt).
  return { location, permission, locating, useMyLocation: resolveDevice, setManualLocation }
}
