import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type PlaceResult = { name: string; lat: number; lng: number };

// Forward geocoding (search) via Mapbox — returns matching places for a query.
// Restricted to India and biased toward locality/place results.
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const q = query.trim();
  if (!q || !mapboxToken) return [];
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
        `?access_token=${mapboxToken}&autocomplete=true&limit=5&country=in`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.features)) {
        return data.features
          .filter((f: any) => Array.isArray(f.center) && f.center.length === 2)
          .map((f: any) => ({ name: f.place_name as string, lng: f.center[0], lat: f.center[1] }));
      }
    }
  } catch (error) {
    console.error("Mapbox place search error:", error);
  }
  return [];
}

// Only allow same-origin path redirects — guards ?next= against open
// redirects ("//evil.com", "https://…", backslash tricks).
export function safeInternalPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null
  return path
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (mapboxToken) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        }
      }
    } catch (error) {
      console.error("Mapbox geocoding error:", error);
    }
  }

  // Fallback to OpenStreetMap Nominatim API (free, no token required)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "TestioCustomerWebApp/1.0",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.address) {
        const addr = data.address;
        const localArea = addr.neighbourhood || addr.suburb || addr.subdivision || addr.road || addr.quarter;
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
        const state = addr.state;
        if (localArea && city) {
          return `${localArea}, ${city}`;
        } else if (city) {
          return state ? `${city}, ${state}` : city;
        }
      }
      if (data.display_name) {
        return data.display_name;
      }
    }
  } catch (error) {
    console.error("Nominatim geocoding error:", error);
  }

  return null;
}

