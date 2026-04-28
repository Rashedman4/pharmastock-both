import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { updateUserPassword } from '@/lib/services/user.service';

const resetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = resetSchema.safeParse(body);
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

  const { token, password } = parsed.data;

  const { rows } = await pool.query(
    'SELECT userid FROM resettokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_TOKEN', message: 'Reset token is invalid or has expired' } },
      { status: 400 }
    );
  }

  const userId = rows[0].userid as number;
  const hashedPassword = await bcrypt.hash(password, 12);
  await updateUserPassword(userId, hashedPassword);

  await pool.query('DELETE FROM resettokens WHERE userid = $1', [userId]);

  await pool.query(
    `UPDATE mobile_refresh_tokens SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );

  return NextResponse.json({ message: 'Password has been reset successfully.' });
}
