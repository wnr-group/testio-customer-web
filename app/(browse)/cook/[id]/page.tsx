import Link from "next/link";
<<<<<<< HEAD
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
=======
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
>>>>>>> origin/main
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Clock,
  ChevronRight,
  Utensils,
<<<<<<< HEAD
  Phone,
  Frown,
=======
  PhoneOff,
>>>>>>> origin/main
  BookOpen,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { CookHeroImage } from "@/components/ui/CookHeroImage";
import { CookMap } from "@/components/ui/CookMap";
import type { Metadata } from "next";


function parseWKBPoint(wkbHex: string): { lng: number; lat: number } | null {
  if (!wkbHex || typeof wkbHex !== "string") return null;
  try {
    const bytes = new Uint8Array(
      wkbHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );
    const view = new DataView(bytes.buffer);
    const isLittleEndian = bytes[0] === 1;
    const type = view.getUint32(1, isLittleEndian);
    const hasSrid = (type & 0x20000000) !== 0;
    let offset = 5;
    if (hasSrid) {
      offset += 4; // Skip SRID bytes
    }
    const lng = view.getFloat64(offset, isLittleEndian);
    const lat = view.getFloat64(offset + 8, isLittleEndian);
    return { lng, lat };
  } catch (e) {
    console.error("Failed to parse WKB point:", e);
    return null;
  }
}


interface Props {
  params: Promise<{ id: string }>;
}

function formatTime(time: string | null) {
  if (!time) return null;
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

// Generate SEO metadata server-side
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cook } = await supabase
    .from("cook_profiles")
    .select("kitchen_name, story_description")
    .eq("id", id)
    .maybeSingle();

<<<<<<< HEAD
  const [cook, setCook] = useState<CookProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cookPhone, setCookPhone] = useState<string | null>(null);
  const [cookPhoneLoading, setCookPhoneLoading] = useState(true);

  useEffect(() => {
    async function fetchCook() {
      if (!id) return;
      setLoading(true);
      const [cookResult, openStatusResult] = await Promise.all([
        supabase.from("cook_profiles").select("*").eq("id", id).maybeSingle(),
        supabase.rpc("get_cook_open_status", { p_cook_id: id }),
      ]);
      const { data, error } = cookResult;
=======
  if (!cook) return { title: "Kitchen Profile" };

  return {
    title: `${cook.kitchen_name} | Testio Home Cooks`,
    description:
      cook.story_description ||
      `Order home-cooked food from ${cook.kitchen_name}.`,
  };
}
>>>>>>> origin/main

export default async function CookProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cook, error } = await supabase
    .from("cook_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !cook) {
    notFound();
  }

  // Parse location coordinates (Supabase returns PostGIS geography as a GeoJSON object by default)
  let latitude: number | undefined;
  let longitude: number | undefined;
  if (cook.location) {
    if (typeof cook.location === "object") {
      const geojson = cook.location as {
        type: string;
        coordinates: [number, number];
      } | null;
      longitude = geojson?.coordinates?.[0];
      latitude = geojson?.coordinates?.[1];
    } else if (typeof cook.location === "string") {
      const parsed = parseWKBPoint(cook.location);
      if (parsed) {
        longitude = parsed.lng;
        latitude = parsed.lat;
      }
<<<<<<< HEAD

      if (openStatusResult.error) {
        console.error("Fetch cook open status error:", openStatusResult.error);
      }

      if (isMounted) {
        setCook(data);
        setIsOpen(openStatusResult.error ? false : Boolean(openStatusResult.data));
        setLoading(false);
      }

      // Runs independently of the main load flow — the button has its own
      // cookPhoneLoading state, so this never blocks the page skeleton.
      supabase
        .rpc("get_cook_phone", { p_cook_id: id })
        .then(({ data: phoneData, error: phoneError }) => {
          if (!isMounted) return;
          if (phoneError) {
            console.error("Fetch cook phone error:", phoneError);
          }
          setCookPhone(typeof phoneData === "string" && phoneData.trim() ? phoneData : null);
          setCookPhoneLoading(false);
        });
    }
    
    let isMounted = true;
    fetchCook();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
        <div className="mx-auto max-w-5xl">
          <Skeleton className="h-4 w-24 rounded-md mb-6" />
          <Skeleton className="h-64 md:h-80 w-full rounded-2xl mb-8" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-4">
              <Skeleton className="h-8 w-2/3 rounded-md" />
              <Skeleton className="h-4 w-1/3 rounded-md" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            <div className="w-full lg:w-[320px] shrink-0">
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
=======
    }
>>>>>>> origin/main
  }
  const cuisines = (cook.cuisine_types as string[]) || [];
  const rating = Number(cook.avg_rating || 0);
  const reviews = cook.total_reviews || 0;
  const openingTime = formatTime(cook.opening_time);
  const closingTime = formatTime(cook.closing_time);

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        <BackButton />

<<<<<<< HEAD
        <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={cook.kitchen_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          {!isOpen && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/95 px-4 py-2 rounded-xl text-sm font-bold text-slate-800 tracking-wide">
                Currently Offline
              </span>
            </div>
          )}
        </div>
=======
        <CookHeroImage
          src={cook.profile_image_url || (cook.kitchen_image_urls?.[0] ?? null)}
          alt={cook.kitchen_name}
          isAvailable={cook.is_available}
        />
>>>>>>> origin/main

        {/* 2-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Info + CTA (occupies 7 of 12 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#091A36] tracking-tight">
                {cook.kitchen_name}
              </h1>

              {cuisines.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {cuisines.map((cuisine: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 rounded-md font-semibold text-[10px] px-2 py-0.5"
                    >
                      {cuisine.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              )}

              <Link
                href={`/cook/${cook.id}/reviews`}
                className="inline-flex items-center gap-2 mt-4 group"
              >
                <StarRating value={rating} readOnly size="sm" />
                <span className="text-sm font-bold text-[#091A36]">
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-semibold underline-offset-2 group-hover:underline">
                  ({reviews} {reviews === 1 ? "review" : "reviews"})
                </span>
              </Link>

              {cook.address_text && (
                <div className="flex items-start gap-2 text-xs text-slate-500 font-medium mt-4">
                  <MapPin className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{cook.address_text}</span>
                </div>
              )}
            </div>

            {cook.story_description && (
              <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-5">
                <div className="flex items-center gap-2 text-[#091A36] mb-2">
                  <BookOpen className="size-4 text-[#D61A22]" />
                  <h3 className="font-bold text-sm">About the Kitchen</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {cook.story_description}
                </p>
              </Card>
            )}

<<<<<<< HEAD
            {cookPhoneLoading ? (
              <button
                disabled
                className="w-full lg:w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs tracking-wider uppercase px-5 h-10 cursor-not-allowed"
              >
                <Phone className="size-3.5" />
                Call Cook
              </button>
            ) : cookPhone ? (
              <a
                href={`tel:${cookPhone}`}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full lg:w-fit bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl gap-2 font-bold text-xs tracking-wider uppercase px-5 h-10"
                )}
              >
                <Phone className="size-3.5" />
                Call Cook
              </a>
            ) : (
              <button
                disabled
                title="Phone unavailable"
                className="w-full lg:w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs tracking-wider uppercase px-5 h-10 cursor-not-allowed"
              >
                <Phone className="size-3.5" />
                Phone unavailable
              </button>
            )}
=======
            <button
              disabled
              title="Masked calling is not available on web yet"
              className="w-full lg:w-fit inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs tracking-wider uppercase px-5 h-10 cursor-not-allowed"
            >
              <PhoneOff className="size-3.5" />
              Call Cook
            </button>

            {/* Hours and View Menu Stacked/Side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[#091A36]">
                  <Clock className="size-4 text-[#D61A22]" />
                  <h3 className="font-bold text-sm">Kitchen Hours</h3>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Open</span>
                  <span className="text-slate-800">
                    {openingTime && closingTime
                      ? `${openingTime} - ${closingTime}`
                      : "Not specified"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Status</span>
                  <span
                    className={
                      cook.is_available
                        ? "text-emerald-600 font-bold"
                        : "text-slate-400 font-bold"
                    }
                  >
                    {cook.is_available ? "Open now" : "Offline"}
                  </span>
                </div>
              </Card>

              <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-3 items-center text-center">
                <div className="p-3 bg-red-50 rounded-full text-[#D61A22]">
                  <Utensils className="size-5" />
                </div>
                <h3 className="font-bold text-sm text-[#091A36]">
                  Ready to order?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Browse today&apos;s menu and add dishes.
                </p>
                <Link href={`/cook/${cook.id}/menu`} className="w-full mt-1">
                  <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl py-5 font-bold text-xs tracking-wider h-10 flex items-center justify-center gap-1.5">
                    View Menu
                    <ChevronRight className="size-3.5" />
                  </Button>
                </Link>
              </Card>
            </div>
>>>>>>> origin/main
          </div>

          {/* Right Column: Mini Mapbox Map (occupies 5 of 12 columns) */}
          <div className="lg:col-span-5 w-full h-[350px] lg:h-[450px] lg:sticky lg:top-6">
            {typeof latitude === "number" && typeof longitude === "number" ? (
              <CookMap
                lat={latitude}
                lng={longitude}
                kitchenName={cook.kitchen_name}
                cookId={cook.id}
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold">
                Map Unavailable (No Coordinates)
              </div>
<<<<<<< HEAD
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Open</span>
                <span className="text-slate-800">
                  {openingTime && closingTime
                    ? `${openingTime} - ${closingTime}`
                    : "Not specified"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Status</span>
                <span
                  className={
                    isOpen
                      ? "text-emerald-600 font-bold"
                      : "text-slate-400 font-bold"
                  }
                >
                  {isOpen ? "Open now" : "Offline"}
                </span>
              </div>
            </Card>

            <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-3 items-center text-center">
              <div className="p-3 bg-red-50 rounded-full text-[#D61A22]">
                <Utensils className="size-5" />
              </div>
              <h3 className="font-bold text-sm text-[#091A36]">
                Ready to order?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse today&apos;s menu and add your favorite dishes to cart.
              </p>
              <Link href={`/cook/${cook.id}/menu`} className="w-full mt-1">
                <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl py-5 font-bold text-xs tracking-wider h-10 flex items-center justify-center gap-1.5">
                  View Menu
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </Card>
=======
            )}
>>>>>>> origin/main
          </div>
        </div>
      </div>
    </div>
  );
}
