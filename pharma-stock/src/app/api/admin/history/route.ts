import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";

//  GET all signal history
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await pool.connect();
    const query = `SELECT * FROM signal_history ORDER BY id DESC`;
    const result = await client.query(query);
    client.release();

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching signal history: " + error },
      { status: 500 }
    );
  }
}

//  POST new record (manually add to history if needed)
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      symbol,
      entrance_date,
      closing_date,
      in_price,
      out_price,
      success,
      reason_en,
      reason_ar,
    } = body;

    const client = await pool.connect();
    const query = `
      INSERT INTO signal_history
        (symbol, entrance_date, closing_date, in_price, out_price, success, reason_en, reason_ar)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const result = await client.query(query, [
      symbol,
      entrance_date,
      closing_date,
      in_price,
      out_price,
      success,
      reason_en,
      reason_ar,
    ]);
    client.release();

    revalidatePath("/api/admin/signalHistory");

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error adding to signal history: " + error },
      { status: 500 }
    );
  }
}

//  PUT (edit a history record)
export async function PUT(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      id,
      symbol,
      entrance_date,
      closing_date,
      in_price,
      out_price,
      success,
      reason_en,
      reason_ar,
    } = await req.json();

    const client = await pool.connect();
    const query = `
      UPDATE signal_history
      SET symbol = $1,
          entrance_date = $2,
          closing_date = $3,
          in_price = $4,
          out_price = $5,
          success = $6,
          reason_en = $7,
          reason_ar = $8
      WHERE id = $9
      RETURNING *;
    `;
    const result = await client.query(query, [
      symbol,
      entrance_date,
      closing_date,
      in_price,
      out_price,
      success,
      reason_en,
      reason_ar,
      id,
    ]);
    client.release();

    revalidatePath("/api/admin/signalHistory");
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating signal history: " + error },
      { status: 500 }
    );
  }
}

//  DELETE (remove a record)
export async function DELETE(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authorizedEmails = process.env.AUTHORIZED_EMAILS?.split(",") || [];
  if (!authorizedEmails.includes(token.email as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    const client = await pool.connect();
    const query = `DELETE FROM signal_history WHERE id = $1`;
    await client.query(query, [id]);
    client.release();

    revalidatePath("/api/admin/signalHistory");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting signal history: " + error },
      { status: 500 }
    );
  }
}
