import SocialLinksLanding from "@/components/app/SocialLinksLanding";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Join Our Investor Community | Bio Pharma Stock",
  description:
    "Connect with the Bio Pharma Stock community for pharmaceutical and biotech investors. Follow us for research updates, discussions, and the latest signals.",
  alternates: buildAlternates("/community", "en"),
};

export default function JoinPage() {
  return <SocialLinksLanding lang="en" />;
}
