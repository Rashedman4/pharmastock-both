import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/emailServiceOld";
import pool from "@/lib/db";
import { createRateLimiter, getClientIP, rateLimitResponse } from "@/lib/mobile/rate-limit";

const forgotLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyFn: getClientIP,
});

// Always the same response regardless of whether the email exists, so this
// endpoint can't be used to enumerate registered accounts.
const GENERIC_RESPONSE = NextResponse.json(
  { message: "If an account with this email exists, a password reset link has been sent." },
  { status: 200 }
);

export async function POST(req: NextRequest) {
  if (!forgotLimiter(req)) return rateLimitResponse();

  try {
    const body = await req.json();
    const { email, lang } = body;
    // Check if the email exists in the users table
    const result = await pool.query(`SELECT id FROM users WHERE email = $1`, [
      email,
    ]);
    if (result.rows.length === 0) {
      return GENERIC_RESPONSE;
    }

    const userId = result.rows[0].id;
    const token = uuidv4();

    // Store token and expiry in reset_tokens table
    await pool.query(
      `INSERT INTO resettokens (userid, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, token]
    );

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/${lang}/auth/reset-password?token=${token}`;
    await sendEmail(
      email,
      "Password Reset Request",
      `We received a request to reset your password. If you made this request, please click the link below to reset your password:

      [Reset Password](${resetUrl})`
    );

    return GENERIC_RESPONSE;
  } catch (error) {
    console.error("Error in password reset request:", error);
    // Still return the generic response so a transient error doesn't leak
    // whether the email exists either.
    return GENERIC_RESPONSE;
  }
}
