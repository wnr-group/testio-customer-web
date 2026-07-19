'use client'

// Manual location entry — Mapbox Geocoding autocomplete, India-biased via
// lib/utils.searchPlaces. Shown wherever device location is unavailable or
// denied, and behind every "change location" affordance.

import { useEffect, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { searchPlaces, type PlaceResult } from '@/lib/utils'

type Props = {
  onPick: (place: PlaceResult) => void
  placeholder?: string
  autoFocus?: boolean
}

export function LocationSearchBox({
  onPick,
  placeholder = 'Search your area, locality or city…',
  autoFocus = false,
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setResults(await searchPlaces(query))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const pick = (r: PlaceResult) => {
    setQuery('')
    setResults([])
    onPick(r)
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-[#1A1A1A]/10 bg-white px-3 shadow-sm">
        <Search className="size-4 shrink-0 text-[#1A1A1A]/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search your location"
          className="w-full bg-transparent py-2.5 text-sm text-[#1A1A1A] outline-none placeholder:text-[#1A1A1A]/40"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-[#1A1A1A]/10 bg-white shadow-lg">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              type="button"
              onClick={() => pick(r)}
              className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-[#1A1A1A]/80 hover:bg-[#FFF9F2]"
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#1A1A1A]/40" />
              <span className="line-clamp-2">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
