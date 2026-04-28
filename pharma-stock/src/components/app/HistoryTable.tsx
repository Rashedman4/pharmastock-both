"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHistoryData } from "@/hooks/useHistoryData";
import { LoadingSpinner } from "../LoadingSpinner";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};
const calculateProfit = (inPrice: number, outPrice: number) => {
  const profit = ((outPrice - inPrice) / inPrice) * 100;
  return profit.toFixed(2);
};
interface LangProps {
  lang: "en" | "ar";
}
export default function HistoryTable({ lang }: LangProps) {
  const { historyData, isLoading, error, refreshHistory, lastUpdated } =
    useHistoryData();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState lang={lang} />;
  }

  if (!historyData || historyData.length === 0) {
    return <EmptyState lang={lang} />;
  }

  return (
    <Card className="w-full ">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-royalBlue text-base sm:text-lg md:text-xl lg:text-2xl">
            {lang === "ar" ? "النتائج" : "Trade History"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <p className="text-[10px] sm:text-sm text-gray-500">
              {lang === "ar"
                ? `اخر تحديث: ${formatDate(lastUpdated.toISOString())}`
                : ` Last updated: ${formatDate(lastUpdated.toISOString())}`}
            </p>
            <Button
              onClick={refreshHistory}
              variant="outline"
              size="sm"
              className="text-[10px] sm:text-sm md:text-base"
            >
              <RefreshCcw
                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                  lang === "ar" ? "ml-1.5" : "mr-1.5"
                } `}
              />

              {lang === "ar" ? "اعادة تحميل" : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-royalBlue bg-opacity-10 text-center">
                <TableHead className="text-royalBlue font-semibold text-[10px] sm:text-sm md:text-base text-center px-3 sm:px-4 py-2 sm:py-3">
                  {lang === "ar" ? "الرمز" : "Symbol"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-[10px] sm:text-sm md:text-base text-center px-1 sm:px-4 py-2 sm:py-3">
                  {lang === "ar" ? "تاريخ الدخول" : "Entrance"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-[10px] sm:text-sm md:text-base text-center px-1 sm:px-4 py-2 sm:py-3">
                  {lang === "ar" ? "سعر الدخول" : "In Price"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-[10px] sm:text-sm md:text-base text-center px-1 sm:px-4 py-2 sm:py-3">
                  {lang === "ar" ? "سعر الخروج" : "Out Price"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-[10px] sm:text-sm md:text-base text-center px-1 sm:px-4 py-2 sm:py-3">
                  {lang === "ar" ? "الربح/الخسارة" : "Profit/Loss"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-[10px] sm:text-sm md:text-base text-center px-1 sm:px-4 py-2 sm:py-3">
                  {lang === "ar" ? "تاريخ الخروج" : "Closing"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {historyData.map((item, index) => {
                  const profitLoss = calculateProfit(
                    item.in_price,
                    item.out_price
                  );
                  return (
                    <motion.tr
                      key={`${item.symbol}-${item.entrance_date}-${item.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="hover:bg-lightGray transition-colors duration-200 text-center"
                    >
                      <TableCell className=" py-2 sm:py-4 px-3 sm:px-4">
                        <Badge
                          variant="outline"
                          className="bg-royalBlue bg-opacity-10 text-royalBlue text-[10px] sm:text-sm md:text-base px-1 sm:px-2 py-0.5 sm:py-1"
                        >
                          {item.symbol}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-sm md:text-base  py-2 sm:py-4 px-1 sm:px-4">
                        {formatDate(item.entrance_date)}
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-sm md:text-base  py-2 sm:py-4 px-1 sm:px-4">
                        ${item.in_price}
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-sm md:text-base  py-2 sm:py-4 px-1 sm:px-4">
                        ${item.out_price}
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-sm md:text-base  py-2 sm:py-4 px-1 sm:px-4">
                        <span
                          className={
                            Number.parseFloat(profitLoss) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {profitLoss}%
                        </span>
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-sm md:text-base  py-2 sm:py-4 px-1 sm:px-4">
                        {formatDate(item.closing_date)}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card className="p-4">
      <LoadingSpinner />
    </Card>
  );
}

function ErrorState({ lang }: LangProps) {
  return (
    <Card className="p-4 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-red-500 font-semibold text-xs sm:text-sm">
          {lang === "ar"
            ? "فشل في تحميل النتائج."
            : "Failed to load history data."}
        </p>
      </motion.div>
    </Card>
  );
}

function EmptyState({ lang }: LangProps) {
  return (
    <Card className="p-4 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-royalBlue font-semibold text-xs">
          {lang === "ar"
            ? "ليس هناك نتائج الان."
            : "No historical data available."}
        </p>
      </motion.div>
    </Card>
  );
}
