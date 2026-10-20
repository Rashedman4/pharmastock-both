"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const OPTIONS = [
  { value: "system", Icon: Monitor, en: "System", ar: "النظام" },
  { value: "light", Icon: Sun, en: "Light", ar: "فاتح" },
  { value: "dark", Icon: Moon, en: "Dark", ar: "داكن" },
] as const;

/**
 * System / Light / Dark switch for the public site.
 *
 * Renders a placeholder until mounted: `theme` is unknown on the server, and
 * marking the active option before hydration would mismatch.
 */
export default function ThemeToggle({
  lang,
  className = "",
}: {
  lang: string;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isArabic = lang === "ar";

  useEffect(() => setMounted(true), []);

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-pureWhite/25 p-0.5 ${className}`}
      role="group"
      aria-label={isArabic ? "المظهر" : "Appearance"}
    >
      {OPTIONS.map(({ value, Icon, en, ar }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            title={isArabic ? ar : en}
            aria-label={isArabic ? ar : en}
            aria-pressed={active}
            className={`rounded-full p-1.5 transition-colors ${
              active
                ? "bg-brightTeal text-royalBlue"
                : "text-pureWhite/70 hover:text-pureWhite"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
