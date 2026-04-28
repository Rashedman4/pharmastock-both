"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RawSignal } from "@/types/signal";
import { useSignals } from "@/hooks/useSignals";
import { LoadingSpinner } from "../LoadingSpinner";
import { RefreshCcw, Info } from "lucide-react";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const formatDateSignal = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
interface LangProps {
  lang: "en" | "ar";
}
export default function SignalsTable({ lang }: LangProps) {
  const { signals, isLoading, error, refreshSignals } = useSignals();
  const [selectedSignal, setSelectedSignal] = useState<RawSignal | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleRefresh = () => {
    refreshSignals();
    setLastUpdated(new Date());
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState lang={lang} />;
  }

  if (!signals || signals.length === 0) {
    return <EmptyState lang={lang} />;
  }

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardContent className="p-2 sm:p-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs sm:text-sm text-gray-500">
            Last updated: {formatDate(lastUpdated.toISOString())}
          </p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
          >
            <RefreshCcw
              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                lang === "ar" ? "ml-1.5" : "mr-1.5"
              } `}
            />
            Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-royalBlue bg-opacity-10">
                <TableHead className="text-royalBlue font-semibold text-xs sm:text-sm text-center">
                  {lang === "ar" ? "الرمز" : "Symbol"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-xs sm:text-sm  text-center">
                  {lang === "ar" ? "النوع" : "Type"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-xs sm:text-sm  text-center">
                  {lang === "ar" ? "سعر الدخول" : "Enter"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-xs sm:text-sm text-center">
                  {lang === "ar" ? "السعر الآن" : "Now"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-xs sm:text-sm text-center">
                  {lang === "ar" ? "الهدف الأول" : "Target 1"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-xs sm:text-sm text-center">
                  {lang === "ar" ? "الهدف الثاني" : "Target 2"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-xs sm:text-sm text-center">
                  {lang === "ar" ? "تاريخ الدخول" : "Opened"}
                </TableHead>
                <TableHead className="text-royalBlue font-semibold text-xs sm:text-sm text-center">
                  {lang === "ar" ? "السبب" : "Reason"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {signals.map((signal, index) => (
                  <motion.tr
                    key={signal.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-lightGray transition-colors duration-200 text-center"
                  >
                    <TableCell className="text-xs sm:text-sm md:text-base px-1 sm:px-4 py-2 sm:py-3">
                      <Badge
                        variant="outline"
                        className="bg-royalBlue bg-opacity-10 text-royalBlue  text-[10px] sm:text-xs md:text-sm px-3 sm:px-4 py-2 sm:py-3 text-center"
                      >
                        {signal.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-xs sm:text-sm md:text-base font-semibold px-1 sm:px-4 py-2 sm:py-3 ${
                        signal.type === "Buy"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {signal.type}
                    </TableCell>
                    <TableCell className="text-[10px] sm:text-sm md:text-base px-1 sm:px-4 py-2 sm:py-3">
                      {signal.enter_price}
                    </TableCell>
                    <TableCell className="text-[10px] sm:text-sm md:text-base px-1 sm:px-4 py-2 sm:py-3">
                      {signal.price_now}
                    </TableCell>
                    <TableCell className="text-[10px] sm:text-sm md:text-base px-1 sm:px-4 py-2 sm:py-3">
                      {signal.first_target}
                    </TableCell>
                    <TableCell className="text-[10px] sm:text-sm md:text-base px-1 sm:px-4 py-2 sm:py-3">
                      {signal.second_target}
                    </TableCell>
                    <TableCell className="text-[10px] sm:text-sm md:text-base px-1 sm:px-4 py-2 sm:py-3">
                      {formatDateSignal(signal.date_opened)}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-brightTeal hover:text-royalBlue hover:bg-brightTeal hover:bg-opacity-10 text-xs sm:text-sm p-1 sm:p-2"
                                  onClick={() => setSelectedSignal(signal)}
                                >
                                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline ml-1">
                                    {lang === "ar" ? "لماذا؟" : "Why?"}
                                  </span>
                                </Button>
                              </DialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs sm:text-sm">
                                {lang === "ar"
                                  ? "رؤية سبب الدخول"
                                  : "See signal rationale"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-center">
                              {lang === "ar" ? (
                                <span dir="rtl">
                                  ما سبب التوصية بشراء السهم{" "}
                                  {selectedSignal?.symbol}؟
                                </span>
                              ) : (
                                `Why ${selectedSignal?.symbol} ${selectedSignal?.type} Signal?`
                              )}
                            </DialogTitle>
                            <DialogDescription
                              className={`${lang == "ar" && "text-right"}`}
                            >
                              {lang === "ar" ? (
                                <span dir="rtl">
                                  هذه التوصية من نوع
                                  {selectedSignal?.type === "Buy"
                                    ? " شراء"
                                    : " شراء"}{" "}
                                  على سهم ${selectedSignal?.symbol} بسبب:
                                </span>
                              ) : (
                                `This ${selectedSignal?.type.toLowerCase()} signal for ${
                                  selectedSignal?.symbol
                                } is due to:`
                              )}
                            </DialogDescription>
                          </DialogHeader>

                          <p
                            className={`text-xs sm:text-sm mt-2 ${
                              lang == "ar" && "text-right"
                            }`}
                          >
                            {lang === "ar" ? (
                              <span dir="rtl">{selectedSignal?.reason_ar}</span>
                            ) : (
                              selectedSignal?.reason_en
                            )}
                          </p>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </motion.tr>
                ))}
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
    <Card className="p-4 sm:p-8">
      <LoadingSpinner />
    </Card>
  );
}

function ErrorState({ lang }: LangProps) {
  return (
    <Card className="p-4 sm:p-8 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-red-500 font-semibold text-xs sm:text-sm">
          {lang === "ar" ? "فشل في تحميل التوصيات." : "Failed to load signals."}
        </p>
      </motion.div>
    </Card>
  );
}

function EmptyState({ lang }: LangProps) {
  return (
    <Card className="p-4 sm:p-8 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-royalBlue font-semibold text-xs sm:text-sm">
          {lang === "ar"
            ? "ليس هناك توصيات الان."
            : "There are no signals now."}
        </p>
      </motion.div>
    </Card>
  );
}
