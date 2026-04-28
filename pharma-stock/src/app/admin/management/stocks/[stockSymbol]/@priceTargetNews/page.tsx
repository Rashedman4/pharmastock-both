import { CardContent } from "@/components/ui/card";
import { priceTargetSymbol } from "@/types/adminSchemas";
import { ExternalLink } from "lucide-react";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type ParamsType = { stockSymbol: string };
export default async function PriceTargetNews({
  params,
}: {
  params: ParamsType | Promise<ParamsType>;
}) {
  const { stockSymbol } = await params;
  const value = stockSymbol.toUpperCase();
  const type = "symbol";

  let latestTargetArticles: priceTargetSymbol[] | null = null;
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/stock-management/priceTargetNews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.API_SECRET_KEY || "fallback-secret-key",
        },
        body: JSON.stringify({ value, type }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return (
          <CardContent>
            {" "}
            <h3 className="text-lg font-semibold text-royalBlue my-4 text-center ">
              No price target articles found for {value}
            </h3>
          </CardContent>
        );
      }
      throw new Error("Failed to fetch price target articles info");
    }

    const data = await response.json();
    // Check if data is an array, if not, try to extract articles from a nested property
    latestTargetArticles = Array.isArray(data) ? data : data.articles || [];

    if (!Array.isArray(latestTargetArticles)) {
      console.error("Unexpected data structure:", latestTargetArticles);
      latestTargetArticles = [];
    }
  } catch (error) {
    console.error("Error:", error);
    return <div>Error fetching price target data.</div>;
  }

  if (!latestTargetArticles || latestTargetArticles.length === 0) {
    return (
      <CardContent>
        {" "}
        <h3 className="text-lg font-semibold text-royalBlue my-4 text-center">
          No price Target articles found for {value}
        </h3>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-6">
      <div className="space-y-6">
        {latestTargetArticles.map((article, index) => (
          <div
            key={index}
            className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 hover:bg-gray-50 p-4 rounded transition-colors duration-300"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {article.analystCompany}
              </span>
              <span className="text-sm text-gray-600 italic">
                Analyst: {article.analystName}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-royalBlue mb-2">
              {article.newsTitle}
            </h3>

            <a
              href={article.newsURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center mb-2"
            >
              View Article <ExternalLink className="ml-1" size={14} />
            </a>

            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                Price: ${article.priceWhenPosted.toFixed(2)}
              </span>
              <span className="text-sm font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Target: ${article.priceTarget.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-end text-xs text-gray-500">
              <div>
                <span className="block">
                  {new Date(article.publishedDate).toLocaleDateString()}
                </span>
                <span className="block italic">{article.newsPublisher}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
}
