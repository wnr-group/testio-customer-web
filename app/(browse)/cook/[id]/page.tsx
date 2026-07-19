"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import {
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  Utensils,
  PhoneOff,
  Frown,
  BookOpen,
} from "lucide-react";
import type { Database } from "@/types/database.types";

type CookProfileRow = Database["public"]["Tables"]["cook_profiles"]["Row"];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80";

function formatTime(time: string | null) {
  if (!time) return null;
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

export default function CookProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [cook, setCook] = useState<CookProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchCook() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("cook_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCook(data);
      setLoading(false);
    }
    fetchCook();
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
  }

  if (notFound || !cook) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4 bg-white border border-slate-100/80 rounded-2xl p-8 shadow-sm">
          <div className="p-4 bg-red-50 rounded-full text-[#D61A22]">
            <Frown className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-[#091A36]">Cook not found</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            This kitchen may have been removed or the link is incorrect.
          </p>
          <Link href="/home" className="w-full mt-2">
            <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs">
              Browse Cooks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const heroImage =
    cook.profile_image_url || cook.kitchen_image_urls?.[0] || FALLBACK_IMAGE;
  const cuisines = cook.cuisine_types || [];
  const rating = Number(cook.avg_rating || 0);
  const reviews = cook.total_reviews || 0;
  const openingTime = formatTime(cook.opening_time);
  const closingTime = formatTime(cook.closing_time);

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#091A36] transition-colors mb-6"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>

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
          {!cook.is_available && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/95 px-4 py-2 rounded-xl text-sm font-bold text-slate-800 tracking-wide">
                Currently Offline
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#091A36] tracking-tight">
                {cook.kitchen_name}
              </h1>

              {cuisines.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {cuisines.map((cuisine, idx) => (
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
          </div>

          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5">
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
                Browse today&apos;s menu and add your favorite dishes to cart.
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
      </div>
    </div>
  );
}
