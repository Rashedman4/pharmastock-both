import AskAboutStockComp from "@/components/app/AskAboutStockComp";
export const metadata = {
  title: "Ask About a Stock | Bio Pharma Stock",
  description:
    "Get instant AI-powered insights on any stock. Analyze pharma stock trends, clinical trials, and investment opportunities in the pharmaceutical industry.",
  keywords: [
    "ask about a stock",
    "stock analysis",
    "AI stock insights",
    "pharma stock trends",
    "clinical trial tracking",
    "investment in healthcare stocks",
    "market predictions",
    "biotech stock analysis",
    "financial research",
    "pharmaceutical industry investments",
  ],
};
export default function AskAboutStockPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AskAboutStockComp lang="en" />
    </div>
  );
}
