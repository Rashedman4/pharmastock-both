import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const url = new URL(request.url);
    const rawPage = parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const offset = (page - 1) * 10;

    const [totalResult, result] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query(
        `
      SELECT id, email, provider_email, phonenumber, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10 OFFSET $1
    `,
        [offset]
      ),
    ]);

    return NextResponse.json({
      users: result.rows,
      total: parseInt(totalResult.rows[0].count),
      page,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    );
  }
}
