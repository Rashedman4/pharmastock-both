import PolicyComp from "@/components/app/PolicyComp";
import { buildAlternates } from "@/lib/seo";
export const metadata = {
  title: "الشروط والأحكام | Bio Pharma Stock",
  description:
    "اطّلع على الشروط والأحكام وسياسة الخصوصية وإخلاء المسؤولية عن مخاطر الاستثمار الخاصة بـ Bio Pharma Stock.",
  alternates: buildAlternates("/policy", "ar"),
};
export default function PricingPage() {
  return (
    <div>
      <PolicyComp lang="ar" />
    </div>
  );
}
