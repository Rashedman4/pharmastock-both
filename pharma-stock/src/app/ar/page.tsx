import Hero from "@/components/app/Hero";
import TopStocksSlider from "@/components/app/TopStocksSlider";
import WhyPharmaSector from "@/components/app/WhyPharmaSector";
import WhyUs from "@/components/app/WhyUs";
import BreakthroughSpotlight from "@/components/app/BreakthroughSpotlight";
import IndustryInsights from "@/components/app/IndustryInsights";
import GlobalPharmaMap from "@/components/app/GlobalPharmaMap";
import EliteGroupCTA from "@/components/EliteGroupCTA";
export const metadata = {
  title: "أفضل الأسهم الدوائية و تحليلات السوق | Bio Pharma Stock",
  description:
    "احصل على أحدث التحليلات حول أسهم الأدوية ونتائج التجارب السريرية واتجاهات السوق. تحليل مدعوم بالذكاء الاصطناعي لاتخاذ قرارات استثمارية أكثر ذكاءً.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-pureWhite rtl">
      <Hero lang="ar" />
      <TopStocksSlider lang="ar" />
      <EliteGroupCTA lang="ar" />
      <div className="  py-8 ">
        <WhyPharmaSector lang="ar" />
        <BreakthroughSpotlight lang="ar" />
        <IndustryInsights lang="ar" />
        <GlobalPharmaMap lang="ar" />
        <WhyUs lang="ar" />
      </div>

      <div className="container mx-auto py-8 " id="whyUs"></div>
    </main>
  );
}
