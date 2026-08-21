import MobilePrivacyPolicy from "@/components/app/MobilePrivacyPolicy";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "سياسة الخصوصية | Bio Pharma Stock",
  description:
    "كيفية قيام تطبيق Bio Pharma Stock بجمع معلوماتك واستخدامها وحمايتها، بما في ذلك الاحتفاظ بالبيانات وحذف الحساب.",
  alternates: buildAlternates("/privacy-policy", "ar"),
};

export default function PrivacyPolicyPage() {
  return <MobilePrivacyPolicy lang="ar" />;
}
