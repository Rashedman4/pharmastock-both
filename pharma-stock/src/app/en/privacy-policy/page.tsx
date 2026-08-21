import MobilePrivacyPolicy from "@/components/app/MobilePrivacyPolicy";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Privacy Policy | Bio Pharma Stock",
  description:
    "How the Bio Pharma Stock mobile app collects, uses, and protects your information, including data retention and account deletion.",
  alternates: buildAlternates("/privacy-policy", "en"),
};

export default function PrivacyPolicyPage() {
  return <MobilePrivacyPolicy lang="en" />;
}
