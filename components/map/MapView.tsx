'use client'

// This component must ONLY be loaded via next/dynamic with { ssr: false }
// Mapbox GL JS requires browser APIs (WebGL, window, document)
// Usage: const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

type Props = {
  center: [number, number] // [lng, lat]
  zoom?: number
  className?: string
  onMapReady?: (map: mapboxgl.Map) => void
}

export default function MapView({ center, zoom = 13, className, onMapReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

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
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className={className ?? 'h-full w-full'} />
}
