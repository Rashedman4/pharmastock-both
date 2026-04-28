"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  /*  TrendingUp,
  Brain,
  Clock,
  Shield, */
  Search,
  CheckCircle,
  Award,
  ShieldCheck,
} from "lucide-react";

interface LangProps {
  lang: "en" | "ar";
}
const translations = {
  en: {
    title: "Why Us",
    reasons: [
      {
        title: "Comprehensive Study",
        description:
          "We conduct an in-depth analysis of pharmaceutical stocks based on their clinical trials and results. Our approach features cutting-edge AI-driven stock analysis for enhanced accuracy.",
        icon: Search,
      },
      {
        title: "Precise Selection",
        description:
          "We select trades based on successful phase III clinical trial results, backed by our in-depth knowledge of the pharmaceutical industry and real-time market insights.",
        icon: CheckCircle,
      },
      {
        title: "Regulatory Considerations",
        description:
          "We pay special attention to classifications granted by the U.S. FDA while monitoring up-to-the-minute market data and emerging trends.",
        icon: Award,
      },
      {
        title: "Risk Reduction",
        description:
          "We strive to avoid stocks that fail to meet strict success criteria through robust investment protection strategies and continuous market monitoring.",
        icon: ShieldCheck,
      },
    ],
  },
  ar: {
    title: "لماذا نحن",
    reasons: [
      {
        title: "دراسة وافية",
        description:
          "نقوم بدراسة شاملة للأسهم الدوائية بناءً على تجاربها السريرية ونتائجها مع استخدام أحدث تقنيات تحليل الأسهم بالذكاء الاصطناعي لدقة أعلى.",
        icon: Search,
      },
      {
        title: "اختيار دقيق",
        description:
          "نختار الصفقات بناءً على نتائج المرحلة الثالثة من التجارب السريرية الناجحة، مدعومة بمعرفة عميقة بصناعة الأدوية وبيانات السوق الفورية.",
        icon: CheckCircle,
      },
      {
        title: "مراعاة التصنيفات",
        description:
          "نولي اهتمامًا خاصًا للتصنيفات التي تمنحها هيئة الغذاء والدواء الأمريكية مع متابعة أحدث بيانات السوق والاتجاهات الناشئة.",
        icon: Award,
      },
      {
        title: "تقليل المخاطر",
        description:
          "نحرص على تجنب الأسهم التي لا تلبي المعايير الصارمة للنجاح من خلال استراتيجيات قوية لحماية الاستثمارات والمراقبة المستمرة للسوق.",
        icon: ShieldCheck,
      },
    ],
  },
};

export default function WhyUs({ lang }: LangProps) {
  const t = translations[lang] || translations.en;

  return (
    <section className="mb-12 py-16 bg-gradient-to-br from-royalBlue/10 to-brightTeal/10 ">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-royalBlue mb-4">{t.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {t.reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300 h-full bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-brightTeal flex items-center">
                    <reason.icon
                      className={`${lang === "ar" ? "ml-2" : "mr-2"} h-5 w-5 `}
                    />
                    {reason.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{reason.description}</p>
                  <motion.div
                    className="mt-4 h-1 bg-brightTeal"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
/* const translations = {
  en: {
    title: "Why Choose Us",
    reasons: [
      {
        title: "Advanced Analytics",
        description: "Cutting-edge AI-driven stock analysis",
        icon: TrendingUp,
      },
      {
        title: "Pharma Expertise",
        description: "In-depth knowledge of the pharmaceutical industry",
        icon: Brain,
      },
      {
        title: "Real-time Insights",
        description: "Up-to-the-minute market data and trends",
        icon: Clock,
      },
      {
        title: "Risk Management",
        description: "Robust strategies to protect your investments",
        icon: Shield,
      },
    ],
  },
  ar: {
    title: "لماذا تختارنا",
    reasons: [
      {
        title: "تحليلات متقدمة",
        description: "تحليل الأسهم المدعوم بالذكاء الاصطناعي",
        icon: TrendingUp,
      },
      {
        title: "خبرة في مجال الأدوية",
        description: "معرفة عميقة بصناعة الأدوية",
        icon: Brain,
      },
      {
        title: "رؤى في الوقت الحقيقي",
        description: "بيانات السوق والاتجاهات في الوقت الفعلي",
        icon: Clock,
      },
      {
        title: "إدارة المخاطر",
        description: "استراتيجيات قوية لحماية استثماراتك",
        icon: Shield,
      },
    ],
  },
}; */
