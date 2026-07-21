import PublicPartnerPage from "@/components/program/PublicPartnerPage";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "برنامج الشركاء | Bio Pharma Stock",
  description:
    "كن شريكًا لدى Bio Pharma Stock. رشّح المستثمرين للانضمام إلى برنامج Elite Investors Group واحصل على عمولات على الإحالات الناجحة.",
  alternates: buildAlternates("/partners", "ar"),
};

export default function PartnersPageAr() {
  return <PublicPartnerPage lang="ar" />;
}
