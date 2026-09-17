import pool from "@/lib/db";

export const NEWS_PER_PAGE = 15;

export interface NewsItem {
  id: number;
  symbol: string;
  title_en: string;
  title_ar: string;
  published_date: string;
  [key: string]: unknown;
}

export interface NewsPage {
  news: NewsItem[];
  totalPages: number;
  currentPage: number;
  totalNews: number;
}

export interface GetNewsPageOptions {
  page?: number;
  symbol?: string;
}

/**
 * Shared news query, used by both `/api/news` (client-side pagination and
 * symbol search) and the server-rendered `/[lang]/news` pages. Keeping one
 * implementation means the HTML crawlers see and the JSON the browser fetches
 * can never drift apart.
 */
export async function getNewsPage({
  page = 1,
  symbol = "",
}: GetNewsPageOptions = {}): Promise<NewsPage> {
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const trimmedSymbol = symbol.trim();
  const offset = (currentPage - 1) * NEWS_PER_PAGE;

  const totalNews = trimmedSymbol
    ? parseInt(
        (
          await pool.query("SELECT COUNT(*) FROM news WHERE symbol ILIKE $1", [
            `%${trimmedSymbol}%`,
          ])
        ).rows[0].count,
      )
    : parseInt((await pool.query("SELECT COUNT(*) FROM news")).rows[0].count);

  const result = trimmedSymbol
    ? await pool.query(
        `
        SELECT *
        FROM news
        WHERE symbol ILIKE $1
        ORDER BY published_date DESC
        LIMIT $2 OFFSET $3
      `,
        [`%${trimmedSymbol}%`, NEWS_PER_PAGE, offset],
      )
    : await pool.query(
        `
        SELECT *
        FROM news
        ORDER BY published_date DESC
        LIMIT $1 OFFSET $2
      `,
        [NEWS_PER_PAGE, offset],
      );

  return {
    // `pg` hands back Date objects. NextResponse.json() used to stringify them
    // on the way out; now that rows also travel straight from a server
    // component into a client component, normalise here so both paths hand the
    // UI the exact same ISO string.
    news: result.rows.map((row) => ({
      ...row,
      published_date:
        row.published_date instanceof Date
          ? row.published_date.toISOString()
          : row.published_date,
    })) as NewsItem[],
    totalPages: Math.ceil(totalNews / NEWS_PER_PAGE),
    currentPage,
    totalNews,
  };
}
