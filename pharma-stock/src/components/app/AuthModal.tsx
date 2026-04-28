"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import LoginAr from "@/components/auth/ar/LoginComp";
import LoginEn from "@/components/auth/en/LoginComp";
import RegisterAr from "@/components/auth/ar/RegisterComp";
import RegisterEn from "@/components/auth/en/RegisterComp";

type LangKey = "en" | "ar";

const translations: Record<
  LangKey,
  {
    title: string;
    subtitle: string;
    loginTab: string;
    registerTab: string;
    dismiss: string;
  }
> = {
  en: {
    title: "Welcome to Bio Pharma Stock",
    subtitle:
      "Create an account or sign in to access personalized signals, watchlists, and more.",
    loginTab: "Login",
    registerTab: "Register",
    dismiss: "Maybe later",
  },
  ar: {
    title: "Bio Pharma Stock مرحبًا بك في",
    subtitle:
      ".أنشئ حسابًا أو سجّل الدخول للوصول إلى توصياتنا و جميع أقسام الموقع",
    loginTab: "تسجيل الدخول",
    registerTab: "إنشاء حساب",
    dismiss: "لاحقًا",
  },
};

export default function AuthModal() {
  const pathname = usePathname();
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [delayPassed, setDelayPassed] = useState(false);
  const [policyOk, setPolicyOk] = useState<boolean>(
    Cookies.get("policyAccepted") === "true"
  );
  const SHOW_DELAY_MS = 2000; // 2s delay before showing

  const lang: LangKey = useMemo(() => {
    if (!pathname) return "en";
    return pathname.startsWith("/ar") ? "ar" : "en";
  }, [pathname]);

  const t = translations[lang];

  useEffect(() => {
    const timer = setTimeout(() => setDelayPassed(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onPolicyAccepted = () => setPolicyOk(true);
    if (typeof window !== "undefined") {
      window.addEventListener("policyAccepted", onPolicyAccepted);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("policyAccepted", onPolicyAccepted);
      }
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    // Do not show on auth routes or admin routes
    const isAuthRoute = /\/(en|ar)\/auth\//.test(pathname);
    const isAdmin =
      pathname.startsWith("/admin") || /\/(en|ar)\/admin\//.test(pathname);
    const dismissed = Cookies.get("authModalDismissed");

    if (
      status === "unauthenticated" &&
      policyOk &&
      delayPassed &&
      !isAuthRoute &&
      !isAdmin &&
      !dismissed
    ) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [pathname, status, delayPassed, policyOk]);

  const handleDismiss = () => {
    Cookies.set("authModalDismissed", "true", { expires: 1 }); // 1 day
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-royalBlue/30">
            <CardHeader className="relative">
              <button
                aria-label="Close"
                className="absolute right-2 top-2 rounded p-2 text-gray-500 hover:bg-lightGray hover:text-gray-700"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </button>
              <CardTitle
                className={`text-2xl font-medium ${
                  lang === "ar" ? "text-right" : "text-left"
                } text-royalBlue`}
              >
                {t.title}
              </CardTitle>
              <p
                className={`mt-1 text-sm text-gray-600 ${
                  lang === "ar" ? "text-right" : "text-left"
                }`}
              >
                {t.subtitle}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className={`mb-4 flex items-center gap-2 ${
                  lang === "ar" ? "flex-row-reverse" : ""
                }`}
              >
                <Button
                  variant={activeTab === "login" ? "default" : "outline"}
                  className={`font-bold ${
                    activeTab === "login"
                      ? "bg-brightTeal text-pureWhite hover:bg-brightTeal/90"
                      : ""
                  }`}
                  onClick={() => setActiveTab("login")}
                >
                  {t.loginTab}
                </Button>
                <Button
                  variant={activeTab === "register" ? "default" : "outline"}
                  className={`font-bold ${
                    activeTab === "register"
                      ? "bg-royalBlue text-pureWhite hover:bg-royalBlue/90"
                      : ""
                  }`}
                  onClick={() => setActiveTab("register")}
                >
                  {t.registerTab}
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {t.dismiss}
                </Button>
              </div>

              <div className={`${lang === "ar" ? "rtl" : ""}`}>
                {activeTab === "login" ? (
                  lang === "ar" ? (
                    <LoginAr />
                  ) : (
                    <LoginEn />
                  )
                ) : lang === "ar" ? (
                  <RegisterAr />
                ) : (
                  <RegisterEn />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
