import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';
import { revokeAppleRefreshToken } from '@/lib/mobile/appleTokens';
import { decryptAppleToken } from '@/lib/mobile/appleTokenCrypto';

const FULL_USER_QUERY = `
  SELECT
    u.id,
    u.email,
    u.firstname,
    u.lastname,
    u.phonenumber,
    u.role,
    u.provider,
    u.created_at,
    (em.id IS NOT NULL) AS is_elite,
    (pa.id IS NOT NULL) AS is_partner
  FROM users u
  LEFT JOIN elite_members em ON em.user_id = u.id AND em.is_active = true
  LEFT JOIN partner_accounts pa ON pa.user_id = u.id AND pa.status = 'APPROVED'
  WHERE u.id = $1`;

function buildUserResponse(u: Record<string, unknown>) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstname,
    lastName: u.lastname,
    name: [u.firstname, u.lastname].filter(Boolean).join(' '),
    role: u.role,
    phonenumber: u.phonenumber,
    provider: u.provider ?? null,
    is_elite: u.is_elite,
    is_partner: u.is_partner,
    created_at: u.created_at,
  };
}

export async function GET(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  const { rows } = await pool.query(FULL_USER_QUERY, [auth.userId]);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json(buildUserResponse(rows[0]));
}

const patchSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phonenumber: z.string().max(20).nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const e of parsed.error.issues) {
      if (e.path[0]) fields[String(e.path[0])] = e.message;
    }
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields } },
      { status: 400 }
    );
  }

  const { firstName, lastName, phonenumber, currentPassword, newPassword } = parsed.data;

  const { rows: userRows } = await pool.query(
    `SELECT password, provider FROM users WHERE id = $1`,
    [auth.userId]
  );
  if (userRows.length === 0) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }
  const user = userRows[0];

  if (newPassword) {
    if (user.provider === 'google' || user.provider === 'apple') {
      return NextResponse.json(
        { error: { code: 'SOCIAL_PROVIDER', message: 'Password is managed by your sign-in provider' } },
        { status: 400 }
      );
    }
    if (!currentPassword) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Current password is required',
            fields: { currentPassword: 'Current password is required' },
          },
        },
        { status: 400 }
      );
    }
    const valid = await bcrypt.compare(currentPassword, (user.password as string) ?? '');
    if (!valid) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
            fields: { currentPassword: 'Incorrect password' },
          },
        },
        { status: 400 }
      );
    }
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (firstName !== undefined) { updates.push(`firstname = $${idx++}`); values.push(firstName); }
  if (lastName !== undefined) { updates.push(`lastname = $${idx++}`); values.push(lastName); }
  if (phonenumber !== undefined) { updates.push(`phonenumber = $${idx++}`); values.push(phonenumber); }
  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    updates.push(`password = $${idx++}`);
    values.push(hash);
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_CHANGES', message: 'No fields to update' } },
      { status: 400 }
    );
  }

  values.push(auth.userId);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);

  const { rows: updated } = await pool.query(FULL_USER_QUERY, [auth.userId]);
  return NextResponse.json(buildUserResponse(updated[0]));
}

// Anonymizes the user's row instead of hard-deleting it, so existing
// transactions/subscriptions/elite records (FK'd to users.id) stay intact
// for accounting/legal retention. A minimal record is archived to
// deleted_accounts for tracking purposes.
export async function DELETE(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT email, firstname, lastname, phonenumber, provider, created_at, apple_refresh_token_enc
       FROM users WHERE id = $1 FOR UPDATE`,
      [auth.userId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }
    const user = rows[0];

    // Disconnect Sign in with Apple (App Review guideline 5.1.1(v)) before
    // anonymizing. Best-effort — deletion must proceed either way.
    if (user.provider === 'apple' && user.apple_refresh_token_enc) {
      try {
        await revokeAppleRefreshToken(decryptAppleToken(user.apple_refresh_token_enc));
      } catch (error) {
        console.error('Failed to revoke Apple token during account deletion:', error);
      }
    }

    await client.query(
      `INSERT INTO deleted_accounts
         (original_user_id, email, firstname, lastname, phonenumber, provider, account_created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [auth.userId, user.email, user.firstname, user.lastname, user.phonenumber, user.provider, user.created_at]
    );

    // Revoke mobile sessions and stop notifications immediately
    await client.query('DELETE FROM mobile_refresh_tokens WHERE user_id = $1', [auth.userId]);
    await client.query('DELETE FROM user_push_tokens WHERE user_id = $1', [auth.userId]);
    await client.query('DELETE FROM user_whatsapp WHERE user_id = $1', [auth.userId]);

    const anonymizedEmail = `deleted-user-${auth.userId}-${Date.now()}@deleted.biopharmastock.invalid`;
    const unusablePasswordHash = await bcrypt.hash(crypto.randomUUID(), 12);
    await client.query(
      `UPDATE users
       SET email = $1, password = $2, firstname = NULL, lastname = NULL,
           phonenumber = NULL, provider = NULL, provider_id = NULL, provider_email = NULL,
           apple_refresh_token_enc = NULL
       WHERE id = $3`,
      [anonymizedEmail, unusablePasswordHash, auth.userId]
    );

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Account deleted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: { code: 'DELETE_FAILED', message: 'Failed to delete account' } },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
