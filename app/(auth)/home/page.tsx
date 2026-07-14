// TODO (TES-168): Map/List toggle, nearby cook discovery, Mapbox GL JS
// Stitch ref: "Homepage - TESTIO" + "Search & Discovery - TESTIO"
// Map must be loaded via: dynamic(() => import('@/components/map/MapView'), { ssr: false })
export default function HomePage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <p className="text-[#666]">Home — Cook Discovery (TES-168)</p>
    </div>
  )
}
