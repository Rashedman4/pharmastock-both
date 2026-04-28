"use client";

import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Lightbulb, TrendingUp, BarChart3, ArrowUpLeft } from "lucide-react";
import { useRef } from "react";

interface ChartAnimationProps {
  children: React.ReactNode;
  className?: string;
}

interface InsightItemProps {
  insight: InsightData;
  index: number;
}
interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  description: string;
}
interface InsightData {
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  sectors: string[];
}
interface langProps {
  lang: "en" | "ar";
}
const insightsTranslation: Record<"en" | "ar", InsightData[]> = {
  en: [
    {
      title: "AI in Drug Discovery Gains Ground",
      description:
        "Top pharma firms have increased investment in AI by 40% YoY, accelerating early-stage drug screening and lowering R&D costs across oncology and neurology.",
      impact: "positive",
      sectors: ["AI", "Biotech", "Pharma R&D"],
    },
    {
      title: "Biosimilars Disrupt Patent-Expired Blockbusters",
      description:
        "With Humira’s patent expired, biosimilars are projected to save $180B in drug spending globally by 2028, putting pressure on branded revenue streams.",
      impact: "negative",
      sectors: ["Generics", "Biologics", "Healthcare Cost"],
    },
    {
      title: "Precision Medicine Becomes Mainstream",
      description:
        "Over 50% of new FDA approvals in 2023 were tied to targeted or biomarker-driven therapies, reflecting a shift toward individualized treatment plans.",
      impact: "positive",
      sectors: ["Genomics", "Diagnostics", "Oncology"],
    },
  ],
  ar: [
    {
      title: "الذكاء الاصطناعي يغير اكتشاف الأدوية",
      description:
        "زادت شركات الأدوية الاستثمار في الذكاء الاصطناعي بنسبة ٤٠٪ سنويًا، مما يسرّع من فحص الأدوية المبكر ويقلل التكاليف في مجالات مثل الأورام والأعصاب.",
      impact: "positive",
      sectors: ["الذكاء الاصطناعي", "التكنولوجيا الحيوية", "البحث والتطوير"],
    },
    {
      title: "الأدوية المشابهة تؤثر على الأدوية الأصلية",
      description:
        "بعد انتهاء براءة اختراع دواء هيوميرا، من المتوقع أن توفر البدائل الحيوية ١٨٠ مليار دولار في تكاليف الأدوية بحلول عام ٢٠٢٨، مما يضغط على إيرادات الأدوية الأصلية.",
      impact: "negative",
      sectors: ["الأدوية المشابهة", "البيولوجيا", "تكاليف الرعاية الصحية"],
    },
    {
      title: "الطب الدقيق يصبح السائد",
      description:
        "أكثر من ٥٠٪ من الموافقات الجديدة من FDA في عام ٢٠٢٣ كانت لعلاجات موجهة أو تعتمد على مؤشرات حيوية، مما يعكس تحولًا نحو خطط علاج فردية.",
      impact: "positive",
      sectors: ["الجينوم", "التشخيص", "علم الأورام"],
    },
  ],
};

const marketTrendData = [
  { year: "2018", traditional: 100, precision: 40, digital: 20 },
  { year: "2019", traditional: 104, precision: 65, digital: 38 },
  { year: "2020", traditional: 108, precision: 95, digital: 65 },
  { year: "2021", traditional: 110, precision: 130, digital: 100 },
  { year: "2022", traditional: 113, precision: 165, digital: 140 },
  { year: "2023", traditional: 115, precision: 200, digital: 190 },
  { year: "2024", traditional: 117, precision: 240, digital: 250 },
  { year: "2025", traditional: 120, precision: 280, digital: 310 },
];

export default function IndustryInsights({ lang }: langProps) {
  const insights = insightsTranslation[lang];
  return (
    <section className="py-16 bg-gradient-to-br from-royalBlue/5 via-royalBlue/2 to-brightTeal/5">
      <div className="container mx-auto px-4">
        <SectionHeader
          title={lang === "ar" ? "رؤى الصناعة" : "Industry Insights"}
          icon={
            <Lightbulb
              className={`${lang == "en" ? "mr-2" : "ml-2"} text-brightTeal`}
            />
          }
          description={
            lang === "ar"
              ? "استفد من تحليلنا المتخصص لاتجاهات صناعة الأدوية لاتخاذ قرارات استثمارية ذكية."
              : "Leverage our expert analysis of pharmaceutical industry trends to make informed investment decisions."
          }
          lang={lang}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <ChartAnimation className="lg:col-span-2">
            <Card className="shadow-lg h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-royalBlue mb-4 flex items-center">
                  {lang == "en" && (
                    <TrendingUp className="mr-2 h-5 w-5 text-brightTeal" />
                  )}
                  {lang === "ar"
                    ? "نمو تقسيمات سوق الأدوية"
                    : "Pharmaceutical Market Segmentation Growth"}

                  {lang == "ar" && (
                    <ArrowUpLeft className="ml-2 h-5 w-5 text-brightTeal" />
                  )}
                </h3>

                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={marketTrendData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="traditional"
                        name="Traditional Pharma"
                        stroke="#0A2472"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="precision"
                        name="Precision Medicine"
                        stroke="#00A896"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="digital"
                        name="Digital Therapeutics"
                        stroke="#B8E994"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  {lang === "ar"
                    ? "يعرض النمو المفهرس (2018 = 100) أن العلاجات الرقمية والدقيقة تنمو بشكل أسرع من خطوط إنتاج الأدوية التقليدية."
                    : "Indexed growth (2018 = 100) shows precision and digital therapies scaling faster than legacy pharma pipelines."}
                </p>
              </CardContent>
            </Card>
          </ChartAnimation>
          <div>
            <Card className="shadow-lg h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-royalBlue mb-4 flex items-center">
                  {lang == "en" && (
                    <BarChart3 className="mr-2 h-5 w-5 text-brightTeal" />
                  )}
                  {lang === "ar" ? "الاتجاهات الرئيسية" : "Key Trends"}
                  {lang == "ar" && (
                    <BarChart3 className="mr-2 h-5 w-5 text-brightTeal" />
                  )}
                </h3>
                <div className="space-y-6">
                  {insights?.map((insight, index) => (
                    <InsightItem
                      key={index}
                      insight={insight}
                      index={index}
                      lang={lang}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-gray-500 mt-8"
        >
          {lang === "ar"
            ? "*البيانات مستندة إلى أبحاث الصناعة ومحدثة في أبريل 2025."
            : "*Data based on industry research and updated in April 2025."}
        </motion.p>
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
}: langProps & SectionHeaderProps) {
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

function ChartAnimation({ children, className }: ChartAnimationProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
      transition={{ duration: 0.7 }}
    >
      {children}
    </motion.div>
  );
}

function InsightItem({ insight, index, lang }: langProps & InsightItemProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="pb-4 border-b border-gray-200 last:border-0"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800">{insight.title}</h4>
        <Badge
          className={
            insight.impact === "positive"
              ? "bg-green-100 text-green-800"
              : insight.impact === "negative"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }
        >
          {lang === "ar"
            ? insight.impact === "positive"
              ? "صعودي"
              : insight.impact === "negative"
              ? "هبوطي"
              : "محايد"
            : insight.impact === "positive"
            ? "Bullish"
            : insight.impact === "negative"
            ? "Bearish"
            : "Neutral"}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
      <div className="flex flex-wrap gap-1">
        {insight.sectors.map((sector, idx) => (
          <motion.div
            key={sector}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
            }
            transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}
          >
            <Badge variant="outline" className="text-xs">
              {sector}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* function ButtonAnimation({ children }: { children: ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
 */
