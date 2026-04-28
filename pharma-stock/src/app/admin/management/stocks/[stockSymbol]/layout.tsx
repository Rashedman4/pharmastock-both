import React from "react";
//import { useRouter } from "next/router";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSignIcon, NewspaperIcon, Target } from "lucide-react";
import { Metadata } from "next";
type ParamsType = { stockSymbol: string };
export async function generateMetadata({
  params,
}: {
  params: ParamsType | Promise<ParamsType>;
}): Promise<Metadata> {
  const { stockSymbol } = await params;
  return {
    title: `Stock Information: ${stockSymbol} | Comprehensive Data & Analysis`,
    description: `Detailed analysis and data for ${stockSymbol}. Stay updated with real-time stock prices, news, and historical performance.`,
    keywords: `${stockSymbol}, stock analysis, stock market data, US stock prices, stock news`,
  };
}

export default function StockDetailsPageLayout({
  children,
  recomendations,
  latestArticles,
  priceTarget,
  priceTargetNews,
  downUp,
  duRecomendation,
}: {
  children: React.ReactNode;
  recomendations: React.ReactNode;
  latestArticles: React.ReactNode;
  priceTarget: React.ReactNode;
  priceTargetNews: React.ReactNode;
  downUp: React.ReactNode;
  duRecomendation: React.ReactNode;
}) {
  //const router = useRouter();
  //const { symbol } = router.query;

  // Mock data (replace with actual API call in a real application)

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50">
        {children}

        <Card className="mb-8 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-royalBlue flex items-center text-2xl">
              <DollarSignIcon className="w-6 h-6 mr-2" /> Recommendations
            </CardTitle>
          </CardHeader>
          {recomendations}
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300 mb-8">
          <CardHeader>
            <CardTitle className="text-royalBlue flex items-center text-2xl">
              <NewspaperIcon className="w-6 h-6 mr-2" />
              Upgrade/Downgrade
            </CardTitle>
          </CardHeader>
          {downUp}
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300 mb-12">
          <CardHeader>
            <CardTitle className="text-royalBlue flex items-center text-2xl">
              <NewspaperIcon className="w-6 h-6 mr-2" />
              Upgrade/Downgrade Recomendations
            </CardTitle>
          </CardHeader>
          {duRecomendation}
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300 mb-8">
          <CardHeader>
            <CardTitle className="text-royalBlue flex items-center text-2xl">
              <NewspaperIcon className="w-6 h-6 mr-2" /> Latest Price Target
            </CardTitle>
          </CardHeader>
          {priceTargetNews}
        </Card>
        <Card className="mb-8 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-royalBlue flex items-center text-2xl">
              <Target className="w-6 h-6 mr-2" /> Price Target
            </CardTitle>
          </CardHeader>
          {priceTarget}
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-royalBlue flex items-center text-2xl">
              <NewspaperIcon className="w-6 h-6 mr-2" /> Latest News
            </CardTitle>
          </CardHeader>
          {latestArticles}
        </Card>
      </div>
    </>
  );
}
