import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { phoneNumber } = await request.json();
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit pin

    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO user_whatsapp (user_id, phone_number, pin_code)
        VALUES ($1, $2, $3)
        RETURNING pin_code
      `;
      const result = await client.query(query, [
        token.id,
        phoneNumber,
        pinCode,
      ]);

      return NextResponse.json(
        {
          pinCode: result.rows[0].pin_code,
        },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.log(error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
