import BreakthroughsPage from "@/components/app/BreakthroughsPage";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FDA Designations | Bio Pharma Stock",
  description:
    "Explore current FDA designations for innovative drug stocks and investment insights.",
  keywords: [
    "FDA drug stocks",
    "biotech signals",
    "pharma stock trading",
    "investment opportunities",
    "technical analysis",
    "market signals",
    "AI stock signals",
    "biotech market trends",
    "drug company stocks",
    "pharma sector insights",
  ],
};

export default function Breakthroughs() {
  return (
    <main className="container mx-auto px-4 py-8">
      <BreakthroughsPage lang="en" />
    </main>
  );
}
