"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, Globe, LogOut, UserCircle, ChevronDown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Rubik } from "next/font/google";

const rubik = Rubik({
  weight: ["400"],
  subsets: ["arabic"],
});

export default function Navbar() {
  const pathName = usePathname();
  const langPrefix = pathName ? pathName.split("/")[1] : "en";
  const isArabic = langPrefix === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = async () => {
    if (!pathname) return;
    const currentLangPrefix = langPrefix === "en" ? "/en" : "/ar";
    const newLangPrefix = langPrefix === "en" ? "/ar" : "/en";
    setIsOpen(false);
    const newPath = pathname.replace(currentLangPrefix, newLangPrefix);
    await fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLangPrefix }),
    });
    router.push(newPath);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setIsOpen(false);
    await signOut();
    router.push("/" + langPrefix + "/auth/login");
  };

  const handleLogin = () => {
    setIsOpen(false);
    router.push("/" + langPrefix + "/auth/login");
  };

  const navItems = isArabic
    ? [
        { href: "/ar/fda-designation", label: "تصنيفات هيئة الغذاء والدواء (FDA)" },
        { href: "/ar/elite-group", label: "برنامج إيليت" },
        { href: "/ar/history", label: "النتائج" },
        { href: "/ar/signals", label: "الأفكار" },
        { href: "/ar/news", label: "الأخبار" },
        { href: "/ar/ask-about-stock", label: "اسأل عن سهم" },
        { href: "/ar", label: "الصفحة الرئيسية" },
      ]
    : [
        { href: "/en", label: "Home" },
        { href: "/en/ask-about-stock", label: "Ask About Stock" },
        { href: "/en/news", label: "News" },
        { href: "/en/signals", label: "Ideas" },
        { href: "/en/history", label: "History" },
        { href: "/en/fda-designation", label: "FDA Designations" },
        { href: "/en/elite-group", label: "Elite Program" },
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
            <span
              className="md:inline-block tracking-tight font-extrabold text-2xl"
              style={{ letterSpacing: "-1px" }}
            >
              Bio<span className="text-brightTeal">Pharma</span>Stock
            </span>
          </Link>

          {/* Desktop nav */}
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
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {status === "authenticated" ? (
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="text-pureWhite hover:bg-brightTeal hover:text-royalBlue gap-1"
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>{isArabic ? "حسابي" : "Account"}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </Button>

                  {dropdownOpen && (
                    <div
                      className={`absolute top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 ${
                        isArabic ? "left-0" : "right-0"
                      }`}
                    >
                      <Link
                        href={`/${langPrefix}/profile`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brightTeal/10 hover:text-royalBlue transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-brightTeal" />
                        {isArabic ? "تعديل الملف الشخصي" : "Edit Profile"}
                      </Link>
                      <div className="my-1 mx-3 border-t border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {isArabic ? "تسجيل الخروج" : "Logout"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogin}
                  className="text-pureWhite hover:bg-brightTeal hover:text-royalBlue"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  {isArabic ? "تسجيل الدخول" : "Login"}
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
            </div>
          </div>

          {/* Mobile hamburger */}
          <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
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
              <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
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

            <div className="space-y-3 mt-8">
              {status === "authenticated" && (
                <Link
                  href={`/${langPrefix}/profile`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-brightTeal/20 text-pureWhite hover:bg-brightTeal hover:text-royalBlue transition-colors font-medium"
                >
                  <Pencil className="h-5 w-5" />
                  {isArabic ? "تعديل الملف الشخصي" : "Edit Profile"}
                </Link>
              )}

              {status === "authenticated" ? (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleLogout}
                  className="w-full text-pureWhite hover:bg-red-500/80 hover:text-white"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  {isArabic ? "تسجيل الخروج" : "Logout"}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleLogin}
                  className="w-full text-pureWhite hover:bg-brightTeal hover:text-royalBlue"
                >
                  <UserCircle className="mr-2 h-5 w-5" />
                  {isArabic ? "تسجيل الدخول" : "Login"}
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
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
