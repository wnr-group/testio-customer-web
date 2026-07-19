'use client'

// This component must ONLY be loaded via next/dynamic with { ssr: false }
// Mapbox GL JS requires browser APIs (WebGL, window, document)
// Usage: const OrderTrackingMap = dynamic(() => import('@/components/order/OrderTrackingMap'), { ssr: false })

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

type TrackingData = {
  cook_lat: number | null
  cook_lng: number | null
  cook_name: string | null
  dest_lat: number | null
  dest_lng: number | null
  assignment_status: string | null
  partner_name: string | null
  partner_vehicle: string | null
  partner_lat: number | null
  partner_lng: number | null
}

type Props = {
  orderId: string
  className?: string
}

const ROUTE_SOURCE_ID = 'tracking-route'
// Redraw the route only once the "moving" endpoint has actually moved this
// far — avoids hammering the Directions API on every 5s ping when the rider
// hasn't gone anywhere meaningful yet.
const ROUTE_REFRESH_METERS = 40

function buildDotElement(color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 0 4px ${color}33,0 2px 6px rgba(0,0,0,0.35);`
  return el
}

// A distinct rider marker (not a colored dot) so it's unmistakable from the
// static kitchen/destination points — the one thing on this map that moves.
function buildRiderElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText =
    'width:32px;height:32px;border-radius:50%;background:#091A36;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid white;transition:transform 0.3s ease-out;'
  el.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>'
  return el
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Which leg of the journey to draw depends on where the partner is in the
// flow: heading to the kitchen first, then heading to the customer. Before a
// partner is assigned at all, show the overall kitchen-to-you path.
function currentLeg(data: TrackingData): { from: [number, number]; to: [number, number]; label: 'to_kitchen' | 'to_you' } | null {
  const hasPartner = data.partner_lat != null && data.partner_lng != null
  const hasCook = data.cook_lat != null && data.cook_lng != null
  const hasDest = data.dest_lat != null && data.dest_lng != null

  if (hasPartner && data.assignment_status === 'assigned' && hasCook) {
    return { from: [data.partner_lng!, data.partner_lat!], to: [data.cook_lng!, data.cook_lat!], label: 'to_kitchen' }
  }
  if (hasPartner && data.assignment_status === 'picked_up' && hasDest) {
    return { from: [data.partner_lng!, data.partner_lat!], to: [data.dest_lng!, data.dest_lat!], label: 'to_you' }
  }
  if (hasCook && hasDest) {
    return { from: [data.cook_lng!, data.cook_lat!], to: [data.dest_lng!, data.dest_lat!], label: 'to_you' }
  }
  return null
}

function trackingLabel(data: TrackingData, etaMin: number | null): string {
  const eta = etaMin != null ? ` · ${etaMin < 1 ? '<1' : etaMin} min` : ''
  if (data.partner_lat != null && data.assignment_status === 'picked_up') {
    return (data.partner_name ? `${data.partner_name} is on the way to you` : 'Your delivery partner is on the way') + eta
  }
  if (data.partner_lat != null && data.assignment_status === 'assigned') {
    return (data.partner_name ? `${data.partner_name} is heading to the kitchen` : 'A delivery partner is heading to the kitchen') + eta
  }
  return 'Finding you a delivery partner…'
}

async function fetchRouteGeometry(
  from: [number, number],
  to: [number, number]
): Promise<{ coordinates: [number, number][]; durationSec: number } | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const route = json?.routes?.[0]
    if (!route?.geometry?.coordinates) return null
    return { coordinates: route.geometry.coordinates, durationSec: route.duration }
  } catch (err) {
    console.error('Failed to fetch route geometry', err)
    return null
  }
}

export default function OrderTrackingMap({ orderId, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const cookMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const riderMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const lastRouteRef = useRef<{ from: [number, number]; label: string } | null>(null)
  const [data, setData] = useState<TrackingData | null>(null)
  const [etaMin, setEtaMin] = useState<number | null>(null)
  const [routeLayerReady, setRouteLayerReady] = useState(false)

  // Initial snapshot via RPC, then live rider position via the same Realtime
  // broadcast channel (`delivery:${orderId}`) the delivery-partner app already
  // publishes to every ~5s while an order is assigned/picked up.
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    supabase
      .rpc('get_order_tracking', { p_order_id: orderId })
      .then(({ data: rpcData, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Failed to load order tracking', error)
          return
        }
        setData(rpcData as TrackingData)
      })

    const channel = supabase
      .channel(`delivery:${orderId}`)
      .on('broadcast', { event: 'location_update' }, (msg) => {
        const payload = msg.payload as { lat: number; lng: number }
        setData((prev) => (prev ? { ...prev, partner_lat: payload.lat, partner_lng: payload.lng } : prev))
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [orderId])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN!,
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [80.2707, 13.0827],
      zoom: 13,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Neither the 'load' event nor isStyleLoaded() reliably reflect real
    // readiness in this Mapbox GL version (both can stay unfired/false long
    // after the style has genuinely finished loading) — so instead of trusting
    // either, just retry addSource/addLayer until they stop throwing
    // "Style is not done loading", which is the actual constraint that matters.
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const setupRouteLayer = () => {
      if (cancelled) return
      try {
        if (!map.getSource(ROUTE_SOURCE_ID)) {
          map.addSource(ROUTE_SOURCE_ID, {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
          })
          // Casing underneath + colored line on top, so the route reads clearly against the basemap.
          map.addLayer({
            id: `${ROUTE_SOURCE_ID}-casing`,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 },
          })
          map.addLayer({
            id: ROUTE_SOURCE_ID,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#D61A22', 'line-width': 4 },
          })
        }
        setRouteLayerReady(true)
      } catch {
        retryTimer = setTimeout(setupRouteLayer, 150)
      }
    }
    setupRouteLayer()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !data) return

    const bounds = new mapboxgl.LngLatBounds()
    let hasPoint = false

    if (data.cook_lat != null && data.cook_lng != null) {
      if (!cookMarkerRef.current) {
        // A full-size pin (default anchor: 'bottom'), not a small center-anchored
        // dot like the other two markers — so it stays visible even if the
        // kitchen and delivery address happen to sit at ~the same coordinate,
        // instead of one marker rendering exactly on top of the other.
        cookMarkerRef.current = new mapboxgl.Marker({ color: '#F5A623' })
          .setLngLat([data.cook_lng, data.cook_lat])
          .setPopup(new mapboxgl.Popup({ offset: 12 }).setText(data.cook_name || 'Kitchen'))
          .addTo(map)
      } else {
        cookMarkerRef.current.setLngLat([data.cook_lng, data.cook_lat])
      }
      bounds.extend([data.cook_lng, data.cook_lat])
      hasPoint = true
    }

    if (data.dest_lat != null && data.dest_lng != null) {
      if (!destMarkerRef.current) {
        destMarkerRef.current = new mapboxgl.Marker({ element: buildDotElement('#2563EB'), anchor: 'center' })
          .setLngLat([data.dest_lng, data.dest_lat])
          .setPopup(new mapboxgl.Popup({ offset: 12 }).setText('Delivery Address'))
          .addTo(map)
      } else {
        destMarkerRef.current.setLngLat([data.dest_lng, data.dest_lat])
      }
      bounds.extend([data.dest_lng, data.dest_lat])
      hasPoint = true
    }

    if (data.partner_lat != null && data.partner_lng != null) {
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = new mapboxgl.Marker({ element: buildRiderElement(), anchor: 'center' })
          .setLngLat([data.partner_lng, data.partner_lat])
          .setPopup(new mapboxgl.Popup({ offset: 20 }).setText(data.partner_name || 'Delivery partner'))
          .addTo(map)
      } else {
        riderMarkerRef.current.setLngLat([data.partner_lng, data.partner_lat])
      }
      bounds.extend([data.partner_lng, data.partner_lat])
      hasPoint = true
    } else if (riderMarkerRef.current) {
      riderMarkerRef.current.remove()
      riderMarkerRef.current = null
    }

    if (hasPoint) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 })
    }
  }, [data])

  // Route line — the actual road path for whichever leg is currently active.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !routeLayerReady || !data) return

    const leg = currentLeg(data)
    if (!leg) {
      lastRouteRef.current = null
      setEtaMin(null)
      const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
      source?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } })
      return
    }

    const last = lastRouteRef.current
    const moved = !last || last.label !== leg.label || haversineMeters(last.from, leg.from) > ROUTE_REFRESH_METERS
    if (!moved) return

    let cancelled = false

    fetchRouteGeometry(leg.from, leg.to).then((route) => {
      if (cancelled || !route) return
      // Only commit the throttle marker once we actually have a route — if this
      // effect invocation gets cancelled (e.g. React Strict Mode's dev-only
      // mount→cleanup→mount cycle), it must not "claim" the fetch and block
      // the surviving invocation from ever requesting it.
      lastRouteRef.current = { from: leg.from, label: leg.label }
      const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
      source?.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: route.coordinates },
      })
      setEtaMin(Math.round(route.durationSec / 60))
    })

    return () => {
      cancelled = true
    }
  }, [data, routeLayerReady])

  return (
    <div className={className ?? 'h-full w-full relative'}>
      <div ref={containerRef} className="w-full h-full" />

      {!data && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <Loader2 className="size-6 text-[#D61A22] animate-spin" />
        </div>
      )}

      {data && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md border border-slate-100 flex items-center gap-2 max-w-[300px]">
          <span className="relative flex size-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D61A22] opacity-60" />
            <span className="relative inline-flex rounded-full size-2 bg-[#D61A22]" />
          </span>
          <p className="text-slate-800 text-xs font-bold truncate">{trackingLabel(data, etaMin)}</p>
        </div>
      )}
    </div>
  )
}
