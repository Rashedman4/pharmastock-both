import MobileTermsOfService from "@/components/app/MobileTermsOfService";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "شروط الخدمة | BioPharmaStock",
  description:
    "الشروط التي تحكم استخدامك لتطبيق BioPharmaStock، بما في ذلك برنامج النخبة والمدفوعات وإنهاء الحساب.",
  alternates: buildAlternates("/terms-of-service", "ar"),
};

export default function TermsOfServicePage() {
  return <MobileTermsOfService lang="ar" />;
}
