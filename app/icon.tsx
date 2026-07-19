import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

// Same mark as components/brand/Logo.tsx, rendered as a static icon —
// ImageResponse (satori) can't import that component's SVG directly.
export default function Icon() {
  return new ImageResponse(
    (
      <svg width={64} height={64} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="60" height="56" rx="16" fill="#F5A623" />
        <path
          d="M18 22 C16 11 24 8 27 15 C28 5 37 5 38 13 C42 6 49 9 47 20 L44 24 H21 Z"
          fill="#E8202A"
        />
        <path d="M15 26 h34 v10 h-12 v20 h-10 V36 H15 Z" fill="#FFFFFF" />
      </svg>
    ),
    { ...size }
  )
}
