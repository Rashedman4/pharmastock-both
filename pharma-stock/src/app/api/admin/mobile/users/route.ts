import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import pool from '@/lib/db';

async function assertAdmin(req: NextRequest) {
  const token = await getToken({ req });
  return token?.role === 'admin' ? token : null;
}

export async function GET(req: NextRequest) {
  const token = await assertAdmin(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '500', 10), 1000);

  let query: string;
  let params: (string | number)[];

  if (search) {
    query = `
      SELECT id, email, firstname, lastname
      FROM users
      WHERE email ILIKE $1
         OR firstname ILIKE $1
         OR lastname ILIKE $1
         OR (firstname || ' ' || lastname) ILIKE $1
      ORDER BY firstname, lastname
      LIMIT $2
    `;
    params = [`%${search}%`, limit];
  } else {
    query = `
      SELECT id, email, firstname, lastname
      FROM users
      ORDER BY firstname, lastname
      LIMIT $1
    `;
    params = [limit];
  }

  const result = await pool.query(query, params);
  return NextResponse.json({ data: result.rows });
}
