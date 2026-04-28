import { CardContent } from "@/components/ui/card";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type ParamsType = { stockSymbol: string };
export default async function PriceTargets({
  params,
}: {
  params: ParamsType | Promise<ParamsType>;
}) {
  const { stockSymbol } = await params;
  const symbol = stockSymbol.toUpperCase();

  let priceTargets = null;
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/stock-management/target`,
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
        return (
          <CardContent>
            <div className="sm:w-auto mb-4 text-center">
              <p className="font-semibold text-lg text-royalBlue">
                No price target data available for this stock.
              </p>
            </div>
          </CardContent>
        );
      }
      throw new Error("Failed to fetch stock info");
    }

    priceTargets = await response.json();
  } catch (error) {
    console.error("Error:", error);
    return <div>Error fetching price target data.</div>;
  }

  if (!priceTargets) {
    return <div>No data Found</div>;
  }

  const {
    targetHigh: HighTarget,
    targetLow: LowTarget,
    targetConsensus: ConsensusTaregt,
    targetMedian: MedianTarget,
  } = priceTargets;

  const recommendation = {
    HighTarget,
    ConsensusTaregt,
    MedianTarget,
    LowTarget,
  };

  return (
    <CardContent>
      <div className="flex flex-wrap justify-between">
        {Object.entries(recommendation).map(([key, value]) => (
          <div key={key} className="w-1/2 sm:w-auto mb-4 text-center">
            <p className="text-sm text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <p
              className={`font-semibold text-lg ${
                key.includes("High")
                  ? "text-[#28A745]"
                  : key.includes("Low")
                    ? "text-[#DC3545]"
                    : "text-[#1877F2]"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </CardContent>
  );
}
