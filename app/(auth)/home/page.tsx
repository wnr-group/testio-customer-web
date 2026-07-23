"use client";

// TES-168: Map/List toggle, nearby cook discovery, Mapbox GL JS
// Stitch ref: "Homepage - TESTIO" + "Search & Discovery - TESTIO"

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, List, MapPin, ArrowRight, Navigation } from "lucide-react";
import { toast } from "sonner";
import { CookCard } from "@/components/CookCard";
import { DishCard } from "@/components/DishCard";
import { useCartStore } from "@/stores/cartStore";
import { useResolvedLocation } from "@/hooks/useResolvedLocation";
import type { PickedLocation, SavedAddress } from "@/components/location/LocationPicker";

// Dynamically import browser-only (Mapbox GL) components.
const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });
const LocationPicker = dynamic(() => import("@/components/location/LocationPicker"), {
  ssr: false,
});

// Where the picker map opens when we have no location yet (viewport only — NOT a
// resolved location). The user still has to search or drag the pin to choose.
const PICKER_DEFAULT_CENTER = { lat: 13.0827, lng: 80.2707 };

const CUISINES = [
  "South Indian",
  "North Indian",
  "Chinese",
  "Continental",
  "Street Food",
  "Desserts",
];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const cartItemCount = useCartStore((s) => s.itemCount());

  const viewMode = searchParams.get("view") || "list";
  const { location, status, setLocation } = useResolvedLocation();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const autoOpenedRef = useRef(false);

  const [cooks, setCooks] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Open the picker once when we can't resolve any location. If the user
  // dismisses it, we don't force it back open — they get a prompt to reopen.
  useEffect(() => {
    if (status === "needs-picker" && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      setPickerOpen(true);
    }
  }, [status]);

  // Load saved addresses eagerly on mount and refresh each time the picker opens,
  // so the list is ready before the first open (not just after pickerOpen fires).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("id, label, address_line, lat, lng")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("is_default", { ascending: false });
      if (error) {
        console.error("Failed to load saved addresses", error);
        return;
      }
      if (!cancelled) setSavedAddresses((data as SavedAddress[]) || []);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen]);

  // Fetch cooks + dishes whenever the resolved location changes.
  useEffect(() => {
    if (!location) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const todayDate = new Date().toISOString().split("T")[0];

        const { data: cooksData, error: cooksError } = await supabase.rpc(
          "get_nearby_cooks",
          {
            user_lat: location!.lat,
            user_lng: location!.lng,
            radius_meters: 10000,
            today_date: todayDate,
          }
        );
        if (cooksError) throw cooksError;
        if (cancelled) return;
        setCooks(cooksData || []);

        if (cooksData && cooksData.length > 0) {
          const cookIds = cooksData.map((c: any) => c.id);
          const { data: dishesData, error: dishesError } = await supabase
            .from("dishes")
            .select(`*, cook_profiles ( kitchen_name )`)
            .in("cook_id", cookIds)
            .eq("is_available", true);
          if (dishesError) throw dishesError;
          if (cancelled) return;
          setDishes(dishesData || []);
        } else {
          setDishes([]);
        }
      } catch (err: any) {
        console.error("Error fetching homepage data:", err);
        if (!cancelled) toast.error("Failed to load nearby cooks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleToggleView = (mode: "map" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.push(`/home?${params.toString()}`);
  };

  // Persist the picked spot as a saved address (default if it's their first),
  // then use it immediately. Even if saving fails we still use it this session.
  const handlePickLocation = async (picked: PickedLocation) => {
    setSavingAddr(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from("customer_addresses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_deleted", false);
        const { error } = await supabase.from("customer_addresses").insert({
          user_id: user.id,
          label: picked.label,
          address_line: picked.address,
          lat: picked.lat,
          lng: picked.lng,
          is_default: (count ?? 0) === 0,
        });
        if (error) throw error;
      }
    } catch (e) {
      console.error("Failed to save address", e);
      toast.error("Couldn't save that address — using it for now.");
    } finally {
      setSavingAddr(false);
      setLocation({
        lat: picked.lat,
        lng: picked.lng,
        label: picked.address || picked.label,
        source: "picked",
      });
      setPickerOpen(false);
    }
  };

  // Use an already-saved address for this session — updates local state
  // only, unlike handlePickLocation above, which always inserts a new row.
  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setLocation({
      lat: addr.lat,
      lng: addr.lng,
      label: addr.address_line || addr.label,
      source: "saved",
    });
    setPickerOpen(false);
  };

  const cookMarkers = cooks
    .filter((c) => typeof c.longitude === "number" && typeof c.latitude === "number")
    .map((c) => ({
      lng: c.longitude,
      lat: c.latitude,
      cookId: c.id,
      kitchenName: c.kitchen_name,
      rating: c.avg_rating != null ? Number(c.avg_rating) : null,
      distanceKm: c.distance_km != null ? Number(c.distance_km) : null,
      dishCount: c.today_dish_count != null ? Number(c.today_dish_count) : null,
      cuisineTypes: c.cuisine_types ?? null,
      imageUrl: c.kitchen_image_url || c.image_url || null,
      isOpen: c.is_open ?? null,
    }));

  const needsLocation = status === "needs-picker" && !location;
  const noCoverage = !!location && !loading && cooks.length === 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* 1. Header / Hero */}
      <section className="bg-gradient-to-br from-[#FFF9F3] via-[#FFFDF9] to-[#FFF3E9] border-b border-slate-100 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center text-center gap-6">
          <h1 className="text-3xl md:text-4xl lg:text-4.5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-2xl">
            Eat like a local. Order from home cooks <br className="hidden md:inline" /> near you.
          </h1>

          {/* Delivery location pill — opens the picker */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full max-w-md mt-1 flex items-center gap-2 p-1 bg-white rounded-full shadow-md border border-slate-100 pl-4 pr-1 text-left group"
          >
            <MapPin className="size-4 text-[#E8202A] shrink-0" />
            <span className="flex-1 text-slate-800 text-xs truncate py-2.5">
              {location ? (
                location.label
              ) : (
                <span className="text-slate-400">Set your delivery location</span>
              )}
            </span>
            <span className="bg-slate-100 group-hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 font-bold text-xs transition-colors h-8 flex items-center gap-1">
              <Navigation className="size-3" /> Change
            </span>
          </button>

          {/* Cuisine quick chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 max-w-2xl">
            {CUISINES.map((cuisine, idx) => (
              <Link href={`/home/search?cuisine=${encodeURIComponent(cuisine)}`} key={idx}>
                <Badge className="bg-[#DCE6F5] hover:bg-[#CAD9F0] text-slate-800 border-0 px-4 py-1.5 rounded-full text-xs font-bold shadow-none transition-all cursor-pointer">
                  {cuisine}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Toggle bar */}
      <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between border-b border-slate-100">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            Home Cooks Around You
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {location ? `Discovering kitchens near ${location.label}` : "Discovering available kitchens within 10 km"}
          </p>
        </div>

        <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <Button
            onClick={() => handleToggleView("list")}
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className={`rounded-lg px-3 py-1 flex items-center gap-1.5 text-xs font-semibold h-8 ${
              viewMode === "list"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 hover:bg-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-transparent"
            }`}
          >
            <List className="size-3.5" />
            List
          </Button>
          <Button
            onClick={() => handleToggleView("map")}
            variant={viewMode === "map" ? "default" : "ghost"}
            size="sm"
            className={`rounded-lg px-3 py-1 flex items-center gap-1.5 text-xs font-semibold h-8 ${
              viewMode === "map"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 hover:bg-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-transparent"
            }`}
          >
            <Map className="size-3.5" />
            Map
          </Button>
        </div>
      </div>

      {/* 3. Content */}
      <div className="mx-auto max-w-7xl px-4 mt-6">
        {needsLocation ? (
          /* No device location + no saved address — ask the user to choose */
          <div className="flex flex-col items-center justify-center p-14 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <MapPin className="size-12 text-[#E8202A] mb-3" />
            <p className="text-slate-800 font-bold text-lg">Set your delivery location</p>
            <p className="text-slate-400 text-sm mt-1 max-w-sm">
              We couldn&apos;t detect where you are. Choose a spot so we can show home cooks near you.
            </p>
            <Button
              onClick={() => setPickerOpen(true)}
              className="mt-5 bg-[#E8202A] hover:bg-[#c71821] text-white rounded-xl px-6 h-11 font-bold"
            >
              Choose location
            </Button>
          </div>
        ) : noCoverage ? (
          /* Resolved a location, but no cooks deliver there yet */
          <div className="flex flex-col items-center justify-center p-14 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <span className="text-4xl mb-3" role="img" aria-label="rooster">🐓</span>
            <p className="text-slate-800 font-bold text-lg">We&apos;re not delivering here yet</p>
            <p className="text-slate-400 text-sm mt-1 max-w-md">
              No home cooks around <span className="font-semibold text-slate-600">{location!.label}</span> right
              now — but we&apos;re coming soon! Try a different location for now.
            </p>
            <Button
              onClick={() => setPickerOpen(true)}
              variant="outline"
              className="mt-5 rounded-xl px-6 h-11 font-bold border-slate-300"
            >
              <Navigation className="size-4" /> Change location
            </Button>
          </div>
        ) : viewMode === "map" ? (
          /* ==================== MAP VIEW ==================== */
          <div className="w-full aspect-[2/1] min-h-[400px] border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden relative">
            <MapView
              center={location ? [location.lng, location.lat] : [PICKER_DEFAULT_CENTER.lng, PICKER_DEFAULT_CENTER.lat]}
              className="w-full h-full"
              markers={cookMarkers}
              userLocation={location ? { lng: location.lng, lat: location.lat } : undefined}
              onViewCookProfile={(cookId) => router.push(`/cook/${cookId}`)}
              onViewCookMenu={(cookId) => router.push(`/cook/${cookId}/menu`)}
            />
            {location && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-slate-100 flex flex-col gap-1 max-w-[280px]">
                <span className="text-xs font-bold text-[#E8202A] flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" /> Your location
                </span>
                <p className="text-slate-800 font-semibold text-sm truncate">{location.label}</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {cooks.length} {cooks.length === 1 ? "kitchen" : "kitchens"} within 10 km. Blue dot is you; red pins are cooks — tap a pin to view their profile or menu.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ==================== LIST VIEW ==================== */
          <div className="flex flex-col gap-12">
            {/* Section A: Popular Cooks */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg md:text-xl font-bold text-slate-800">Popular Cooks</h3>
                <Link
                  href="/home/search?view=list"
                  className="text-xs font-semibold text-[#E8202A] hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="size-3" />
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array(4)
                    .fill(0)
                    .map((_, idx) => (
                      <div key={idx} className="flex flex-col gap-3">
                        <Skeleton className="w-full aspect-[16/9] rounded-2xl" />
                        <Skeleton className="h-5 w-3/4 rounded-md" />
                        <Skeleton className="h-4 w-1/2 rounded-md" />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {cooks.map((cook) => (
                    <CookCard key={cook.id} cook={cook} showButton={false} />
                  ))}
                </div>
              )}
            </div>

            {/* Section B: What's Cooking Today */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-slate-800">
                  What&apos;s Cooking Today
                </h3>
                <Link
                  href="/home/search?toggle=dishes"
                  className="text-xs font-semibold text-[#E8202A] hover:underline flex items-center gap-1"
                >
                  View All Dishes <ArrowRight className="size-3" />
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array(4)
                    .fill(0)
                    .map((_, idx) => (
                      <div key={idx} className="flex flex-col gap-3">
                        <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
                        <Skeleton className="h-5 w-3/4 rounded-md" />
                        <Skeleton className="h-4 w-1/4 rounded-md" />
                      </div>
                    ))}
                </div>
              ) : dishes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-600 font-medium">No dishes available today</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Try checking again later or exploring other cooks.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {dishes.slice(0, 8).map((dish) => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Floating cart */}
      {mounted && cartItemCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link href="/cart">
            <Button className="bg-[#E8202A] hover:bg-[#c71821] text-white shadow-xl rounded-full p-4 h-14 w-14 flex items-center justify-center relative transition-transform hover:scale-105 active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-md">
                {cartItemCount}
              </span>
            </Button>
          </Link>
        </div>
      )}

      {/* Location picker modal */}
      <LocationPicker
        open={pickerOpen}
        initialCenter={location ?? PICKER_DEFAULT_CENTER}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickLocation}
        saving={savingAddr}
        savedAddresses={savedAddresses}
        onSelectSaved={handleSelectSavedAddress}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
          <p className="text-slate-400 text-sm">Loading TESTIO...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
