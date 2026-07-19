const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating an account or placing an order through TESTIO, you agree to be bound by these Terms & Agreement. If you do not agree, please do not use the platform.",
  },
  {
    title: "2. What TESTIO Is",
    body: "TESTIO connects customers with independent home cooks in their neighbourhood for daily home-cooked meals. TESTIO facilitates discovery, ordering, and payment — the food itself is prepared and fulfilled by the individual cook, not by TESTIO.",
  },
  {
    title: "3. Accounts & Verification",
    body: "You must provide a valid phone number and verify it via OTP to place orders. You're responsible for keeping your account secure and for all activity under it.",
  },
  {
    title: "4. Orders & Payments",
    body: "Prices shown include applicable taxes unless stated otherwise. Payment is collected at checkout via our payment partner. An order is confirmed only once payment succeeds and the cook accepts it.",
  },
  {
    title: "5. Cancellations & Refunds",
    body: "Orders may be cancelled before a cook accepts them for a full refund. Once a cook has started preparing your order, cancellation may not be possible. Approved refunds are processed within 24 hours.",
  },
  {
    title: "6. Pickup & Delivery",
    body: "Pickup times are estimates set by the cook and may vary. For delivery orders, a delivery partner will collect your order from the cook and hand it to you; your address is only shared with the assigned partner and cook after payment is confirmed.",
  },
  {
    title: "7. Reviews & Conduct",
    body: "Reviews must reflect your genuine experience. Abusive, fraudulent, or harassing behaviour toward cooks, delivery partners, or TESTIO staff may result in account suspension.",
  },
  {
    title: "8. Liability",
    body: "TESTIO facilitates the transaction between you and the cook but is not responsible for food quality, allergens, or preparation practices beyond what cooks represent on their profile. Please review dish descriptions and contact the cook with allergy concerns before ordering.",
  },
  {
    title: "9. Changes to These Terms",
    body: "We may update these terms from time to time. Continued use of TESTIO after a change means you accept the updated terms.",
  },
  {
    title: "10. Contact",
    body: "Questions about these terms can be sent through the Help & Support section of the app.",
  },
];

export default function AgreementPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight">
          Terms &amp; Agreement
        </h1>
        <p className="mt-2 text-xs font-semibold text-slate-400">
          Last updated: 2026 · Draft copy — pending legal review
        </p>

        <div className="mt-8 flex flex-col gap-6 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 md:p-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="flex flex-col gap-1.5">
              <h2 className="text-sm font-bold text-[#091A36]">{s.title}</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
