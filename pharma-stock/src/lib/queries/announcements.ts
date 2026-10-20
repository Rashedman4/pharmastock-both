import pool from "@/lib/db";

export const ANNOUNCEMENTS_PER_PAGE = 15;

export interface AnnouncementListItem {
  id: number;
  symbol: string;
  title_en: string;
  title_ar: string;
  source_url: string | null;
  announced_at: string | null;
  published_date: string;
}

export interface AnnouncementArticle extends AnnouncementListItem {
  /** Markdown. `_en` is the verbatim original, `_ar` the translation. */
  content_en: string;
  content_ar: string;
  stock_name_en: string | null;
  stock_name_ar: string | null;
}

export interface AnnouncementsPage {
  announcements: AnnouncementListItem[];
  totalPages: number;
  currentPage: number;
  total: number;
}

/**
 * Server-side announcement reads, used by the SSR'd `/[lang]/announcements`
 * pages. The client paginates against `/api/announcements`, which runs the
 * same SQL shape — same reason as `queries/news.ts`: one implementation means
 * the crawled HTML and the fetched JSON cannot drift apart.
 *
 * `pg` hands back Date objects; they are normalized to ISO strings here so a
 * row travels from a server component into a client component unchanged.
 */
function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : (value as string);
}

export async function getAnnouncementsPage(
  { page = 1, symbol = "" }: { page?: number; symbol?: string } = {}
): Promise<AnnouncementsPage> {
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const trimmed = symbol.trim().toUpperCase();
  const offset = (currentPage - 1) * ANNOUNCEMENTS_PER_PAGE;

  const where = trimmed ? "WHERE symbol = $1" : "";
  const params = trimmed ? [trimmed] : [];

  const [countResult, dataResult] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM company_announcements ${where}`, params),
    pool.query(
      `SELECT id, symbol, title_en, title_ar, source_url, announced_at, published_date
       FROM company_announcements ${where}
       ORDER BY published_date DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, ANNOUNCEMENTS_PER_PAGE, offset]
    ),
  ]);

  const total: number = countResult.rows[0].total;

  return {
    announcements: dataResult.rows.map((row) => ({
      ...row,
      announced_at: row.announced_at ? toIso(row.announced_at) : null,
      published_date: toIso(row.published_date),
    })) as AnnouncementListItem[],
    totalPages: Math.ceil(total / ANNOUNCEMENTS_PER_PAGE),
    currentPage,
    total,
  };
}

export async function getAnnouncementById(
  id: number
): Promise<AnnouncementArticle | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const { rows } = await pool.query(
    `SELECT ca.id, ca.symbol, ca.title_en, ca.title_ar, ca.content_en, ca.content_ar,
            ca.source_url, ca.announced_at, ca.published_date,
            s.name_en AS stock_name_en, s.name_ar AS stock_name_ar
     FROM company_announcements ca
     LEFT JOIN stocks s ON s.symbol = ca.symbol
     WHERE ca.id = $1`,
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    announced_at: row.announced_at ? toIso(row.announced_at) : null,
    published_date: toIso(row.published_date),
  } as AnnouncementArticle;
}

/** Newest announcement timestamp, for the sitemap's `lastmod`. */
export async function getLatestAnnouncementDate(): Promise<Date | null> {
  const { rows } = await pool.query(
    "SELECT MAX(published_date) AS latest FROM company_announcements"
  );
  return rows[0]?.latest ? new Date(rows[0].latest) : null;
}
