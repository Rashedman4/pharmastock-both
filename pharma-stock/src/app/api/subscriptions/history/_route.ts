/* import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Get the token and extract user email
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }
    if (!token.email) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      // Get user ID
      const { rows: userRows } = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [token.email]
      );

      if (userRows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userId = userRows[0].id;

      // Get transaction history
      const { rows: transactions } = await client.query(
        `SELECT 
          t.id,
          t.amount,
          t.currency,
          t.status,
          t.payment_method,
          t.created_at,
          t.original_amount,
          t.discount_amount,
          p.name as package_name,
          p.interval,
          p.interval_count
         FROM transactions t
         LEFT JOIN subscriptions s ON t.subscription_id = s.id
         LEFT JOIN packages p ON s.package_id = p.id
         WHERE t.user_id = $1
         ORDER BY t.created_at DESC
         LIMIT 50`,
        [userId]
      );

      return NextResponse.json({ transactions });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 }
    );
  }
}
 */
