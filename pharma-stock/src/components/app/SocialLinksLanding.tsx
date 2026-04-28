"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  //MessageCircle,
  Send,
  Users,
  ArrowRight,
  TrendingUp,
  Zap,
  Bell,
} from "lucide-react";
import Link from "next/link";

interface SocialLink {
  id: string;
  name: { en: string; ar: string };
  icon: any;
  url: string;
  color: string;
  bgGradient: string;
  buttonText: { en: string; ar: string };
}

interface LangProps {
  lang: "en" | "ar";
}

const socialLinks: SocialLink[] = [
  /*  {
    id: "whatsapp-channel",
    name: { en: "WhatsApp Channel", ar: "قناة واتساب" },
    icon: MessageCircle,
    url: "https://whatsapp.com/channel/0029Vb6nDojJJhzXZOk3s91a",
    color: "#25D366",
    bgGradient: "from-green-400 to-green-600",
    buttonText: { en: "Join Channel", ar: "انضم للقناة" },
  }, */
  {
    id: "whatsapp-group",
    name: { en: "WhatsApp group", ar: "جروب واتساب" },
    icon: Users,
    url: "https://t.co/ndtNRpXOq5",
    color: "#128C7E",
    bgGradient: "from-emerald-400 to-emerald-600",
    buttonText: { en: "Join Group", ar: "انضم للجروب" },
  },
  {
    id: "telegram-channel",
    name: { en: "Telegram Channel", ar: "قناة تليجرام" },
    icon: Send,
    url: "https://t.me/biopharmastock",
    color: "#0088cc",
    bgGradient: "from-blue-400 to-blue-600",
    buttonText: { en: "Join Channel", ar: "انضم للقناة" },
  },
];

const benefits = [
  {
    icon: Bell,
    title: { en: "Instant Notifications", ar: "إشعارات فورية" },
    description: {
      en: "Never miss important pharma stock updates",
      ar: "لا تفوت أي تحديثات مهمة لأسهم الأدوية",
    },
  },
  {
    icon: TrendingUp,
    title: { en: "Expert Analysis", ar: "تحليل خبراء" },
    description: {
      en: "Get professional insights on market movements",
      ar: "احصل على رؤى احترافية حول تحركات السوق",
    },
  },
  {
    icon: Zap,
    title: { en: "Early Access", ar: "الوصول المبكر" },
    description: {
      en: "Be first to know about breakthrough opportunities",
      ar: "كن أول من يعرف عن الفرص الرائدة",
    },
  },
];

export default function SocialLinksLanding({ lang }: LangProps) {
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-br from-royalBlue via-royalBlue to-brightTeal relative overflow-hidden"
    >
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-brightTeal/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-pureWhite/5 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header Section */}
        <HeaderSection lang={lang} />

        <div className="flex flex-col">
          <div className="order-2 md:order-1">
            <BenefitsSection lang={lang} />
          </div>
          <div className="order-1 md:order-2">
            <SocialLinksSection lang={lang} />
          </div>
        </div>
        {/* Footer */}
        <FooterCTA lang={lang} />
      </div>
    </div>
  );
}

function HeaderSection({ lang }: LangProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-16"
    >
      <h1 className="text-5xl md:text-6xl font-bold text-pureWhite mb-2">
        Bio Pharma Stock
      </h1>
      <div className="h-1 w-32 bg-brightTeal mx-auto rounded-full" />

      <motion.h2 className="text-3xl md:text-5xl font-bold text-pureWhite mb-6 mt-6">
        {lang === "ar"
          ? "لأستلام التوصيات و اخر الاخبار إنضم إلى وسائل التواصل الخاصة بنا"
          : "Join Our Community"}
      </motion.h2>

      <motion.p className="text-xl md:text-2xl text-pureWhite/90 max-w-3xl mx-auto mb-8">
        {lang === "ar"
          ? "تحليلات الأسهم الدوائية و التنبيهات الفورية"
          : "Get exclusive access to pharmaceutical market insights, and real-time alerts"}
      </motion.p>
    </motion.div>
  );
}

function BenefitsSection({ lang }: LangProps) {
  return (
    <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16">
      {benefits.map((benefit, index) => (
        <BenefitCard key={index} benefit={benefit} index={index} lang={lang} />
      ))}
    </motion.div>
  );
}

function BenefitCard({
  benefit,
  index,
  lang,
}: {
  benefit: any;
  index: number;
  lang: "en" | "ar";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
    >
      <Card className="bg-pureWhite/10 backdrop-blur-md border-pureWhite/20">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-brightTeal rounded-full flex items-center justify-center mx-auto mb-4">
            <benefit.icon className="w-8 h-8 text-royalBlue" />
          </div>
          <h3 className="text-xl font-bold text-pureWhite mb-2">
            {benefit.title[lang]}
          </h3>
          <p className="text-pureWhite/80">{benefit.description[lang]}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SocialLinksSection({ lang }: LangProps) {
  const [linksWithUrls, setLinksWithUrls] = useState<SocialLink[]>(socialLinks);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const res = await fetch("/api/community");
        if (!res.ok) throw new Error("Failed to fetch community links");
        const data: { id: string; url: string }[] = await res.json();

        // Map fetched URLs to static links
        const updatedLinks = socialLinks.map((link) => {
          const fetchedLink = data.find((item) => item.id === link.id);
          return {
            ...link,
            url: fetchedLink?.url || link.url, // Use fetched URL or fallback to static
          };
        });

        setLinksWithUrls(updatedLinks);
      } catch (error) {
        console.error("Error fetching community links:", error);
        // Keep static URLs on error
      }
    };

    fetchUrls();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
      {linksWithUrls.map((link, index) => (
        <SocialLinkCard key={link.id} link={link} index={index} lang={lang} />
      ))}
    </div>
  );
}

function SocialLinkCard({
  link,
  index,
  lang,
}: {
  link: SocialLink;
  index: number;
  lang: "en" | "ar";
}) {
  const Icon = link.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 + index * 0.15 }}
    >
      <Card className="h-full bg-pureWhite hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-brightTeal">
        <div className={`h-3 bg-gradient-to-r ${link.bgGradient}`} />
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-center mb-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                lang === "ar" ? "ml-4" : "mr-4"
              }`}
              style={{ backgroundColor: `${link.color}20` }}
            >
              <Icon className="w-7 h-7" style={{ color: link.color }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-royalBlue">
                {link.name[lang]}
              </h3>
              <div className="h-0.5 w-12 bg-brightTeal mt-1" />
            </div>
          </div>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            <Button
              className={`w-full text-white font-bold py-6 text-lg shadow-lg flex items-center justify-center ${
                lang === "ar" ? "flex-row-reverse" : ""
              }`}
              style={{
                background: `linear-gradient(135deg, ${link.color} 0%, ${link.color}dd 100%)`,
              }}
            >
              {lang === "ar" ? (
                <>
                  <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
                  {link.buttonText[lang]}
                </>
              ) : (
                <>
                  {link.buttonText[lang]}{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FooterCTA({ lang }: LangProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 1.2 }}
      className="text-center"
    >
      <Card className="bg-pureWhite/10 backdrop-blur-md border-pureWhite/20 max-w-2xl mx-auto">
        <CardContent className="p-8">
          <h3 className="text-2xl md:text-3xl font-bold text-pureWhite mb-4">
            {lang === "ar"
              ? "جاهز لبدء رحلتك الاستثمارية؟"
              : "Ready to Start Your Investment Journey?"}
          </h3>
          <p className="text-pureWhite/90 mb-6 text-lg">
            {lang === "ar"
              ? "سجّل حسابك الآن للوصول الى توصياتنا المميزة وتحقيق أفضل الفرص الاستثمارية"
              : "Sign up now and create your account to access our premium signals and unlock the best opportunities"}
          </p>
          <Link href={`/${lang}/auth/login`}>
            <Button
              className={`bg-brightTeal hover:bg-brightTeal/90 text-royalBlue font-bold text-lg px-8 py-6 flex items-center justify-center ${
                lang === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              {lang === "ar" ? (
                <>
                  <ArrowRight className="mr-2 h-5 w-5 rotate-180" /> سجّل الآن
                  للوصول للتوصيات
                </>
              ) : (
                <>
                  Sign Up Now <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
