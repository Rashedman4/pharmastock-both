"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Microscope, TrendingUp, Pill, HeartPulse } from "lucide-react";
import { useRef } from "react";

interface LangProps {
  lang: "en" | "ar";
}

const translations = {
  en: {
    title: "Why Invest in the Pharmaceutical Sector?",
    reasons: [
      {
        title: "Innovation Driven",
        description:
          "Constant breakthroughs in medical research and technology",
        icon: Microscope,
        position: "left",
      },
      {
        title: "Growing Demand",
        description:
          "Aging population and increasing healthcare needs worldwide",
        icon: TrendingUp,
        position: "right",
      },
      {
        title: "High Profit Margins",
        description: "Strong returns on investment for successful drugs",
        icon: Pill,
        position: "left",
      },
      {
        title: "Global Impact",
        description: "Improving lives and health outcomes across the world",
        icon: HeartPulse,
        position: "right",
      },
    ],
  },
  ar: {
    title: "لماذا الاستثمار في قطاع الأدوية؟",
    reasons: [
      {
        title: "مدفوع بالابتكار",
        description: "اختراقات مستمرة في البحث الطبي والتكنولوجيا",
        icon: Microscope,
        position: "left",
      },
      {
        title: "زيادة الطلب",
        description:
          "زيادة عدد السكان المسنين واحتياجات الرعاية الصحية المتزايدة في جميع أنحاء العالم",
        icon: TrendingUp,
        position: "right",
      },
      {
        title: "هامش ربح مرتفع",
        description: "عائدات قوية على الاستثمار للأدوية الناجحة",
        icon: Pill,
        position: "left",
      },
      {
        title: "أثر عالمي",
        description: "تحسين الحياة ونتائج الصحة في جميع أنحاء العالم",
        icon: HeartPulse,
        position: "right",
      },
    ],
  },
};

// DNA helix points calculation
const createDNAPoints = () => {
  const points = [];
  for (let i = 0; i < 360; i += 30) {
    const radians = (i * Math.PI) / 180;
    points.push({
      x1: parseFloat((Math.sin(radians) * 20).toFixed(5)),
      y1: parseFloat((i / 3).toFixed(5)),
      x2: parseFloat((Math.sin(radians + Math.PI) * 20).toFixed(5)),
      y2: parseFloat((i / 3).toFixed(5)),
    });
  }
  return points;
};

export default function WhyPharmaSector({ lang }: LangProps) {
  const containerRef = useRef(null);
  const dnaPoints = createDNAPoints();
  const reasons = translations[lang].reasons || translations.en.reasons;

  return (
    <section
      ref={containerRef}
      className="mb-12 py-16 bg-gradient-to-br from-royalBlue to-brightTeal text-pureWhite relative overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="relative mb-12">
          <h2 className="text-3xl font-bold text-center mb-2">
            {translations[lang].title}
          </h2>
          <div className="flex justify-center">
            <motion.div
              className="w-40 h-20 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <svg
                width="160"
                height="80"
                viewBox="0 0 160 80"
                className="absolute top-0 left-0"
              >
                {dnaPoints.map((point, index) => (
                  <motion.g key={index}>
                    <motion.line
                      x1={80 + point.x1}
                      y1={point.y1}
                      x2={80 + point.x2}
                      y2={point.y2}
                      stroke="white"
                      strokeWidth="2"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{
                        pathLength: 1,
                        opacity: 1,
                        transition: {
                          duration: 1,
                          delay: index * 0.1,
                        },
                      }}
                      viewport={{ once: true }}
                    />
                    <motion.circle
                      cx={80 + point.x1}
                      cy={point.y1}
                      r="2"
                      fill="white"
                      initial={{ scale: 0 }}
                      whileInView={{
                        scale: 1,
                        transition: {
                          duration: 0.5,
                          delay: index * 0.1,
                        },
                      }}
                      viewport={{ once: true }}
                    />
                    <motion.circle
                      cx={80 + point.x2}
                      cy={point.y2}
                      r="2"
                      fill="white"
                      initial={{ scale: 0 }}
                      whileInView={{
                        scale: 1,
                        transition: {
                          duration: 0.5,
                          delay: index * 0.1,
                        },
                      }}
                      viewport={{ once: true }}
                    />
                  </motion.g>
                ))}
              </svg>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              className={`lg:${
                reason.position === "left"
                  ? "justify-self-start"
                  : "justify-self-end"
              } w-full lg:w-[90%]`}
              initial={{ opacity: 0, x: reason.position === "left" ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
            >
              <Card className="bg-pureWhite/10 backdrop-blur-md hover:shadow-lg transition-shadow duration-300 h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <reason.icon
                      className={`${lang === "ar" ? "ml-2" : "mr-2"} h-5 w-5 `}
                    />
                    {reason.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{reason.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
