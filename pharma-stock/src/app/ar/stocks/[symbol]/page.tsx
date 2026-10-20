import { notFound } from "next/navigation";
import StockDetail, { type StockDetailData } from "@/components/app/StockDetail";
import { buildAlternates } from "@/lib/seo";
import { getStockDetail, normalizeSymbol } from "@/modules/stocks/stocks.service";

export const revalidate = 300;

interface Props {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { symbol } = await params;
  const upper = normalizeSymbol(symbol);
  const stock = await getStockDetail(upper, null).catch(() => null);
  const name = stock?.name_ar || stock?.name_en || "";
  const suffix = name && name !== upper ? ` (${name})` : "";

  return {
    title: `${upper}${suffix} — الأخبار والإعلانات والتصنيفات | Bio Pharma Stock`,
    description: `كل ما ننشره عن ${upper}${suffix}: إعلانات الشركة والتحديثات اليومية وتصنيفات هيئة الغذاء والدواء والأخبار.`,
    alternates: buildAlternates(`/stocks/${upper}`, "ar"),
  };
}

export default async function StockPageAr({ params }: Props) {
  const { symbol } = await params;
  const upper = normalizeSymbol(symbol);

  const stock = await getStockDetail(upper, null);
  if (!stock) notFound();

  return (
    <main dir="rtl" className="container mx-auto px-4 py-8">
      <StockDetail
        lang="ar"
        symbol={upper}
        initialData={stock as unknown as StockDetailData}
      />
    </main>
  );
}
