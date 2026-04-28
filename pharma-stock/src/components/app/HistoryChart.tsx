"use client";

import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";

import { useHistoryData } from "@/hooks/useHistoryData";

import { ArrowUp, ArrowDown, RefreshCcw } from "lucide-react";
import { LoadingSpinner } from "../LoadingSpinner";

import type React from "react"; // Import React

import { Button } from "@/components/ui/button";
interface LangProps {
  lang: "en" | "ar";
}
export default function HistoryChart({ lang }: LangProps) {
  const { historyData, isLoading, error, refreshHistory, lastUpdated } =
    useHistoryData();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  const profitCount = historyData.filter((item) => item.success).length;

  const lossCount = historyData.filter((item) => item.success === false).length;

  const totalTrades = historyData.length;

  const calculatePercentage = (count: number) =>
    totalTrades ? (count / totalTrades) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-royalBlue text-base sm:text-lg md:text-xl lg:text-2xl">
              {lang === "ar" ? "أداء التداول" : "Trade Performance"}
            </CardTitle>

            <div className="flex items-center space-x-2">
              <p className="text-[10px] sm:text-sm text-gray-500">
                {lang === "ar"
                  ? ` آخر تحديث: ${formatDate(lastUpdated.toISOString())}`
                  : `Last updated: ${formatDate(lastUpdated.toISOString())}`}
              </p>

              <Button
                onClick={refreshHistory}
                variant="outline"
                size="sm"
                className="text-[10px] sm:text-sm md:text-base"
              >
                <RefreshCcw
                  className={`w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 ${
                    lang == "ar" ? "ml-1.5" : "mr-1.5"
                  }`}
                />
                {lang === "ar" ? "إعادة تحميل" : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <PerformanceBar
              label={lang === "ar" ? "ربح" : "Profit"}
              count={profitCount}
              percentage={calculatePercentage(profitCount)}
              color="text-green-500"
              icon={<ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />}
              lang={lang}
            />

            <PerformanceBar
              label={lang === "ar" ? "خسارة" : "Loss"}
              count={lossCount}
              percentage={calculatePercentage(lossCount)}
              color="text-red-500"
              icon={<ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />}
              lang={lang}
            />
          </div>

          <p className="text-xs sm:text-sm md:text-base mt-2 text-gray-500">
            Total Trades: {totalTrades}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PerformanceBar({
  label,

  count,

  percentage,

  color,

  icon,
  lang,
}: {
  label: string;

  count: number;

  percentage: number;

  color: string;

  icon: React.ReactNode;
  lang: string;
}) {
  return (
    <div className="space-y-1 sm:space-y-2" dir="rtl">
      <div
        className="flex justify-between items-center text-xs sm:text-sm md:text-base"
        dir="rtl"
      >
        <div className="flex items-center space-x-1 sm:space-x-2">
          <span className={`p-1 sm:p-1.5 rounded-full ${color}`}>{icon}</span>

          <span className={`font-medium ${color}`}>{label}</span>
        </div>

        <span className={`font-medium ${color}`}>
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>

      <Progress
        value={percentage}
        className={`h-2 sm:h-2.5 md:h-3  rounded-lg rtl`}
        dir={lang === "ar" ? "rtl" : "ltr"}
      />
    </div>
  );
}

function ErrorState() {
  return (
    <Card className="p-6 sm:p-8 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-red-500 font-semibold text-xs sm:text-sm md:text-base">
          Failed to load chart data.
        </p>
      </motion.div>
    </Card>
  );
}

function formatDate(isoString: string) {
  const date = new Date(isoString);

  return date.toLocaleDateString();
}
function LoadingState() {
  return (
    <Card className="p-4">
      <LoadingSpinner />
    </Card>
  );
}
