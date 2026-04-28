import NewsFeed from "@/components/app/NewsFeed";
export const metadata = {
  title: "اخر الأخبار | Bio Pharma Stock",
  description:
    "ابق على اطلاع بآخر الأخبار والمقالات حول أسهم الأدوية واتجاهات السوق.",
  keywords: [
    "أخبار الأدوية",
    "أخبار أسهم شركات الأدوية",
    "أسهم التكنولوجيا الحيوية",
    "تحديثات سوق الأسهم",
    "أخبار التداول",
    "تحليل سوق الأسهم الدوائية",
    "أسهم الرعاية الصحية",
    "موافقات هيئة الغذاء والدواء",
    "استثمارات التكنولوجيا الحيوية",
    "آخر تطورات الأدوية",
    "أخبار المال والأعمال",
    "توقعات سوق الأسهم",
    "اتجاهات صناعة الأدوية",
    "فرص الاستثمار",
    "تقارير السوق",
  ],
};
export default function NewsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-royalBlue mb-6">
        آخر الأخبار الدوائية{" "}
      </h1>
      <NewsFeed lang="ar" />
    </main>
  );
}
