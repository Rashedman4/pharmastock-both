import MobileTermsOfService from "@/components/app/MobileTermsOfService";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Terms of Service | Bio Pharma Stock",
  description:
    "The terms governing your use of the Bio Pharma Stock mobile app, including account registration, website-only Elite program access, and account termination.",
  alternates: buildAlternates("/terms-of-service", "en"),
};

export default function TermsOfServicePage() {
  return <MobileTermsOfService lang="en" />;
}
