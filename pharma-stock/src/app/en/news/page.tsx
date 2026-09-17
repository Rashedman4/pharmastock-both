import NewsSection from "@/components/app/NewsSection";
import { buildAlternates } from "@/lib/seo";
export const metadata = {
  title: "Latest Pharmaceutical News | Bio Pharma Stock",
  description:
    "Stay updated with the latest news and articles about pharmaceutical stocks and market trends.",
  alternates: buildAlternates("/news", "en"),
};
export default function NewsPage() {
  return (
    <main className="container mx-auto px-0 py-0">
      <h1 className="text-3xl font-bold text-royalBlue mb-6">
        Latest Pharmaceutical News
      </h1>
      <NewsSection lang="en" />
    </main>
  );
}
