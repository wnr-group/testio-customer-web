import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import {
  MapPin,
  Clock,
  ChevronRight,
  Utensils,
  PhoneOff,
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

  if (!cook) return { title: "Kitchen Profile" };

  return {
    title: `${cook.kitchen_name} | Testio Home Cooks`,
    description:
      cook.story_description ||
      `Order home-cooked food from ${cook.kitchen_name}.`,
  };
}

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
    }
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

        <CookHeroImage
          src={cook.profile_image_url || (cook.kitchen_image_urls?.[0] ?? null)}
          alt={cook.kitchen_name}
          isAvailable={cook.is_available}
        />

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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
