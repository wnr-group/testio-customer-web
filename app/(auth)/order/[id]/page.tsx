// TODO (TES-171): StatusStepper, order items, cook info, cancel button, call cook
// Stitch ref: "Order Tracking - TESTIO"
// Real-time: useRealtimeOrder(orderId) — Supabase channel subscription
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-[#666]">Order Detail: {id} (TES-171)</p>
    </div>
  )
}
