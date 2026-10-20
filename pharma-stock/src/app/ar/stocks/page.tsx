import { Suspense } from "react";
import StockSearchPanel from "@/components/app/StockSearchPanel";
import { buildAlternates } from "@/lib/seo";

export const metadata = {
  title: "البحث عن أسهم الأدوية الأمريكية | Bio Pharma Stock",
  description:
    "ابحث في أسهم شركات الأدوية والتكنولوجيا الحيوية الأمريكية التي نغطيها، وتابع ما يهمك منها.",
  alternates: buildAlternates("/stocks", "ar"),
};

export default function StocksSearchPageAr() {
  return (
    <main dir="rtl" className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-royalBlue dark:text-slate-100">
        البحث عن الأسهم
      </h1>
      <p className="mb-6 text-slate-600 dark:text-slate-300">
        ابحث عن شركة، وافتح صفحتها، وتابعها لتصلك التنبيهات.
      </p>
      {/* The panel reads `?q=`, so it needs a boundary to stay static. */}
      <Suspense fallback={null}>
        <StockSearchPanel lang="ar" />
      </Suspense>
    </main>
  );
}
