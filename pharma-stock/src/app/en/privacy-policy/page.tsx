import MobilePrivacyPolicy from "@/components/app/MobilePrivacyPolicy";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Privacy Policy | BioPharmaStock",
  description:
    "How the BioPharmaStock mobile app collects, uses, and protects your information, including data retention and account deletion.",
  alternates: buildAlternates("/privacy-policy", "en"),
};

export default function PrivacyPolicyPage() {
  return <MobilePrivacyPolicy lang="en" />;
}
