// TODO (TES-170): Address selector, pickup time picker, order summary, Razorpay payment
// Stitch ref: "Cart & Checkout - TESTIO"
// Razorpay: load via next/script (strategy lazyOnload), invoke on "Pay" click
// On success → call verify-payment edge function → redirect to /order/[id]/confirm
export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-[#666]">Checkout (TES-170)</p>
    </div>
  )
}
