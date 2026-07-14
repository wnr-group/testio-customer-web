// TODO (TES-171): 5-star selector, comment textarea, submit → reviews table
// Only accessible for completed orders (check in server component before rendering)
export default async function WriteReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <p className="text-[#666]">Write Review for order: {id} (TES-171)</p>
    </div>
  )
}
