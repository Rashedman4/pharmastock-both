import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuth';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id as string);

  const { rows } = await pool.query(
    `SELECT id, email, firstname, lastname, phonenumber, provider FROM users WHERE id = $1`,
    [userId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  const u = rows[0];

  return NextResponse.json({
    firstName: u.firstname ?? '',
    lastName: u.lastname ?? '',
    email: u.email,
    phonenumber: u.phonenumber ?? '',
    provider: u.provider ?? null,
  });
}

const patchSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100).optional(),
    lastName: z.string().min(1, 'Last name is required').max(100).optional(),
    phonenumber: z.string().max(20).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((d) => !d.newPassword || d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id as string);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const e of parsed.error.issues) {
      if (e.path[0]) fields[String(e.path[0])] = e.message;
    }
    return NextResponse.json({ message: 'Validation error', fields }, { status: 400 });
  }

  const { firstName, lastName, phonenumber, currentPassword, newPassword } = parsed.data;

  const { rows } = await pool.query(
    `SELECT password, provider FROM users WHERE id = $1`,
    [userId]
  );
  if (rows.length === 0) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  const user = rows[0];

  if (newPassword) {
    if (user.provider === 'google' || user.provider === 'apple') {
      return NextResponse.json(
        { message: 'Password is managed by your sign-in provider' },
        { status: 400 }
      );
    }
    if (!currentPassword) {
      return NextResponse.json(
        { message: 'Validation error', fields: { currentPassword: 'Current password is required' } },
        { status: 400 }
      );
    }
    const valid = await bcrypt.compare(currentPassword, (user.password as string) ?? '');
    if (!valid) {
      return NextResponse.json(
        { message: 'Validation error', fields: { currentPassword: 'Incorrect password' } },
        { status: 400 }
      );
    }
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (firstName !== undefined) { updates.push(`firstname = $${idx++}`); values.push(firstName); }
  if (lastName !== undefined) { updates.push(`lastname = $${idx++}`); values.push(lastName); }
  if (phonenumber !== undefined) { updates.push(`phonenumber = $${idx++}`); values.push(phonenumber || null); }
  if (newPassword) {
    const hash = await bcrypt.hash(newPassword, 12);
    updates.push(`password = $${idx++}`);
    values.push(hash);
  }

  if (updates.length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
  }

  values.push(userId);
  await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);

  return NextResponse.json({ message: 'Profile updated successfully' });
}
