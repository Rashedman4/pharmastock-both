"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  Zap,
  Pill,
  Microscope,
  Stethoscope,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

interface langProps {
  lang: "en" | "ar"; // Define the expected prop type as a union of string literals
}

interface Translation {
  title: string;
  comingSoon: string;
  description: string;
  joinWaitlist: string;
  drugPipeline: string;
  drugPipelineDesc: string;
  clinicalTrials: string;
  clinicalTrialsDesc: string;
  marketTrends: string;
  marketTrendsDesc: string;
  aiPredictions: string;
  aiPredictionsDesc: string;
  whyPharma: string;
  whyPharmaReasons: string[];
}

interface Translations {
  en: Translation;
  ar: Translation;
}

const translations: Translations = {
  en: {
    title: "Ask About a Pharma Stock",
    comingSoon: "Coming Soon: AI-Powered Pharma Stock Insights",
    description:
      "Get ready for a revolutionary way to analyze pharmaceutical stocks! Our upcoming AI-powered feature will provide you with instant, in-depth insights about any pharma stock you are interested in.",
    joinWaitlist: "Join Waitlist",
    drugPipeline: "Drug Pipeline Analysis",
    drugPipelineDesc:
      "Get insights into the company's drug development pipeline and potential market impact.",
    clinicalTrials: "Clinical Trial Tracking",
    clinicalTrialsDesc:
      "Stay updated on ongoing clinical trials and their potential influence on stock performance.",
    marketTrends: "Market Trend Analysis",
    marketTrendsDesc:
      "Understand how global health trends and policies affect pharmaceutical stock values.",
    aiPredictions: "AI-Driven Predictions",
    aiPredictionsDesc:
      "Harness the power of AI to get accurate predictions about pharma stock performance.",
    whyPharma: "Why Focus on Pharma Stocks?",
    whyPharmaReasons: [
      "High growth potential in the healthcare sector",
      "Opportunity to invest in life-changing medical innovations",
      "Relatively stable performance during economic downturns",
      "Increasing global demand for healthcare services and products",
    ],
  },
  ar: {
    title: "اسأل عن سهم في قطاع الأدوية",
    comingSoon: "قريبًا: تحليلات الأسهم الصيدلانية المدعومة بالذكاء الاصطناعي",
    description:
      "استعد لطريقة ثورية لتحليل أسهم شركات الأدوية! ميزتنا القادمة المدعومة بالذكاء الاصطناعي ستوفر لك تحليلات فورية وعميقة حول أي سهم صيدلاني يثير اهتمامك.",
    joinWaitlist: "انضم إلى قائمة الانتظار",
    drugPipeline: "تحليل خط إنتاج الأدوية",
    drugPipelineDesc:
      "احصل على رؤى حول خط إنتاج الأدوية للشركة وتأثيره المحتمل على السوق.",
    clinicalTrials: "متابعة التجارب السريرية",
    clinicalTrialsDesc:
      "ابقَ على اطلاع حول التجارب السريرية الجارية وتأثيرها المحتمل على أداء الأسهم.",
    marketTrends: "تحليل اتجاهات السوق",
    marketTrendsDesc:
      "افهم كيف تؤثر الاتجاهات الصحية العالمية والسياسات على قيمة أسهم شركات الأدوية.",
    aiPredictions: "تنبؤات الذكاء الاصطناعي",
    aiPredictionsDesc:
      "استفد من قوة الذكاء الاصطناعي للحصول على تنبؤات دقيقة حول أداء أسهم شركات الأدوية.",
    whyPharma: "لماذا التركيز على أسهم شركات الأدوية؟",
    whyPharmaReasons: [
      "إمكانية نمو عالية في قطاع الرعاية الصحية",
      "فرصة للاستثمار في ابتكارات طبية تغير الحياة",
      "أداء مستقر نسبيًا خلال فترات الركود الاقتصادي",
      "زيادة الطلب العالمي على الخدمات والمنتجات الصحية",
    ],
  },
};

export default function AskAboutStockComp({ lang }: langProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const t: Translation = translations[lang] || translations.en;
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse" as const,
      },
    },
  };

  const handleJoinWaitlist = async () => {
    if (!session) {
      toast({
        title: lang === "ar" ? "يجب تسجيل الدخول" : "Authentication Required",
        description:
          lang === "ar"
            ? "يرجى تسجيل الدخول للانضمام إلى قائمة الانتظار"
            : "Please sign in to join the waitlist",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/wait-list", {
        method: "POST",
      });
      //const data = await response.json();

      if (response.status === 409) {
        toast({
          title:
            lang === "ar"
              ? "أنت مسجل في قائمة الانتظار"
              : "Already on Waitlist",
          description:
            lang === "ar"
              ? "أنت مسجل بالفعل في قائمة الانتظار"
              : "You are already on the waiting list",
        });
      } else if (response.ok) {
        toast({
          title: lang === "ar" ? "تمت العملية بنجاح" : "Success",
          description:
            lang === "ar"
              ? "تمت إضافتك إلى قائمة الانتظار"
              : "You have been added to the waitlist",
        });
      }
    } catch (error) {
      console.log(error);

      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description:
          lang === "ar"
            ? "فشل الانضمام إلى قائمة الانتظار"
            : "Failed to join waitlist",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-bold text-royalBlue mb-8 text-center">
          {t.title}
        </h1>
      </motion.div>

      <motion.div
        variants={{ ...itemVariants, ...pulseVariants }}
        animate="pulse"
      >
        <Card className="mb-8 bg-gradient-to-br from-royalBlue to-brightTeal text-pureWhite">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Sparkles className={lang === "ar" ? "ml-2" : "mr-2"} />
              {t.comingSoon}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{t.description}</p>
            <div className="flex justify-center">
              <Button
                className="bg-pureWhite text-royalBlue hover:bg-pureWhite/90"
                onClick={handleJoinWaitlist}
              >
                {t.joinWaitlist}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Pill
                  className={` ${
                    lang === "ar" ? "ml-2" : "mr-2"
                  } text-brightTeal`}
                />
                {t.drugPipeline}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t.drugPipelineDesc}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Microscope
                  className={`${
                    lang === "ar" ? "ml-2" : "mr-2"
                  } text-brightTeal`}
                />
                {t.clinicalTrials}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t.clinicalTrialsDesc}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <TrendingUp
                  className={`${
                    lang === "ar" ? "ml-2" : "mr-2"
                  } text-brightTeal`}
                />
                {t.marketTrends}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t.marketTrendsDesc}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Zap
                  className={`${
                    lang === "ar" ? "ml-2" : "mr-2"
                  } text-brightTeal`}
                />
                {t.aiPredictions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t.aiPredictionsDesc}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Stethoscope
                className={`${lang === "ar" ? "ml-2" : "mr-2"} text-brightTeal`}
              />
              {t.whyPharma}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul
              className={`list-disc ${
                lang === "ar" ? "pr-5" : "pl-5"
              } space-y-2`}
            >
              {t.whyPharmaReasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
