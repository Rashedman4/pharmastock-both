import { MetadataRoute } from "next";
import pool from "@/lib/db";

const baseUrl = "https://biopharmastock.com";

// The sitemap now hits the DB to derive real `lastmod` values, so cap how often
// that happens. An hour is far finer-grained than any crawler needs and keeps
// the query off every bot request.
export const revalidate = 3600;

// Content tables that drive a page's `lastmod`. Pages without one fall back to
// the build/revalidate time. "latest" means the newest of all three — the
// homepage surfaces news, breakthroughs and prices together, so any of them
// changing makes it worth re-crawling.
type ContentKey = "news" | "breakthroughs" | "history";
type LastmodSource = ContentKey | "latest";

// Real public, indexable routes only. Auth-gated routes (/signals,
// /ask-about-stock, /daily-video — see PROTECTED_ROUTES in middleware.ts) are
// deliberately excluded: they 307 to a `noindex` login page, and listing them
// here just earns "Page with redirect" exclusions in Search Console.
const PUBLIC_PATHS: {
  path: string;
  changefreq: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  content?: LastmodSource;
}[] = [
  { path: "", changefreq: "daily", priority: 1, content: "latest" },
  { path: "/news", changefreq: "daily", priority: 0.8, content: "news" },
  {
    path: "/fda-designation",
    changefreq: "daily",
    priority: 0.8,
    content: "breakthroughs",
  },
  { path: "/history", changefreq: "weekly", priority: 0.6, content: "history" },
  { path: "/elite-group", changefreq: "weekly", priority: 0.8 },
  { path: "/partners", changefreq: "weekly", priority: 0.7 },
  { path: "/community", changefreq: "monthly", priority: 0.6 },
  { path: "/policy", changefreq: "yearly", priority: 0.3 },
  { path: "/privacy-policy", changefreq: "yearly", priority: 0.3 },
  { path: "/terms-of-service", changefreq: "yearly", priority: 0.3 },
];

type ContentTimestamps = Partial<Record<ContentKey, Date>>;

// One round trip for all three. A sitemap that 500s is worse than one with a
// slightly stale lastmod, so any failure degrades to the fallback date.
async function getContentTimestamps(): Promise<ContentTimestamps> {
  try {
    const { rows } = await pool.query<{
      news: Date | null;
      breakthroughs: Date | null;
      history: Date | null;
    }>(`
      SELECT
        (SELECT MAX(published_date) FROM news)           AS news,
        (SELECT MAX(created_at)     FROM breakthroughs)  AS breakthroughs,
        (SELECT MAX(closing_date)   FROM signal_history) AS history
    `);

    const row = rows[0];
    if (!row) return {};

    return {
      ...(row.news ? { news: new Date(row.news) } : {}),
      ...(row.breakthroughs
        ? { breakthroughs: new Date(row.breakthroughs) }
        : {}),
      ...(row.history ? { history: new Date(row.history) } : {}),
    };
  } catch (error) {
    console.error("sitemap: could not read content timestamps", error);
    return {};
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const timestamps = await getContentTimestamps();
  const fallback = new Date();
  const entries: MetadataRoute.Sitemap = [];

  const known = Object.values(timestamps).filter(Boolean) as Date[];
  const latest = known.length
    ? new Date(Math.max(...known.map((d) => d.getTime())))
    : undefined;

  for (const { path, changefreq, priority, content } of PUBLIC_PATHS) {
    const resolved =
      content === "latest" ? latest : content ? timestamps[content] : undefined;
    const lastModified = resolved ?? fallback;

    for (const lang of ["en", "ar"] as const) {
      entries.push({
        url: `${baseUrl}/${lang}${path}`,
        lastModified,
        changeFrequency: changefreq,
        priority,
        alternates: {
          languages: {
            en: `${baseUrl}/en${path}`,
            ar: `${baseUrl}/ar${path}`,
            "x-default": `${baseUrl}/en${path}`,
          },
        },
      });
    }
  }

  return entries;
}
