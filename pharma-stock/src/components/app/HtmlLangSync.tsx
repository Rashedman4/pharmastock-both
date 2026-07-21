"use client";

import { useEffect } from "react";

interface HtmlLangSyncProps {
  lang: "en" | "ar";
}

/**
 * The root layout can't know which locale segment (/en or /ar) matched
 * without opting the whole app out of static rendering (headers()/pathname
 * would force every route to render dynamically). Since /en and /ar are
 * static folders with a known lang each, their own layouts just sync the
 * <html> lang/dir attributes on mount instead.
 */
export default function HtmlLangSync({ lang }: HtmlLangSyncProps) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return null;
}
