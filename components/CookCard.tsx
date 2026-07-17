"use client";

import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface CookProfile {
  id: string;
  kitchen_name: string;
  cuisine_types?: string[];
  avg_rating: number;
  total_reviews: number;
  distance_km?: number;
  address_text?: string;
  image_url?: string;
  kitchen_image_url?: string;
  is_open?: boolean;
}

interface CookCardProps {
  cook: CookProfile;
  showButton?: boolean;
}

export function CookCard({ cook, showButton = true }: CookCardProps) {
  const imageUrl = cook.kitchen_image_url || cook.image_url || "/placeholder-kitchen.jpg";
  const cuisines = cook.cuisine_types || [];
  const distance = cook.distance_km ?? 2.5;

  // Calculate simulated delivery times
  const minTime = Math.max(15, Math.round(15 + distance * 8));
  const maxTime = Math.round(minTime + 10);

  return (
    <Link href={`/cook/${cook.id}`} className="block w-full h-full">
      <Card className="w-full shadow-sm hover:shadow-md transition-shadow bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col group h-full pt-0 pb-0 cursor-pointer">
        {/* Image container - attached to top of card */}
        <div className="relative w-full aspect-[16/9] bg-slate-100 overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={cook.kitchen_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80";
            }}
          />

          {/* Rating Badge Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md text-xs font-bold text-slate-800 shadow-sm border border-slate-50">
            <Star className="size-3 fill-[#F5A623] stroke-[#F5A623]" />
            <span>{Number(cook.avg_rating || 0).toFixed(1)}</span>
          </div>

          {/* Popular Badge Overlay on bottom-left for high rating cooks */}
          {Number(cook.avg_rating || 0) >= 4.8 && (
            <div className="absolute bottom-3 left-3 bg-[#F5A623] px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider">
              POPULAR
            </div>
          )}

          {/* Status Overlay */}
          {cook.is_open === false && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/95 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 tracking-wider">
                CLOSED
              </span>
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="p-4 flex flex-col flex-1 gap-2.5 justify-between">
          <div className="flex flex-col gap-1.5">
            {/* Kitchen Name */}
            <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-1">
              {cook.kitchen_name}
            </h3>

            {/* Description / Subtext */}
            <p className="text-xs text-slate-400 line-clamp-1 leading-normal">
              Specializes in authentic homemade delicacies
            </p>

            {/* Location & Time Info */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-slate-400 shrink-0" />
                {distance.toFixed(1)} km
              </span>
              <span>•</span>
              <span>{minTime}-{maxTime} min</span>
            </div>

            {/* Cuisine Tags */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {cuisines.slice(0, 3).map((cuisine, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 rounded-md font-semibold text-[10px] px-1.5 py-0.5"
                >
                  {cuisine.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          {/* VIEW MENU button (Only shown in search results, styled as a nested content element) */}
          {showButton && (
            <div className="w-full mt-1.5">
              <div
                className="w-full inline-flex shrink-0 items-center justify-center border border-[#E8202A] bg-transparent text-[#E8202A] group-hover:bg-[#E8202A] group-hover:text-white rounded-xl transition-colors font-bold py-1 h-9 text-xs select-none"
              >
                VIEW MENU
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
