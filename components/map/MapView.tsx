'use client'

// This component must ONLY be loaded via next/dynamic with { ssr: false }
// Mapbox GL JS requires browser APIs (WebGL, window, document)
// Usage: const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export type MapMarker = {
  lng: number
  lat: number
  cookId: string
  kitchenName: string
  rating?: number | null
  distanceKm?: number | null
  dishCount?: number | null
  cuisineTypes?: string[] | null
  imageUrl?: string | null
  isOpen?: boolean | null
}

type Props = {
  center: [number, number] // [lng, lat]
  zoom?: number
  className?: string
  markers?: MapMarker[]
  userLocation?: { lng: number; lat: number } // "You are here" — a small dot, distinct from cook pins
  onMapReady?: (map: mapboxgl.Map) => void
  onViewCookProfile?: (cookId: string) => void
  onViewCookMenu?: (cookId: string) => void
}

// Builds the popup body via DOM APIs (not innerHTML) — kitchen_name and cuisine
// tags are cook-authored text, so string-interpolated HTML would be an XSS risk.
function buildCookPopupContent(
  mk: MapMarker,
  onViewProfile: (cookId: string) => void,
  onViewMenu: (cookId: string) => void
): HTMLElement {
  const root = document.createElement('div')
  root.style.cssText = 'width:208px;font-family:inherit;'

  if (mk.imageUrl) {
    const img = document.createElement('img')
    img.src = mk.imageUrl
    img.alt = ''
    img.style.cssText =
      'width:100%;height:96px;object-fit:cover;border-radius:10px;margin-bottom:8px;display:block;background:#f1f5f9;'
    root.appendChild(img)
  }

  const nameRow = document.createElement('div')
  nameRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:2px;'
  const name = document.createElement('p')
  name.textContent = mk.kitchenName
  name.style.cssText = 'font-weight:700;font-size:13px;color:#091A36;margin:0;line-height:1.3;'
  nameRow.appendChild(name)
  if (mk.isOpen === false) {
    const closed = document.createElement('span')
    closed.textContent = 'CLOSED'
    closed.style.cssText =
      'flex-shrink:0;background:#F1F5F9;color:#64748B;font-size:9px;font-weight:700;padding:2px 6px;border-radius:9999px;letter-spacing:0.02em;'
    nameRow.appendChild(closed)
  }
  root.appendChild(nameRow)

  const metaBits: string[] = []
  if (mk.rating != null) metaBits.push(`★ ${mk.rating.toFixed(1)}`)
  if (mk.distanceKm != null) metaBits.push(`${mk.distanceKm} km away`)
  if (mk.dishCount != null) metaBits.push(`${mk.dishCount} dish${mk.dishCount === 1 ? '' : 'es'} today`)
  if (metaBits.length > 0) {
    const meta = document.createElement('p')
    meta.textContent = metaBits.join(' · ')
    meta.style.cssText = 'font-size:11px;color:#64748B;margin:0 0 8px;'
    root.appendChild(meta)
  }

  if (mk.cuisineTypes && mk.cuisineTypes.length > 0) {
    const tags = document.createElement('div')
    tags.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;'
    mk.cuisineTypes.slice(0, 3).forEach((cuisine) => {
      const tag = document.createElement('span')
      tag.textContent = cuisine
      tag.style.cssText =
        'background:#F1F5F9;color:#334155;font-size:10px;font-weight:600;padding:2px 7px;border-radius:9999px;'
      tags.appendChild(tag)
    })
    root.appendChild(tags)
  }

  const actions = document.createElement('div')
  actions.style.cssText = 'display:flex;gap:6px;'

  const profileBtn = document.createElement('button')
  profileBtn.type = 'button'
  profileBtn.textContent = 'View Profile'
  profileBtn.style.cssText =
    'flex:1;background:#E8202A;color:#fff;border:none;border-radius:8px;padding:7px 0;font-size:11px;font-weight:700;cursor:pointer;'
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onViewProfile(mk.cookId)
  })
  actions.appendChild(profileBtn)

  const menuBtn = document.createElement('button')
  menuBtn.type = 'button'
  menuBtn.textContent = 'See Menu'
  menuBtn.style.cssText =
    'flex:1;background:#F1F5F9;color:#091A36;border:none;border-radius:8px;padding:7px 0;font-size:11px;font-weight:700;cursor:pointer;'
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onViewMenu(mk.cookId)
  })
  actions.appendChild(menuBtn)

  root.appendChild(actions)
  return root
}

// A small dot (not a full-size pin) so it never visually swallows a cook
// marker that happens to sit at (or very near) the same coordinates.
function buildUserDotElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText =
    'width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25),0 2px 6px rgba(0,0,0,0.35);'
  return el
}

export default function MapView({
  center,
  zoom = 13,
  className,
  markers,
  userLocation,
  onMapReady,
  onViewCookProfile,
  onViewCookMenu,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    mapRef.current = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    if (onMapReady) {
      mapRef.current.on('load', () => onMapReady(mapRef.current!))
    }

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync markers whenever the markers prop changes (cooks load asynchronously)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const valid = (markers ?? []).filter(
      (mk) => Number.isFinite(mk.lng) && Number.isFinite(mk.lat)
    )

    for (const mk of valid) {
      const popup = new mapboxgl.Popup({ offset: 24, maxWidth: '240px' }).setDOMContent(
        buildCookPopupContent(
          mk,
          onViewCookProfile ?? (() => {}),
          onViewCookMenu ?? (() => {})
        )
      )
      const marker = new mapboxgl.Marker({ color: '#E8202A' })
        .setLngLat([mk.lng, mk.lat])
        .setPopup(popup)
        .addTo(map)
      markersRef.current.push(marker)
    }

    // "You are here" — rendered as a small dot, distinct from (and never
    // hidden behind) a cook pin at the same or a very nearby coordinate.
    userMarkerRef.current?.remove()
    userMarkerRef.current = null
    const hasUser =
      !!userLocation && Number.isFinite(userLocation.lng) && Number.isFinite(userLocation.lat)
    if (hasUser) {
      userMarkerRef.current = new mapboxgl.Marker({ element: buildUserDotElement(), anchor: 'center' })
        .setLngLat([userLocation!.lng, userLocation!.lat])
        .setPopup(new mapboxgl.Popup({ offset: 14 }).setText('You are here'))
        .addTo(map)
    }

    // Frame the user's location together with every cook marker so pins are
    // never stuck at the edge (or off-screen) of the initial center.
    if (valid.length > 0 || hasUser) {
      const bounds = new mapboxgl.LngLatBounds()
      bounds.extend(center)
      if (hasUser) bounds.extend([userLocation!.lng, userLocation!.lat])
      valid.forEach((mk) => bounds.extend([mk.lng, mk.lat]))
      map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 0 })
    }
  }, [markers, userLocation, onViewCookProfile, onViewCookMenu]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className={className ?? 'h-full w-full'} />
}
