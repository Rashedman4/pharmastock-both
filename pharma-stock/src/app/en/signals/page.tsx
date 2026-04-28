import { Signal } from "lucide-react";
import SignalsTable from "@/components/app/SignalsTable";
export const metadata = {
  title: "Ideas | Bio Pharma Stock",
  description: "View current trading signals for pharmaceutical stocks.",
  keywords: [
    "Pharma stock signals",
    "trading signals",
    "pharmaceutical stocks",
    "stock market",
    "investment",
    "stock signals analysis",
    "Pharma trading",
    "buy sell signals",
    "technical analysis",
    "market trends",
    "stock price forecast",
    "pharma sector trading",
    "AI stock signals",
    "financial market indicators",
    "best pharma stocks",
  ],
};
export default function SignalsPage() {
  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-royalBlue flex items-center">
          <Signal className="mr-2 h-8 w-8" />
          Ideas
        </h1>
        <div className="mt-2 h-1 w-20 bg-brightTeal"></div>{" "}
        <p className="mt-3 text-sm text-gray-600 ">
          These signals are generated using advanced and highly efficient
          analytics and are provided for{" "}
          <strong>educational purposes only</strong>. You should conduct your
          own research before making any investment decisions. We do not
          guarantee any specific outcomes and are not responsible for any
          financial losses.
        </p>
      </div>
      <SignalsTable lang="en" />
    </div>
  );
}
