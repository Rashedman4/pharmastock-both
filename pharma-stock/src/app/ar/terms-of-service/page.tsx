import MobileTermsOfService from "@/components/app/MobileTermsOfService";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "شروط الخدمة | Bio Pharma Stock",
  description:
    "الشروط التي تحكم استخدامك لتطبيق Bio Pharma Stock، بما في ذلك تسجيل الحساب، والوصول إلى برنامج النخبة عبر الموقع الإلكتروني فقط، وإنهاء الحساب.",
  alternates: buildAlternates("/terms-of-service", "ar"),
};

export default function TermsOfServicePage() {
  return <MobileTermsOfService lang="ar" />;
}
