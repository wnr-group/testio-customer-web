"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

// Load MapView dynamically with ssr: false since Mapbox GL JS relies on window/document browser APIs.
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs font-bold text-slate-400">
      Loading map...
    </div>
  ),
});

export function CookMap({
  lat,
  lng,
  kitchenName,
  cookId,
}: {
  lat: number;
  lng: number;
  kitchenName: string;
  cookId: string;
}) {
  const markers = [
    {
      lat,
      lng,
      cookId,
      kitchenName,
      isOpen: true,
    },
  ];

  return (
    <Card className="w-full h-full overflow-hidden rounded-2xl border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] flex flex-col p-4">
      <div className="flex items-center gap-2 text-[#091A36] mb-3 shrink-0">
        <MapPin className="size-4 text-[#D61A22]" />
        <h3 className="font-bold text-sm">Kitchen Location</h3>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-100 min-h-[250px]">
        <MapView
          center={[lng, lat]}
          zoom={14}
          markers={markers}
          className="w-full h-full"
        />
      </div>
    </Card>
  );
}
