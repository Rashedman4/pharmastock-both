import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { createRateLimiter, getClientIP, rateLimitResponse } from "@/lib/mobile/rate-limit";

// Bounds brute-forcing the 6-character verification code: at 10 attempts per
// 15-minute window (the code's own lifetime, enforced below in the query),
// guessing the ~16.7M possible codes is infeasible from a single IP.
const verifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: getClientIP,
});

export async function POST(req: NextRequest) {
  if (!verifyLimiter(req)) return rateLimitResponse();

  try {
    const body = await req.json();

    const { email: userEmail, code } = body;

    // Check if the email and verification code match in the pending_users table
    const result = await pool.query(
      `
        SELECT * FROM pendingusers
        WHERE email = $1 AND verification_code = $2
        AND created_at > NOW() - INTERVAL '15 minutes'
      `,
      [userEmail, code]
    );
    // If the verification code is incorrect, expired, or not found, return an error
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid verification code or email." },
        { status: 400 }
      );
    }

    // If verification succeeds, move the data to the users table
    const { firstname, lastname, email, password, phonenumber } =
      result.rows[0];

    // Check for potential issues during the move to the final `users` table
    try {
      await pool.query(
        `
          INSERT INTO users (firstname, lastname, email, password, phonenumber)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [firstname, lastname, email, password, phonenumber]
      );

      // Delete the user from the pending_users table after successful insertion
      await pool.query(
        `
          DELETE FROM pendingusers WHERE email = $1
        `,
        [email]
      );

      return NextResponse.json(
        { message: "Verification successful and registration completed." },
        { status: 200 }
      );
    } catch (error) {
      // If there's a database error when moving data to `users`
      console.error("Error moving data to users table:", error);
      return NextResponse.json(
        {
          error:
            "Error completing the registration process. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error during verification:", error);
    return NextResponse.json(
      { error: "Error verifying the code." },
      { status: 500 }
    );
  }
}
