import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

