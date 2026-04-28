"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, Globe, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Rubik } from "next/font/google";
//import Image from "next/image";
//import LanguageSwitcher from "./LangSwitch";
const rubik = Rubik({
  weight: ["400"], // Define font weights
  subsets: ["arabic"], // Include Arabic subset
});

export default function Navbar() {
  const pathName = usePathname();
  const langPrefix = pathName ? pathName.split("/")[1] : "en";
  const isArabic = langPrefix === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession(); // Access the session data

  const toggleLanguage = async () => {
    if (!pathname) return; // Prevent errors if pathname is null
    const currentLangPrefix = langPrefix === "en" ? "/en" : "/ar";

    const newLangPrefix = langPrefix === "en" ? "/ar" : "/en";
    setIsOpen(false);
    const newPath = pathname.replace(currentLangPrefix, newLangPrefix);

    // Update cookie via API
    await fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLangPrefix }),
    });

    router.push(newPath);
  };
  const handleAuth = async () => {
    if (status === "authenticated") {
      await signOut();
      setIsOpen(false);
      router.push("/" + langPrefix + "/auth/login");
    } else {
      setIsOpen(false);
      router.push("/" + langPrefix + "/auth/login");
    }
  };
  const navItems = isArabic
    ? [
        //{ href: "/ar/subscription", label: "الأشتراكات" },
        {
          href: "/ar/fda-designation",
          label: "تصنيفات هيئة الغذاء والدواء (FDA)",
        },
        { href: "/ar/elite-group", label: "برنامج إيليت" },

        { href: "/ar/history", label: "النتائج" },
        { href: "/ar/signals", label: "الأفكار" },
        //{ href: "/ar/daily-video", label: "الفيديو اليومي" },
        { href: "/ar/news", label: "الأخبار" },
        { href: "/ar/ask-about-stock", label: "اسأل عن سهم" },
        { href: "/ar", label: "الصفحة الرئيسية" },
      ]
    : [
        { href: "/en", label: "Home" },
        { href: "/en/ask-about-stock", label: "Ask About Stock" },
        { href: "/en/news", label: "News" },
        //{ href: "/en/daily-video", label: "Daily Video" },
        { href: "/en/signals", label: "Ideas" },
        { href: "/en/history", label: "History" },
        { href: "/en/fda-designation", label: "FDA Designations" },
        { href: "/en/elite-group", label: "Elite Program" },
        //  { href: "/en/subscription", label: "Subscriptions" },
      ];

  const menuNav = isArabic ? navItems.slice().reverse() : navItems;

  return (
    <nav
      className={`bg-royalBlue text-pureWhite sticky top-0 z-50 shadow-lg dark:bg-gray-800 ${
        isArabic ? `dir-rtl ${rubik.className}` : ""
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
            {/*     <Image
              src="/logo.png"
              alt="BioPharmaStock Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
              priority
            /> */}
            <span
              className=" md:inline-block tracking-tight font-extrabold text-2xl"
              style={{ letterSpacing: "-1px" }}
            >
              Bio<span className="text-brightTeal">Pharma</span>Stock
            </span>
          </Link>

          {/* <Link href="/">
            <Image
              src="/logo.png" // Update the path to your actual logo image
              alt="PharmaStock Logo"
              width={431}
              height={215}
              className="w-[120px] h-auto md:w-[200px] lg:w-[120px]" // Adjust size responsively
              priority
            />
          </Link> */}
          <div className="hidden lg:flex items-center justify-between flex-1 ml-10">
            <div className="flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`hover:text-brightTeal transition-colors ${
                    pathname === item.href ? "text-brightTeal" : ""
                  }`}
                >
                  <span>{item.label}</span>
                  {pathname === item.href && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-brightTeal"
                      layoutId="underline"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              {status === "authenticated" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAuth}
                  className="text-pureWhite hover:bg-brightTeal hover:text-royalBlue"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {langPrefix == "en" ? "Logout" : "تسجيل الخروج"}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAuth}
                  className="text-pureWhite hover:bg-brightTeal hover:text-royalBlue"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  {langPrefix == "en" ? "Login" : "تسجيل الدخول"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-pureWhite hover:bg-brightTeal hover:text-royalBlue"
              >
                <Globe className="mr-2 h-4 w-4" />
                {langPrefix === "en" ? "العربية" : "English"}
              </Button>
              {/*               <LanguageSwitcher lang={isArabic ? "ar" : "en"} />
               */}{" "}
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: isArabic ? -100 : 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isArabic ? -100 : 100 }}
          transition={{ type: "tween", duration: 0.3 }}
          className="lg:hidden fixed inset-0 bg-royalBlue dark:bg-gray-800 z-50 overflow-y-auto"
        >
          <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-8">
              <Link
                href="/"
                className="flex items-center gap-2 text-2xl font-bold"
              >
                <span className="tracking-tight font-extrabold text-xl">
                  Bio<span className="text-brightTeal">Pharma</span>Stock
                </span>
              </Link>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-col mt-8">
              {menuNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-base text-center py-3 px-4 hover:bg-brightTeal hover:text-royalBlue transition-colors rounded-lg ${
                    pathname === item.href ? "bg-brightTeal text-royalBlue" : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="space-y-4 mt-8">
              {status === "authenticated" ? (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleAuth}
                  className="w-full text-pureWhite hover:bg-brightTeal hover:text-royalBlue"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleAuth}
                  className="w-full text-pureWhite hover:bg-brightTeal hover:text-royalBlue"
                >
                  <UserCircle className="mr-2 h-5 w-5" />
                  Login
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                onClick={toggleLanguage}
                className="w-full text-pureWhite hover:bg-brightTeal hover:text-royalBlue"
              >
                <Globe className="mr-2 h-5 w-5" />
                {langPrefix === "en" ? "العربية" : "English"}
              </Button>
              {/*             <LanguageSwitcher lang={isArabic ? "ar" : "en"} />
               */}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
