"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

import { Calendar } from "lucide-react";

interface LangProps {
  lang: "en" | "ar";
}

const translations = {
  en: {
    newsItems: [
      {
        symbol: "PHRM",
        content:
          "PharmaGen announces successful Phase 3 trials for new cancer drug.",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
      },
      {
        symbol: "MEDX",
        content:
          "MediCorp partners with leading research institute for breakthrough gene therapy.",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
      },
      {
        symbol: "BIOT",
        content:
          "BioTech Solutions receives FDA approval for innovative diabetes treatment.",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
      },
    ],
  },
  ar: {
    newsItems: [
      {
        symbol: "PHRM",
        content:
          "تعلن PharmaGen عن نجاح التجارب السريرية من المرحلة الثالثة لعقار جديد لعلاج السرطان.",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
      },
      {
        symbol: "MEDX",
        content: "تتعاون MediCorp مع معهد أبحاث رائد لعلاج جيني مبتكر.",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
      },
      {
        symbol: "BIOT",
        content:
          "تحصل BioTech Solutions على موافقة FDA لعلاج مبتكر لمرض السكري.",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
      },
    ],
  },
};

export default function NewsFeed({ lang }: LangProps) {
  const t = translations[lang] || translations.en;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      relative: formatDistanceToNow(date, {
        addSuffix: true,
        locale: lang === "ar" ? ar : undefined,
      }),
      exact: format(date, "MMM d, yyyy 'at' h:mm a"),
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {t.newsItems.map((item, index) => {
        const dates = formatDate(item.timestamp);
        return (
          <motion.div
            key={`${item.symbol}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-brightTeal">
                      {item.symbol}:
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {dates.relative}
                    </div>
                  </div>
                  <p className="text-gray-700">{item.content}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
