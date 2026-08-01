import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;
    // Check if the token is valid and has not expired
    const result = await pool.query(
      `SELECT userid FROM resettokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const userId = result.rows[0].userid;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [
      hashedPassword,
      parseInt(userId),
    ]);

    // Delete the used token
    await pool.query(`DELETE FROM resettokens WHERE token = $1`, [token]);

    return NextResponse.json(
      { message: "Password successfully reset" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
