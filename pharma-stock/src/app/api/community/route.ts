import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET() {
  try {
    const client = await pool.connect();
    const query = `SELECT id, url, name_en, name_ar FROM groups ORDER BY numId`;
    const result = await client.query(query);
    client.release();

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching community links. error: " + error },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check authorized emails
  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, url } = body;

    if (!id || !url) {
      return NextResponse.json(
        { error: "id and url are required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Check if group exists
    const checkResult = await client.query(
      "SELECT * FROM groups WHERE id = $1",
      [id]
    );

    if (checkResult.rowCount === 0) {
      client.release();
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Update the URL
    const query = `
      UPDATE groups 
      SET url = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await client.query(query, [url, id]);
    client.release();

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating community link. error: " + error },
      { status: 500 }
    );
  }
}
