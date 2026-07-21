"use client";

import Link from "next/link";
import { Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Rubik } from "next/font/google";
import Image from "next/image";

const rubik = Rubik({
  weight: ["400"],
  subsets: ["arabic"],
});

const Footer = () => {
  const pathName = usePathname();
  const langPrefix = pathName ? pathName.split("/")[1] : "en";
  const isArabic = langPrefix === "ar";
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const quickLinks = isArabic
    ? [
        { href: "/ar", label: "الصفحة الرئيسية" },
        { href: "/ar/ask-about-stock", label: "اسأل عن سهم" },
        { href: "/ar/news", label: "الأخبار" },
        { href: "/ar/signals", label: "الأفكار" },
        { href: "/ar/history", label: "النتائج" },
        { href: "/ar/fda-designation", label: "تصنيفات هيئة الغذاء والدواء (FDA)" },
        { href: "/ar/elite-group", label: "برنامج إيليت" },
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

  return (
    <footer
      className={`bg-royalBlue text-pureWhite ${
        isArabic ? `dir-rtl text-right ${rubik.className}` : ""
      }`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Bio Pharma Stock</h3>
            <p className="text-sm text-brightTeal font-semibold mb-2">
              {isArabic
                ? "حيث يلتقي العلم بالاستثمار"
                : "Where Science Meets Investing."}
            </p>
            <p className="text-sm">
              {isArabic
                ? "BioPharmaStock شركة متخصصة تقدّم رؤى بحثية استثمارية لقطاع الأدوية الحيوية، وتركّز حصريًا على شركات التكنولوجيا الحيوية والأدوية المدرجة في الأسواق العامة. يقوم فريق الأبحاث لدينا بتحليل مستمر للتجارب السريرية، والقرارات التنظيمية الصادرة عن إدارة الغذاء والدواء الأمريكية (FDA)، والأبحاث العلمية المنشورة، والمستجدات المؤسسية، والمحفزات السوقية، لتقديم أبحاث دقيقة التوقيت ورؤى حصرية للمستثمرين الباحثين عن فرص في واحد من أكثر القطاعات كثافة بالمعرفة في العالم."
                : "BioPharmaStock is a specialized biopharmaceutical investment intelligence company focused exclusively on publicly traded biotechnology and pharmaceutical companies. Our research team continuously analyzes clinical trials, FDA regulatory events, scientific publications, corporate developments, and market catalysts to deliver timely research and exclusive insights for investors seeking opportunities in one of the world's most knowledge-intensive sectors."}
            </p>
            <p className="text-sm mt-2">
              {isArabic
                ? "النجم العالي لتصميم الانظمة ذ.م.م، الإمارات العربية المتحدة، أبو ظبي"
                : "ALNJAM ALAALI SOFTWARE DESIGN CO. L.L.C, UAE, Abu Dhabi"}
            </p>
            <div className="mt-4 flex justify-start">
              <Image
                src="/logo-transparent-1200x800.png"
                alt="BioPharmaStock Logo"
                width={150}
                height={100}
                className="hidden md:block md:w-45 md:h-30 object-contain rounded-lg p-1 shadow"
                priority
              />
              <Image
                src="/logo-transparent-1200x800.png"
                alt="BioPharmaStock Logo"
                width={150}
                height={100}
                className="md:hidden md:w-30 md:h-20 object-contain rounded-lg p-1 shadow"
                priority
              />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-md font-semibold mb-4">
              {isArabic ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-brightTeal transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-md font-semibold mb-4">
              {isArabic ? "اتصل بنا" : "Contact Us"}
            </h4>
            <p className="text-sm mb-2">
              <a href="mailto:info@biopharmastock.com" className="hover:underline">
                {isArabic
                  ? "البريد الإلكتروني: info@biopharmastock.com"
                  : "Email: info@biopharmastock.com"}
              </a>
            </p>
            <p className="text-sm mb-2">
              {isArabic ? (
                <>
                  رقم الهاتف:{" "}
                  <a href="tel:+971509363328" className="hover:underline">
                    <span dir="ltr">+971 50 936 3328</span>
                  </a>
                </>
              ) : (
                <a href="tel:+971509363328" className="hover:underline">
                  Phone: +971 50 936 3328
                </a>
              )}
            </p>
            <p className="text-sm mt-3">
              <Link
                href={`/${isArabic ? "ar" : "en"}/community`}
                className="inline-flex items-center text-brightTeal font-semibold transition-colors"
              >
                <span className="hover:underline">
                  {isArabic ? "انضم إلى مجتمعنا" : "Join Our Community"}
                </span>
                <span
                  className={`ml-2 transform transition-transform group-hover:translate-x-1 ${
                    isArabic ? "rotate-180 mr-2 ml-0" : ""
                  }`}
                >
                  →
                </span>
              </Link>
            </p>
          </div>

          {/* Account + Social */}
          <div>
            {isAuthenticated && (
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-4">
                  {isArabic ? "حسابي" : "My Account"}
                </h4>
                <Link
                  href={`/${langPrefix}/profile`}
                  className="inline-flex items-center gap-2 text-sm text-brightTeal hover:underline font-medium transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019.07 16.5H7.5v-1.57a2 2 0 01.586-1.414z"
                    />
                  </svg>
                  {isArabic ? "تعديل الملف الشخصي" : "Edit Profile"}
                </Link>
              </div>
            )}

            <h4 className="text-md font-semibold mb-4">
              {isArabic ? "تابعنا" : "Follow Us"}
            </h4>
            <div className="flex space-x-4">
              <a
                href="https://x.com/m_almanasrah"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-brightTeal transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-pureWhite/20 text-center text-sm">
          <p>
            {isArabic
              ? `© ${new Date().getFullYear()} Bio Pharma Stock. جميع الحقوق محفوظة. `
              : `© ${new Date().getFullYear()} Bio Pharma Stock. All rights reserved. `}
            <Link
              href={`/${langPrefix}/policy`}
              className="text-brightTeal hover:underline"
            >
              {isArabic ? "السياسة" : "Policy"}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
