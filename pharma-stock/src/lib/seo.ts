export const SITE_URL = "https://biopharmastock.com";

/**
 * Self-referencing canonical + hreflang alternates for a bilingual (en/ar) page.
 * `pathWithoutLang` must start with "/" and exclude the /en or /ar prefix, e.g. "/signals".
 * Use "" for the homepage.
 */
export function buildAlternates(pathWithoutLang: string, currentLang: "en" | "ar") {
  const enUrl = `${SITE_URL}/en${pathWithoutLang}`;
  const arUrl = `${SITE_URL}/ar${pathWithoutLang}`;
  return {
    canonical: currentLang === "en" ? enUrl : arUrl,
    languages: {
      en: enUrl,
      ar: arUrl,
      "x-default": enUrl,
    },
  };
}
