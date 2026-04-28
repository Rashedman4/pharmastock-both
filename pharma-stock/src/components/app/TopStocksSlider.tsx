"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

// Dummy data for fallback
const dummyStocks = [
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    price: 165.23,
    change: 1.2,
  },
  { symbol: "PFE", name: "Pfizer Inc.", price: 38.47, change: -0.5 },
  { symbol: "MRK", name: "Merck & Co.", price: 114.56, change: 0.8 },
  {
    symbol: "ABBV",
    name: "AbbVie Inc.",
    price: 147.89,
    change: 2.1,
  },
  {
    symbol: "LLY",
    name: "Eli Lilly and Company",
    price: 432.67,
    change: 3.5,
  },
  {
    symbol: "BMY",
    name: "Bristol-Myers Squibb",
    price: 67.34,
    change: -1.2,
  },
  { symbol: "AMGN", name: "Amgen Inc.", price: 238.91, change: 0.3, image: "" },
  {
    symbol: "GILD",
    name: "Gilead Sciences",
    price: 78.56,
    change: -0.7,
  },
  {
    symbol: "VRTX",
    name: "Vertex Pharmaceuticals",
    price: 345.12,
    change: 1.8,
  },
  {
    symbol: "REGN",
    name: "Regeneron Pharmaceuticals",
    price: 789.45,
    change: 2.7,
  },
];

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface LangProps {
  lang: "en" | "ar";
}

export default function TopStocksSlider({ lang }: LangProps) {
  const [stocks, setStocks] = useState<Stock[]>(dummyStocks);

  useEffect(() => {
    fetch("/api/home-page-prices")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setStocks(data);
      })
      .catch(() => setStocks(dummyStocks));
  }, []);

  return (
    <div className="w-full bg-gray-100 py-3 md:py-6 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-royalBlue mb-4">
          {lang === "ar" ? "أفضل الأسهم الدوائية" : " Top Pharma Stocks"}
        </h2>
        <motion.div
          animate={{
            x:
              lang === "ar"
                ? [100, 50 * stocks.length]
                : [-100, -50 * stocks.length],
          }}
          transition={{
            duration: 40,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="flex gap-4 md:gap-6"
        >
          {stocks.map((stock, index) => (
            <Card
              key={`${stock.symbol}-${index}`}
              className="flex-shrink-0 w-64 md:w-72"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-bold text-lg">{stock.symbol}</h3>
                  <p className="text-sm text-gray-600">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${stock.price?.toFixed(2)}</p>
                  <p
                    className={`flex items-center ${
                      stock.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stock.change >= 0 ? (
                      <ArrowUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(stock.change)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
