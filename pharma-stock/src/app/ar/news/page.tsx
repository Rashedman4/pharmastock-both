import NewsSection from "@/components/app/NewsSection";
import { buildAlternates } from "@/lib/seo";
import { getNewsPage, type NewsPage } from "@/lib/queries/news";

export const metadata = {
  title: "اخر الأخبار | Bio Pharma Stock",
  description:
    "ابق على اطلاع بآخر الأخبار والمقالات حول أسهم الأدوية واتجاهات السوق.",
  alternates: buildAlternates("/news", "ar"),
};

// Regenerate every 5 minutes. News changes often enough to matter and rarely
// enough that per-request rendering would be waste.
export const revalidate = 300;

export default async function NewsPage() {
  // A failed query must not take the page down: NewsFeed falls back to its
  // original fetch-on-mount when handed null.
  let initialNews: NewsPage | null = null;
  try {
    initialNews = await getNewsPage({ page: 1 });
  } catch (error) {
    console.error("/ar/news: server-side news fetch failed", error);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-royalBlue mb-6">
        آخر الأخبار الدوائية{" "}
      </h1>
      <NewsSection lang="ar" initialNews={initialNews} />
    </main>
  );
}
