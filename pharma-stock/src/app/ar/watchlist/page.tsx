import WatchlistPanel from "@/components/app/WatchlistPanel";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "قائمة متابعتي | Bio Pharma Stock",
  description: "الأسهم التي تتابعها، والتنبيهات التي تصلك عنها.",
  alternates: buildAlternates("/watchlist", "ar"),
  robots: { index: false, follow: false },
};

export default function WatchlistPageAr() {
  return (
    <main dir="rtl" className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-royalBlue dark:text-slate-100">
        قائمة متابعتي
      </h1>
      <WatchlistPanel lang="ar" />
    </main>
  );
}
