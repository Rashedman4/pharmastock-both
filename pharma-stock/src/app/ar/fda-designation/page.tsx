import BreakthroughsPage from "@/components/app/BreakthroughsPage";
import { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "تصنيفات هيئةالغذاء والدواء | Bio Pharma Stock",
  description:
    "استكشف التصنيفات الحالية لإدارة الغذاء والدواء (FDA) لأسهم الأدوية المبتكرة وأفكار الاستثمار.",
  alternates: buildAlternates("/fda-designation", "ar"),
  keywords: [
    "أسهم الأدوية المعتمدة من FDA",
    "إشارات البيوتكنولوجي",
    "تداول أسهم الأدوية",
    "فرص الاستثمار",
    "التحليل الفني",
    "إشارات السوق",
    "إشارات الأسهم بالذكاء الاصطناعي",
    "اتجاهات سوق البيوتكنولوجي",
    "أسهم شركات الأدوية",
    "رؤى قطاع الأدوية",
  ],
};
export default function Breakthroughs() {
  return (
    <main className="container mx-auto px-4 py-8">
      <BreakthroughsPage lang="ar" />
    </main>
  );
}
