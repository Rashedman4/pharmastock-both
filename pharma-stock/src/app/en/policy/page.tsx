import PolicyComp from "@/components/app/PolicyComp";
import { buildAlternates } from "@/lib/seo";
export const metadata = {
  title: "Terms & Conditions | Bio Pharma Stock",
  description:
    "Read the Bio Pharma Stock terms and conditions, privacy policy, and investment risk disclaimer.",
  alternates: buildAlternates("/policy", "en"),
};
export default function PricingPage() {
  return (
    <div>
      <PolicyComp lang="en" />
    </div>
  );
}
