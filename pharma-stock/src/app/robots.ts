import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://biopharmastock.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Only the genuinely private namespaces. A blanket `/api` disallow also
        // blocked Googlebot's renderer from fetching the public endpoints our
        // own client components read (/api/news, /api/breakthroughs,
        // /api/home-page-prices), so crawlers only ever saw empty pages.
        // Those endpoints are public either way — robots.txt is a crawl
        // directive, not an access control — and they carry an
        // `X-Robots-Tag: noindex` header (see next.config.ts) so the raw JSON
        // is fetchable but never indexed as a page.
        disallow: ["/admin", "/api/admin", "/api/auth", "/handoff"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ""),
  };
}
