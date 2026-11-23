import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/marketing/PublicNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  BUSINESS_ADDRESS,
  BUSINESS_NAME,
  CONTACT_EMAIL,
  LAST_UPDATED,
  SECTIONS,
  WEBSITE_URL,
  type PolicyBlock,
} from "./policy-content";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | Testio Hospitality Services" },
  description:
    "Learn how Testio Hospitality Services collects, uses, stores and protects personal information when you use our website and customer application.",
  alternates: { canonical: "https://www.testiofood.com/privacy-policy" },
  robots: { index: true, follow: true },
};

const BODY = "text-xs text-slate-500 leading-relaxed font-medium break-words";
const LINK = "font-semibold text-[#E8202A] hover:underline";

function EmailLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
      {CONTACT_EMAIL}
    </a>
  );
}

function Block({ block }: { block: PolicyBlock }) {
  switch (block.kind) {
    case "p":
      return <p className={BODY}>{block.text}</p>;
    case "ul":
      return (
        <ul className={`${BODY} list-disc pl-5 flex flex-col gap-1.5`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "emailLine":
      return (
        <p className={BODY}>
          {block.lead} <EmailLink />.
        </p>
      );
    case "internalLink":
      return (
        <p className={BODY}>
          {block.lead}{" "}
          <Link
            href={block.href}
            className={`${LINK} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8161F] focus-visible:ring-offset-2 rounded-sm`}
          >
            {block.label}
          </Link>
          .
        </p>
      );
    case "contact":
      return (
        <address className={`${BODY} not-italic flex flex-col gap-1`}>
          <span className="font-bold text-[#091A36]">{BUSINESS_NAME}</span>
          <span>{BUSINESS_ADDRESS}</span>
          <span>
            Email: <EmailLink />
          </span>
          <span>
            Website:{" "}
            <a href={WEBSITE_URL} className={LINK}>
              {WEBSITE_URL}
            </a>
          </span>
        </address>
      );
  }
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <PublicNavbar solid />
      <main className="min-h-screen bg-[#FAF8F8] py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Last Updated: {LAST_UPDATED}
          </p>

          <div className="mt-8 flex flex-col gap-6 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-6 md:p-8">
            {SECTIONS.map((s) => (
              <section key={s.title} className="flex flex-col gap-1.5">
                <h2 className="text-sm font-bold text-[#091A36]">{s.title}</h2>
                {s.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
