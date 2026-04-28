import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUpIcon, BarChart3Icon } from "lucide-react";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type ParamsType = { stockSymbol: string };

export default async function AskAboutStockPage({
  params,
}: {
  params: ParamsType | Promise<ParamsType>;
}) {
  const { stockSymbol } = await params;
  const symbol = stockSymbol.toUpperCase();
  let stockData = null;
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/stock-management/info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.API_SECRET_KEY || "fallback-secret-key",
        },
        body: JSON.stringify({ symbol }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error("Failed to fetch stock info");
    }

    stockData = await response.json();
  } catch (error) {
    console.error("Error:", error);
  }

  if (!stockData) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl md:text-4xl font-bold text-royalBlue mb-4 md:mb-0">
          {stockData.name} Stock Details ({symbol})
        </h1>
        <div className="flex flex-col md:flex-row items-start md:items-center">
          <span className="text-2xl md:text-3xl font-bold mr-2 text-teal-500 mb-2 md:mb-0">
            ${stockData.price}
          </span>
          <span
            className={`flex items-center text-lg ${
              stockData.changesPercentage >= 0
                ? "text-[#28A745]"
                : "text-[#DC3545]"
            }`}
          >
            {stockData.changesPercentage >= 0 ? (
              <ArrowUpIcon className="w-5 h-5 mr-1" />
            ) : (
              <ArrowDownIcon className="w-5 h-5 mr-1" />
            )}
            {stockData.change} ({stockData.changePercent}
            %)
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-royalBlue flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2" /> Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Previous Close</p>
              <p className="font-semibold text-teal-500">
                ${stockData.previousClose}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price Open</p>
              <p className="font-semibold text-teal-500">${stockData.open}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Day Low</p>
              <p className="font-semibold text-teal-500">${stockData.dayLow}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Day High</p>
              <p className="font-semibold text-teal-500">
                ${stockData.dayHigh}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-royalBlue flex items-center">
              <BarChart3Icon className="w-5 h-5 mr-2" /> Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Volume</p>
              <p className="font-semibold text-teal-500">
                $ {new Intl.NumberFormat("en-US").format(stockData.volume)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Volume </p>
              <p className="font-semibold text-teal-500">
                $ {new Intl.NumberFormat("en-US").format(stockData.avgVolume)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price Average (50 Days)</p>
              <p className="font-semibold text-teal-500">
                ${new Intl.NumberFormat("en-US").format(stockData.priceAvg50)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Market Cap</p>
              <p className="font-semibold text-teal-500">
                ${new Intl.NumberFormat("en-US").format(stockData.marketCap)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
