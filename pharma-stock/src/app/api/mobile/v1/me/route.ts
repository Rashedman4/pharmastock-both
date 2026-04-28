import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getMobileAuthPayload } from '@/lib/mobile/auth-middleware';

export async function GET(req: NextRequest) {
  const auth = getMobileAuthPayload(req);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Valid Bearer token required' } },
      { status: 401 }
    );
  }

  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.firstname,
       u.lastname,
       u.phonenumber,
       u.role,
       u.created_at,
       (em.id IS NOT NULL) AS is_elite,
       (pa.id IS NOT NULL) AS is_partner
     FROM users u
     LEFT JOIN elite_members em ON em.user_id = u.id AND em.is_active = true
     LEFT JOIN partner_accounts pa ON pa.user_id = u.id AND pa.status = 'APPROVED'
     WHERE u.id = $1`,
    [auth.userId]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }

  const u = rows[0];

  return NextResponse.json({
    id: u.id,
    email: u.email,
    firstName: u.firstname,
    lastName: u.lastname,
    name: [u.firstname, u.lastname].filter(Boolean).join(' '),
    role: u.role,
    phonenumber: u.phonenumber,
    is_elite: u.is_elite,
    is_partner: u.is_partner,
    created_at: u.created_at,
  });
}
