import MobilePrivacyPolicy from "@/components/app/MobilePrivacyPolicy";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "سياسة الخصوصية | BioPharmaStock",
  description:
    "كيفية قيام تطبيق BioPharmaStock بجمع معلوماتك واستخدامها وحمايتها، بما في ذلك الاحتفاظ بالبيانات وحذف الحساب.",
  alternates: buildAlternates("/privacy-policy", "ar"),
};

export default function PrivacyPolicyPage() {
  return <MobilePrivacyPolicy lang="ar" />;
}
