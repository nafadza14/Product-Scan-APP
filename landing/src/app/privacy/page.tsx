import type { Metadata } from "next";
import { LegalPage } from "@/components/sites/scanything/LegalPage";

export const metadata: Metadata = {
  title: "Kebijakan Privasi / Privacy Policy · Scanything",
  description:
    "How Scanything collects, uses and protects your personal data, including photos and health information, and how to delete it. Available in Indonesian and English.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
