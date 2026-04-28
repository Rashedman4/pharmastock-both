import pool from '@/lib/db';

export interface User {
  id: number;
  email: string | null;
  firstname: string | null;
  lastname: string | null;
  phonenumber: string | null;
  role: string;
  provider: string | null;
  provider_id: string | null;
  provider_email: string | null;
  created_at: Date;
}

export interface CreateUserInput {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  phonenumber?: string | null;
}

const USER_COLUMNS =
  'id, email, firstname, lastname, phonenumber, role, provider, provider_id, provider_email, created_at';

export async function getUserById(id: number): Promise<User | null> {
  const { rows } = await pool.query<User>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function getUserWithPasswordByEmail(
  email: string
): Promise<(User & { password: string }) | null> {
  const { rows } = await pool.query<User & { password: string }>(
    `SELECT ${USER_COLUMNS}, password FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function createUser(data: CreateUserInput): Promise<User> {
  const { rows } = await pool.query<User>(
    `INSERT INTO users (firstname, lastname, email, password, phonenumber)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${USER_COLUMNS}`,
    [data.firstname, data.lastname, data.email, data.password, data.phonenumber ?? null]
  );
  return rows[0];
}

export async function updateUserPassword(id: number, hashedPassword: string): Promise<void> {
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
}
