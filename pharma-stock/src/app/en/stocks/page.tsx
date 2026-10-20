import { Suspense } from "react";
import StockSearchPanel from "@/components/app/StockSearchPanel";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "Search US Biopharma Stocks | Bio Pharma Stock",
  description:
    "Search the US biopharmaceutical and biotech stocks we cover, and follow the ones you care about.",
  alternates: buildAlternates("/stocks", "en"),
};

export default function StocksSearchPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-royalBlue dark:text-slate-100">
        Search Stocks
      </h1>
      <p className="mb-6 text-slate-600 dark:text-slate-300">
        Find a company, open its page, and follow it to get alerts.
      </p>
      {/* The panel reads `?q=`, so it needs a boundary to stay static. */}
      <Suspense fallback={null}>
        <StockSearchPanel lang="en" />
      </Suspense>
    </main>
  );
}
