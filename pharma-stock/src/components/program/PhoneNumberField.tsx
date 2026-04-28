"use client";

import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ProgramLang } from "@/components/program/shared";

export const COUNTRY_CODES = [
  { name: { en: "Select Country Code", ar: "اختر رمز الدولة" }, code: "" },
  { name: { en: "Jordan", ar: "الأردن" }, code: "+962" },
  { name: { en: "UAE", ar: "الإمارات العربية المتحدة" }, code: "+971" },
  { name: { en: "Bahrain", ar: "البحرين" }, code: "+973" },
  { name: { en: "Saudi Arabia", ar: "السعودية" }, code: "+966" },
  { name: { en: "Iraq", ar: "العراق" }, code: "+964" },
  { name: { en: "Kuwait", ar: "الكويت" }, code: "+965" },
  { name: { en: "Lebanon", ar: "لبنان" }, code: "+961" },
  { name: { en: "Egypt", ar: "مصر" }, code: "+20" },
  { name: { en: "Oman", ar: "عُمان" }, code: "+968" },
  { name: { en: "Qatar", ar: "قطر" }, code: "+974" },
  { name: { en: "United States", ar: "الولايات المتحدة" }, code: "+1" },
  { name: { en: "United Kingdom", ar: "المملكة المتحدة" }, code: "+44" },
  { name: { en: "Australia", ar: "أستراليا" }, code: "+61" },
  { name: { en: "Germany", ar: "ألمانيا" }, code: "+49" },
  { name: { en: "France", ar: "فرنسا" }, code: "+33" },
  { name: { en: "India", ar: "الهند" }, code: "+91" },
] as const;

export function splitPhoneNumber(fullPhone?: string | null) {
  const value = String(fullPhone || "").trim();
  if (!value) return { countryCode: "", localNumber: "" };

  const match = [...COUNTRY_CODES]
    .filter((item) => item.code)
    .sort((a, b) => b.code.length - a.code.length)
    .find((item) => value.startsWith(item.code));

  if (!match) {
    return { countryCode: "", localNumber: value };
  }

  return {
    countryCode: match.code,
    localNumber: value.slice(match.code.length).trim(),
  };
}

export function buildPhoneNumber(countryCode: string, localNumber: string) {
  return `${countryCode}${localNumber.replace(/\s+/g, "").trim()}`;
}

export function PhoneNumberField({
  lang = "en",
  label,
  placeholder,
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
  required = false,
}: {
  lang?: ProgramLang;
  label: string;
  placeholder: string;
  countryCode: string;
  localNumber: string;
  onCountryCodeChange: (value: string) => void;
  onLocalNumberChange: (value: string) => void;
  required?: boolean;
}) {
  const isArabic = lang === "ar";
  const iconSide = isArabic ? "right-3" : "left-3";
  const inputPad = isArabic ? "pr-10" : "pl-10";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>

      <div className={`flex gap-2 ${isArabic ? "flex-row-reverse" : ""}`}>
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="h-11 w-[170px] rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          aria-label={label}
          required={required}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.code}-${c.name.en}`} value={c.code}>
              {c.name[lang]} {c.code}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Phone
            className={`pointer-events-none absolute ${iconSide} top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400`}
          />
          <Input
            type="tel"
            inputMode="tel"
            dir="ltr"
            className={`${inputPad} h-11 rounded-xl border-slate-300 text-left focus-visible:ring-blue-500`}
            placeholder={placeholder}
            value={localNumber}
            onChange={(e) => onLocalNumberChange(e.target.value)}
            required={required}
          />
        </div>
      </div>
    </div>
  );
}
