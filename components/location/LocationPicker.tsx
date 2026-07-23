'use client'

// Shared location picker: geocoding search + draggable map pin + label.
// Load via next/dynamic with { ssr: false } — Mapbox GL needs browser APIs.

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'
import { MapPin, Search, X, Loader2, ArrowLeft } from 'lucide-react'
import { reverseGeocode, searchPlaces, type PlaceResult } from '@/lib/utils'

export type PickedLocation = {
  lat: number
  lng: number
  label: string // "Home" | "Work" | "Other"
  address: string // human-readable place name
  isDefault: boolean
}

export type SavedAddress = {
  id: string
  label: string
  address_line: string
  lat: number
  lng: number
}

type Props = {
  open: boolean
  initialCenter: { lat: number; lng: number } // where the map opens (viewport only)
  onClose: () => void
  onConfirm: (loc: PickedLocation) => void
  saving?: boolean
  initialLabel?: string
  initialAddress?: string
  initialIsDefault?: boolean
  savedAddresses?: SavedAddress[] // when non-empty, shows a "pick an existing address" list before the map
  onSelectSaved?: (addr: SavedAddress) => void // called instead of onConfirm — no DB write
}

const LABELS = ['Home', 'Work', 'Other']

export default function LocationPicker({
  open,
  initialCenter,
  onClose,
  onConfirm,
  saving,
  initialLabel,
  initialAddress,
  initialIsDefault,
  savedAddresses,
  onSelectSaved,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [coords, setCoords] = useState(initialCenter)
  const [address, setAddress] = useState(initialAddress ?? '')
  const [label, setLabel] = useState(initialLabel ?? 'Home')
  const [isDefault, setIsDefault] = useState(initialIsDefault ?? false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [geocoding, setGeocoding] = useState(false)

  // Two-step flow: show the saved-address list first (if there is one) and
  // only mount the pin-drop map once the user explicitly asks to add a new
  // address. Callers that never pass savedAddresses (add/edit address pages)
  // always land straight on 'map', matching their existing behavior exactly.
  const hasSavedAddresses = Boolean(savedAddresses && savedAddresses.length > 0)
  const [view, setView] = useState<'list' | 'map'>(hasSavedAddresses ? 'list' : 'map')
  const wasOpenRef = useRef(false)

  // Reset to the correct starting view only on the closed→open transition,
  // so an in-flight savedAddresses fetch completing while already open
  // doesn't yank the user back to the list mid-pin-drop.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setView(hasSavedAddresses ? 'list' : 'map')
    }
    wasOpenRef.current = open
  }, [open, hasSavedAddresses])

  // Initialise the map + draggable pin when the picker opens.
  useEffect(() => {
    if (!open || view !== 'map' || !mapContainerRef.current) return

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

    if (!initialAddress) {
      void updateFromLngLat(initialCenter.lng, initialCenter.lat)
    }

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [open, view]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced place search.
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setResults(await searchPlaces(query))
    }, 300)
    return () => clearTimeout(t)
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
          <div className="flex items-center gap-2 min-w-0">
            {view === 'map' && hasSavedAddresses && (
              <button
                onClick={() => setView('list')}
                aria-label="Back to saved addresses"
                className="text-slate-400 hover:text-slate-700 p-1 -ml-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900">
                {view === 'list' ? 'Choose a delivery address' : 'Choose your delivery location'}
              </h3>
              <p className="text-xs text-slate-400">
                {view === 'list'
                  ? 'Pick a saved address or add a new one'
                  : 'Search an area or drag the pin to your spot'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Saved addresses — pick one instead of dropping a new pin */}
        {view === 'list' && savedAddresses && savedAddresses.length > 0 && (
          <div className="px-5 pt-4 pb-2 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500">Saved addresses</p>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => onSelectSaved?.(addr)}
                  className="w-full text-left flex items-start gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 transition-colors"
                >
                  <MapPin className="size-4 text-[#E8202A] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">{addr.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{addr.address_line}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setView('map')}
              className="w-full text-left text-xs font-bold text-[#E8202A] hover:underline pt-1 pb-1"
            >
              + Add a new address
            </button>
          </div>
        )}

        {view === 'map' && (
        <>
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

        {/* Set as default checkbox */}
        <div className="px-5 pt-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            Set as default
          </label>
        </div>

        {/* Confirm */}
        <div className="px-5 py-4 mt-2">
          <Button
            onClick={() => onConfirm({ lat: coords.lat, lng: coords.lng, label, address, isDefault })}
            disabled={!address || geocoding || saving}
            className="w-full bg-[#E8202A] hover:bg-[#c71821] text-white rounded-xl h-11 font-bold"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Confirm location'}
          </Button>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
