import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

interface LangProps {
  lang: string;
}

export default function LanguageSwitcher({ lang }: LangProps) {
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = async (newLang: "en" | "ar") => {
    if (pathname === null) return; // Add this line
    const currentLangPrefix = lang === "en" ? "/en" : "/ar";
    const newLangPrefix = newLang === "en" ? "/en" : "/ar";
    const newPath = pathname.replace(currentLangPrefix, newLangPrefix);

    // Update cookie via API
    await fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLang }),
    });

    router.push(newPath);
  };
  return (
    <div
      className={`language-switcher flex justify-center w-full lg:items-center space-x-2`}
    >
      <button
        className={`flex items-center justify-center space-x-1 p-2 rounded transition-colors duration-200 ${
          lang === "en"
            ? "bg-royalBlue"
            : " hover:bg-brightTeal hover:text-royalBlue"
        } w-full lg:w-auto`}
        onClick={() => changeLanguage("en")}
        aria-label="Switch to English"
      >
        <Image src="/USA.png" alt="US Flag" width={20} height={15} />
        <span className="text-sm">EN</span>
      </button>
      <button
        className={`flex items-center justify-center space-x-1 p-2 rounded transition-colors duration-200 ${
          lang === "en"
            ? "bg-royalBlue"
            : "hover:bg-brightTeal hover:text-royalBlue"
        } w-full lg:w-auto`}
        onClick={() => changeLanguage("ar")}
        aria-label="Switch to Arabic"
      >
        <Image src="/KSA.png" alt="Saudi Arabia Flag" width={20} height={15} />
        <span className="text-sm">عربي</span>
      </button>
    </div>
  );
}
