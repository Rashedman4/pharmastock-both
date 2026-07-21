import PublicPartnerPage from "@/components/program/PublicPartnerPage";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Partner Program | Bio Pharma Stock",
  description:
    "Become a Bio Pharma Stock partner. Refer investors to our Elite Investors Group program and earn commissions on successful referrals.",
  alternates: buildAlternates("/partners", "en"),
};

export default function PartnersPageEn() {
  return <PublicPartnerPage lang="en" />;
}
