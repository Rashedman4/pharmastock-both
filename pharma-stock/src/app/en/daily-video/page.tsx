import DailyVideo from "@/components/app/DailyVideo";
import QuestionForm from "@/components/app/QuestionForm";

export const metadata = {
  title: "Daily Market Insights | Bio Pharma Stock",
  description:
    "Watch daily market insights and stock analysis videos. Get expert opinions on market trends, stock performance, and investment opportunities.",
  keywords: [
    "stock market insights",
    "daily market analysis",
    "stock trends",
    "investment insights",
    "financial market updates",
    "technical analysis",
    "trading strategies",
    "market news",
    "US stocks",
    "stock predictions",
  ],
};
export default function DailyVideoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-royalBlue mb-6">
        Daily Market Insights
      </h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <DailyVideo lang="en" />
        </div>
        <div>
          <QuestionForm lang="en" />
        </div>
      </div>
    </div>
  );
}
