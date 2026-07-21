import { MetadataRoute } from "next";

const baseUrl = "https://biopharmastock.com";

// Real public, indexable routes only (excludes auth pages, checkout
// success/subscription flows, and anything behind the auth gate).
const PUBLIC_PATHS: { path: string; changefreq: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changefreq: "daily", priority: 1 },
  { path: "/ask-about-stock", changefreq: "monthly", priority: 0.7 },
  { path: "/daily-video", changefreq: "daily", priority: 0.8 },
  { path: "/history", changefreq: "weekly", priority: 0.6 },
  { path: "/news", changefreq: "daily", priority: 0.7 },
  { path: "/signals", changefreq: "daily", priority: 0.7 },
  { path: "/fda-designation", changefreq: "daily", priority: 0.7 },
  { path: "/elite-group", changefreq: "weekly", priority: 0.8 },
  { path: "/partners", changefreq: "weekly", priority: 0.7 },
  { path: "/community", changefreq: "monthly", priority: 0.6 },
  { path: "/policy", changefreq: "yearly", priority: 0.3 },
  { path: "/privacy-policy", changefreq: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changefreq, priority } of PUBLIC_PATHS) {
    for (const lang of ["en", "ar"] as const) {
      entries.push({
        url: `${baseUrl}/${lang}${path}`,
        changeFrequency: changefreq,
        priority,
        alternates: {
          languages: {
            en: `${baseUrl}/en${path}`,
            ar: `${baseUrl}/ar${path}`,
          },
        },
      });
    }
  }

  return entries;
}
