"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ar } from "date-fns/locale";
import { RefreshCcw, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "../LoadingSpinner";
import { formatDistanceToNow, format } from "date-fns";
interface LangProps {
  lang: "en" | "ar";
}

interface NewsItem {
  id: number;
  symbol: string;
  title_en: string;
  title_ar: string;
  //price: number;
  published_date: string;
}

interface NewsResponse {
  news: NewsItem[];
  totalPages: number;
  currentPage: number;
  totalNews: number;
}

export default function NewsFeed({ lang }: LangProps) {
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [symbolInput, setSymbolInput] = useState<string>("");
  const [activeSymbol, setActiveSymbol] = useState<string>("");

  const fetchNews = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const symbolParam = activeSymbol
        ? `&symbol=${encodeURIComponent(activeSymbol)}`
        : "";
      const response = await fetch(`/api/news?page=${page}${symbolParam}`);
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      const data: NewsResponse = await response.json();
      setNewsData(data);
      setCurrentPage(page);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeSymbol]);

  useEffect(() => {
    fetchNews(currentPage);
  }, [currentPage, fetchNews]);

  const handleRefresh = () => {
    fetchNews(1);
    setLastUpdated(new Date());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSymbol(symbolInput.trim());
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSymbolInput("");
    setActiveSymbol("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState lang={lang} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 mb-6">
        <div
          className={`flex items-center justify-between ${
            lang === "ar" ? "flex-row-reverse" : ""
          }`}
        >
          <p className="text-sm text-gray-500">
            {lang === "ar" ? "آخر تحديث:" : "Last updated:"}{" "}
            {format(lastUpdated, "HH:mm:ss")}
          </p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            <RefreshCcw
              className={`w-4 h-4 ${lang === "ar" ? "ml-2" : "mr-2"}`}
            />
            {lang === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>

        <form
          onSubmit={handleSearch}
          className={`flex gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}
        >
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            placeholder={
              lang === "ar"
                ? "ابحث برمز السهم (مثال: NXP)"
                : "Search by symbol (e.g., NXP)"
            }
            className="flex-1 px-3 py-2 border rounded-md text-sm"
            aria-label={lang === "ar" ? "رمز السهم" : "Symbol"}
          />
          <Button type="submit" className="bg-brightTeal text-pureWhite">
            {lang === "ar" ? "بحث" : "Search"}
          </Button>
          {activeSymbol && (
            <Button type="button" variant="outline" onClick={clearSearch}>
              {lang === "ar" ? "إزالة البحث" : "Clear"}
            </Button>
          )}
        </form>

        {activeSymbol && (
          <p
            className={`text-xs text-gray-500 ${
              lang === "ar" ? "text-right" : "text-left"
            }`}
          >
            {lang === "ar" ? "نتائج لرمز:" : "Results for symbol:"}{" "}
            <span className="font-semibold">{activeSymbol}</span>
          </p>
        )}
      </div>

      <motion.div className="space-y-4">
        {newsData?.news.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-brightTeal">
                    {item.symbol}
                  </span>
                  {/*   <span
                    className={`font-semibold ${
                      item.price > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${item.price}
                  </span> */}
                </div>
                <p className="text-gray-700 mb-2">
                  {lang === "ar" ? item.title_ar : item.title_en}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar
                    className={`w-4 h-4 ${lang === "ar" ? "ml-1" : "mr-1"}`}
                  />
                  {formatDistanceToNow(new Date(item.published_date), {
                    addSuffix: true,
                    locale: lang === "ar" ? ar : undefined,
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {newsData && newsData.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {lang === "ar" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                صفحة {currentPage} من {newsData.totalPages}
              </span>{" "}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === newsData.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {newsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === newsData.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
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
          {lang === "ar" ? "فشل في تحميل الأخبار." : "Failed to load news."}
        </p>
      </motion.div>
    </Card>
  );
}
