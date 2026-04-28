import NewsFeed from "@/components/app/NewsFeed";
export const metadata = {
  title: "Latest Pharmaceutical News | Bio Pharma Stock",
  description:
    "Stay updated with the latest news and articles about pharmaceutical stocks and market trends.",
  keywords: [
    "pharmaceutical news",
    "pharma stock news",
    "biotech stocks",
    "stock market updates",
    "trading news",
    "PharmaStock analysis",
    "healthcare stocks",
    "FDA approvals",
    "biotech investments",
    "latest drug developments",
    "financial news",
    "stock predictions",
    "pharma industry trends",
    "investment opportunities",
    "market reports",
  ],
};
export default function NewsPage() {
  return (
    <main className="container mx-auto px-0 py-0">
      <h1 className="text-3xl font-bold text-royalBlue mb-6">
        Latest Pharmaceutical News
      </h1>
      <NewsFeed lang="en" />
    </main>
  );
}
