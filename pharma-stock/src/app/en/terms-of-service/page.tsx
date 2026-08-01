import MobileTermsOfService from "@/components/app/MobileTermsOfService";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Terms of Service | BioPharmaStock",
  description:
    "The terms governing your use of the BioPharmaStock mobile app, including the Elite program, payments, and account termination.",
  alternates: buildAlternates("/terms-of-service", "en"),
};

export default function TermsOfServicePage() {
  return <MobileTermsOfService lang="en" />;
}
