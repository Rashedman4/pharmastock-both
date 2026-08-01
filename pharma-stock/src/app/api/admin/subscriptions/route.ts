import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/modules/program/route-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const result = await pool.query(`
      SELECT s.id, u.email, p.name as package_name, p.price, s.end_date
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN packages p ON s.package_id = p.id
      WHERE s.status = 'active'
      ORDER BY s.end_date ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Error fetching subscriptions" },
      { status: 500 }
    );
  }
}
