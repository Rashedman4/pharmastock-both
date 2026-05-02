import pool from '../db';

export type AudienceType = 'all_users' | 'elite_users' | 'subscription_users' | 'custom';

export async function resolveAudienceUserIds(
  audienceType: AudienceType,
  customUserIds?: number[]
): Promise<number[]> {
  if (audienceType === 'custom') {
    return customUserIds ?? [];
  }

  if (audienceType === 'all_users') {
    const result = await pool.query(
      'SELECT DISTINCT user_id FROM user_push_tokens'
    );
    return result.rows.map((r: { user_id: number }) => r.user_id);
  }

  if (audienceType === 'elite_users') {
    const result = await pool.query(
      `SELECT DISTINCT u.id
       FROM users u
       INNER JOIN elite_members em ON em.user_id = u.id AND em.is_active = true`
    );
    return result.rows.map((r: { id: number }) => r.id);
  }

  if (audienceType === 'subscription_users') {
    // Users who have push tokens registered (active app users)
    const result = await pool.query(
      'SELECT DISTINCT user_id FROM user_push_tokens'
    );
    return result.rows.map((r: { user_id: number }) => r.user_id);
  }

  return [];
}
