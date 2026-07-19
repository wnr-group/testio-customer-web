"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, SlidersHorizontal, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CookCard } from "@/components/CookCard";
import { DishCard } from "@/components/DishCard";
import { useCartStore } from "@/stores/cartStore";
import { reverseGeocode } from "@/lib/utils";


const ALL_CUISINES = [
  "South Indian",
  "North Indian",
  "Chinese",
  "Kerala",
  "Biryani",
  "Street Food",
  "Tiffin",
  "Seafood",
];

const DEFAULT_COORDS = { lat: 13.0569, lng: 80.2437 };

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const cartItemCount = useCartStore((s) => s.itemCount());

  // URL Query Params
  const queryCuisine = searchParams.get("cuisine");
  const queryLocation = searchParams.get("location");
  const initialSearchType = searchParams.get("toggle") === "dishes" ? "dishes" : "cooks";

  // State Management
  const [coordinates, setCoordinates] = useState(DEFAULT_COORDS);
  const [locationText, setLocationText] = useState(queryLocation || "Sector 5, Chennai");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    queryCuisine ? [queryCuisine] : []
  );
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(5); // default 5km
  const [searchType, setSearchType] = useState<"cooks" | "dishes">(initialSearchType);

  const [cooks, setCooks] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Sync cuisines list if URL changes
  useEffect(() => {
    if (queryCuisine) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCuisines((prev) =>
        prev.includes(queryCuisine) ? prev : [...prev, queryCuisine]
      );
    }
  }, [queryCuisine]);

  // Geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
          
          if (!queryLocation) {
            const address = await reverseGeocode(lat, lng);
            if (address) {
              setLocationText(address);
            }
          }
        },
        () => {
          setCoordinates(DEFAULT_COORDS);
        }
      );
    }
  }, [queryLocation]);

  // Fetch cooks and dishes from DB
  useEffect(() => {
    async function fetchSearchData() {
      setLoading(true);
      try {
        const todayDate = new Date().toISOString().split("T")[0];
        
        // Fetch nearby cooks up to 10km (we filter closer distances client-side)
        const { data: cooksData, error: cooksError } = await supabase.rpc(
          "get_nearby_cooks",
          {
            user_lat: coordinates.lat,
            user_lng: coordinates.lng,
            radius_meters: 10000,
            today_date: todayDate,
          }
        );

        if (cooksError) throw cooksError;
        setCooks(cooksData || []);

        if (cooksData && cooksData.length > 0) {
          const cookIds = cooksData.map((c: any) => c.id);
          const { data: dishesData, error: dishesError } = await supabase
            .from("dishes")
            .select(`
              *,
              cook_profiles (
                kitchen_name
              )
            `)
            .in("cook_id", cookIds)
            .eq("is_available", true);

          if (dishesError) throw dishesError;
          setDishes(dishesData || []);
        } else {
          setDishes([]);
        }
      } catch (err: any) {
        console.error("Error fetching search data:", err);
        toast.error("Failed to load search results");
      } finally {
        setLoading(false);
      }
    }

    fetchSearchData();
  }, [coordinates, supabase]);

  // Filter Handlers
  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const handleRatingSelect = (rating: number) => {
    setMinRating((prev) => (prev === rating ? null : rating));
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCuisines([]);
    setMinRating(null);
    setMaxDistance(5);
  };

  // Filter application - Cooks
  const filteredCooks = cooks.filter((cook) => {
    const matchesSearch =
      !searchQuery ||
      cook.kitchen_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cook.cuisine_types &&
        cook.cuisine_types.some((c: string) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    const matchesCuisines =
      selectedCuisines.length === 0 ||
      (cook.cuisine_types &&
        cook.cuisine_types.some((c: string) => selectedCuisines.includes(c)));

    const matchesRating = !minRating || Number(cook.avg_rating || 0) >= minRating;

    const matchesDistance = !maxDistance || (cook.distance_km ?? 0) <= maxDistance;

    return matchesSearch && matchesCuisines && matchesRating && matchesDistance;
  });

  // Filter application - Dishes
  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch =
      !searchQuery ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description &&
        dish.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const cookProfile = cooks.find((c) => c.id === dish.cook_id);

    const matchesCuisines =
      selectedCuisines.length === 0 ||
      (cookProfile &&
        cookProfile.cuisine_types &&
        cookProfile.cuisine_types.some((c: string) => selectedCuisines.includes(c)));

    const matchesRating =
      !minRating || (cookProfile && Number(cookProfile.avg_rating || 0) >= minRating);

    const matchesDistance =
      !maxDistance || (cookProfile && (cookProfile.distance_km ?? 0) <= maxDistance);

    return matchesSearch && matchesCuisines && matchesRating && matchesDistance;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Search Header Bar */}
      <section className="bg-white border-b border-slate-100 py-4 shadow-sm sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Location indicator */}
          <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold shrink-0">
            <MapPin className="size-5 text-[#E8202A] shrink-0" />
            <span>{locationText}</span>
          </div>

          {/* Search Input Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for 'Biryani' or 'Home Cooks'..."
              className="pl-10 pr-4 py-2 border-slate-200 rounded-xl w-full text-slate-800 placeholder:text-slate-400 focus:border-[#E8202A] focus:ring-1 focus:ring-[#E8202A] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* ==================== LEFT FILTER SIDEBAR ==================== */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-6 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4 text-[#E8202A]" />
              Filters
            </span>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-[#E8202A] hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Cuisine Checkboxes */}
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cuisines
            </h5>
            <div className="flex flex-col gap-2 mt-1.5">
              {ALL_CUISINES.map((cuisine) => {
                const isChecked = selectedCuisines.includes(cuisine);
                return (
                  <label key={cuisine} className="flex items-center gap-3.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-[#E8202A] focus:ring-[#E8202A] cursor-pointer"
                      checked={isChecked}
                      onChange={() => handleCuisineToggle(cuisine)}
                    />
                    <span className={`text-sm transition-colors ${
                      isChecked ? "text-slate-900 font-semibold" : "text-slate-600 group-hover:text-slate-900"
                    }`}>
                      {cuisine}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rating Toggles */}
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ratings
            </h5>
            <div className="flex gap-2 mt-1.5">
              {[4.0, 4.5].map((rating) => {
                const isActive = minRating === rating;
                return (
                  <Button
                    key={rating}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => handleRatingSelect(rating)}
                    className={`flex-1 rounded-xl h-9 text-xs font-semibold ${
                      isActive 
                        ? "bg-[#E8202A] hover:bg-[#c71821] text-white" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Star className={`size-3.5 mr-1 ${isActive ? "fill-white" : "fill-slate-400"}`} />
                    {rating}+
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Distance Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Distance
              </h5>
              <span className="text-xs font-bold text-[#E8202A]">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full accent-[#E8202A] cursor-pointer mt-1"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>1km</span>
              <span>5km</span>
              <span>10km</span>
            </div>
          </div>
        </aside>

        {/* ==================== RIGHT CONTENT PANEL ==================== */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                Showing {searchType === "cooks" ? filteredCooks.length : filteredDishes.length} {searchType} near {locationText}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                Hand-picked home kitchens serving authentic flavors
              </p>
            </div>

            {/* Cooks / Dishes Toggle */}
            <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl h-10 items-center shrink-0">
              <Button
                variant={searchType === "cooks" ? "default" : "ghost"}
                onClick={() => setSearchType("cooks")}
                size="sm"
                className={`rounded-lg px-4 text-xs font-bold h-8 transition-all ${
                  searchType === "cooks"
                    ? "bg-[#E8202A] text-white shadow-sm hover:bg-[#E8202A]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-transparent"
                }`}
              >
                COOKS
              </Button>
              <Button
                variant={searchType === "dishes" ? "default" : "ghost"}
                onClick={() => setSearchType("dishes")}
                size="sm"
                className={`rounded-lg px-4 text-xs font-bold h-8 transition-all ${
                  searchType === "dishes"
                    ? "bg-[#E8202A] text-white shadow-sm hover:bg-[#E8202A]"
                    : "text-slate-500 hover:text-slate-800 hover:bg-transparent"
                }`}
              >
                DISHES
              </Button>
            </div>
          </div>

          {/* Results Grid / List */}
          {loading ? (
            /* Skeletal Loaders */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className="flex flex-col gap-3">
                    <Skeleton className="w-full aspect-[16/10] rounded-2xl" />
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </div>
                ))}
            </div>
          ) : searchType === "cooks" ? (
            /* Cooks View Grid */
            filteredCooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-150 rounded-2xl shadow-sm text-center">
                <SlidersHorizontal className="size-8 text-slate-300 mb-2" />
                <p className="text-slate-600 font-bold text-lg">No cooks match your filter criteria</p>
                <p className="text-slate-400 text-sm mt-1 max-w-sm">
                  Try widening your distance slider, removing cuisine checks, or clearing search.
                </p>
                <Button onClick={handleClearFilters} className="mt-4 bg-slate-900 hover:bg-slate-850 text-white rounded-xl">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCooks.map((cook) => (
                  <CookCard key={cook.id} cook={cook} />
                ))}
              </div>
            )
          ) : (
            /* Dishes View Grid */
            filteredDishes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-150 rounded-2xl shadow-sm text-center">
                <p className="text-slate-600 font-bold text-lg">No dishes found matching your query</p>
                <p className="text-slate-400 text-sm mt-1 max-w-sm">
                  Try exploring different cuisines or search terms.
                </p>
                <Button onClick={handleClearFilters} className="mt-4 bg-slate-900 hover:bg-slate-850 text-white rounded-xl">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            )
          )}
        </main>
      </div>

      {/* Floating Shopping Cart widget */}
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
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-400 text-sm font-medium">Loading search results...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

