import Hero from "@/components/app/Hero";
import TopStocksSlider from "@/components/app/TopStocksSlider";
import WhyPharmaSector from "@/components/app/WhyPharmaSector";
import WhyUs from "@/components/app/WhyUs";
import BreakthroughSpotlight from "@/components/app/BreakthroughSpotlight";
import IndustryInsights from "@/components/app/IndustryInsights";
import GlobalPharmaMap from "@/components/app/GlobalPharmaMap";
import EliteGroupCTA from "@/components/EliteGroupCTA";
import { buildAlternates } from "@/lib/seo";
export const metadata = {
  title:
    "Bio Pharma Stock | Biopharma Research Intelligence — Where Science Meets Investing",
  description:
    "Where science meets investing. Get biopharma research intelligence — clinical trial analysis, FDA regulatory tracking, and AI-driven signals for smarter pharmaceutical and biotech investing.",
  alternates: buildAlternates("", "en"),
};
export default function Home() {
  return (
    <main className="min-h-screen bg-pureWhite">
      <Hero lang="en" />
      <TopStocksSlider lang="en" />
      <EliteGroupCTA lang="en" />

      <div className="  py-8 ">
        <WhyPharmaSector lang="en" />
        <BreakthroughSpotlight lang="en" />
        <IndustryInsights lang="en" />
        <GlobalPharmaMap lang="en" />
        <WhyUs lang="en" />
      </div>

      <div className="container mx-auto py-8 " id="whyUs"></div>
    </main>
  );
}
