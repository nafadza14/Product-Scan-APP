import type { Metadata } from "next";
import { LegalPage } from "@/components/sites/scanything/LegalPage";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan / Terms of Service · Scanything",
  description:
    "The terms for using Scanything: health information disclaimer, accounts, Premium subscriptions, refunds and your rights. Available in Indonesian and English.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
