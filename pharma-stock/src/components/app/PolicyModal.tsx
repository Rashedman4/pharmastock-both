"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

const translations = {
  en: {
    title: "Terms and Conditions",
    acceptButton: "I Accept",
    readMore: "Read Full Policy",
    summary:
      "By using Bio Pharma Stock, you agree to our terms and conditions. We provide stock signals, news, and analysis for the US pharmaceutical market. All investment decisions are your responsibility, and we do not guarantee any specific outcomes.",
    switchLang: "العربية",
  },
  ar: {
    title: "الشروط والأحكام",
    acceptButton: "أوافق",
    readMore: "قراءة السياسة الكاملة",
    summary:
      "باستخدام Bio Pharma Stock، فإنك توافق على شروطنا وأحكامنا. نقدم إشارات الأسهم والأخبار والتحليلات لسوق الأدوية الأمريكي. جميع قرارات الاستثمار هي مسؤوليتك، ولا نضمن أي نتائج محددة.",
    switchLang: "English",
  },
};

export default function PolicyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const lang = (
    pathname ? pathname.split("/")[1] : "en"
  ) as keyof typeof translations;

  const t = translations[lang];
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return; // Prevent errors if pathname is null
    const policyAccepted = Cookies.get("policyAccepted");
    const isPolicyPage = pathname.includes("/policy");
    if (!policyAccepted && !isPolicyPage) {
      setIsOpen(true);
    }
  }, [pathname]);

  const handleAccept = () => {
    Cookies.set("policyAccepted", "true", { expires: 365 });
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("policyAccepted"));
    }
  };
  const toggleLanguage = async () => {
    if (!pathname) return; // Prevent errors if pathname is null
    const currentLangPrefix = lang === "en" ? "/en" : "/ar";
    const newLangPrefix = lang === "en" ? "/ar" : "/en";
    const newPath = pathname.replace(currentLangPrefix, newLangPrefix);

    // Update language cookie via API
    await fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLangPrefix }),
    });

    router.push(newPath);
  };
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg"
        >
          <Card className="border-brightTeal">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-royalBlue">
                {t.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-royalBlue hover:bg-brightTeal hover:text-pureWhite flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {t.switchLang}
              </Button>
            </CardHeader>
            <CardContent
              className={`space-y-4 ${lang === "ar" ? "rtl" : "ltr"}`}
            >
              <p className="text-gray-600">{t.summary}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/${lang}/policy`, "_blank")}
                >
                  {t.readMore}
                </Button>
                <Button
                  className="bg-brightTeal hover:bg-royalBlue text-white"
                  onClick={handleAccept}
                >
                  {t.acceptButton}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
