import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    // Check if user is already in waitlist
    const checkQuery = "SELECT * FROM waitinglist WHERE user_id = $1";
    const checkResult = await client.query(checkQuery, [token.id]);

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { message: "Already on waitlist" },
        { status: 409 }
      );
    }

    // Add to waitlist
    const insertQuery = "INSERT INTO waitinglist (user_id) VALUES ($1)";
    await client.query(insertQuery, [token.id]);

    return NextResponse.json({ message: "Added to waitlist" }, { status: 201 });
  } catch (error) {
    console.log(error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check authorized emails
  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT w.user_id,w.created_at, u.email, u.provider, u.provider_email, u.firstname, u.lastname
      FROM waitinglist w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `;
    const result = await client.query(query);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.log(error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
