import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/services/user.service';
import { createRateLimiter, getClientIP, rateLimitResponse } from '@/lib/mobile/rate-limit';
import { sendEmailNotification } from '@/lib/emailService';

const forgotSchema = z.object({
  email: z.string().email(),
});

const forgotLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyFn: getClientIP,
});

const SUCCESS_RESPONSE = NextResponse.json({
  message: 'If an account with this email exists, a password reset link has been sent.',
});

export async function POST(req: NextRequest) {
  if (!forgotLimiter(req)) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return SUCCESS_RESPONSE;
  }

  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return SUCCESS_RESPONSE;
  }

  try {
    const user = await getUserByEmail(parsed.data.email);
    if (user && user.provider !== 'google') {
      const token = uuidv4();
      await pool.query(
        `INSERT INTO resettokens (userid, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [user.id, token]
      );

      const resetUrl = `${process.env.NEXTAUTH_URL}/en/auth/reset-password?token=${token}`;
      const name = [user.firstname, user.lastname].filter(Boolean).join(' ') || undefined;

      await sendEmailNotification(
        parsed.data.email,
        'Password Reset Request',
        `You requested a password reset. Use the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
        name
      );
    }
  } catch (err) {
    console.error('[mobile/forgot-password]', err);
  }

  return SUCCESS_RESPONSE;
}
