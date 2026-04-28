"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowLeft,
  History,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface LangProps {
  lang: "en" | "ar";
}

const translations = {
  en: {
    title: "Invest Smart in Pharma Stocks",
    description:
      "Unlock the potential of pharmaceutical markets with our advanced insights and expert analysis.",
    getStarted: "Register Now",
    learnMore: "Join Our Community",
    advantages: "Bio Pharma Stock Advantages",
    realTimeAnalysis: "Real-time market analysis",
    highPotential: "High-potential stock picks",
    aiPredictions: "AI-powered predictions",
  },
  ar: {
    title: "استثمر بذكاء في الأسهم الدوائية",
    description:
      "استكشف إمكانيات الأسهم الدوائية مع رؤانا المتقدمة وتحليلات الخبراء.",
    getStarted: "للتوصيات سجل الآن",
    learnMore: "انضم إلى مجتمعنا",
    advantages: "مزايا Bio Pharma Stock",
    realTimeAnalysis: "تحليل السوق في الوقت الحقيقي",
    highPotential: "اختيارات الأسهم ذات الإمكانات العالية",
    aiPredictions: "تنبؤات مدعومة بالذكاء الاصطناعي",
  },
};

export default function Hero({ lang }: LangProps) {
  const t = translations[lang] || translations.en;
  const { status } = useSession();

  /*   const handleScroll = function () {
    const element = document.getElementById("whyUs");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }; */
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-royalBlue text-pureWhite py-20 relative overflow-hidden"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              {t.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl mb-8"
            >
              {t.description}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <div className="flex space-x-4 rtl:space-x-reverse">
                <Link
                  href={status === "authenticated" ? "/signals" : "/auth/login"}
                >
                  <Button
                    size="lg"
                    className="bg-brightTeal hover:bg-brightTeal/90 text-royalBlue"
                  >
                    {status === "authenticated"
                      ? lang === "ar"
                        ? "اذهب إلى الأفكار"
                        : "Go to Signals"
                      : t.getStarted}
                    {lang == "ar" ? (
                      <ArrowLeft className="mr-2 h-5 w-5" />
                    ) : (
                      <ArrowRight className="ml-2 h-5 w-5" />
                    )}
                  </Button>
                </Link>
                <Link href="/community">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-brightTeal border-pureWhite hover:bg-pureWhite hover:text-royalBlue"
                  >
                    {t.learnMore}
                  </Button>
                </Link>
              </div>
              <Link href="/history" className="w-full md:w-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  <Button
                    size="lg"
                    className={`w-auto ${
                      lang === "ar" ? "bg-gradient-to-l" : "bg-gradient-to-r"
                    } from-brightTeal to-pureWhite text-royalBlue font-semibold shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden ${
                      lang === "ar" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <History
                        className={`${lang === "ar" ? "ml-2" : "mr-2"} h-5 w-5`}
                      />
                      {lang === "en" ? "Our Signals History" : "نتائج صفقاتنا"}
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="hidden md:block"
          >
            <div className="bg-pureWhite/10 backdrop-blur-md rounded-lg p-6 shadow-xl">
              <h3 className="text-2xl font-semibold mb-4">{t.advantages}</h3>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <TrendingUp
                    className={`${
                      lang === "ar" ? "ml-2" : "mr-2"
                    } h-5 w-5 text-brightTeal`}
                  />
                  <span>{t.realTimeAnalysis}</span>
                </li>
                <li className="flex items-center">
                  <DollarSign
                    className={`${
                      lang === "ar" ? "ml-2" : "mr-2"
                    } h-5 w-5 text-brightTeal`}
                  />
                  <span>{t.highPotential}</span>
                </li>
                <li className="flex items-center">
                  <Zap
                    className={`${
                      lang === "ar" ? "ml-2" : "mr-2"
                    } h-5 w-5 text-brightTeal`}
                  />
                  <span>{t.aiPredictions}</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-royalBlue via-royalBlue to-brightTeal opacity-50"></div>
    </motion.section>
  );
}
