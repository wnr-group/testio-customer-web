// TODO (TES-170): Success animation, order number, cook name, pickup time, "View Order" CTA
// Stitch ref: "Order Confirmation - TESTIO"
export default async function OrderConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-[#666]">Order Confirmed: {id} (TES-170)</p>
    </div>
  )
}
