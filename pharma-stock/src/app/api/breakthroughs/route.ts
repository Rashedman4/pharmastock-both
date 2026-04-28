import { NextResponse } from "next/server";
import pool from "@/lib/db";

const BREAKTHROUGHS_PER_PAGE = 6;

const VALID_CATEGORIES = new Set(["drug", "therapy", "device"]);
const VALID_STAGES = new Set(["research", "clinical", "approved"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const q = (searchParams.get("q") || "").trim();
  const categoryRaw = (searchParams.get("category") || "").trim();
  const stageRaw = (searchParams.get("stage") || "").trim();

  const category =
    categoryRaw && VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : "";
  const stage = stageRaw && VALID_STAGES.has(stageRaw) ? stageRaw : "";

  // Legacy escape hatch (avoid using it in UI)
  const all = searchParams.get("all") === "true";

  const offset = (page - 1) * BREAKTHROUGHS_PER_PAGE;

  const client = await pool.connect();
  try {
    const where: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (q) {
      const like = `%${q}%`;
      where.push(`(
        title_en ILIKE $${i}
        OR title_ar ILIKE $${i}
        OR description_en ILIKE $${i}
        OR description_ar ILIKE $${i}
        OR company ILIKE $${i}
        OR symbol ILIKE $${i}
      )`);
      values.push(like);
      i++;
    }

    if (category) {
      where.push(`category = $${i}`);
      values.push(category);
      i++;
    }

    if (stage) {
      where.push(`stage = $${i}`);
      values.push(stage);
      i++;
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Count
    const countRes = await client.query(
      `SELECT COUNT(*) FROM breakthroughs ${whereSQL}`,
      values
    );
    const totalBreakthroughs = Number(countRes.rows?.[0]?.count || 0);
    const totalPages = Math.max(
      1,
      Math.ceil(totalBreakthroughs / BREAKTHROUGHS_PER_PAGE)
    );

    // Data
    if (all) {
      const allRes = await client.query(
        `
        SELECT *
        FROM breakthroughs
        ${whereSQL}
        ORDER BY created_at DESC
        `,
        values
      );
      return NextResponse.json(allRes.rows, { status: 200 });
    }

    const dataRes = await client.query(
      `
      SELECT *
      FROM breakthroughs
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
      `,
      [...values, BREAKTHROUGHS_PER_PAGE, offset]
    );

    return NextResponse.json(
      {
        breakthroughs: dataRes.rows,
        totalPages,
        currentPage: page,
        totalBreakthroughs,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching breakthroughs, error: " + String(error) },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
