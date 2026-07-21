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
  title: "Bio Pharma Stock | رؤى بحثية لقطاع الأدوية الحيوية — حيث يلتقي العلم بالاستثمار",
  description:
    "حيث يلتقي العلم بالاستثمار. احصل على رؤى بحثية متخصصة في قطاع الأدوية الحيوية — تحليل التجارب السريرية، ومتابعة القرارات التنظيمية لإدارة الغذاء والدواء الأمريكية (FDA)، وإشارات مدعومة بالذكاء الاصطناعي لاستثمار أذكى في قطاعي الأدوية والتكنولوجيا الحيوية.",
  alternates: buildAlternates("", "ar"),
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
