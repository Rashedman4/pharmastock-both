"use client";

import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useRef } from "react";

const translations = {
  en: {
    title: "Global Pharmaceutical Landscape",
    description:
      "Discover investment opportunities across the world's pharmaceutical markets and track regional growth trends.",
    regions: {
      "north-america": "North America",
      europe: "Europe",
      "asia-pacific": "Asia-Pacific",
      "emerging-markets": "Emerging Markets",
    },
    labels: {
      growth: "Growth",
      topSectors: "TOP SECTORS",
      trackedCompanies: "TRACKED COMPANIES",
      investmentOpportunity: "INVESTMENT OPPORTUNITY",
      clickRegion: "Click on a region to view detailed information",
      opportunityLevels: {
        low: "Low",
        medium: "Medium",
        high: "High",
      },
    },
  },
  ar: {
    title: "المشهد الصيدلاني العالمي",
    description:
      "اكتشف فرص الاستثمار في أسواق الأدوية العالمية وتتبع اتجاهات النمو الإقليمية.",
    regions: {
      "north-america": "أمريكا الشمالية",
      europe: "أوروبا",
      "asia-pacific": "آسيا والمحيط الهادئ",
      "emerging-markets": "الأسواق الناشئة",
    },
    labels: {
      growth: "النمو",
      topSectors: "القطاعات الرئيسية",
      trackedCompanies: "الشركات المتتبعة",
      investmentOpportunity: "فرصة الاستثمار",
      clickRegion: "انقر على منطقة لعرض معلومات مفصلة",
      opportunityLevels: {
        low: "منخفض",
        medium: "متوسط",
        high: "مرتفع",
      },
    },
  },
};

interface RegionDetailCardProps {
  region: RegionData;
}
interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  description: string;
}
interface MapAnimationProps {
  children: React.ReactNode;
  className?: string;
}
interface RegionPathProps {
  path: string;
  isActive: boolean;
  onClick: () => void;
  delay?: number;
}
interface RegionData {
  id: string;
  name: string;
  growth: number;
  companies: number;
  topSectors: string[];
  description: string;
}

const translatedRegions = {
  en: [
    {
      id: "north-america",
      name: "North America",
      growth: 5.8, // CAGR 2025–2030, Grand View Research 2026
      companies: 2400, // Estimated active pharma manufacturers in the U.S. and Canada, 2025
      topSectors: ["Oncology", "GLP-1 / Metabolic", "ADCs"],
      description:
        "North America represents ~47% of global pharmaceutical revenue in 2025. GLP-1 drugs (semaglutide, tirzepatide) are the fastest-growing category, with Eli Lilly and Novo Nordisk dominating. The U.S. also leads in ADC approvals — 19 therapies cleared by mid-2026 — and AI-driven drug discovery, with 173+ clinical programs active. (Source: IQVIA, Grand View Research)",
    },
    {
      id: "europe",
      name: "Europe",
      growth: 4.8, // CAGR 2025–2030, Precedence Research 2026
      companies: 1850, // Estimated pharmaceutical companies in Europe, 2025
      topSectors: ["Oncology", "Biosimilars", "Cardiovascular"],
      description:
        "Europe accounts for ~18% of global pharmaceutical sales, with Germany, France, and Switzerland as the largest markets. Biosimilar adoption is accelerating rapidly as key biologics lose exclusivity, with the EU biosimilars segment growing at ~14% CAGR. Oncology remains the dominant therapy area by spend. EMA approved 89 new medicines in 2025. (Source: EMA, Precedence Research)",
    },
    {
      id: "asia-pacific",
      name: "Asia-Pacific",
      growth: 9.5, // CAGR 2025–2030, multiple sources
      companies: 3400, // Estimated pharmaceutical companies in Asia-Pacific, 2025
      topSectors: ["Generics", "Biosimilars", "AI Drug Discovery"],
      description:
        "Asia-Pacific is the fastest-growing pharmaceutical region with a projected CAGR of ~9.5% through 2030. China's pharmaceutical output exceeded $200B in 2025, while India remains the world's largest supplier of generic medicines by volume, supplying ~20% of global generic exports. Japan leads Asia in ADC and biologics development. AI drug discovery in China has surged, with over 40 companies active. (Source: GlobalData, IQVIA)",
    },
    {
      id: "emerging-markets",
      name: "Emerging Markets",
      growth: 7.5, // CAGR 2025–2030; Latin America 7.03%, Middle East/Africa similar
      companies: 1600, // Estimated active pharmaceutical companies in EM, 2025
      topSectors: ["Generics", "Vaccines", "Biosimilars"],
      description:
        "Emerging markets (Latin America, Middle East, Africa) represent a combined pharmaceutical market of over $200B in 2025. Brazil leads Latin America at ~$50B, with the region growing at 7% CAGR to 2034. Biosimilar and vaccine rollouts, improving healthcare infrastructure, and a rising middle class are the primary growth engines. GLP-1 access programs are beginning to expand in these regions. (Source: Precedence Research, Grand View Research)",
    },
  ],
  ar: [
    {
      id: "north-america",
      name: "أمريكا الشمالية",
      growth: 5.8,
      companies: 2400,
      topSectors: ["علم الأورام", "عقاقير GLP-1 / الاستقلاب", "الأجسام المضادة المترافقة"],
      description:
        "تمثل أمريكا الشمالية نحو ٤٧٪ من إيرادات الأدوية العالمية في ٢٠٢٥. تُعد عقاقير GLP-1 (سيماغلوتيد وتيرزيباتيد) الفئة الأسرع نموًا، بقيادة إيلي ليلي ونوفو نورديسك. تتصدر الولايات المتحدة أيضًا في موافقات الأجسام المضادة المترافقة (ADC) بـ١٩ علاجًا معتمدًا، وفي اكتشاف الأدوية بالذكاء الاصطناعي بأكثر من ١٧٣ برنامجًا سريريًا نشطًا. (المصدر: IQVIA، Grand View Research)",
    },
    {
      id: "europe",
      name: "أوروبا",
      growth: 4.8,
      companies: 1850,
      topSectors: ["علم الأورام", "الأدوية البيولوجية المشابهة", "أمراض القلب"],
      description:
        "تمثل أوروبا نحو ١٨٪ من مبيعات الأدوية العالمية، وتُعدّ ألمانيا وفرنسا وسويسرا أكبر أسواقها. يتسارع تبني الأدوية البيولوجية المشابهة (biosimilars) مع انتهاء فترات الحصرية للعقاقير الحيوية الكبرى، بمعدل نمو سنوي ~١٤٪. يستحوذ علم الأورام على أكبر حصة من الإنفاق العلاجي. وافقت وكالة EMA على ٨٩ دواءً جديدًا في ٢٠٢٥. (المصدر: EMA، Precedence Research)",
    },
    {
      id: "asia-pacific",
      name: "آسيا والمحيط الهادئ",
      growth: 9.5,
      companies: 3400,
      topSectors: ["الأدوية الجنيسة", "الأدوية البيولوجية المشابهة", "اكتشاف الأدوية بالذكاء الاصطناعي"],
      description:
        "تُعد آسيا والمحيط الهادئ المنطقة الأسرع نموًا دوائيًا بمعدل نمو سنوي متوقع ~٩.٥٪ حتى ٢٠٣٠. تجاوز الإنتاج الدوائي الصيني ٢٠٠ مليار دولار في ٢٠٢٥، فيما تظل الهند المورد الأكبر للأدوية الجنيسة عالميًا بنسبة ~٢٠٪ من الصادرات. تقود اليابان آسيا في تطوير الأجسام المضادة المترافقة والمستحضرات البيولوجية، فيما تضم الصين أكثر من ٤٠ شركة نشطة في مجال الذكاء الاصطناعي الدوائي. (المصدر: GlobalData، IQVIA)",
    },
    {
      id: "emerging-markets",
      name: "الأسواق الناشئة",
      growth: 7.5,
      companies: 1600,
      topSectors: ["الأدوية الجنيسة", "اللقاحات", "الأدوية البيولوجية المشابهة"],
      description:
        "تمثل الأسواق الناشئة (أمريكا اللاتينية، الشرق الأوسط، أفريقيا) سوقًا دوائيًا مجمعًا يتجاوز ٢٠٠ مليار دولار في ٢٠٢٥. تتصدر البرازيل أمريكا اللاتينية بنحو ٥٠ مليار دولار، بمعدل نمو إقليمي ٧٪ حتى ٢٠٣٤. تُشكّل برامج توزيع اللقاحات والأدوية البيولوجية المشابهة، وتحسن البنية التحتية الصحية، والطبقة الوسطى المتنامية محركات النمو الرئيسية. (المصدر: Precedence Research، Grand View Research)",
    },
  ],
};
interface LangProps {
  lang: "en" | "ar";
}

export default function GlobalPharmaMap({ lang }: LangProps) {
  const [activeRegion, setActiveRegion] = useState<string>("north-america");
  const regions = translatedRegions[lang];
  const selectedRegion =
    regions.find((region) => region.id === activeRegion) || regions[0];
  const t = translations[lang];
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        {/* Section header with scroll animation */}
        <SectionHeader
          title={t.title}
          icon={<Globe className="mr-2" />}
          description={t.description}
          lang={lang}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <MapAnimation className="lg:col-span-2">
            <div className="relative h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-inner">
              <svg viewBox="0 0 800 400" className="w-full h-full">
                {/* Simplified world map with interactive regions */}
                <RegionPath
                  path="M150,120 C180,100 220,110 250,120 C280,130 310,120 340,110 C370,100 400,110 430,120 L430,200 C400,190 370,200 340,210 C310,220 280,210 250,200 C220,190 180,200 150,180 Z"
                  isActive={activeRegion === "north-america"}
                  onClick={() => setActiveRegion("north-america")}
                  delay={0.1}
                />
                <RegionPath
                  path="M450,120 C480,110 510,120 540,130 C570,140 600,130 630,120 L630,180 C600,190 570,180 540,170 C510,160 480,170 450,180 Z"
                  isActive={activeRegion === "europe"}
                  onClick={() => setActiveRegion("europe")}
                  delay={0.2}
                />
                <RegionPath
                  path="M550,200 C580,190 610,200 640,210 C670,220 700,210 730,200 L730,260 C700,270 670,260 640,250 C610,240 580,250 550,260 Z"
                  isActive={activeRegion === "asia-pacific"}
                  onClick={() => setActiveRegion("asia-pacific")}
                  delay={0.3}
                />
                <RegionPath
                  path="M250,250 C280,240 310,250 340,260 C370,270 400,260 430,250 L430,310 C400,320 370,310 340,300 C310,290 280,300 250,310 Z"
                  isActive={activeRegion === "emerging-markets"}
                  onClick={() => setActiveRegion("emerging-markets")}
                  delay={0.4}
                />

                {/* Region labels */}
                <text
                  x={lang === "en" ? 200 : 250}
                  y="150"
                  fill={activeRegion === "north-america" ? "#fff" : "#333"}
                  fontSize="12"
                >
                  {t.regions["north-america"]}
                </text>
                <text
                  x="540"
                  y="150"
                  fill={activeRegion === "europe" ? "#fff" : "#333"}
                  fontSize="12"
                >
                  {t.regions["europe"]}
                </text>
                <text
                  x={lang === "en" ? 640 : 700}
                  y="230"
                  fill={activeRegion === "asia-pacific" ? "#fff" : "#333"}
                  fontSize="12"
                >
                  {t.regions["asia-pacific"]}
                </text>
                <text
                  x={lang === "en" ? 280 : 350}
                  y="280"
                  fill={activeRegion === "emerging-markets" ? "#fff" : "#333"}
                  fontSize="12"
                >
                  {t.regions["emerging-markets"]}
                </text>
              </svg>

              <div
                className={`absolute bottom-4 ${
                  lang == "en" ? "left-4" : "left--4"
                } bg-white/80 backdrop-blur-sm p-2 rounded-md text-xs`}
              >
                {t.labels.clickRegion}
              </div>
            </div>
          </MapAnimation>

          <RegionDetailCard region={selectedRegion} lang={lang} />
        </div>
      </div>
    </section>
  );
}

// Add these components at the end of the file, before the closing }
function SectionHeader({
  title,
  icon,
  description,
  lang,
}: LangProps & SectionHeaderProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="text-center mb-12"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7 }}
    >
      <motion.h2
        className="text-3xl font-bold text-royalBlue mb-2 flex items-center justify-center"
        initial={{ scale: 0.9 }}
        animate={isInView ? { scale: 1 } : { scale: 0.9 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {lang == "ar" && `${title}`} {icon} {lang == "en" && `${title}`}
      </motion.h2>
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: "100px" } : { width: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="h-1 bg-brightTeal mx-auto mb-4"
      />
      <motion.p
        className="text-gray-600 max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}

function MapAnimation({ children, className }: MapAnimationProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={
        isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
      }
      transition={{ duration: 0.7 }}
    >
      {children}
    </motion.div>
  );
}

function RegionPath({ path, isActive, onClick, delay }: RegionPathProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.path
      ref={ref}
      d={path}
      fill={isActive ? "#0A2472" : "#CFD8DC"}
      stroke="#fff"
      strokeWidth="2"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={
        isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
      }
      transition={{ duration: 1, delay: delay }}
    />
  );
}

function RegionDetailCard({ region, lang }: LangProps & RegionDetailCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const t = translations[lang];
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
      transition={{ duration: 0.7 }}
      key={region.id} // Re-trigger animation when region changes
    >
      <Card className="h-full border-2 border-royalBlue/20 bg-white shadow-lg">
        <CardContent className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            key={`header-${region.id}`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-royalBlue">
                {region.name}
              </h3>
              <Badge
                className={`${
                  region.growth > 8
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {lang == "ar" && t.labels.growth}
                {region.growth > 8 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {lang == "en" && t.labels.growth}
              </Badge>
            </div>

            <p className="text-gray-600 mb-6">{region.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            key={`sectors-${region.id}`}
            className="space-y-4"
          >
            <div>
              <h4 className="text-sm font-semibold text-gray-500">
                {t.labels.topSectors}
              </h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {region.topSectors.map((sector: string, idx: number) => (
                  <motion.div
                    key={sector}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}
                  >
                    <Badge variant="outline" className="bg-gray-100">
                      {sector}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-500">
                {t.labels.trackedCompanies}
              </h4>
              <motion.p
                className="text-2xl font-bold text-royalBlue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                key={`companies-${region.id}`}
              >
                {region.companies}
              </motion.p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            key={`opportunity-${region.id}`}
            className="mt-6 pt-4 border-t border-gray-200"
          >
            <h4 className="text-sm font-semibold text-gray-500 mb-2">
              {t.labels.investmentOpportunity}
            </h4>
            <motion.div
              className="w-full bg-gray-200 rounded-full h-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <motion.div
                className="bg-brightTeal h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(region.growth * 7, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.6 }}
              ></motion.div>
            </motion.div>
            <div className="flex justify-between text-xs mt-1">
              <span>{t.labels.opportunityLevels.low}</span>
              <span>{t.labels.opportunityLevels.medium}</span>
              <span>{t.labels.opportunityLevels.high}</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
