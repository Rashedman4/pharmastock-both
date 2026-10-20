import { notFound } from "next/navigation";
import StockDetail, { type StockDetailData } from "@/components/app/StockDetail";
import { buildAlternates } from "@/lib/seo";
import { getStockDetail, normalizeSymbol } from "@/modules/stocks/stocks.service";

// Same cadence as the news page: fresh enough for a content page, cheap enough
// to keep off every request.
export const revalidate = 300;

interface Props {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { symbol } = await params;
  const upper = normalizeSymbol(symbol);
  const stock = await getStockDetail(upper, null).catch(() => null);
  const name = stock?.name_en && stock.name_en !== upper ? ` (${stock.name_en})` : "";

  return {
    title: `${upper}${name} — News, FDA Designations & Announcements | Bio Pharma Stock`,
    description: `Everything we publish on ${upper}${name}: company announcements, daily updates, FDA designations and news.`,
    alternates: buildAlternates(`/stocks/${upper}`, "en"),
  };
}

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const upper = normalizeSymbol(symbol);

  // Rendered server-side with no user, so the page is complete for crawlers;
  // the client component refetches with the session for the watch state.
  const stock = await getStockDetail(upper, null);
  if (!stock) notFound();

  return (
    <main className="container mx-auto px-4 py-8">
      <StockDetail
        lang="en"
        symbol={upper}
        initialData={stock as unknown as StockDetailData}
      />
    </main>
  );
}
