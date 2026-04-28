import type { Metadata } from "next";
import { ArrowUpDown } from "lucide-react";
import HistoryTable from "@/components/app/HistoryTable";
import HistoryChart from "@/components/app/HistoryChart";

export const metadata: Metadata = {
  title: "النتائج | Bio Pharma Stock",
  description: "عرض بيانات التداول و النتائج لأسهم الأدوية.",
};

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-royalBlue flex items-center">
          <ArrowUpDown className="ml-2 h-6 w-6 sm:h-8 sm:w-8" />
          النتائج
        </h1>
        <div className="mt-1 h-1 w-16 sm:w-20 bg-brightTeal"></div>
      </div>
      <div className="space-y-4 sm:space-y-8">
        <HistoryChart lang="ar" />
        <HistoryTable lang="ar" />
      </div>
    </div>
  );
}
