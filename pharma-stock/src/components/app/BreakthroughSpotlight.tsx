"use client";

import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Dna, Pill, Microscope } from "lucide-react";
import { useState, useRef, ReactNode } from "react";
import useSWR from "swr";

const translations = {
  en: {
    title: "Breakthrough Spotlight",
    description:
      "Discover revolutionary pharmaceutical innovations that could transform medicine and create exceptional investment opportunities.",
    stages: {
      research: "Research Stage",
      clinical: "Clinical Trials",
      approved: "FDA Approved",
    },
    categories: {
      drug: "Novel Drug",
      therapy: "Advanced Therapy",
      device: "Medical Device",
    },
    innovation: "The Innovation",
    marketPotential: "Market Potential",
    navigation: {
      previous: "Previous",
      next: "Next",
    },
  },
  ar: {
    title: "تسليط الضوء على الابتكارات",
    description:
      "اكتشف الابتكارات الصيدلانية الثورية التي قد تُحدث تحولاً في الطب وتُوفر فرصاً استثمارية مميزة.",
    stages: {
      research: "مرحلة البحث",
      clinical: "التجارب السريرية",
      approved: "معتمد من FDA",
    },
    categories: {
      drug: "دواء مبتكر",
      therapy: "علاج متقدم",
      device: "جهاز طبي",
    },
    innovation: "الابتكار",
    marketPotential: "إمكانات السوق",
    navigation: {
      previous: "السابق",
      next: "التالي",
    },
  },
};

interface SectionHeaderProps {
  title: string;
  icon: ReactNode;
  description: string;
  lang: "en" | "ar";
}

interface Breakthrough {
  id: number;
  title_en: string;
  title_ar: string;
  company: string;
  symbol: string;
  description_en: string;
  description_ar: string;
  potential_impact_en: string;
  potential_impact_ar: string;
  category: "drug" | "therapy" | "device";
  stage: "research" | "clinical" | "approved";
  created_at: string;
}

const categoryIcons = {
  drug: Pill,
  therapy: Dna,
  device: Microscope,
};

interface LangProps {
  lang: "en" | "ar";
}

interface BreakthroughsResponse {
  breakthroughs: Breakthrough[];
  totalPages: number;
  currentPage: number;
  totalBreakthroughs: number;
}

const fetchBreakthroughs = async (): Promise<Breakthrough[]> => {
  const res = await fetch("/api/breakthroughs?page=1");
  if (!res.ok) throw new Error("Failed to fetch breakthroughs");
  const data = await res.json();

  // Backward compatible in case all=true is still used somewhere
  if (Array.isArray(data)) return data as Breakthrough[];

  return (data as BreakthroughsResponse).breakthroughs;
};
export default function BreakthroughSpotlight({ lang }: LangProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const t = translations[lang] || translations.en;

  const { data: breakthroughs = [], error } = useSWR<Breakthrough[]>(
    "/api/breakthroughs?page=1",
    fetchBreakthroughs
  );

  const handleNext = () => {
    if (breakthroughs.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % breakthroughs.length);
      setIsAnimating(false);
    }, 300);
  };

  const handlePrev = () => {
    if (breakthroughs.length <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex(
        (prev) => (prev - 1 + breakthroughs.length) % breakthroughs.length
      );
      setIsAnimating(false);
    }, 300);
  };

  if (error) {
    return <div>Error loading breakthroughs</div>;
  }

  if (breakthroughs.length === 0) {
    return <div>No breakthroughs available</div>;
  }

  const activeBreakthrough = breakthroughs[activeIndex];
  const CategoryIcon = categoryIcons[activeBreakthrough.category];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <SectionHeader
          title={t.title}
          icon={
            <Lightbulb
              className={`${lang === "ar" ? "ml-2" : "mr-2"} text-brightTeal`}
            />
          }
          description={t.description}
          lang={lang}
        />

        <div className="max-w-4xl mx-auto">
          <motion.div
            animate={{ opacity: isAnimating ? 0 : 1, y: isAnimating ? 20 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-2 border-brightTeal/20 shadow-lg">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-5">
                  <div className="md:col-span-2 bg-gradient-to-br from-royalBlue to-brightTeal p-6 text-white flex flex-col justify-center">
                    <div>
                      <div className="mb-4">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white">
                          {t.stages[activeBreakthrough.stage]}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">
                        {lang === "en"
                          ? activeBreakthrough.title_en
                          : activeBreakthrough.title_ar}
                      </h3>
                      <div
                        className={`flex items-center mb-4 ${
                          lang === "ar" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <CategoryIcon
                          className={`${
                            lang === "ar" ? "ml-2" : "mr-2"
                          } h-5 w-5`}
                        />
                        <span className="text-sm opacity-90">
                          {t.categories[activeBreakthrough.category]}
                        </span>
                      </div>
                      <div className="mt-auto">
                        <p className="text-lg opacity-80">
                          <span className="font-semibold">
                            {activeBreakthrough.company}
                          </span>{" "}
                          <span className="font-bold">
                            ({activeBreakthrough.symbol})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-3 p-6">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      key={activeIndex}
                    >
                      <h4 className="text-lg font-semibold text-royalBlue mb-4">
                        {t.innovation}
                      </h4>
                      <p className="mb-4 text-gray-700">
                        {lang === "en"
                          ? activeBreakthrough.description_en
                          : activeBreakthrough.description_ar}
                      </p>

                      <h4 className="text-lg font-semibold text-royalBlue mb-4">
                        {t.marketPotential}
                      </h4>
                      <p className="mb-6 text-gray-700">
                        {lang === "en"
                          ? activeBreakthrough.potential_impact_en
                          : activeBreakthrough.potential_impact_ar}
                      </p>

                      <div
                        className={`flex justify-between items-center mt-auto ${
                          lang === "ar" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`flex ${
                            lang === "ar"
                              ? "space-x-reverse space-x-2"
                              : "space-x-2"
                          }`}
                        >
                          {breakthroughs.map((_, index) => (
                            <button
                              key={index}
                              className={`w-3 h-3 rounded-full ${
                                index === activeIndex
                                  ? "bg-brightTeal"
                                  : "bg-gray-300"
                              }`}
                              onClick={() => setActiveIndex(index)}
                            />
                          ))}
                        </div>
                        <div
                          className={`flex ${
                            lang === "ar"
                              ? "space-x-reverse space-x-2"
                              : "space-x-2"
                          }`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrev}
                            className="border-royalBlue text-royalBlue"
                            disabled={breakthroughs.length <= 1}
                          >
                            {t.navigation.previous}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            className="border-royalBlue text-royalBlue"
                            disabled={breakthroughs.length <= 1}
                          >
                            {t.navigation.next}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          {/* <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {" "}
            <Button className="bg-brightTeal hover:bg-brightTeal/90 text-white">
              Explore All Breakthroughs <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div> */}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ title, icon, description, lang }: SectionHeaderProps) {
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
        className={`text-3xl font-bold text-royalBlue mb-2 flex  justify-center ${
          lang === "ar" ? "flex-row-reverse" : ""
        }`}
        initial={{ scale: 0.9 }}
        animate={isInView ? { scale: 1 } : { scale: 0.9 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span className={`${lang === "ar" ? "ml-2" : "mr-2"}`}>{icon}</span>
        {title}
      </motion.h2>
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: "100px" } : { width: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="h-1 bg-brightTeal mx-auto mb-4"
      />
      <motion.p
        className={`text-gray-600 max-w-2xl mx-auto ${
          lang === "ar" ? "text-right" : "text-center"
        }`}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
