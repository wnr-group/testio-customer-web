'use client'

// Shared location picker: geocoding search + draggable map pin + label.
// Load via next/dynamic with { ssr: false } — Mapbox GL needs browser APIs.

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'
import { MapPin, Search, X, Loader2 } from 'lucide-react'
import { reverseGeocode, searchPlaces, type PlaceResult } from '@/lib/utils'

export type PickedLocation = {
  lat: number
  lng: number
  label: string // "Home" | "Work" | "Other"
  address: string // human-readable place name
}

type Props = {
  open: boolean
  initialCenter: { lat: number; lng: number } // where the map opens (viewport only)
  onClose: () => void
  onConfirm: (loc: PickedLocation) => void
  saving?: boolean
}

const LABELS = ['Home', 'Work', 'Other']

export default function LocationPicker({ open, initialCenter, onClose, onConfirm, saving }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [coords, setCoords] = useState(initialCenter)
  const [address, setAddress] = useState('')
  const [label, setLabel] = useState('Home')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [geocoding, setGeocoding] = useState(false)

  // Initialise the map + draggable pin when the picker opens.
  useEffect(() => {
    if (!open || !mapContainerRef.current) return

    const map = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 14,
    })
    mapRef.current = map

    const marker = new mapboxgl.Marker({ color: '#E8202A', draggable: true })
      .setLngLat([initialCenter.lng, initialCenter.lat])
      .addTo(map)
    markerRef.current = marker

    const updateFromLngLat = async (lng: number, lat: number) => {
      setCoords({ lat, lng })
      setGeocoding(true)
      const a = await reverseGeocode(lat, lng)
      setAddress(a || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      setGeocoding(false)
    }

    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat()
      void updateFromLngLat(lng, lat)
    })
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat)
      void updateFromLngLat(e.lngLat.lng, e.lngLat.lat)
    })
    map.on('load', () => map.resize())

    void updateFromLngLat(initialCenter.lng, initialCenter.lat)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced place search.
  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setResults(await searchPlaces(query));
    }, 300);
    return () => clearTimeout(t);
  }, [query])

  const pickResult = (r: PlaceResult) => {
    setQuery(r.name)
    setResults([])
    setAddress(r.name)
    setCoords({ lat: r.lat, lng: r.lng })
    markerRef.current?.setLngLat([r.lng, r.lat])
    mapRef.current?.flyTo({ center: [r.lng, r.lat], zoom: 15 })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Choose your delivery location</h3>
            <p className="text-xs text-slate-400">Search an area or drag the pin to your spot</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 relative">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3">
            <Search className="size-4 text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search area, locality, landmark…"
              className="w-full bg-transparent outline-none text-sm py-2.5 text-slate-800 placeholder:text-slate-400"
            />
          </div>
          {results.length > 0 && (
            <div className="absolute left-5 right-5 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickResult(r)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-start gap-2"
                >
                  <MapPin className="size-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="px-5 pt-3">
          <div
            ref={mapContainerRef}
            className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
          />
        </div>

        {/* Selected address */}
        <div className="px-5 pt-3">
          <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
            <MapPin className="size-4 text-[#E8202A] mt-0.5 shrink-0" />
            <div className="text-sm text-slate-700 min-h-[20px]">
              {geocoding ? (
                <span className="text-slate-400">Locating…</span>
              ) : (
                address || <span className="text-slate-400">Move the pin to set your spot</span>
              )}
            </div>
          </div>
        </div>

        {/* Label chips */}
        <div className="px-5 pt-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Save as</p>
          <div className="flex gap-2">
            {LABELS.map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  label === l
                    ? 'bg-[#E8202A] text-white border-[#E8202A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm */}
        <div className="px-5 py-4 mt-2">
          <Button
            onClick={() => onConfirm({ lat: coords.lat, lng: coords.lng, label, address })}
            disabled={!address || geocoding || saving}
            className="w-full bg-[#E8202A] hover:bg-[#c71821] text-white rounded-xl h-11 font-bold"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Confirm location'}
          </Button>
        </div>
      </div>
    </div>
  )
}
