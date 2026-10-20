import WatchlistPanel from "@/components/app/WatchlistPanel";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "My Watchlist | Bio Pharma Stock",
  description: "The stocks you follow, and the alerts you get for them.",
  alternates: buildAlternates("/watchlist", "en"),
  // Signed-in only (PROTECTED_ROUTES in middleware.ts), so there is nothing
  // for a crawler to index here.
  robots: { index: false, follow: false },
};

export default function WatchlistPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-royalBlue dark:text-slate-100">
        My Watchlist
      </h1>
      <WatchlistPanel lang="en" />
    </main>
  );
}
