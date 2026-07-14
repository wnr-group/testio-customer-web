// TODO (TES-169): Hero photo, kitchen name, cuisine tags, rating, mini map, CTAs
// Stitch ref: "Cook Profile - TESTIO"
// Server component — fetch cook data server-side for SEO
// Mini map: dynamic(() => import('@/components/map/MapView'), { ssr: false })
export default async function CookProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-[#666]">Cook Profile: {id} (TES-169)</p>
    </div>
  )
}
