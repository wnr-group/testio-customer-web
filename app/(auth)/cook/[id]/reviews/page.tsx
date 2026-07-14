// TODO (TES-169): Paginated reviews list, star rating display, empty state
export default async function CookReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-[#666]">Cook Reviews: {id} (TES-169)</p>
    </div>
  )
}
