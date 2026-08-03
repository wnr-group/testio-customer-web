'use client'

import Image from "next/image"
import { useState } from "react"

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80";

export function CookHeroImage({
    src,
    alt,
    isAvailable,
}: {
        src: string | null;
        alt: string;
        isAvailable: boolean;
    }) {
      const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);

      return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 mb-8 shadow-sm">
          <Image
            src={imgSrc}
            alt={alt}
            fill
            sizes="(max-w-768px) 100vw, 80vw"
            className="object-cover"
            priority
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-white/95 px-4 py-2 rounded-xl text-sm font-bold text-slate-800 tracking-wide">
                Currently Offline
              </span>
            </div>
          )}
        </div>
      );
    }

