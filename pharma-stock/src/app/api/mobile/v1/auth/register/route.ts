import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/services/user.service';
import { createRateLimiter, getClientIP, rateLimitResponse } from '@/lib/mobile/rate-limit';
import { sendEmail } from '@/lib/emailService';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyFn: getClientIP,
});

export async function POST(req: NextRequest) {
  if (!registerLimiter(req)) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    parsed.error.issues.forEach((e) => {
      if (e.path[0]) fields[String(e.path[0])] = e.message;
    });
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request', fields } },
      { status: 400 }
    );
  }

  const { email, password, firstName, lastName } = parsed.data;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    if (existingUser.provider === 'google') {
      return NextResponse.json(
        {
          error: {
            code: 'OAUTH_ACCOUNT',
            message: 'This email is registered with Google. Please use Google sign-in.',
          },
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' } },
      { status: 409 }
    );
  }

  await pool.query(
    `DELETE FROM pendingusers WHERE created_at < NOW() - INTERVAL '15 minutes' OR email = $1`,
    [email]
  );

  const hashedPassword = await bcrypt.hash(password, 12);
  const verificationCode = uuidv4().slice(0, 6).toUpperCase();

  await pool.query(
    `INSERT INTO pendingusers (firstname, lastname, email, password, verification_code, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [firstName, lastName, email, hashedPassword, verificationCode]
  );

  await sendEmail(email, 'Verification Code', verificationCode);

  return NextResponse.json(
    { message: 'Verification code sent to your email. Please check your inbox to complete registration.' },
    { status: 201 }
  );
}
