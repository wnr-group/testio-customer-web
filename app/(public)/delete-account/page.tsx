import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/marketing/PublicNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

// Account deletion is a manual, email-based support process. Do not add
// processing timelines or claims about automatic/in-app deletion without
// confirmation.

export const metadata: Metadata = {
  title: { absolute: "Account Deletion | Testio Hospitality Services" },
  description:
    "Learn how to request deletion of your Testio Customer account and associated personal information.",
  alternates: { canonical: "https://www.testiofood.com/delete-account" },
  robots: { index: true, follow: true },
};

const APP_NAME = "Testio Customer";
const BUSINESS_NAME = "TESTIO HOSPITALITY SERVICES";
const CONTACT_EMAIL = "testio24x7india@gmail.com";
const WEBSITE_URL = "https://www.testiofood.com";
const PRIVACY_URL = "https://www.testiofood.com/privacy-policy";
const SUBJECT = "Testio Customer – Account Deletion Request";
const BODY_TEXT =
  "Hello,\n\nI would like to request deletion of my Testio Customer account.\n\nRegistered mobile number: \nRegistered email address (if any): \n";
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY_TEXT)}`;

const DELETED_ITEMS = [
  "Your name and email address",
  "Your profile photo",
  "Items in your cart",
  "Notification (push) tokens for your devices",
  "Referral and reward-coin records linked to your account",
];

const BODY = "text-xs text-slate-500 leading-relaxed font-medium break-words";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8161F] focus-visible:ring-offset-2 rounded-sm";
const LINK = `font-semibold text-[#C8161F] hover:underline ${FOCUS}`;

export default function DeleteAccountPage() {
  return (
    <>
      <PublicNavbar solid />
      <main className="min-h-screen bg-[#FAF8F8] py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight">
            Testio Customer – Account Deletion Request
          </h1>

          <div className="mt-8 flex flex-col gap-6 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 md:p-8">
            <section className="flex flex-col gap-1.5">
              <h2 className="text-sm font-bold text-[#091A36]">
                Your Privacy Matters to Us
              </h2>
              <p className={BODY}>
                {APP_NAME} respects your privacy and lets you request deletion of
                your account and associated personal information.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-[#091A36]">
                How to Request Account Deletion
              </h2>
              <p className={BODY}>
                Account deletion is requested by email and reviewed by our
                support team. It is not instant and cannot be done inside the
                app.
              </p>
              <ol className={`${BODY} list-decimal pl-5 flex flex-col gap-1.5`}>
                <li>
                  Send an email to {CONTACT_EMAIL} with the subject{" "}
                  &ldquo;{SUBJECT}&rdquo;.
                </li>
                <li>Include your registered mobile number or email address.</li>
                <li>
                  Our support team will verify your identity and process your
                  request.
                </li>
              </ol>
              <div>
                <a
                  href={MAILTO}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#C8161F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#A8121A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8161F] focus-visible:ring-offset-2"
                >
                  Email us to request deletion
                </a>
              </div>
              <p className={BODY}>
                We may contact you to confirm the account is yours before acting
                on your request. Never send your password, OTP or payment
                details by email. We will never ask for them.
              </p>
            </section>

            <section className="flex flex-col gap-1.5">
              <h2 className="text-sm font-bold text-[#091A36]">
                What Information Will Be Deleted?
              </h2>
              <p className={BODY}>
                After we verify your identity, we will delete the following
                personal information associated with your account:
              </p>
              <ul className={`${BODY} list-disc pl-5 flex flex-col gap-1.5`}>
                {DELETED_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-1.5">
              <h2 className="text-sm font-bold text-[#091A36]">Data Retention</h2>
              <p className={BODY}>
                Some information may be kept where required by applicable laws,
                regulatory requirements, fraud prevention or legitimate security
                purposes. This can include records of your orders, payments and
                refunds, and system logs.
              </p>
              <p className={BODY}>
                Retained information is handled in line with applicable legal
                requirements and our{" "}
                <Link href="/privacy-policy" className={LINK}>
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <section className="flex flex-col gap-1.5">
              <h2 className="text-sm font-bold text-[#091A36]">Contact Us</h2>
              <p className={BODY}>
                For account deletion requests or privacy-related questions.
              </p>
              <address className={`${BODY} not-italic flex flex-col gap-1`}>
                <span>
                  Application:{" "}
                  <span className="font-bold text-[#091A36]">{APP_NAME}</span>
                </span>
                <span>
                  Business:{" "}
                  <span className="font-bold text-[#091A36]">{BUSINESS_NAME}</span>
                </span>
                <span>
                  Email:{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
                    {CONTACT_EMAIL}
                  </a>
                </span>
                <span>
                  Website:{" "}
                  <a href={WEBSITE_URL} className={LINK}>
                    {WEBSITE_URL}
                  </a>
                </span>
                <span>
                  Privacy Policy:{" "}
                  <a href="/privacy-policy" className={LINK}>
                    {PRIVACY_URL}
                  </a>
                </span>
              </address>
            </section>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
