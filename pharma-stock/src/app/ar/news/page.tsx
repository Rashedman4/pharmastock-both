import NewsSection from "@/components/app/NewsSection";
import { buildAlternates } from "@/lib/seo";
export const metadata = {
  title: "اخر الأخبار | Bio Pharma Stock",
  description:
    "ابق على اطلاع بآخر الأخبار والمقالات حول أسهم الأدوية واتجاهات السوق.",
  alternates: buildAlternates("/news", "ar"),
};
export default function NewsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-royalBlue mb-6">
        آخر الأخبار الدوائية{" "}
      </h1>
      <NewsSection lang="ar" />
    </main>
  );
}
