/* import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Pass authOptions to getServerSession
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT status, end_date, cancel_at_period_end 
         FROM subscriptions 
         WHERE user_id = (SELECT id FROM users WHERE email = $1)
         AND status = 'active'
         AND end_date > NOW()
         ORDER BY created_at DESC 
         LIMIT 1`,
        [token.email]
      );
      const { rows: recrods } = await client.query(
        `SELECT status, end_date, cancel_at_period_end 
         FROM subscriptions 
         WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
        [token.email]
      );
      return NextResponse.json({
        isActive: rows.length > 0,
        endDate: rows[0]?.end_date || null,
        cancelAtPeriodEnd: rows[0]?.cancel_at_period_end || false,
        isFirstTime: recrods.length == 0,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
 */
